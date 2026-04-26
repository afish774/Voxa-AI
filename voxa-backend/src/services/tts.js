import textToSpeech from '@google-cloud/text-to-speech';
import dotenv from 'dotenv';

dotenv.config();

let clientOptions = {};

try {
    if (process.env.GOOGLE_CREDENTIALS) {
        clientOptions.credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
        console.log("🔐 Google TTS Authenticated securely from memory.");
    } else {
        console.warn("⚠️ GOOGLE_CREDENTIALS environment variable is missing.");
    }
} catch (e) {
    console.error("❌ Failed to parse GOOGLE_CREDENTIALS JSON:", e.message);
}

const client = new textToSpeech.TextToSpeechClient(clientOptions);

// 🛡️ OMNI-AUDIT FIX: [TTS-01] Google TTS has a 5000-byte per-request limit.
// Cap at 4800 to leave headroom for encoding overhead. Without this, long LLM
// responses silently fail or get truncated by Google's API.
const MAX_TTS_BYTES = 4800;

// 🛡️ OMNI-AUDIT FIX: [IMG-03] 10-second timeout prevents a stalled Google
// Cloud endpoint from blocking the SSE stream. Without this, a hanging TTS
// call holds the response open until the 30s client-side timeout fires.
const TTS_TIMEOUT_MS = 10000;

export const generateSpeech = async (text, voicePref = 'female') => {
    try {
        // 🛡️ OMNI-AUDIT FIX: [TTS-01] Truncate to byte limit at sentence boundary
        let safeText = text || '';
        if (Buffer.byteLength(safeText, 'utf8') > MAX_TTS_BYTES) {
            const truncated = Buffer.from(safeText, 'utf8')
                .subarray(0, MAX_TTS_BYTES)
                .toString('utf8');
            const lastSentence = Math.max(
                truncated.lastIndexOf('. '),
                truncated.lastIndexOf('! '),
                truncated.lastIndexOf('? ')
            );
            safeText = lastSentence > 0
                ? truncated.substring(0, lastSentence + 1)
                : truncated;
            console.warn(`⚠️ [TTS] Text truncated from ${Buffer.byteLength(text, 'utf8')} to ${Buffer.byteLength(safeText, 'utf8')} bytes`);
        }

        // 🚀 FIXED: Swapped to 'Neural2' which is highly reliable and universally supported
        let voiceName = 'en-US-Neural2-F';
        if (voicePref === 'male') voiceName = 'en-US-Neural2-D';

        const request = {
            input: { text: safeText },
            voice: { languageCode: 'en-US', name: voiceName },
            audioConfig: { audioEncoding: 'MP3' },
        };

        // 🛡️ OMNI-AUDIT FIX: [IMG-03] Timeout wrapper — reject after 10s
        const [response] = await Promise.race([
            client.synthesizeSpeech(request),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('TTS timed out after 10s')), TTS_TIMEOUT_MS)
            ),
        ]);

        return response.audioContent.toString('base64');
    } catch (error) {
        console.error("❌ Google TTS Generation Error:", error.message);
        return null;
    }
};