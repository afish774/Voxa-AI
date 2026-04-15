import { ChatGroq } from "@langchain/groq";
import { HumanMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";
import { TavilySearch } from "@langchain/tavily";
import { getChatHistory, getRelevantFacts, saveFact } from './memory.js';
import { createReminderTool, getCryptoPriceTool, createSendEmailTool, getSportsDataTool, getWeatherTool } from './tools.js'; // 🚀 UPDATED IMPORT
import dotenv from 'dotenv';

dotenv.config();

// 🧠 1. Initialize High-Speed Groq Models
const groqChat = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: "llama-3.3-70b-versatile",
    temperature: 0,
});

const groqVision = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    temperature: 0.7,
    maxRetries: 1
});

// 🌐 2. Initialize Live Web Search Tool
const searchTool = new TavilySearch({
    maxResults: 2,
    apiKey: process.env.TAVILY_API_KEY,
});

// 🧠 3. Background Fact Extractor
const extractBackgroundFacts = async (userId, userText) => {
    try {
        const extractorPrompt = `Analyze this text. Extract any concrete, long-term facts about the user. Write the fact in a single sentence. If no facts exist, reply NONE.\nUSER TEXT: "${userText}"\nFACT:`;
        const result = await groqChat.invoke([new HumanMessage(extractorPrompt)]);
        const fact = result.content.trim();
        if (fact !== "NONE") await saveFact(userId, fact);
    } catch (err) { }
};

// 🧠 4. Core Agentic RAG Pipeline
export const generateAIResponse = async (userPrompt, base64Image = null, userId, onStatusUpdate, mood = "neutral") => {
    try {
        if (!userId) throw new Error("userId is missing!");

        const history = await getChatHistory(userId);
        const facts = await getRelevantFacts(userId, userPrompt);

        let memoryContext = "--- RAG KNOWLEDGE BASE ---\n";
        facts.forEach(fact => { memoryContext += `- ${fact}\n`; });
        memoryContext += "\n--- RECENT CONVERSATION ---\n";
        history.forEach(msg => { memoryContext += `${msg.role === 'user' ? 'USER' : 'VOXA'}: ${msg.text}\n`; });
        memoryContext += "--- END MEMORY ---\n\n";

        // 🚀 THE UPGRADED, IRONCLAD SYSTEM PROMPT
        const systemInstruction = `You are Voxa, an intelligent AI voice assistant. 
RULES:
1. Speak in natural, complete sentences (under 40 words).
2. Do NOT use markdown formatting.
3. WIDGET PROTOCOL (CRITICAL): If you use a tool (Weather, Crypto, Sports, Reminder, Email), the tool will return a string formatted as ||CARD:TYPE:DATA||. You MUST append this EXACT string to the very end of your response without changing a single character. Do not paraphrase or translate it.
    * Crypto Example: "Bitcoin is currently trading at $65,000." ||CARD:CRYPTO:Bitcoin:65000.00:2.50||
    * Weather Example: "It is currently 25 degrees in London." ||CARD:WEATHER:London:25:Cloudy||
    * Sports Example: You must embed the EXACT JSON string inside the card tag. ||CARD:SPORTS:{"league":"ipl","isLive":true,"status":"Match Info"}||
4. VISION OVERRIDE: If an image is provided, describe what you see accurately.
5. FULL AUTHORITY: You have full permission to interact with the real world.
6. EMOTIONAL AWARENESS: The user's current detected mood is: ${mood}.`;

        let result;

        if (base64Image && base64Image.length > 100) {
            const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");
            const visionMessages = [
                new HumanMessage({
                    content: [
                        { type: "text", text: `[SYSTEM CONTEXT]\n${systemInstruction}\n\n${memoryContext}\n\nCURRENT USER MESSAGE: ${userPrompt}` },
                        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${cleanBase64}` } }
                    ]
                })
            ];
            result = await groqVision.invoke(visionMessages);
        } else {
            let messages = [new SystemMessage(systemInstruction), new HumanMessage(`${memoryContext}CURRENT USER MESSAGE: ${userPrompt}`)];

            // 🚀 INITIALIZE TOOLS WITH USER ID
            const reminderTool = createReminderTool(userId);
            const emailTool = createSendEmailTool(userId);

            const activeTools = [searchTool, reminderTool, getCryptoPriceTool, emailTool, getSportsDataTool, getWeatherTool];
            const groqChatWithTools = groqChat.bindTools(activeTools);

            result = await groqChatWithTools.invoke(messages);
            let loopCount = 0;

            while (result.tool_calls && result.tool_calls.length > 0 && loopCount < 3) {
                messages.push(result);

                for (const toolCall of result.tool_calls) {
                    try {
                        let toolResultText = "";

                        if (toolCall.name === "tavily_search_results_json" || toolCall.name === searchTool.name) {
                            if (onStatusUpdate) onStatusUpdate("Scanning the live internet...");
                            const searchData = await searchTool.invoke(toolCall.args);
                            toolResultText = typeof searchData === 'string' ? searchData : JSON.stringify(searchData);
                        }
                        else if (toolCall.name === "save_reminder") {
                            toolResultText = await reminderTool.invoke(toolCall.args);
                        }
                        else if (toolCall.name === "get_crypto_price") {
                            toolResultText = await getCryptoPriceTool.invoke(toolCall.args);
                        }
                        else if (toolCall.name === "send_email") { // 🚀 EXECUTING THE NEW EMAIL TOOL
                            toolResultText = await emailTool.invoke(toolCall.args);
                        }
                        else if (toolCall.name === "get_sports_data") {
                            if (onStatusUpdate) onStatusUpdate("Fetching live sports data...");
                            toolResultText = await getSportsDataTool.invoke(toolCall.args);
                        }
                        else if (toolCall.name === "get_weather") {
                            toolResultText = await getWeatherTool.invoke(toolCall.args);
                        }

                        messages.push(new ToolMessage({
                            content: toolResultText,
                            tool_call_id: toolCall.id,
                            name: toolCall.name
                        }));
                    } catch (err) {
                        messages.push(new ToolMessage({ content: "Tool execution failed.", tool_call_id: toolCall.id, name: toolCall.name }));
                    }
                }

                if (loopCount === 2) {
                    result = await groqChat.invoke(messages);
                } else {
                    result = await groqChatWithTools.invoke(messages);
                }
                loopCount++;
            }
        }

        let responseText = result.content;

        if (responseText) {
            responseText = responseText.replace(/<function[^>]*>.*?<\/function>/gi, '').trim();
        }

        if (!responseText || responseText.trim() === "") {
            responseText = "I completed the task, but I am having trouble translating it into speech right now.";
        }

        let cardData = null;

        // 🚀 THE ULTIMATE PARSER (Extracts UI tags and removes them from speech)
        const cardRegex = /\|\|\s*CARD\s*:\s*(.*?)\s*\|\|/is;
        const match = responseText.match(cardRegex);

        if (match) {
            const rawTag = match[1].trim();
            const firstColonIndex = rawTag.indexOf(':');

            if (firstColonIndex !== -1) {
                const type = rawTag.substring(0, firstColonIndex).trim().toUpperCase();
                const payload = rawTag.substring(firstColonIndex + 1).trim();

                if (type === 'CRYPTO') {
                    const parts = payload.split(':').map(p => p.trim());
                    cardData = { type: 'crypto', coin: parts[0], price: parts[1], change: parts[2] };
                } else if (type === 'WEATHER') {
                    const parts = payload.split(':').map(p => p.trim());
                    cardData = { type: 'weather', location: parts[0], temp: parts[1], condition: parts[2] };
                } else if (type === 'RECEIPT') {
                    cardData = { type: 'receipt', message: payload };
                } else if (type === 'SPORTS') {
                    if (payload.startsWith('{') && payload.endsWith('}')) {
                        try {
                            cardData = { type: 'sports', ...JSON.parse(payload) };
                        } catch (e) { console.error("❌ Sports JSON Error"); }
                    }
                }
            }
            // Strip the tag so it is not spoken aloud by the voice engine
            responseText = responseText.replace(match[0], '').trim();
        }

        console.log("🤖 LLAMA RAW TEXT:", result.content);
        console.log("🃏 EXTRACTED CARD:", cardData);

        extractBackgroundFacts(userId, userPrompt);
        return { text: responseText, card: cardData };

    } catch (error) {
        return { error: true, text: `GROQ ERROR: ${error.message}` };
    }
};