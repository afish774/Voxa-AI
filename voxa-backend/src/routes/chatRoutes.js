import express from 'express';
import { generateAIResponse } from '../services/gemini.js';
import { executeCommand } from '../services/system.js';
import { Message } from '../services/memory.js';
import { generateSpeech } from '../services/tts.js';
import { protect } from '../middleware/authMiddleware.js'; // 🚀 Import the Security Guard

const router = express.Router();

// 🚀 Use 'protect' and filter history by req.user._id
router.get('/history', protect, async (req, res) => {
    try {
        const history = await Message.find({ user: req.user._id }).sort({ timestamp: -1 }).limit(50).lean();
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch chat history" });
    }
});

// 🚀 Use 'protect' on the main chat route
router.post('/', protect, async (req, res) => {
    try {
        const { prompt, image, voice } = req.body;
        if (!prompt) return res.status(400).json({ error: "Prompt is required" });

        console.log(`🗣️ User [${req.user.name}] said: "${prompt}"`);
        if (image) console.log(`📥 Server received image payload.`);

        // 💾 Save User's prompt to MongoDB
        await Message.create({ user: req.user._id, role: 'user', text: prompt });

        const commandResponse = executeCommand(prompt);
        if (commandResponse) {
            console.log(`⚡ System Command Executed.`);
            const audio = await generateSpeech(commandResponse, voice || 'female');

            // 💾 Save Command response to MongoDB
            await Message.create({ user: req.user._id, role: 'ai', text: commandResponse });

            return res.json({ text: commandResponse, audio, success: true });
        }

        // NOTE: We pass req.user._id to Gemini in case your RAG vault needs it!
        const aiResponse = await generateAIResponse(prompt, image, req.user._id);
        console.log(`🤖 Voxa thought: "${aiResponse.text}"`);

        // 💾 Save Gemini response to MongoDB
        await Message.create({ user: req.user._id, role: 'ai', text: aiResponse.text });

        const base64Audio = await generateSpeech(aiResponse.text, voice || 'female');

        res.json({
            text: aiResponse.text,
            card: aiResponse.card,
            audio: base64Audio,
            success: true
        });

    } catch (error) {
        console.error("❌ Route Error:", error);
        res.status(500).json({ error: "Failed to process request" });
    }
});

export default router;