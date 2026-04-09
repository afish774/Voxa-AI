import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { generateEmbedding, Fact } from '../services/memory.js';

const router = express.Router();

// 🧠 POST /api/learn
// Explicitly inject knowledge into Voxa's RAG Vault
router.post('/', protect, async (req, res) => {
    try {
        const { documentText } = req.body;

        if (!documentText || documentText.trim().length === 0) {
            return res.status(400).json({ error: "No text provided to learn." });
        }

        console.log(`📚 User [${req.user.name}] is teaching Voxa new information...`);

        // 1. Simple Chunking Strategy (Split by double newlines or paragraphs)
        // This ensures we don't exceed embedding token limits and keeps search highly accurate
        const chunks = documentText.split(/\n\s*\n/).filter(chunk => chunk.trim().length > 20);

        let savedCount = 0;

        // 2. Embed and Save each chunk
        for (const chunk of chunks) {
            const cleanChunk = chunk.trim();

            // Prevent exact duplicates
            const exists = await Fact.findOne({ user: req.user._id, fact: cleanChunk });
            if (!exists) {
                const embedding = await generateEmbedding(cleanChunk);
                await Fact.create({
                    user: req.user._id,
                    fact: cleanChunk,
                    embedding
                });
                savedCount++;
            }
        }

        console.log(`✅ Voxa successfully memorized ${savedCount} new concepts.`);

        res.status(200).json({
            success: true,
            message: `Successfully memorized ${savedCount} new concepts into the Vector Vault.`,
            chunksProcessed: chunks.length
        });

    } catch (error) {
        console.error("❌ Knowledge Ingestion Error:", error);
        res.status(500).json({ error: "Failed to process and memorize the document." });
    }
});

export default router;