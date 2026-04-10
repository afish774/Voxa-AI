import express from 'express';
import { Fact } from '../services/memory.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// 🧠 GET: Fetch all saved memories for the logged-in user
router.get('/', protect, async (req, res) => {
    try {
        // We use .select('-embedding') so we don't send massive arrays of 384 numbers to the frontend!
        const facts = await Fact.find({ user: req.user._id })
            .select('-embedding')
            .sort({ timestamp: -1 })
            .lean();
        res.json(facts);
    } catch (error) {
        console.error("Fetch Memories Error:", error);
        res.status(500).json({ error: "Failed to fetch memories" });
    }
});

// 🗑️ DELETE: Remove a specific memory by its MongoDB ID
router.delete('/:id', protect, async (req, res) => {
    try {
        // We include user: req.user._id to ensure a hacker can't delete someone else's memory
        await Fact.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        res.json({ success: true, message: "Memory erased." });
    } catch (error) {
        console.error("Delete Memory Error:", error);
        res.status(500).json({ error: "Failed to delete memory" });
    }
});

export default router;