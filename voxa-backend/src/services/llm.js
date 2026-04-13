import { ChatGroq } from "@langchain/groq";
import { HumanMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";
import { TavilySearch } from "@langchain/tavily";
import { getChatHistory, getRelevantFacts, saveFact } from './memory.js';
import { createReminderTool, getCryptoPriceTool, sendEmailTool, getSportsDataTool, getWeatherTool } from './tools.js';
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

        // 🚀 THE CLEANED, STRICT JSON SYSTEM PROMPT
        const systemInstruction = `You are Voxa, an intelligent AI voice assistant. 
RULES:
1. Speak in natural, complete sentences (under 40 words).
2. Do NOT use markdown formatting.
3. WIDGET PROTOCOL: If you provide Weather or Sports information, you MUST append the exact hidden tag at the very end of your response.
- WEATHER: ||CARD:WEATHER:Location_Name:Temperature_Number:Condition|| 
- SPORTS: You must use the get_sports_data tool. The tool will return a JSON string. You MUST embed that EXACT JSON string inside the card tag without altering it.
    * Example Output: "Here is the sports update." ||CARD:SPORTS:{"league":"ipl","isLive":true,"battingTeam":"India","battingScore":"145/1","battingOvers":"25.2","bowlingTeam":"Pakistan","bowlingScore":"310/10","bowlingOvers":"50.0","crr":5.73,"rrr":7.94,"status":"India need 166 runs"}||
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

            const reminderTool = createReminderTool(userId);
            const activeTools = [searchTool, reminderTool, getCryptoPriceTool, sendEmailTool, getSportsDataTool, getWeatherTool];
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
                        else if (toolCall.name === "send_email") {
                            toolResultText = await sendEmailTool.invoke(toolCall.args);
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

        // 🚀 ROBUST JSON EXTRACTOR (DO NOT USE COLON SPLITTING FOR SPORTS)
        const cardMatch = responseText.match(/\|\|\s*CARD\s*:\s*(.*?)\s*\|\|/is);

        if (cardMatch) {
            const rawContent = cardMatch[1].trim();
            const firstColonIndex = rawContent.indexOf(':');

            if (firstColonIndex !== -1) {
                const cardType = rawContent.substring(0, firstColonIndex).trim().toUpperCase();
                const payload = rawContent.substring(firstColonIndex + 1).trim();

                if (cardType === 'WEATHER') {
                    const segments = payload.split(':').map(s => s.trim());
                    cardData = { type: 'weather', location: segments[0], temp: segments[1], condition: segments[2] };
                } else if (cardType === 'SPORTS') {
                    if (payload.startsWith('{') && payload.endsWith('}')) {
                        try {
                            const parsedData = JSON.parse(payload);
                            cardData = { type: 'sports', ...parsedData };
                        } catch (error) {
                            console.error("❌ Invalid JSON:", error);
                        }
                    }
                }
            }
            responseText = responseText.replace(cardMatch[0], '').trim();
        }

        console.log("🤖 LLAMA RAW TEXT:", result.content);
        console.log("🃏 EXTRACTED CARD:", cardData);

        extractBackgroundFacts(userId, userPrompt);
        return { text: responseText, card: cardData };

    } catch (error) {
        return { error: true, text: `GROQ ERROR: ${error.message}` };
    }
};