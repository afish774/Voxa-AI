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

export const generateSpeech = async (text, voicePref = 'female') => {
    try {
        // 🚀 FIXED: Swapped to 'Neural2' which is highly reliable and universally supported
        let voiceName = 'en-US-Neural2-F';
        if (voicePref === 'male') voiceName = 'en-US-Neural2-D';

        const request = {
            input: { text: text },
            voice: { languageCode: 'en-US', name: voiceName },
            audioConfig: { audioEncoding: 'MP3' },
        };

        const [response] = await client.synthesizeSpeech(request);

        return response.audioContent.toString('base64');
    } catch (error) {
        console.error("❌ Google TTS Generation Error:", error.message);
        return null;
    }
};