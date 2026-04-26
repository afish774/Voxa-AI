import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { generateEmbedding, Fact } from '../services/memory.js';

const router = express.Router();

// 🛡️ OMNI-AUDIT FIX: [MEM-LEAK-04] Hard limits to prevent event loop starvation.
// A 500-chunk document with ONNX inference per chunk would block the main thread
// for minutes, starving all concurrent HTTP requests.
const MAX_INPUT_LENGTH = 100_000; // ~100KB of raw text
const MAX_CHUNKS = 50;            // 50 chunks × ~200ms ONNX inference ≈ 10s max

// 🧠 POST /api/learn
// Explicitly inject knowledge into Voxa's RAG Vault
router.post('/', protect, async (req, res) => {
    try {
        const { documentText } = req.body;

        if (!documentText || documentText.trim().length === 0) {
            return res.status(400).json({ error: "No text provided to learn." });
        }

        // 🛡️ OMNI-AUDIT FIX: [MEM-LEAK-04] Reject oversized payloads before
        // any processing begins — fail fast, preserve server resources.
        if (documentText.length > MAX_INPUT_LENGTH) {
            return res.status(400).json({
                error: `Document is too large (${(documentText.length / 1000).toFixed(0)}KB). Maximum allowed is ${MAX_INPUT_LENGTH / 1000}KB.`,
            });
        }

        console.log(`📚 User [${req.user.name}] is teaching Voxa new information...`);

        // 1. Simple Chunking Strategy (Split by double newlines or paragraphs)
        // This ensures we don't exceed embedding token limits and keeps search highly accurate
        const allChunks = documentText.split(/\n\s*\n/).filter(chunk => chunk.trim().length > 20);

        // 🛡️ OMNI-AUDIT FIX: [MEM-LEAK-04] Cap chunk count to prevent CPU starvation
        if (allChunks.length > MAX_CHUNKS) {
            console.warn(
                `⚠️ [Learn] Document has ${allChunks.length} chunks — capping to ${MAX_CHUNKS}. ` +
                `User [${req.user.name}] should split large documents.`
            );
        }
        const chunks = allChunks.slice(0, MAX_CHUNKS);

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
            chunksProcessed: chunks.length,
            // 🛡️ OMNI-AUDIT FIX: [MEM-LEAK-04] Inform client if chunks were truncated
            truncated: allChunks.length > MAX_CHUNKS,
            totalChunksInDocument: allChunks.length,
        });

    } catch (error) {
        console.error("❌ Knowledge Ingestion Error:", error);
        res.status(500).json({ error: "Failed to process and memorize the document." });
    }
});

export default router;