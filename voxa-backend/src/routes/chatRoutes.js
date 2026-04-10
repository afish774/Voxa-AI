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
        res.status(500).json({ error: "Failed to fetch chat history" });
    }
});

// 🚀 UPGRADED: Server-Sent Events (SSE) Streaming Route
router.post('/', protect, async (req, res) => {
    // 1. Establish the Real-Time Pipeline Headers
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    });

    // Helper function to push chunks of data down the pipe
    const sendStreamEvent = (type, payload) => {
        res.write(`data: ${JSON.stringify({ type, ...payload })}\n\n`);
    };

    try {
        const { prompt, image, voice } = req.body;
        if (!prompt) {
            sendStreamEvent('error', { text: "Prompt is required" });
            return res.end();
        }

        console.log(`🗣️ User [${req.user.name}] said: "${prompt}"`);
        await Message.create({ user: req.user._id, role: 'user', text: prompt });

        const commandResponse = executeCommand(prompt);
        if (commandResponse) {
            sendStreamEvent('text', { text: commandResponse });
            const audio = await generateSpeech(commandResponse, voice || 'female');
            sendStreamEvent('audio', { audio });
            await Message.create({ user: req.user._id, role: 'ai', text: commandResponse });
            return res.end();
        }

        // 2. Start the AI Pipeline and pass in a real-time status callback
        sendStreamEvent('status', { text: 'Thinking...' });

        const aiResponse = await generateAIResponse(prompt, image, req.user._id, (statusMessage) => {
            // This fires dynamically if the AI decides to use the Tavily Search Tool!
            sendStreamEvent('status', { text: statusMessage });
        });

        if (aiResponse.error) {
            sendStreamEvent('error', { text: aiResponse.text });
            return res.end();
        }

        // 3. ⚡ INSTANT TEXT DELIVERY ⚡
        // The UI will update with text and widgets immediately!
        console.log(`🤖 Voxa thought: "${aiResponse.text}"`);
        sendStreamEvent('text', { text: aiResponse.text, card: aiResponse.card });
        await Message.create({ user: req.user._id, role: 'ai', text: aiResponse.text });

        // 4. GENERATE AUDIO IN BACKGROUND
        // 🚀 FIXED: Removed the 'Synthesizing voice...' status so it stops overwriting the actual text!
        const base64Audio = await generateSpeech(aiResponse.text, voice || 'female');

        // 5. SEND AUDIO AND CLOSE CONNECTION
        sendStreamEvent('audio', { audio: base64Audio });
        res.end();

    } catch (error) {
        console.error("❌ Route Error:", error);
        sendStreamEvent('error', { text: "Failed to process request" });
        res.end();
    }
});

export default router;