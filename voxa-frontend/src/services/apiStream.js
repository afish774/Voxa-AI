export const streamChatResponse = async (payload, callbacks) => {
    const { prompt, image, voice, mood, token } = payload;
    const { onStatus, onText, onAudio, onError } = callbacks;

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
                                if (data.type === 'status') onStatus(data.text);
                                else if (data.type === 'text') onText(data.text, data.card);
                                else if (data.type === 'audio') onAudio(data.audio);
                                else if (data.type === 'error') {
                                    console.error("🚨 ENGINE STREAM ERROR:", data.text);
                                    onError(data.text);
                                }
                            } catch (e) { }
                        }
                    }
                }
            }
        }
    } catch (err) {
        console.error("🚨 FETCH FAILED:", err);
        onError("Network connection dropped. Check the console.");
    }
};