import textToSpeech from '@google-cloud/text-to-speech';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

const keyFilename = path.join(rootDir, 'google-credentials.json');

const client = new textToSpeech.TextToSpeechClient({
    keyFilename: keyFilename
});

export const generateSpeech = async (text, voicePreference) => {
    try {
        const spokenText = text.replace(/\|\|CARD:[^|]+\|\|/g, '').trim();

        // 🚀 UPGRADED: Using Google's absolute best premium Neural2 voices
        const voiceName = voicePreference === 'male' ? 'en-US-Neural2-J' : 'en-US-Neural2-F';

        const request = {
            input: { text: spokenText },
            voice: { languageCode: 'en-US', name: voiceName },
            audioConfig: {
                audioEncoding: 'MP3',
                // Drop the pitch by 2 semitones if male for a deeper, richer sound
                pitch: voicePreference === 'male' ? -2.0 : 0.0,
                speakingRate: 1.05
            },
        };

        const [response] = await client.synthesizeSpeech(request);
        return response.audioContent.toString('base64');
    } catch (err) {
        console.error("❌ TTS Error:", err.message);
        return null;
    }
};