import { ChatGroq } from "@langchain/groq";
import { HumanMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";
import { TavilySearch } from "@langchain/tavily";
import { getChatHistory, getRelevantFacts, saveFact } from './memory.js';
import dotenv from 'dotenv';

dotenv.config();

// 🧠 1. Initialize High-Speed Groq Models (Upgraded to Llama 3.3!)
const groqChat = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: "llama-3.3-70b-versatile", // 🚀 FIXED: Pointing to Groq's newest active model
    temperature: 0.7,
});

const groqVision = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: "llama-3.2-11b-vision-preview",
    temperature: 0.7,
});

// 🌐 2. Initialize Live Web Search Tool
const searchTool = new TavilySearch({
    maxResults: 2, // Keeps context window small and fast
    apiKey: process.env.TAVILY_API_KEY,
});

// Bind the tool to the Chat Model
const groqChatWithTools = groqChat.bindTools([searchTool]);

// 🧠 3. Background Fact Extractor
const extractBackgroundFacts = async (userId, userText) => {
    try {
        const extractorPrompt = `Analyze this text. Extract any concrete, long-term facts about the user. Write the fact in a single sentence. If no facts exist, reply NONE.\nUSER TEXT: "${userText}"\nFACT:`;
        const result = await groqChat.invoke([new HumanMessage(extractorPrompt)]);
        const fact = result.content.trim();
        if (fact !== "NONE") await saveFact(userId, fact);
    } catch (err) {
        // Fails silently in the background
    }
};

// 🧠 4. Core Agentic RAG Pipeline
export const generateAIResponse = async (userPrompt, base64Image = null, userId) => {
    try {
        if (!userId) throw new Error("userId is missing!");

        // 🔍 Retrieve Memory Context (RAG)
        const history = await getChatHistory(userId);
        const facts = await getRelevantFacts(userId, userPrompt);

        let memoryContext = "--- RAG KNOWLEDGE BASE ---\n";
        facts.forEach(fact => { memoryContext += `- ${fact}\n`; });
        memoryContext += "\n--- RECENT CONVERSATION ---\n";
        history.forEach(msg => { memoryContext += `${msg.role === 'user' ? 'USER' : 'VOXA'}: ${msg.text}\n`; });
        memoryContext += "--- END MEMORY ---\n\n";

        const systemInstruction = `You are Voxa, an intelligent AI voice assistant. 
        RULES:
        1. Speak in natural, complete sentences (under 40 words).
        2. Do NOT use markdown formatting.
        3. WIDGET PROTOCOL: If the user asks for the WEATHER, append a hidden tag: ||CARD:WEATHER:Location_Name:Temperature_Number:Condition||
        Example: "It is sunny in Chavakkad." ||CARD:WEATHER:Chavakkad:28:Sunny||
        Condition must be exactly one of: Sunny, Autumn, Rain, or Winter.
        4. VISION OVERRIDE: If an image is provided, describe what you see accurately.`;

        let messages = [new SystemMessage(systemInstruction)];

        // 👁️ Vision Routing
        let result;
        if (base64Image && base64Image.length > 100) {
            const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");
            messages.push(new HumanMessage({
                content: [
                    { type: "text", text: `${memoryContext}CURRENT USER MESSAGE: ${userPrompt}` },
                    { type: "image_url", image_url: { url: `data:image/jpeg;base64,${cleanBase64}` } }
                ]
            }));
            console.log("📸 Vision Pipeline Active: Image routed to Llama Vision.");
            result = await groqVision.invoke(messages);
        } else {
            // 🌐 Standard Agentic Routing
            messages.push(new HumanMessage(`${memoryContext}CURRENT USER MESSAGE: ${userPrompt}`));

            // First Pass: Does Llama want to use a tool?
            result = await groqChatWithTools.invoke(messages);

            // If the model decides it needs live data, it will return tool_calls
            if (result.tool_calls && result.tool_calls.length > 0) {
                console.log("🌐 Voxa detected a gap in knowledge. Searching the live web...");

                // Append the AI's request to use the tool to the message history
                messages.push(result);

                // Execute the search tool
                for (const toolCall of result.tool_calls) {
                    if (toolCall.name === "tavily_search_results_json" || toolCall.name === searchTool.name) {
                        const searchData = await searchTool.invoke(toolCall.args);

                        // Append the live internet results back to the AI
                        messages.push(new ToolMessage({
                            content: typeof searchData === 'string' ? searchData : JSON.stringify(searchData),
                            tool_call_id: toolCall.id,
                            name: toolCall.name
                        }));
                    }
                }

                // Second Pass: Llama reads the live internet data and answers you
                result = await groqChatWithTools.invoke(messages);
            }
        }

        let responseText = result.content;
        let cardData = null;

        // 🃏 Extract Widget Cards for the UI
        const cardMatch = responseText.match(/\|\|CARD:([^|]+)\|\|/);
        if (cardMatch) {
            const segments = cardMatch[1].split(':');
            if (segments[0] === 'WEATHER') cardData = { type: 'weather', location: segments[1], temp: segments[2], condition: segments[3] };
            responseText = responseText.replace(cardMatch[0], '').trim();
        }

        // Trigger fact extraction in the background
        extractBackgroundFacts(userId, userPrompt);

        return { text: responseText, card: cardData };
    } catch (error) {
        console.error("❌ Groq Pipeline Error:", error.message);
        return { error: true, text: "I am experiencing network interference. Please try speaking again." };
    }
};