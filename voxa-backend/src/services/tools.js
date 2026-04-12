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

// 🌍 TOOL 4: The Global Sports Hub (MASTER ROUTER)
export const getSportsDataTool = tool(
    async ({ requestType, sport, query }) => {
        try {
            const lowerQuery = query.toLowerCase();

            // ==========================================
            // 🏏 ROUTE 1: CRICKET & IPL (CricAPI Live)
            // ==========================================
            if (sport.toLowerCase() === "cricket" || lowerQuery.includes("ipl")) {
                if (!process.env.CRICKET_API_KEY) {
                    return "Error: CRICKET_API_KEY is missing from the environment variables. Cannot fetch live cricket scores.";
                }

                const res = await fetch(`https://api.cricapi.com/v1/currentMatches?apikey=${process.env.CRICKET_API_KEY}&offset=0`);
                const matchData = await res.json();

                if (!matchData.data || matchData.data.length === 0) {
                    return `I couldn't find any live or recent cricket matches matching "${query}".`;
                }

                const targetMatch = matchData.data.find(m =>
                    m.name.toLowerCase().includes(lowerQuery) ||
                    m.shortName.toLowerCase().includes(lowerQuery)
                );

                if (!targetMatch) {
                    return `I scanned the live servers but couldn't find an active match for "${query}".`;
                }

                const teamA = targetMatch.teams[0];
                const teamB = targetMatch.teams[1];
                let scoreA = "-";
                let scoreB = "-";

                if (targetMatch.score && targetMatch.score.length > 0) {
                    const scoreObjA = targetMatch.score.find(s => s.inning.includes(teamA));
                    const scoreObjB = targetMatch.score.find(s => s.inning.includes(teamB));
                    if (scoreObjA) scoreA = `${scoreObjA.r}/${scoreObjA.w}`;
                    if (scoreObjB) scoreB = `${scoreObjB.r}/${scoreObjB.w}`;
                }

                const status = targetMatch.status || "Live";
                const league = targetMatch.matchType.toUpperCase() === "T20" ? "IPL / T20" : targetMatch.matchType.toUpperCase();

                return `Data found. ${teamA}: ${scoreA}. ${teamB}: ${scoreB}. Status: ${status}. League: ${league}. Format this exactly into the SPORTS widget card.`;
            }

            // ==========================================
            // 🧠 ROUTE 2: TACTICS & FORMATIONS
            // ==========================================
            if (requestType === "tactics") {
                if (lowerQuery.includes("long ball") || lowerQuery.includes("counter")) return "The Long Ball Counter is a tactical setup focusing on absorbing pressure deep, drawing the opponent in, and launching rapid, direct passes to fast forwards. A classic example is Jose Mourinho's peak 4-3-3.";
                if (lowerQuery.includes("tiki taka") || lowerQuery.includes("possession")) return "Tiki-Taka is characterized by short passing and movement, working the ball through various channels, and maintaining possession.";
                if (lowerQuery.includes("pick and roll")) return "The Pick and Roll is a classic offensive play in basketball where a player sets a screen (pick) for a teammate handling the ball and then moves toward the basket (rolls) to accept a pass.";
                return `Tactical analysis for ${query} in ${sport}: This system generally requires high situational awareness and exploits specific defensive weaknesses.`;
            }

            // ==========================================
            // ⚽ ROUTE 3: GLOBAL SPORTS (TheSportsDB for NBA, NFL, Soccer, etc.)
            // ==========================================
            const safeQuery = encodeURIComponent(query);
            const searchResponse = await fetch(`https://www.thesportsdb.com/api/v1/json/123/searchteams.php?t=${safeQuery}`);
            const teamData = await searchResponse.json();

            if (!teamData.teams) return `I couldn't find database records for the ${sport} team "${query}". Please check the spelling.`;

            const team = teamData.teams[0];
            const teamId = team.idTeam;

            // Fetch Recent Scores
            if (requestType === "scores") {
                const eventResponse = await fetch(`https://www.thesportsdb.com/api/v1/json/123/eventslast.php?id=${teamId}`);
                const eventData = await eventResponse.json();

                if (!eventData.results) return `${team.strTeam} currently has no recent match results listed in the public database.`;

                const lastMatch = eventData.results[0];
                const homeTeam = lastMatch.strHomeTeam;
                const awayTeam = lastMatch.strAwayTeam;
                const homeScore = lastMatch.intHomeScore || "0";
                const awayScore = lastMatch.intAwayScore || "0";
                const league = lastMatch.strLeague || sport;
                const status = "FT"; // TheSportsDB 'last events' are always full-time

                return `Data found. ${homeTeam}: ${homeScore}. ${awayTeam}: ${awayScore}. Status: ${status}. League: ${league}. Format this exactly into the SPORTS widget card.`;
            }

            // Fetch Upcoming Fixtures
            if (requestType === "fixtures") {
                const eventResponse = await fetch(`https://www.thesportsdb.com/api/v1/json/123/eventsnext.php?id=${teamId}`);
                const eventData = await eventResponse.json();

                if (!eventData.events) return `${team.strTeam} currently has no upcoming fixtures listed in the public database.`;

                const nextMatch = eventData.events[0];
                const homeTeam = nextMatch.strHomeTeam;
                const awayTeam = nextMatch.strAwayTeam;
                const date = nextMatch.dateEvent || "Upcoming";
                const league = nextMatch.strLeague || sport;

                return `Data found. ${homeTeam}: -. ${awayTeam}: -. Status: Scheduled for ${date}. League: ${league}. Format this exactly into the SPORTS widget card.`;
            }

            // Fetch Team Info
            if (requestType === "team_info") {
                return `${team.strTeam} plays in the ${team.strLeague}. Their home venue is ${team.strStadium}, which has a capacity of ${team.intStadiumCapacity}.`;
            }

            return `I found data for ${team.strTeam}, but could not process the specific request type.`;

        } catch (error) {
            console.error("Sports API Error:", error);
            return "Error: Failed to fetch sports data from the global network. The API might be temporarily down.";
        }
    },
    {
        name: "get_sports_data",
        description: "Fetches live scores, previous match results, upcoming fixtures, and team info for ALL global sports (Football, NBA, NFL, Cricket, etc.).",
        schema: z.object({
            requestType: z.enum(["team_info", "fixtures", "scores", "tactics"]).describe("The specific type of sports information requested. Use 'scores' for recent/live matches, and 'fixtures' for upcoming schedules."),
            sport: z.string().describe("The name of the sport (e.g., 'football', 'basketball', 'cricket', 'baseball')."),
            query: z.string().describe("The name of the team (e.g., 'Lakers', 'Real Madrid', 'Royal Challengers Bangalore')."),
        }),
    }
);

// 🌤️ TOOL 5: The Global Weather Radar
export const getWeatherTool = tool(
    async ({ location }) => {
        try {
            const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`);
            const geoData = await geoRes.json();

            if (!geoData.results || geoData.results.length === 0) {
                return `I could not locate the city "${location}". Please provide a valid city name.`;
            }

            const { latitude, longitude, name } = geoData.results[0];

            const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
            const weatherData = await weatherRes.json();

            const temp = Math.round(weatherData.current_weather.temperature);
            const code = weatherData.current_weather.weathercode;

            let condition = "Sunny";
            if (code >= 51 && code <= 69) condition = "Rain";
            else if (code >= 71 && code <= 79) condition = "Winter";
            else if (code >= 80 && code <= 99) condition = "Rain";
            else if (code >= 1 && code <= 3) condition = "Autumn";

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
            location: z.string().describe("The name of the city or location (e.g., 'London', 'New York', 'Chavakkad')."),
        }),
    }
);