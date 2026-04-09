import express from 'express';
import { generateAIResponse } from '../services/llm.js'; // 🚀 Pointing to new Custom Pipeline
import { executeCommand } from '../services/system.js';
import { Message } from '../services/memory.js';
import { generateSpeech } from '../services/tts.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/history', protect, async (req, res) => {
    try {
        const history = await Message.find({ user: req.user._id }).sort({ timestamp: -1 }).limit(50).lean();
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch chat history" });
    }
});

router.post('/', protect, async (req, res) => {
    try {
        const { prompt, image, voice } = req.body;
        if (!prompt) return res.status(400).json({ error: "Prompt is required" });

        console.log(`🗣️ User [${req.user.name}] said: "${prompt}"`);
        if (image) console.log(`📥 Server received image payload.`);

        await Message.create({ user: req.user._id, role: 'user', text: prompt });

        const commandResponse = executeCommand(prompt);
        if (commandResponse) {
            console.log(`⚡ System Command Executed.`);
            const audio = await generateSpeech(commandResponse, voice || 'female');
            await Message.create({ user: req.user._id, role: 'ai', text: commandResponse });
            return res.json({ text: commandResponse, audio, success: true });
        }

        // Send to RAG Pipeline
        const aiResponse = await generateAIResponse(prompt, image, req.user._id);

        // 🛡️ Graceful Error Handling
        if (aiResponse.error) {
            return res.status(200).json({ text: aiResponse.text, success: false });
        }

        console.log(`🤖 Voxa thought: "${aiResponse.text}"`);

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