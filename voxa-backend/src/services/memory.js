import mongoose from 'mongoose';
import { pipeline } from '@xenova/transformers';

// 🚀 1. Local AI Embedding Engine (Runs completely free in Node.js)
class EmbeddingPipeline {
    static instance = null;
    static async getInstance() {
        if (this.instance === null) {
            // Downloads a tiny, hyper-fast embedding model into server memory
            this.instance = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        }
        return this.instance;
    }
}

export const generateEmbedding = async (text) => {
    const embedder = await EmbeddingPipeline.getInstance();
    const output = await embedder(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
};

// 💾 2. Schemas
const messageSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: String,
    text: String,
    timestamp: { type: Date, default: Date.now }
});
export const Message = mongoose.model('Message', messageSchema);

// Updated Vault with Vector Array
const factSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fact: String,
    embedding: { type: [Number], required: true }, // The 384-dimensional vector
    timestamp: { type: Date, default: Date.now }
});
export const Fact = mongoose.model('Fact', factSchema);

// 🛠️ 3. Memory Controllers
export const saveToMemory = async (userId, role, text) => {
    try { await Message.create({ user: userId, role, text }); }
    catch (err) { console.error("Memory Save Error:", err); }
};

export const getChatHistory = async (userId) => {
    try {
        const history = await Message.find({ user: userId }).sort({ timestamp: -1 }).limit(8).lean();
        return history.reverse();
    } catch (err) { return []; }
};

// 🧠 4. The RAG Engine
export const saveFact = async (userId, extractedFact) => {
    if (!extractedFact || extractedFact.includes("NONE")) return;
    try {
        const exists = await Fact.findOne({ user: userId, fact: extractedFact });
        if (!exists) {
            const embedding = await generateEmbedding(extractedFact);
            await Fact.create({ user: userId, fact: extractedFact, embedding });
            console.log(`💾 Vector Embedded & Saved: "${extractedFact}"`);
        }
    } catch (err) { console.error("Fact Save Error:", err); }
};

export const getRelevantFacts = async (userId, query) => {
    try {
        const queryEmbedding = await generateEmbedding(query);

        // MongoDB Atlas Native Vector Search
        const facts = await Fact.aggregate([
            {
                $vectorSearch: {
                    index: 'vector_index',
                    path: 'embedding',
                    queryVector: queryEmbedding,
                    numCandidates: 20,
                    limit: 5,
                    filter: { user: new mongoose.Types.ObjectId(userId.toString()) }
                }
            },
            { $project: { fact: 1, score: { $meta: "vectorSearchScore" } } }
        ]);
        return facts.map(f => f.fact);
    } catch (err) {
        // Fallback: If Vector Index isn't set up yet, degrade gracefully to standard search
        const fallbackFacts = await Fact.find({ user: userId }).sort({ timestamp: -1 }).limit(5).lean();
        return fallbackFacts.map(f => f.fact);
    }
};