import { ChatGroq } from "@langchain/groq";
import { HumanMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";
import { TavilySearch } from "@langchain/tavily";
import { getChatHistory, getRelevantFacts, saveFact } from './memory.js';
import { createReminderTool, getCryptoPriceTool, sendEmailTool, getSportsDataTool } from './tools.js';
import dotenv from 'dotenv';

dotenv.config();

// 🧠 1. Initialize High-Speed Groq Models
const groqChat = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
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

        // 🚀 UPDATED: System Prompt with Weather & Sports Widget Protocols
        const systemInstruction = `You are Voxa, an intelligent AI voice assistant. 
        RULES:
        1. Speak in natural, complete sentences (under 40 words).
        2. Do NOT use markdown formatting.
        3. WIDGET PROTOCOL: You can trigger UI widgets by appending a hidden tag at the very end of your response.
        - WEATHER: ||CARD:WEATHER:Location_Name:Temperature_Number:Condition|| 
        - SPORTS: ||CARD:SPORTS:TeamA:TeamB:ScoreA:ScoreB:Status:League||
          Example Score: "Real Madrid won 2-1." ||CARD:SPORTS:Real Madrid:Barcelona:2:1:FT:La Liga||
          Example Schedule: "They play tomorrow at 8 PM." ||CARD:SPORTS:Lakers:Warriors:-:-:Tomorrow 8 PM:NBA||
        4. VISION OVERRIDE: If an image is provided, describe what you see accurately.
        5. FULL AUTHORITY: You have full permission and the necessary tools to interact with the real world. If the user asks you to send an email, do NOT say it is outside your capabilities.
        6. TOOL EXECUTION: You MUST use the native tool-calling JSON array to execute actions. Do NOT output raw <function> XML tags in your spoken text under any circumstances. If you need to use a tool, trigger it silently.
        7. TOOL SYNTHESIS: Always synthesize tool results into a spoken response for the user. Make sure to clearly state numbers, match details, and prices.
        8. EMOTIONAL AWARENESS: The user's current detected mood is: ${mood}. If they are frustrated, sad, or angry, adjust your tone to be highly empathetic, soft, and supportive. If they are happy, be energetic.`;

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
            const activeTools = [searchTool, reminderTool, getCryptoPriceTool, sendEmailTool, getSportsDataTool];
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
                            if (onStatusUpdate) onStatusUpdate("Accessing secure database...");
                            toolResultText = await reminderTool.invoke(toolCall.args);
                        }
                        else if (toolCall.name === "get_crypto_price") {
                            if (onStatusUpdate) onStatusUpdate("Fetching live market data...");
                            toolResultText = await getCryptoPriceTool.invoke(toolCall.args);
                        }
                        else if (toolCall.name === "send_email") {
                            if (onStatusUpdate) onStatusUpdate("Drafting and sending email...");
                            toolResultText = await sendEmailTool.invoke(toolCall.args);
                        }
                        else if (toolCall.name === "get_sports_data") {
                            if (onStatusUpdate) onStatusUpdate("Analyzing global sports network...");
                            toolResultText = await getSportsDataTool.invoke(toolCall.args);
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

        // 🚀 BULLETPROOF REGEX: Ignores spaces, casing, and minor formatting typos
        const cardMatch = responseText.match(/\|\|\s*CARD\s*:\s*([^|]+)\s*\|\|/i);

        if (cardMatch) {
            // Clean up any weird spacing Llama might have added inside the tags
            const segments = cardMatch[1].split(':').map(s => s.trim());
            const cardType = segments[0].toUpperCase();

            if (cardType === 'WEATHER') {
                cardData = { type: 'weather', location: segments[1], temp: segments[2], condition: segments[3] };
            } else if (cardType === 'SPORTS') {
                cardData = { type: 'sports', teamA: segments[1], teamB: segments[2], scoreA: segments[3], scoreB: segments[4], status: segments[5], league: segments[6] };
            }

            // Scrub the tag from the text so Voxa doesn't accidentally read it out loud!
            responseText = responseText.replace(cardMatch[0], '').trim();
        }

        // 🕵️ THE SPYGLASS: This will print exactly what Llama generated to your backend terminal!
        console.log("🤖 LLAMA RAW TEXT:", result.content);
        console.log("🃏 EXTRACTED CARD:", cardData);

        extractBackgroundFacts(userId, userPrompt);
        return { text: responseText, card: cardData };

    } catch (error) {
        const rawError = error.message || error.toString();
        console.error("🔥 LLM ENGINE CRASH:", rawError);
        return { error: true, text: `GROQ ERROR: ${rawError}` };
    }
};