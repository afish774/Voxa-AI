import textToSpeech from '@google-cloud/text-to-speech';
import dotenv from 'dotenv';

dotenv.config();

// 🚀 FIXED: Initialize Google TTS Client directly from memory! No files needed.
let clientOptions = {};

try {
    if (process.env.GOOGLE_CREDENTIALS) {
        // Parse the raw JSON string directly from the Render environment variable
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
        // Map user preferences to high-quality Google Wavenet/Journey voices
        let voiceName = 'en-US-Journey-F'; // Default Female
        if (voicePref === 'male') voiceName = 'en-US-Journey-D';

        const request = {
            input: { text: text },
            voice: { languageCode: 'en-US', name: voiceName },
            audioConfig: { audioEncoding: 'MP3' },
        };

        const [response] = await client.synthesizeSpeech(request);

        // Return base64 string to stream to the frontend
        return response.audioContent.toString('base64');
    } catch (error) {
        console.error("❌ Google TTS Generation Error:", error.message);
        return null; // Return null so the app doesn't crash, it just skips audio
    }
};