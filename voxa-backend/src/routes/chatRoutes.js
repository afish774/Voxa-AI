import express from 'express';
import { generateAIResponse } from '../services/llm.js';
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
        console.error("History Fetch Error:", error);
        res.status(500).json({ error: "Failed to fetch chat history" });
    }
});

// 🚀 Server-Sent Events (SSE) Streaming Route
router.post('/', protect, async (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    });

    // 🛠️ SURGICAL FIX: Track client disconnect to prevent ERR_STREAM_WRITE_AFTER_END
    let clientDisconnected = false;
    req.on('close', () => { clientDisconnected = true; });

    const sendStreamEvent = (type, payload) => {
        if (clientDisconnected) return; // 🛠️ SURGICAL FIX: Guard writes to closed stream
        try {
            res.write(`data: ${JSON.stringify({ type, ...payload })}\n\n`);
        } catch (e) { clientDisconnected = true; }
    };

    try {
        const { prompt, image, voice, mood } = req.body;

        if (!prompt && !image) {
            sendStreamEvent('error', { text: "Prompt or image is required" });
            return res.end();
        }

        const logPrompt = prompt || "[Image Uploaded]";
        console.log(`🗣️ User [${req.user.name}] said: "${logPrompt}" (Mood: ${mood || 'neutral'})`);

        // 🚀 FIXED: Isolated database saving so a DB error doesn't break the whole AI stream
        try {
            await Message.create({ user: req.user._id, role: 'user', text: logPrompt });
            console.log(`✅ User Query Successfully Saved to DB`);
        } catch (dbErr) {
            console.error(`❌ Failed to save User Query:`, dbErr);
        }

        if (prompt) {
            const commandResponse = executeCommand(prompt);
            if (commandResponse) {
                sendStreamEvent('text', { text: commandResponse });
                const audio = await generateSpeech(commandResponse, voice || 'female');
                sendStreamEvent('audio', { audio });
                try {
                    await Message.create({ user: req.user._id, role: 'ai', text: commandResponse });
                } catch (e) { }
                return res.end();
            }
        }

        sendStreamEvent('status', { text: 'Thinking...' });

        const aiResponse = await generateAIResponse(prompt, image, req.user._id, (statusMessage) => {
            sendStreamEvent('status', { text: statusMessage });
        }, mood);

        if (aiResponse.error) {
            sendStreamEvent('error', { text: aiResponse.text });
            return res.end();
        }

        // ⚡ INSTANT TEXT DELIVERY
        sendStreamEvent('text', { text: aiResponse.text, card: aiResponse.card });

        try {
            await Message.create({ user: req.user._id, role: 'ai', text: aiResponse.text });
            console.log(`✅ AI Response Successfully Saved to DB`);
        } catch (dbErr) {
            console.error(`❌ Failed to save AI Response:`, dbErr);
        }

        // GENERATE AUDIO IN BACKGROUND
        const base64Audio = await generateSpeech(aiResponse.text, voice || 'female');

        sendStreamEvent('audio', { audio: base64Audio });
        res.end();

    } catch (error) {
        console.error("❌ Route Error:", error);
        sendStreamEvent('error', { text: "Failed to process request" });
        res.end();
    }
});

export default router;