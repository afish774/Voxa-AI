// ============================================================================
// 🌐 API STREAM SERVICE — SSE Client & History Fetch
// ============================================================================

// 🛠️ AUDIT FIX: [QW-05] — Externalize Backend URL via Vite Environment Variable
//
// BEFORE: Both fetch() calls in this file hardcoded the production Render URL:
//   "https://voxa-ai-zh5o.onrender.com/api/chat"
//   "https://voxa-ai-zh5o.onrender.com/api/chat/history"
//
// This caused two concrete problems:
//   1. Local development required manually editing source code before every
//      dev session (and then reverting before committing) — a broken workflow.
//   2. Any future domain change, migration to a different host, or addition
//      of a staging environment required a code edit + full frontend redeploy.
//
// AFTER: The base URL is read from `import.meta.env.VITE_API_URL`, which Vite
// injects at build time from the active .env file.
//
// Development  → create `voxa-frontend/.env.local` with:
//                  VITE_API_URL=http://localhost:5000
//
// Production   → set `VITE_API_URL=https://voxa-ai-zh5o.onrender.com`
//                in your Vercel / Netlify environment variables dashboard.
//                No source code changes required for domain migrations.
//
// The fallback (`|| 'https://voxa-ai-zh5o.onrender.com'`) keeps the current
// production deployment working with zero configuration until you set the
// env var in your Vercel dashboard — nothing breaks on day one.
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://voxa-ai-zh5o.onrender.com';

/**
 * Opens an SSE (Server-Sent Events) stream to the Voxa chat endpoint.
 * Dispatches typed events to the provided callbacks as they arrive.
 *
 * @param {object} payload   - { prompt, image, voice, mood, token }
 * @param {object} callbacks - { onStatus, onText, onAudio, onError }
 */
export const streamChatResponse = async (payload, callbacks) => {
    const { prompt, image, voice, mood, token } = payload;
    const { onStatus, onText, onAudio, onError } = callbacks;

    // 🛠️ SURGICAL FIX: [V-12] Client-side SSE timeout — if no valid event arrives
    // within 30s, abort the stream and show an error instead of hanging forever.
    let streamTimeoutId = null;
    const STREAM_TIMEOUT_MS = 30000;

    const resetStreamTimeout = (reader) => {
        if (streamTimeoutId) clearTimeout(streamTimeoutId);
        streamTimeoutId = setTimeout(() => {
            console.error('🚨 SSE STREAM TIMEOUT: No events received for 30s. Aborting.');
            try { reader.cancel(); } catch (e) { /* ignore cancel errors on already-closed streams */ }
            onError('Request timed out. The server may be overloaded — please try again.');
        }, STREAM_TIMEOUT_MS);
    };

    try {
        // 🛠️ AUDIT FIX: [QW-05] Dynamic base URL — no more hardcoded production domain
        const response = await fetch(`${API_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ prompt, image, voice, mood }),
        });

        // If the backend rejects the request (e.g. 401 Unauthorized, 429 Rate Limited,
        // 500 Internal Error), catch it before attempting to parse an SSE stream.
        if (!response.ok) {
            const errorDetails = await response.text();
            console.error(`🚨 BACKEND CRASH (${response.status}):`, errorDetails);

            // 🛠️ Rate limit: parse the structured JSON body from chatLimiter
            // (Batch 2 fix) and surface a human-readable message
            if (response.status === 429) {
                try {
                    const parsed = JSON.parse(errorDetails);
                    onError(parsed.text || "You're sending messages too quickly. Please wait a moment.");
                } catch {
                    onError("You're sending messages too quickly. Please wait a moment.");
                }
                return;
            }

            throw new Error(`Server rejected the request with status ${response.status}.`);
        }

        if (!response.body) throw new Error('No readable stream');

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let done = false;
        let buffer = '';

        // 🛠️ SURGICAL FIX: [V-12] Start the timeout clock as soon as the stream opens
        resetStreamTimeout(reader);

        while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;

            if (value) {
                buffer += decoder.decode(value, { stream: true });
                const events = buffer.split('\n\n');
                // The last element may be a partial event — keep it in the buffer
                buffer = events.pop();

                for (const event of events) {
                    const lines = event.split('\n');
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.substring(6));

                                // 🛠️ SURGICAL FIX: [V-12] Reset timeout on every valid event
                                resetStreamTimeout(reader);

                                if (data.type === 'status') onStatus(data.text);
                                else if (data.type === 'text') onText(data.text, data.card);
                                else if (data.type === 'audio') onAudio(data.audio);
                                else if (data.type === 'error') {
                                    console.error('🚨 ENGINE STREAM ERROR:', data.text);
                                    onError(data.text);
                                }
                            } catch (e) {
                                // 🛠️ SURGICAL FIX: [V-06] Log malformed SSE data instead of
                                // silently swallowing — aids debugging without crashing the loop
                                console.warn(
                                    '⚠️ SSE JSON parse error (malformed frame):',
                                    e.message,
                                    '| Raw line:',
                                    line
                                );
                            }
                        }
                    }
                }
            }
        }

        // 🛠️ SURGICAL FIX: [V-12] Clean up timeout when stream completes normally
        if (streamTimeoutId) clearTimeout(streamTimeoutId);

    } catch (err) {
        // 🛠️ SURGICAL FIX: [V-12] Clean up timeout on every error path
        if (streamTimeoutId) clearTimeout(streamTimeoutId);
        console.error('🚨 FETCH FAILED:', err);
        onError('Network connection dropped. Check the console.');
    }
};

/**
 * Fetches the user's full chat history for the History UI tab.
 *
 * @param {string} token - The user's JWT Bearer token
 * @returns {Array}       Array of message objects, or [] on failure
 */
export const fetchChatHistory = async (token) => {
    try {
        // 🛠️ AUDIT FIX: [QW-05] Dynamic base URL — no more hardcoded production domain
        const response = await fetch(`${API_BASE_URL}/api/chat/history`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            console.error(
                `History fetch rejected by server (${response.status}).`
            );
            return [];
        }

        const data = await response.json();
        // Filter out any null/empty documents that may have slipped into the DB
        return data.filter((msg) => msg && msg.text);
    } catch (err) {
        console.error('🚨 FETCH HISTORY FAILED:', err);
        return [];
    }
};