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
            to: z.string().describe("The exact email address to send the message to. If the user does not provide an email address, ask them for it."),
            subject: z.string().describe("A brief, professional subject line for the email."),
            body: z.string().describe("The main text content of the email.")
        }),
    }
);

// 🌍 TOOL 4: The Global Sports Hub (Multi-Sport Data & Tactics)
export const getSportsDataTool = tool(
    async ({ requestType, sport, query }) => {
        try {
            // Multi-Sport Tactical Engine
            if (requestType === "tactics") {
                const lowerQuery = query.toLowerCase();

                // Football (Soccer)
                if (lowerQuery.includes("long ball") || lowerQuery.includes("counter")) return "The Long Ball Counter is a tactical setup focusing on absorbing pressure deep, drawing the opponent in, and launching rapid, direct passes to fast forwards. A classic example is Jose Mourinho's peak 4-3-3.";
                if (lowerQuery.includes("tiki taka") || lowerQuery.includes("possession")) return "Tiki-Taka is characterized by short passing and movement, working the ball through various channels, and maintaining possession. It relies heavily on technical midfielders creating triangles across the pitch.";

                // Basketball
                if (lowerQuery.includes("pick and roll")) return "The Pick and Roll is a classic offensive play in basketball where a player sets a screen (pick) for a teammate handling the ball and then moves toward the basket (rolls) to accept a pass.";
                if (lowerQuery.includes("triangle")) return "The Triangle Offense is a basketball strategy relying on spacing, passing, and constant motion, popularized by Phil Jackson with the Bulls and Lakers.";

                // American Football
                if (lowerQuery.includes("west coast")) return "The West Coast Offense in American football relies on short, horizontal passing routes to stretch out the defense, rather than establishing the run game first.";

                return `Tactical analysis for ${query} in ${sport}: This system generally requires high situational awareness and exploits specific defensive weaknesses.`;
            }

            // Live Sports API Engine (Works for NBA, NFL, MLB, NHL, Premier League, etc.)
            const searchResponse = await fetch(`https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${query}`);
            const teamData = await searchResponse.json();

            if (!teamData.teams) {
                return `I couldn't find database records for the ${sport} team "${query}". Please check the spelling.`;
            }

            const team = teamData.teams[0];
            const teamId = team.idTeam;

            if (requestType === "fixtures") {
                const eventResponse = await fetch(`https://www.thesportsdb.com/api/v1/json/3/eventsnext.php?id=${teamId}`);
                const eventData = await eventResponse.json();

                if (!eventData.events) return `${team.strTeam} currently has no upcoming fixtures listed in the public database.`;

                const nextMatch = eventData.events[0];
                return `The next match for ${team.strTeam} is ${nextMatch.strEvent} scheduled for ${nextMatch.dateEvent}.`;
            }

            if (requestType === "team_info") {
                return `${team.strTeam} plays in the ${team.strLeague}. Their home venue is ${team.strStadium}, which has a capacity of ${team.intStadiumCapacity}.`;
            }

            return `I found data for ${team.strTeam}, but could not process the specific request type.`;
        } catch (error) {
            console.error("Sports API Error:", error);
            return "Error: Failed to fetch sports data from the global API.";
        }
    },
    {
        name: "get_sports_data",
        description: "Fetches live sports team information, upcoming fixtures, and detailed tactical data for global sports including Football, Basketball (NBA), American Football (NFL), Baseball (MLB), and more.",
        schema: z.object({
            requestType: z.enum(["team_info", "fixtures", "tactics"]).describe("The specific type of sports information requested."),
            sport: z.string().describe("The name of the sport (e.g., 'football', 'basketball', 'baseball', 'cricket')."),
            query: z.string().describe("The name of the team (e.g., 'Los Angeles Lakers', 'Manchester United') or the tactical formation (e.g., 'pick and roll', '4-3-3')."),
        }),
    }
);