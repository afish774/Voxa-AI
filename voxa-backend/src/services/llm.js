import { ChatGroq } from "@langchain/groq";
import { HumanMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";
import { TavilySearch } from "@langchain/tavily";
import { getChatHistory, getRelevantFacts, saveFact } from './memory.js';
import { createReminderTool } from './tools.js'; // 🚀 IMPORTED NEW TOOL
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
    model: "llama-3.2-11b-vision-preview",
    temperature: 0.7,
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
export const generateAIResponse = async (userPrompt, base64Image = null, userId, onStatusUpdate) => {
    try {
        if (!userId) throw new Error("userId is missing!");

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
        4. VISION OVERRIDE: If an image is provided, describe what you see accurately.
        5. TOOL USAGE: If you use a tool, you MUST synthesize the results into a spoken response for the user.`;

        let messages = [new SystemMessage(systemInstruction)];

        let result;
        if (base64Image && base64Image.length > 100) {
            const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");
            messages.push(new HumanMessage({
                content: [
                    { type: "text", text: `${memoryContext}CURRENT USER MESSAGE: ${userPrompt}` },
                    { type: "image_url", image_url: { url: `data:image/jpeg;base64,${cleanBase64}` } }
                ]
            }));
            result = await groqVision.invoke(messages);
        } else {
            messages.push(new HumanMessage(`${memoryContext}CURRENT USER MESSAGE: ${userPrompt}`));

            // 🚀 DYNAMIC BINDING: We bind the tools here so they have access to your specific user ID
            const reminderTool = createReminderTool(userId);
            const activeTools = [searchTool, reminderTool];
            const groqChatWithTools = groqChat.bindTools(activeTools);

            result = await groqChatWithTools.invoke(messages);
            let loopCount = 0;

            while (result.tool_calls && result.tool_calls.length > 0 && loopCount < 3) {

                messages.push(result);

                for (const toolCall of result.tool_calls) {
                    try {
                        let toolResultText = "";

                        // 🔀 Route to the correct tool based on what Llama 3 decides
                        if (toolCall.name === "tavily_search_results_json" || toolCall.name === searchTool.name) {
                            if (onStatusUpdate) onStatusUpdate("Scanning the live internet...");
                            const searchData = await searchTool.invoke(toolCall.args);
                            toolResultText = typeof searchData === 'string' ? searchData : JSON.stringify(searchData);
                        }
                        else if (toolCall.name === "save_reminder") {
                            if (onStatusUpdate) onStatusUpdate("Accessing secure database...");
                            toolResultText = await reminderTool.invoke(toolCall.args);
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
        if (!responseText || responseText.trim() === "") {
            responseText = "I completed the task, but I am having trouble translating it into speech right now.";
        }

        let cardData = null;
        const cardMatch = responseText.match(/\|\|CARD:([^|]+)\|\|/);
        if (cardMatch) {
            const segments = cardMatch[1].split(':');
            if (segments[0] === 'WEATHER') cardData = { type: 'weather', location: segments[1], temp: segments[2], condition: segments[3] };
            responseText = responseText.replace(cardMatch[0], '').trim();
        }

        extractBackgroundFacts(userId, userPrompt);
        return { text: responseText, card: cardData };
    } catch (error) {
        return { error: true, text: "I am experiencing network interference. Please try speaking again." };
    }
};