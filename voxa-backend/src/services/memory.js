import mongoose from 'mongoose';

// 1. Short-Term Chat Schema
const messageSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // 🚀 Locks to user
    role: String,
    text: String,
    timestamp: { type: Date, default: Date.now }
});
export const Message = mongoose.model('Message', messageSchema);

// 2. 🧠 Long-Term Fact Schema (The RAG Vault)
const factSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // 🚀 Locks to user
    fact: String,
    timestamp: { type: Date, default: Date.now }
});
export const Fact = mongoose.model('Fact', factSchema);

// Memory Controllers
export const saveToMemory = async (userId, role, text) => {
    try {
        await Message.create({ user: userId, role, text });
    } catch (err) {
        console.error("Memory Save Error:", err);
    }
};

export const getChatHistory = async (userId) => {
    try {
        const history = await Message.find({ user: userId }).sort({ timestamp: -1 }).limit(8).lean();
        return history.reverse();
    } catch (err) {
        return [];
    }
};

// 🧠 Fact Vault Controllers
export const saveFact = async (userId, extractedFact) => {
    if (!extractedFact || extractedFact.includes("NONE")) return;
    try {
        const exists = await Fact.findOne({ user: userId, fact: extractedFact });
        if (!exists) {
            await Fact.create({ user: userId, fact: extractedFact });
            console.log(`💾 New Long-Term Memory Saved: "${extractedFact}"`);
        }
    } catch (err) {
        console.error("Fact Save Error:", err);
    }
};

export const getLongTermFacts = async (userId) => {
    try {
        const facts = await Fact.find({ user: userId }).lean();
        return facts.map(f => f.fact);
    } catch (err) {
        return [];
    }
};