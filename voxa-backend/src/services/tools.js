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

// 🌍 TOOL 4: The Global Sports Hub (UPGRADED WITH LIVE SCORES)
export const getSportsDataTool = tool(
    async ({ requestType, sport, query }) => {
        try {
            if (requestType === "tactics") {
                const lowerQuery = query.toLowerCase();
                if (lowerQuery.includes("long ball") || lowerQuery.includes("counter")) return "The Long Ball Counter is a tactical setup focusing on absorbing pressure deep, drawing the opponent in, and launching rapid, direct passes to fast forwards. A classic example is Jose Mourinho's peak 4-3-3.";
                if (lowerQuery.includes("tiki taka") || lowerQuery.includes("possession")) return "Tiki-Taka is characterized by short passing and movement, working the ball through various channels, and maintaining possession. It relies heavily on technical midfielders creating triangles across the pitch.";
                if (lowerQuery.includes("pick and roll")) return "The Pick and Roll is a classic offensive play in basketball where a player sets a screen (pick) for a teammate handling the ball and then moves toward the basket (rolls) to accept a pass.";
                if (lowerQuery.includes("triangle")) return "The Triangle Offense is a basketball strategy relying on spacing, passing, and constant motion, popularized by Phil Jackson with the Bulls and Lakers.";
                if (lowerQuery.includes("west coast")) return "The West Coast Offense in American football relies on short, horizontal passing routes to stretch out the defense, rather than establishing the run game first.";
                return `Tactical analysis for ${query} in ${sport}: This system generally requires high situational awareness and exploits specific defensive weaknesses.`;
            }

            const safeQuery = encodeURIComponent(query);
            const searchResponse = await fetch(`https://www.thesportsdb.com/api/v1/json/123/searchteams.php?t=${safeQuery}`);
            const teamData = await searchResponse.json();

            if (!teamData.teams) {
                return `I couldn't find database records for the ${sport} team "${query}". Please check the spelling.`;
            }

            const team = teamData.teams[0];
            const teamId = team.idTeam;

            // 🚀 NEW: Added the endpoints to fetch actual scores!
            if (requestType === "scores") {
                const eventResponse = await fetch(`https://www.thesportsdb.com/api/v1/json/123/eventslast.php?id=${teamId}`);
                const eventData = await eventResponse.json();

                if (!eventData.results) return `${team.strTeam} currently has no recent match results listed in the public database.`;

                const lastMatch = eventData.results[0];
                return `The last match was ${lastMatch.strEvent}. The final score was ${lastMatch.strHomeTeam} ${lastMatch.intHomeScore}, ${lastMatch.strAwayTeam} ${lastMatch.intAwayScore}.`;
            }

            if (requestType === "fixtures") {
                const eventResponse = await fetch(`https://www.thesportsdb.com/api/v1/json/123/eventsnext.php?id=${teamId}`);
                const eventData = await eventResponse.json();

                if (!eventData.events) return `${team.strTeam} currently has no upcoming fixtures listed in the public database. Note: The free sports API sometimes restricts future fixture data.`;

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
        description: "Fetches live sports team information, recent scores, upcoming fixtures, and tactical data for global sports.",
        schema: z.object({
            // 🚀 NEW: 'scores' added to the schema so Llama knows it can use it!
            requestType: z.enum(["team_info", "fixtures", "scores", "tactics"]).describe("The specific type of sports information requested."),
            sport: z.string().describe("The name of the sport (e.g., 'football', 'basketball', 'baseball')."),
            query: z.string().describe("The name of the team (e.g., 'Los Angeles Lakers') or tactical formation."),
        }),
    }
);

// 🌤️ NEW TOOL 5: The Global Weather Radar (Live Geocoding & Weather)
export const getWeatherTool = tool(
    async ({ location }) => {
        try {
            // Step 1: Convert city name to GPS Coordinates
            const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`);
            const geoData = await geoRes.json();

            if (!geoData.results || geoData.results.length === 0) {
                return `I could not locate the city "${location}". Please provide a valid city name.`;
            }

            const { latitude, longitude, name } = geoData.results[0];

            // Step 2: Fetch precise weather using Coordinates
            const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
            const weatherData = await weatherRes.json();

            const temp = Math.round(weatherData.current_weather.temperature);
            const code = weatherData.current_weather.weathercode;

            // Step 3: Map complex meteorological codes to your 4 strict UI conditions
            let condition = "Sunny";
            if (code >= 51 && code <= 69) condition = "Rain"; // Drizzle to Heavy Rain
            else if (code >= 71 && code <= 79) condition = "Winter"; // Snow
            else if (code >= 80 && code <= 99) condition = "Rain"; // Showers & Thunderstorms
            else if (code >= 1 && code <= 3) condition = "Autumn"; // Partly Cloudy / Overcast

            return `The current live weather in ${name} is ${temp} degrees Celsius with a condition of ${condition}. Format your response exactly to trigger the Weather Widget.`;

        } catch (error) {
            console.error("Weather API Error:", error);
            return "Error: Failed to fetch live weather data due to a network timeout.";
        }
    },
    {
        name: "get_weather",
        description: "Fetches highly accurate, real-time weather data and temperature for any city, region, or location globally.",
        schema: z.object({
            location: z.string().describe("The name of the city or location (e.g., 'Chavakkad', 'London', 'New York')."),
        }),
    }
);