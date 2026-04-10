import { tool } from "@langchain/core/tools";
import { z } from "zod";
import Reminder from "../models/Reminder.js";

// 🛠️ TOOL 1: The Personal Secretary (Database Write)
export const createReminderTool = (userId) => {
    return tool(
        async ({ task }) => {
            try {
                // This is where Voxa actually writes to MongoDB!
                await Reminder.create({ user: userId, task: task });
                return `Successfully saved reminder: "${task}". Tell the user it has been saved to their database.`;
            } catch (error) {
                return "Error: Failed to save reminder to the database.";
            }
        },
        {
            name: "save_reminder",
            description: "Saves a reminder, task, or note to the user's database. Use this anytime the user asks you to 'remind me to...' or 'save this note...'",
            schema: z.object({
                task: z.string().describe("The specific task or note to save (e.g., 'buy milk', 'call mom at 5pm')"),
            }),
        }
    );
};