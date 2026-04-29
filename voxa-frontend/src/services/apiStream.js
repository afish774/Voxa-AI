// ============================================================================
// 🌐 API STREAM SERVICE — SSE Client & History Fetch
// ============================================================================

// 🛠️ AUDIT FIX: [QW-05] — Externalize Backend URL via Vite Environment Variable
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://voxa-ai-zh5o.onrender.com';

/**
 * Opens an SSE (Server-Sent Events) stream to the Voxa chat endpoint.
 * Dispatches typed events to the provided callbacks as they arrive.
 *
 * @param {object} payload   - { prompt, image, voice, mood, token }
 * @param {object} callbacks - { onStatus, onText, onAudio, onError }
 * @returns {AbortController} - Returns the controller so React can abort on unmount
 */
export const streamChatResponse = async (payload, callbacks) => {
    const { prompt, image, voice, mood, token } = payload;
    const { onStatus, onText, onAudio, onError } = callbacks;

    // 🛠️ AUDIT FIX: Master AbortController to instantly sever TCP socket if React unmounts
    const abortController = new AbortController();
    const { signal } = abortController;

    // 🛠️ SURGICAL FIX: [V-12] Client-side SSE timeout
    let streamTimeoutId = null;
    const STREAM_TIMEOUT_MS = 30000;

    const resetStreamTimeout = (reader) => {
        if (streamTimeoutId) clearTimeout(streamTimeoutId);
        streamTimeoutId = setTimeout(() => {
            console.error('🚨 SSE STREAM TIMEOUT: No events received for 30s. Aborting.');
            abortController.abort(); // Forcefully kill the fetch connection
            try { reader.cancel(); } catch (e) { /* ignore cancel errors on already-closed streams */ }
            onError('Request timed out. The server may be overloaded — please try again.');
        }, STREAM_TIMEOUT_MS);
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ prompt, image, voice, mood }),
            signal, // Wire up the abort signal
        });

        if (!response.ok) {
            const errorDetails = await response.text();
            console.error(`🚨 BACKEND CRASH (${response.status}):`, errorDetails);

            if (response.status === 429) {
                try {
                    const parsed = JSON.parse(errorDetails);
                    onError(parsed.text || "You're sending messages too quickly. Please wait a moment.");
                } catch {
                    onError("You're sending messages too quickly. Please wait a moment.");
                }
                return abortController;
            }

            throw new Error(`Server rejected the request with status ${response.status}.`);
        }

        if (!response.body) throw new Error('No readable stream');

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let done = false;
        let buffer = '';

        resetStreamTimeout(reader);

        while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;

            if (value) {
                buffer += decoder.decode(value, { stream: true });
                const events = buffer.split('\n\n');
                buffer = events.pop();

                for (const event of events) {
                    const lines = event.split('\n');
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.substring(6));

                                resetStreamTimeout(reader);

                                if (data.type === 'status') onStatus(data.text);
                                else if (data.type === 'text') onText(data.text, data.card);
                                else if (data.type === 'audio') onAudio(data.audio);
                                else if (data.type === 'error') {
                                    console.error('🚨 ENGINE STREAM ERROR:', data.text);
                                    onError(data.text);
                                }
                            } catch (e) {
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

        if (streamTimeoutId) clearTimeout(streamTimeoutId);

    } catch (err) {
        if (streamTimeoutId) clearTimeout(streamTimeoutId);
        if (err.name === 'AbortError') {
            console.log('🛑 Client forcefully aborted the stream.');
        } else {
            console.error('🚨 FETCH FAILED:', err);
            onError('Network connection dropped. Check the console.');
        }
    }

    return abortController;
};

/**
 * Fetches the user's full chat history for the History UI tab.
 *
 * @param {string} token - The user's JWT Bearer token
 * @returns {Array}       Array of message objects, or [] on failure
 */
export const fetchChatHistory = async (token) => {
    try {
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