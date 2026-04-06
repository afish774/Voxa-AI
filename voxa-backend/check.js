import dotenv from 'dotenv';
dotenv.config();

async function interrogateGoogle() {
    console.log("🔍 Connecting to Google API to scan your allowed models...");
    const apiKey = process.env.GEMINI_API_KEY;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.error) {
            console.error("❌ Google threw an error with your key:", data.error.message);
            return;
        }

        // Filter down to only the models that actually support text generation
        const validModels = data.models
            .filter(m => m.supportedGenerationMethods.includes("generateContent"))
            .map(m => m.name.replace("models/", "")); // Strip the "models/" prefix

        console.log("✅ SUCCESS! Your API key has access to the following text models:");
        console.log(validModels);

    } catch (error) {
        console.error("❌ Failed to reach Google:", error.message);
    }
}

interrogateGoogle();