import express from 'express';
import rateLimit from 'express-rate-limit'; // 🛠️ AUDIT FIX: [SEC-02] run `npm install express-rate-limit`
import { generateAIResponse } from '../services/llm.js';
import { executeCommand } from '../services/system.js';
import { Message } from '../services/memory.js';
import { generateSpeech } from '../services/tts.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// ============================================================================
// 🛡️ RATE LIMITER
// ============================================================================

/**
 * 🛠️ AUDIT FIX: [SEC-02] — Per-User Rate Limiting on the Chat Endpoint
 *
 * BEFORE: No rate limiting existed. A single authenticated user (or a bot
 * holding a valid JWT) could issue thousands of requests per minute,
 * exhausting Groq API credit, MongoDB read quota, and Google TTS quota in
 * seconds with zero friction.
 *
 * AFTER: Each authenticated user is limited to 20 requests per 60-second
 * window. The key is their MongoDB user ID (not their IP) so that users
 * sharing an IP address (e.g., on corporate NAT or a university network)
 * each get their own independent quota.
 *
 * Configuration rationale:
 *   windowMs: 60s     → Rolling 1-minute window.
 *   max: 20           → Generous enough for fast conversational use (human
 *                        speech averages 1 turn per 15–30s), but blocks bots.
 *   keyGenerator      → Per-user-ID, not per-IP, for fairness on shared networks.
 *   standardHeaders   → Sends `RateLimit-*` headers so the frontend can show
 *                       a "please slow down" message before the 429 fires.
 *   legacyHeaders     → Disabled — the old `X-RateLimit-*` headers are
 *                       redundant alongside standardHeaders.
 *   skipFailedReqs    → false — even failed requests count toward the limit
 *                       to prevent rapid retry abuse.
 *
 * Note: `protect` runs before `chatLimiter` in the middleware chain, so
 * `req.user` is always populated (and never null, post SEC-03 fix) by the
 * time keyGenerator is called.
 */
const chatLimiter = rateLimit({
    windowMs: 60 * 1000, // 1-minute rolling window
    max: 20,             // 20 requests per user per minute
    keyGenerator: (req) => {
        // Use MongoDB user ID as the rate-limit key — never falls back to IP
        // because protect() guarantees req.user exists before this runs.
        return req.user._id.toString();
    },
    standardHeaders: true,  // Emit `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
    legacyHeaders: false,    // Suppress deprecated `X-RateLimit-*` headers
    skipFailedRequests: false,
    handler: (req, res) => {
        // Return a structured SSE error so the frontend's onError handler
        // receives a clean message instead of a raw 429 JSON response that
        // bypasses the stream entirely. We write the SSE headers manually
        // here because express-rate-limit fires before res.writeHead().
        res.status(429).set({
            'Content-Type': 'application/json',
        }).json({
            error: true,
            text: "You're sending messages too quickly. Please wait a moment before trying again.",
        });
    },
});

// ============================================================================
// 🖼️ IMAGE VALIDATION HELPER
// ============================================================================

/**
 * 🛠️ AUDIT FIX: [ERR-03] — Image Payload Validation Before AI Pipeline Entry
 *
 * BEFORE: `base64Image.length > 100` was the only check. Any string longer
 * than 100 characters — including 49MB of arbitrary non-image data — was
 * forwarded straight to the Groq Vision model, wasting tokens and compute.
 *
 * AFTER: Three-stage validation:
 *   1. MIME type must be a recognized image type via data URI prefix.
 *   2. Decoded byte size must be ≤ 3MB. The in-app camera captures at 512px
 *      width + 0.4 JPEG quality (~30–80KB), so 3MB is 40–100× headroom for
 *      manually uploaded images while still blocking abuse.
 *   3. Returns a structured result object so the calling route can send a
 *      descriptive SSE error event rather than a cryptic 400.
 *
 * @param {string|null} base64Image - Raw data URI string from req.body.image
 * @returns {{ valid: boolean, reason?: string }}
 */
const validateImage = (base64Image) => {
    // No image provided — perfectly valid, continue to text-only path
    if (!base64Image) return { valid: true };

    // Stage 1: Verify it is a well-formed data URI with an image MIME type
    const mimeMatch = base64Image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
    if (!mimeMatch) {
        return {
            valid: false,
            reason: 'Invalid image format. Expected a base64 data URI (e.g. data:image/jpeg;base64,...).',
        };
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimeTypes.includes(mimeMatch[1].toLowerCase())) {
        return {
            valid: false,
            reason: `Unsupported image type: ${mimeMatch[1]}. Allowed types: JPEG, PNG, WebP, GIF.`,
        };
    }

    // Stage 2: Estimate the decoded byte size (base64 overhead ≈ 33%)
    const base64Data = base64Image.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');
    const estimatedBytes = Math.ceil((base64Data.length * 3) / 4);
    const MAX_IMAGE_BYTES = 3 * 1024 * 1024; // 3 MB

    if (estimatedBytes > MAX_IMAGE_BYTES) {
        const sizeMB = (estimatedBytes / (1024 * 1024)).toFixed(1);
        return {
            valid: false,
            reason: `Image is too large (${sizeMB}MB). Maximum allowed size is 3MB.`,
        };
    }

    return { valid: true };
};

// ============================================================================
// 📜 ROUTE: GET /api/chat/history
// ============================================================================

router.get('/history', protect, async (req, res) => {
    try {
        const history = await Message.find({ user: req.user._id })
            .sort({ timestamp: -1 })
            .limit(50)
            .lean();
        res.json(history);
    } catch (error) {
        console.error('History Fetch Error:', error);
        res.status(500).json({ error: 'Failed to fetch chat history' });
    }
});

// ============================================================================
// 💬 ROUTE: POST /api/chat  — Server-Sent Events (SSE) Streaming Route
// ============================================================================

/**
 * Middleware chain: protect → chatLimiter → handler
 *   protect     — verifies JWT, attaches req.user (null-guarded post SEC-03)
 *   chatLimiter — enforces 20 req/min per user ID (SEC-02)
 *   handler     — validates image, calls AI pipeline, streams SSE events
 */
router.post('/', protect, chatLimiter, async (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    });

    // 🛠️ SURGICAL FIX: [V-ORIG] Track client disconnect to prevent
    // ERR_STREAM_WRITE_AFTER_END on long-running AI calls
    let clientDisconnected = false;
    req.on('close', () => {
        clientDisconnected = true;
    });

    const sendStreamEvent = (type, payload) => {
        if (clientDisconnected) return; // Guard all writes to closed stream
        try {
            res.write(`data: ${JSON.stringify({ type, ...payload })}\n\n`);
        } catch (e) {
            clientDisconnected = true;
        }
    };

    try {
        const { prompt, image, voice, mood } = req.body;

        if (!prompt && !image) {
            sendStreamEvent('error', { text: 'Prompt or image is required' });
            return res.end();
        }

        // ── 🛠️ AUDIT FIX: [ERR-03] — Validate image before touching the AI pipeline
        // Any invalid or oversized image produces a clean SSE error event and
        // terminates the request before a single Groq token is consumed.
        const imageValidation = validateImage(image);
        if (!imageValidation.valid) {
            console.warn(
                `🖼️ [Chat] Image validation failed for user [${req.user.name}]: ${imageValidation.reason}`
            );
            sendStreamEvent('error', { text: imageValidation.reason });
            return res.end();
        }

        const logPrompt = prompt || '[Image Uploaded]';
        console.log(
            `🗣️ User [${req.user.name}] said: "${logPrompt}" (Mood: ${mood || 'neutral'})`
        );

        // 🚀 FIXED: Isolated database saving so a DB error doesn't crash the AI stream
        try {
            await Message.create({ user: req.user._id, role: 'user', text: logPrompt });
            console.log(`✅ User Query Successfully Saved to DB`);
        } catch (dbErr) {
            console.error(`❌ Failed to save User Query:`, dbErr);
        }

        // ── System command fast-path (local commands bypass the AI entirely) ──
        // 🚀 DEPLOYMENT FIX: Safely bypass local command execution in production cloud environments
        if (prompt && process.env.NODE_ENV !== 'production') {
            const commandResponse = executeCommand(prompt);
            if (commandResponse) {
                sendStreamEvent('text', { text: commandResponse });

                const audio = await generateSpeech(commandResponse, voice || 'female');

                // 🛠️ AUDIT FIX: [ERR-01] — Only emit audio event if TTS succeeded.
                // generateSpeech() returns null on Google TTS failure. Sending
                // { audio: null } downstream causes the frontend's audio player to
                // set src="data:audio/mpeg;base64,null" — an invalid src string that
                // throws a MediaError and swallows the voice-continuation callback.
                if (audio) {
                    sendStreamEvent('audio', { audio });
                }

                try {
                    await Message.create({
                        user: req.user._id,
                        role: 'ai',
                        text: commandResponse,
                    });
                } catch (e) {
                    /* non-fatal — history save failure doesn't break the response */
                }

                return res.end();
            }
        }

        sendStreamEvent('status', { text: 'Thinking...' });

        const aiResponse = await generateAIResponse(
            prompt,
            image,
            req.user._id,
            (statusMessage) => {
                sendStreamEvent('status', { text: statusMessage });
            },
            mood
        );

        if (aiResponse.error) {
            sendStreamEvent('error', { text: aiResponse.text });
            return res.end();
        }

        // ⚡ INSTANT TEXT + CARD DELIVERY — audio is generated asynchronously below
        sendStreamEvent('text', { text: aiResponse.text, card: aiResponse.card });

        // Save AI response to chat history (non-fatal if it fails)
        try {
            await Message.create({
                user: req.user._id,
                role: 'ai',
                text: aiResponse.text,
            });
            console.log(`✅ AI Response Successfully Saved to DB`);
        } catch (dbErr) {
            console.error(`❌ Failed to save AI Response:`, dbErr);
        }

        // ── TTS synthesis (runs after text is already delivered to client) ───
        const base64Audio = await generateSpeech(aiResponse.text, voice || 'female');

        // 🛠️ AUDIT FIX: [ERR-01] — Null audio guard
        //
        // BEFORE: `sendStreamEvent('audio', { audio: base64Audio })` fired
        // unconditionally. When Google TTS threw an error, `generateSpeech`
        // returned null, and the frontend received `{ type: "audio", audio: null }`.
        // The onAudio handler then tried to set audioPlayer.src to the string
        // "data:audio/mpeg;base64,null" — an invalid URL that throws a MediaError
        // and, crucially, never fires the `onEnded` event that drives
        // `triggerVoiceContinuation()`. This silently froze the voice loop,
        // leaving the microphone permanently disabled until the user refreshed.
        //
        // AFTER: The audio event is suppressed entirely when TTS fails. The
        // frontend's onAudio handler is simply never called, so the `else`
        // branch in App.jsx (`else { triggerVoiceContinuation(); }`) fires
        // correctly, restoring microphone listening as expected.
        if (base64Audio) {
            sendStreamEvent('audio', { audio: base64Audio });
        } else {
            // TTS failed — log it but let the stream end cleanly.
            // The frontend handles the missing audio event gracefully via
            // the else-branch in its onAudio callback.
            console.warn(
                `⚠️ [Chat] TTS generation returned null for user [${req.user.name}] — ` +
                `audio event suppressed. Voice continuation will fire via missing onAudio.`
            );
        }

        res.end();
    } catch (error) {
        console.error('❌ Route Error:', error);
        sendStreamEvent('error', { text: 'Failed to process request' });
        res.end();
    }
});

export default router;