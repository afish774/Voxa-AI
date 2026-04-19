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
            console.error("🚨 SSE STREAM TIMEOUT: No events received for 30s. Aborting.");
            try { reader.cancel(); } catch (e) { }
            onError("Request timed out. The server may be overloaded — please try again.");
        }, STREAM_TIMEOUT_MS);
    };

    try {
        const response = await fetch("https://voxa-ai-zh5o.onrender.com/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ prompt, image, voice, mood }),
        });

        // 🚀 THE FIX: If the backend throws an error, catch it before trying to stream!
        if (!response.ok) {
            const errorDetails = await response.text();
            console.error(`🚨 BACKEND CRASH (${response.status}):`, errorDetails);
            throw new Error(`Server rejected the request.`);
        }

        if (!response.body) throw new Error("No readable stream");

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let done = false;
        let buffer = "";

        // 🛠️ SURGICAL FIX: [V-12] Start the timeout clock as soon as the stream opens
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

                                // 🛠️ SURGICAL FIX: [V-12] Reset timeout on every valid event
                                resetStreamTimeout(reader);

                                if (data.type === 'status') onStatus(data.text);
                                else if (data.type === 'text') onText(data.text, data.card);
                                else if (data.type === 'audio') onAudio(data.audio);
                                else if (data.type === 'error') {
                                    console.error("🚨 ENGINE STREAM ERROR:", data.text);
                                    onError(data.text);
                                }
                            } catch (e) {
                                // 🛠️ SURGICAL FIX: [V-06] Log malformed SSE data instead of silently swallowing
                                console.warn("⚠️ SSE JSON parse error (malformed frame):", e.message, "| Raw line:", line);
                            }
                        }
                    }
                }
            }
        }

        // 🛠️ SURGICAL FIX: [V-12] Clean up timeout when stream completes normally
        if (streamTimeoutId) clearTimeout(streamTimeoutId);

    } catch (err) {
        // 🛠️ SURGICAL FIX: [V-12] Clean up timeout on error path too
        if (streamTimeoutId) clearTimeout(streamTimeoutId);
        console.error("🚨 FETCH FAILED:", err);
        onError("Network connection dropped. Check the console.");
    }
};

// 🚀 ADDED: The missing fetch function required by the History UI Tab!
export const fetchChatHistory = async (token) => {
    try {
        const response = await fetch("https://voxa-ai-zh5o.onrender.com/api/chat/history", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            console.error("History fetch rejected by server.");
            return [];
        }

        const data = await response.json();
        return data.filter(msg => msg && msg.text);
    } catch (err) {
        console.error("🚨 FETCH HISTORY FAILED:", err);
        return [];
    }
};