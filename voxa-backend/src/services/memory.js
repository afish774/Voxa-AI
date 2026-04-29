import mongoose from 'mongoose';
import { pipeline } from '@xenova/transformers';

// ============================================================================
// 🧠 1. LOCAL AI EMBEDDING ENGINE
// ============================================================================

/**
 * 🛠️ AUDIT FIX: [BUG-02] — TOCTOU Race Condition Eliminated
 */
class EmbeddingPipeline {
    static _instance = null;
    static _initPromise = null;

    static async getInstance() {
        if (this._instance) return this._instance;

        if (!this._initPromise) {
            this._initPromise = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
                .then((loadedPipeline) => {
                    this._instance = loadedPipeline;
                    this._initPromise = null;
                    console.log('✅ [Memory] Embedding model loaded successfully (Xenova/all-MiniLM-L6-v2)');
                    return loadedPipeline;
                })
                .catch((err) => {
                    this._initPromise = null;
                    console.error('❌ [Memory] Embedding model failed to load:', err.message);
                    throw err;
                });
        }

        return this._initPromise;
    }
}

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
    embedding: { type: [Number], required: true },
    timestamp: { type: Date, default: Date.now },
});
export const Fact = mongoose.model('Fact', factSchema);

// ============================================================================
// 🛠️ 3. MEMORY CONTROLLERS
// ============================================================================

export const saveToMemory = async (userId, role, text) => {
    try {
        await Message.create({ user: userId, role, text });
    } catch (err) {
        console.error('Memory Save Error:', err);
    }
};

export const getChatHistory = async (userId) => {
    try {
        const history = await Message.find({ user: userId })
            .sort({ timestamp: -1 })
            .limit(4)
            .lean();
        return history.reverse();
    } catch (err) {
        return [];
    }
};

// ============================================================================
// 🧠 4. RAG ENGINE — SEMANTIC FACT STORAGE & RETRIEVAL
// ============================================================================

export const saveFact = async (userId, extractedFact) => {
    if (!extractedFact || extractedFact.includes('NONE') || extractedFact.trim().length < 10) {
        return;
    }

    try {
        // 🛠️ AUDIT FIX: Hard OOM boundary protection. 
        // Xenova pipelines process in-RAM. An excessively long string will crash Node.
        const safeFact = extractedFact.substring(0, 512).trim();
        const embedding = await generateEmbedding(safeFact);

        try {
            const nearDuplicates = await Fact.aggregate([
                {
                    $vectorSearch: {
                        index: 'vector_index',
                        path: 'embedding',
                        queryVector: embedding,
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
                    `"${safeFact.substring(0, 60)}..."`
                );
                return;
            }
        } catch (vectorErr) {
            console.warn('[Memory] Vector dedup unavailable, falling back to exact-string check:', vectorErr.message);
            const exists = await Fact.findOne({ user: userId, fact: safeFact });
            if (exists) return;
        }

        await Fact.create({ user: userId, fact: safeFact, embedding });
        console.log(`💾 [Memory] Vector embedded & saved: "${safeFact.substring(0, 80)}"`);
    } catch (err) {
        console.error('Fact Save Error:', err);
    }
};

export const getRelevantFacts = async (userId, query) => {
    try {
        // Safe bounding for search queries to prevent OOM
        const safeQuery = query.substring(0, 512).trim();
        const queryEmbedding = await generateEmbedding(safeQuery);

        const facts = await Fact.aggregate([
            {
                $vectorSearch: {
                    index: 'vector_index',
                    path: 'embedding',
                    queryVector: queryEmbedding,
                    numCandidates: 100,
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

        const relevantFacts = facts.filter((f) => f.score > 0.65);

        if (relevantFacts.length < facts.length) {
            console.log(
                `🧠 [Memory] Relevance gate filtered ${facts.length - relevantFacts.length}` +
                ` low-score fact(s) below 0.65 threshold.`
            );
        }

        return relevantFacts.map((f) => f.fact);
    } catch (err) {
        console.warn('[Memory] Vector search unavailable, using recency fallback:', err.message);
        const fallbackFacts = await Fact.find({ user: userId })
            .sort({ timestamp: -1 })
            .limit(5)
            .lean();
        return fallbackFacts.map((f) => f.fact);
    }
};