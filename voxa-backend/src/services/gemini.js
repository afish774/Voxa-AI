import { GoogleGenerativeAI } from '@google/generative-ai';
// 🚀 Removed saveToMemory from imports since chatRoutes.js handles saving now!
import { getChatHistory, getLongTermFacts, saveFact } from './memory.js';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
console.log("🕵️ DETECTED KEY ENDS IN:", apiKey.slice(-6));

const primaryModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// 🚀 FIXED: Added userId to the background extractor so facts save to the right person
const extractBackgroundFacts = async (userId, userText) => {
  try {
    const extractorPrompt = `
        Analyze the following text. Extract any concrete, long-term facts about the user. 
        Write the fact in a single sentence. If no facts exist, reply NONE.
        USER TEXT: "${userText}"
        FACT:`;

    const result = await primaryModel.generateContent(extractorPrompt);
    const fact = result.response.text().trim();
    if (fact !== "NONE") await saveFact(userId, fact); // Pass userId here!
  } catch (err) {
    // Silently fail on rate limits for the background task
  }
};

// 🚀 FIXED: Added userId as the third parameter to catch it from chatRoutes.js
export const generateAIResponse = async (userPrompt, base64Image = null, userId) => {
  try {
    if (!userId) throw new Error("userId is missing from the request!");

    // 🚀 FIXED: Pass userId to fetch the correct user's history and facts
    const history = await getChatHistory(userId);
    const facts = await getLongTermFacts(userId);

    let memoryContext = "--- LONG-TERM KNOWLEDGE BASE ---\n";
    facts.forEach(fact => { memoryContext += `- ${fact}\n`; });
    memoryContext += "\n--- RECENT CONVERSATION ---\n";
    history.forEach(msg => { memoryContext += `${msg.role === 'user' ? 'USER' : 'VOXA'}: ${msg.text}\n`; });
    memoryContext += "--- END MEMORY ---\n\n";

    // (Removed saveToMemory here to prevent duplicate DB entries)

    const systemInstruction = `You are Voxa, an intelligent AI voice assistant. 
    
    RULES:
    1. Speak in natural, complete sentences (under 40 words).
    2. Do NOT use markdown formatting.
    3. WIDGET PROTOCOL: If the user asks for the WEATHER, append a hidden tag at the very end of your response formatted exactly like this: ||CARD:WEATHER:Location_Name:Temperature_Number:Condition||
    Example: "It is currently sunny in Chavakkad." ||CARD:WEATHER:Chavakkad:28:Sunny||
    Condition must be one of: Sunny, Cloudy, Rain, or Storm.
    4. VISION OVERRIDE: If an image is provided, YOU MUST LOOK AT THE IMAGE. Describe what you see accurately and answer the user's question about it.`;

    const chatModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemInstruction
    });

    let finalPrompt = `${memoryContext}CURRENT USER MESSAGE: ${userPrompt}`;
    const parts = [];

    if (base64Image && base64Image.length > 100) {
      const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");
      parts.push({ inlineData: { data: cleanBase64, mimeType: "image/jpeg" } });
      finalPrompt = `[SYSTEM NOTE: CAMERA ACTIVE. LOOK AT THE IMAGE.]\n\n` + finalPrompt;

      // 📸 RESTORED: Visual confirmation log
      console.log("📸 Vision Module Active: Image successfully injected into AI brain.");
    }

    parts.push({ text: finalPrompt });

    const result = await chatModel.generateContent({
      contents: [{ role: "user", parts: parts }],
      generationConfig: { temperature: 0.7 },
    });

    let responseText = await result.response.text();
    let cardData = null;

    const cardMatch = responseText.match(/\|\|CARD:([^|]+)\|\|/);
    if (cardMatch) {
      const segments = cardMatch[1].split(':');
      if (segments[0] === 'WEATHER') {
        cardData = { type: 'weather', location: segments[1], temp: segments[2], condition: segments[3] };
      }
      responseText = responseText.replace(cardMatch[0], '').trim();
    }

    // (Removed saveToMemory here to prevent duplicate DB entries)

    // 🚀 FIXED: Trigger background fact extraction WITH the userId
    extractBackgroundFacts(userId, userPrompt);

    return { text: responseText, card: cardData };
  } catch (error) {
    console.error("❌ Gemini Error:", error.message);

    if (error.message.includes("429") || error.message.includes("Quota")) {
      const quotaMessage = "I'm sorry, but your Google API quota has been completely exhausted. Please update my API key.";
      return { text: quotaMessage, card: null };
    }

    throw new Error("Failed to generate AI response.");
  }
};