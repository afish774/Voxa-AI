import mongoose from 'mongoose';
import { pipeline } from '@xenova/transformers';

// ============================================================================
// 🧠 1. LOCAL AI EMBEDDING ENGINE
// ============================================================================

/**
 * 🛠️ AUDIT FIX: [BUG-02] — TOCTOU Race Condition Eliminated
 *
 * BEFORE: Two concurrent requests arriving before the first `await pipeline()`
 * resolved would both see `instance === null`, both call `pipeline()`, and
 * race to load the 85MB ONNX model twice — risking duplicate heap allocation,
 * file-handle conflicts, and undefined singleton state.
 *
 * AFTER: A Promise-lock singleton. The first caller sets `_initPromise` to the
 * in-flight Promise before `await`ing it. Every subsequent concurrent caller
 * receives the SAME promise and awaits the same resolution. The model is
 * guaranteed to load exactly once. On failure, `_initPromise` is reset so the
 * next call can retry cleanly.
 */
class EmbeddingPipeline {
    static _instance = null;
    static _initPromise = null;

    static async getInstance() {
        // Fast path: model is already loaded and available
        if (this._instance) return this._instance;

        // Slow path (cold start): set the Promise BEFORE awaiting so concurrent
        // callers share this single in-flight load instead of duplicating it.
        if (!this._initPromise) {
            this._initPromise = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
                .then((loadedPipeline) => {
                    this._instance = loadedPipeline;
                    this._initPromise = null; // Clear promise — instance is now ready
                    console.log('✅ [Memory] Embedding model loaded successfully (Xenova/all-MiniLM-L6-v2)');
                    return loadedPipeline;
                })
                .catch((err) => {
                    // Reset so the next call can attempt to reload
                    this._initPromise = null;
                    console.error('❌ [Memory] Embedding model failed to load:', err.message);
                    throw err;
                });
        }

        return this._initPromise;
    }
}

/**
 * Generates a 384-dimensional embedding vector for a given text string.
 * Uses the Xenova/all-MiniLM-L6-v2 model running entirely in-process.
 */
export const generateEmbedding = async (text) => {
    const embedder = await EmbeddingPipeline.getInstance();
    const output = await embedder(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
};

// ============================================================================
// 💾 2. MONGOOSE SCHEMAS
// ============================================================================

const messageSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: String,
    text: String,
    timestamp: { type: Date, default: Date.now },
});
export const Message = mongoose.model('Message', messageSchema);

const factSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fact: String,
    embedding: { type: [Number], required: true }, // 384-dimensional vector (MiniLM-L6-v2)
    timestamp: { type: Date, default: Date.now },
});
export const Fact = mongoose.model('Fact', factSchema);

// ============================================================================
// 🛠️ 3. MEMORY CONTROLLERS
// ============================================================================

/**
 * Persists a single conversation turn (user or AI) to the chat history.
 */
export const saveToMemory = async (userId, role, text) => {
    try {
        await Message.create({ user: userId, role, text });
    } catch (err) {
        console.error('Memory Save Error:', err);
    }
};

/**
 * 🛠️ AUDIT FIX: [QW-03] — Redundant DB Read Eliminated
 *
 * BEFORE: `.limit(8)` fetched 8 documents from MongoDB across the network,
 * but `llm.js` immediately discarded 4 of them with `.slice(0, 4)`.
 * This doubled the DB read load and wasted bandwidth on every single request.
 *
 * AFTER: `.limit(4)` — the DB returns exactly as many documents as are used.
 * The `.slice(0, 4).reverse()` in `llm.js` is now a no-op safety guard; it
 * should also be removed from llm.js in a future cleanup pass.
 */
export const getChatHistory = async (userId) => {
    try {
        const history = await Message.find({ user: userId })
            .sort({ timestamp: -1 })
            .limit(4) // 🛠️ AUDIT FIX: [QW-03] Was .limit(8) — 4 documents fetched, 4 documents used
            .lean();
        return history.reverse();
    } catch (err) {
        return [];
    }
};

// ============================================================================
// 🧠 4. RAG ENGINE — SEMANTIC FACT STORAGE & RETRIEVAL
// ============================================================================

/**
 * 🛠️ AUDIT FIX: [MEM-01] — Semantic Deduplication Replaces Exact String Match
 *
 * BEFORE: `Fact.findOne({ user, fact: extractedFact })` — exact string equality
 * check only. Semantically identical facts like "User's name is Ahmed" and
 * "The user is named Ahmed" were BOTH saved, progressively poisoning the RAG
 * knowledge base with contradictory near-duplicate entries.
 *
 * AFTER: A vector search runs BEFORE saving. If any existing fact has a cosine
 * similarity score ≥ 0.92 to the new fact, the new fact is considered a
 * semantic duplicate and is silently dropped. This keeps the knowledge base
 * clean and non-contradictory as it scales toward thousands of facts.
 *
 * Fallback: If the vector index is unavailable (e.g., Atlas free tier not yet
 * configured), the code falls back to the original exact-string check so the
 * system never silently loses facts due to infrastructure limitations.
 */
export const saveFact = async (userId, extractedFact) => {
    // Minimum quality gate — reject NONE responses and sub-10-character strings
    if (!extractedFact || extractedFact.includes('NONE') || extractedFact.trim().length < 10) {
        return;
    }

    try {
        // 🛠️ AUDIT FIX: [MEM-01] Generate embedding FIRST so we can run semantic dedup
        // before committing to a write. (Old code generated embedding after the exact-match
        // check, making semantic dedup impossible.)
        const embedding = await generateEmbedding(extractedFact);

        // 🛠️ AUDIT FIX: [MEM-01] — Semantic near-duplicate check via vector search
        try {
            const nearDuplicates = await Fact.aggregate([
                {
                    $vectorSearch: {
                        index: 'vector_index',
                        path: 'embedding',
                        queryVector: embedding,
                        // numCandidates kept small here (15) because we only need
                        // the single nearest neighbor for a duplicate decision,
                        // not high recall.
                        numCandidates: 15,
                        limit: 1,
                        filter: {
                            user: new mongoose.Types.ObjectId(userId.toString()),
                        },
                    },
                },
                {
                    $project: {
                        fact: 1,
                        score: { $meta: 'vectorSearchScore' },
                    },
                },
            ]);

            if (nearDuplicates.length > 0 && nearDuplicates[0].score > 0.92) {
                console.log(
                    `⚡ [Memory] Semantic duplicate skipped` +
                    ` (score: ${nearDuplicates[0].score.toFixed(3)}) — ` +
                    `"${extractedFact.substring(0, 60)}..."`
                );
                return; // Near-duplicate found — abort save to keep knowledge base clean
            }
        } catch (vectorErr) {
            // 🛠️ AUDIT FIX: [MEM-01] Graceful fallback if Atlas vector index is not yet
            // configured. Revert to exact-string check rather than losing the fact entirely.
            console.warn(
                '[Memory] Vector dedup unavailable, falling back to exact-string check:',
                vectorErr.message
            );
            const exists = await Fact.findOne({ user: userId, fact: extractedFact });
            if (exists) return; // Exact duplicate — abort save
        }

        // No semantic or exact duplicate found — persist the new fact
        await Fact.create({ user: userId, fact: extractedFact, embedding });
        console.log(`💾 [Memory] Vector embedded & saved: "${extractedFact.substring(0, 80)}"`);
    } catch (err) {
        console.error('Fact Save Error:', err);
    }
};

/**
 * Retrieves the top semantically relevant facts for a given query using
 * MongoDB Atlas Vector Search (HNSW index on the `embedding` field).
 *
 * 🛠️ AUDIT FIX: [MEM-02] — numCandidates increased from 20 → 100
 *   HNSW recommendation: numCandidates ≥ 10× limit. With limit: 5, the
 *   minimum is 50. We use 100 for a healthy recall margin at scale (5,000+
 *   facts). The old value of 20 caused the search to miss genuinely relevant
 *   facts because the HNSW graph traversal was terminated too early.
 *
 * 🛠️ AUDIT FIX: [QW-06] — Relevance score gate added (score > 0.65)
 *   BEFORE: All top-5 results were returned regardless of cosine similarity.
 *   A fact scoring 0.28 (irrelevant noise) was injected into the LLM context
 *   just as confidently as one scoring 0.95. This polluted the system prompt
 *   with unrelated facts and degraded answer quality.
 *   AFTER: Only facts above the 0.65 relevance threshold are returned.
 *   If no facts meet this bar (e.g., a brand-new user with < 3 stored facts),
 *   an empty array is returned cleanly and the LLM answers from its own
 *   knowledge without false memory injections.
 */
export const getRelevantFacts = async (userId, query) => {
    try {
        const queryEmbedding = await generateEmbedding(query);

        const facts = await Fact.aggregate([
            {
                $vectorSearch: {
                    index: 'vector_index',
                    path: 'embedding',
                    queryVector: queryEmbedding,
                    numCandidates: 100, // 🛠️ AUDIT FIX: [MEM-02] Was 20 — now 100 for proper HNSW recall
                    limit: 5,
                    filter: {
                        user: new mongoose.Types.ObjectId(userId.toString()),
                    },
                },
            },
            {
                $project: {
                    fact: 1,
                    score: { $meta: 'vectorSearchScore' },
                },
            },
        ]);

        // 🛠️ AUDIT FIX: [QW-06] Relevance gate — discard low-confidence facts
        // before injecting them into the LLM context window.
        const relevantFacts = facts.filter((f) => f.score > 0.65);

        if (relevantFacts.length < facts.length) {
            console.log(
                `🧠 [Memory] Relevance gate filtered ${facts.length - relevantFacts.length}` +
                ` low-score fact(s) below 0.65 threshold.`
            );
        }

        return relevantFacts.map((f) => f.fact);
    } catch (err) {
        // Graceful degradation: if the Atlas vector index is not set up yet,
        // fall back to recency-based retrieval so the system remains functional.
        console.warn('[Memory] Vector search unavailable, using recency fallback:', err.message);
        const fallbackFacts = await Fact.find({ user: userId })
            .sort({ timestamp: -1 })
            .limit(5)
            .lean();
        return fallbackFacts.map((f) => f.fact);
    }
};