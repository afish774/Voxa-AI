import { tool } from "@langchain/core/tools";
import { z } from "zod";
import Reminder from "../models/Reminder.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// 🛠️ TOOL 1: The Personal Secretary (Database Write)
export const createReminderTool = (userId) => {
    return tool(
        async ({ task }) => {
            try {
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

// 📈 TOOL 2: The Live Crypto Tracker (API Tool)
export const getCryptoPriceTool = tool(
    async ({ coinId }) => {
        try {
            const normalizedCoin = coinId.toLowerCase();
            const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${normalizedCoin}&vs_currencies=usd`);
            const data = await response.json();

            if (data[normalizedCoin] && data[normalizedCoin].usd) {
                return `The current live price of ${normalizedCoin} is $${data[normalizedCoin].usd} USD.`;
            } else {
                return `I could not find the live price for ${normalizedCoin}. Make sure it is a valid cryptocurrency name.`;
            }
        } catch (error) {
            return "Error: Failed to connect to the crypto pricing API.";
        }
    },
    {
        name: "get_crypto_price",
        description: "Fetches the real-time live price of any cryptocurrency in USD. Use this anytime the user asks about the price or value of Bitcoin, Ethereum, Solana, or any other crypto.",
        schema: z.object({
            coinId: z.string().describe("The full name of the cryptocurrency to look up (e.g., 'bitcoin', 'ethereum', 'solana', 'dogecoin'). Do not use abbreviations like BTC or ETH."),
        }),
    }
);

// 📧 TOOL 3: The Email Sender (Action Tool)
export const sendEmailTool = tool(
    async ({ to, subject, body }) => {
        try {
            if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
                return "Error: Email credentials are not configured on the server.";
            }

            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            await transporter.sendMail({
                from: `"Voxa AI" <${process.env.EMAIL_USER}>`,
                to: to,
                subject: subject,
                text: body
            });

            return `Successfully sent email to ${to}. Tell the user the email has been dispatched.`;
        } catch (error) {
            console.error("Nodemailer Error:", error);
            return "Error: Failed to send the email due to a network or authentication issue.";
        }
    },
    {
        name: "send_email",
        description: "Sends an email to a specified email address. Use this when the user asks you to email someone, send a message, or draft an email.",
        schema: z.object({
            to: z.string().email().describe("The exact email address to send the message to. If the user does not provide an email address, ask them for it."),
            subject: z.string().describe("A brief, professional subject line for the email."),
            body: z.string().describe("The main text content of the email.")
        }),
    }
);