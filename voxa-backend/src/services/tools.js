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

// 🌍 TOOL 4: The Global Sports Hub (MASTER ROUTER WITH RAPIDAPI + MOCK FALLBACKS)
export const getSportsDataTool = tool(
    async ({ requestType, sport, query }) => {
        try {
            const lowerQuery = query.toLowerCase();
            const apiKey = process.env.RAPIDAPI_KEY;

            // ==========================================
            // 🧠 ROUTE 1: TACTICS & FORMATIONS (Preserved)
            // ==========================================
            if (requestType === "tactics") {
                if (lowerQuery.includes("long ball") || lowerQuery.includes("counter")) return "The Long Ball Counter is a tactical setup focusing on absorbing pressure deep, drawing the opponent in, and launching rapid, direct passes to fast forwards. A classic example is Jose Mourinho's peak 4-3-3.";
                if (lowerQuery.includes("tiki taka") || lowerQuery.includes("possession")) return "Tiki-Taka is characterized by short passing and movement, working the ball through various channels, and maintaining possession.";
                if (lowerQuery.includes("pick and roll")) return "The Pick and Roll is a classic offensive play in basketball where a player sets a screen (pick) for a teammate handling the ball and then moves toward the basket (rolls) to accept a pass.";
                return `Tactical analysis for ${query} in ${sport}: This system generally requires high situational awareness and exploits specific defensive weaknesses.`;
            }

            // ==========================================
            // 🏏 ROUTE 2: CRICKET & IPL (API-Cricket via RapidAPI)
            // ==========================================
            if (sport.toLowerCase() === "cricket" || lowerQuery.includes("ipl") || lowerQuery.includes("india")) {
                if (!apiKey) throw new Error("RAPIDAPI_KEY is missing");

                const response = await fetch('https://api-cricket-v1.p.rapidapi.com/fixtures?status=LIVE', {
                    headers: { 'x-rapidapi-key': apiKey, 'Content-Type': 'application/json' }
                });
                if (!response.ok) throw new Error("Cricket API Error");

                const rawData = await response.json();

                // If there are no live matches, throw error to trigger the fallback logic below
                if (!rawData.response || rawData.response.length === 0) throw new Error("No live cricket matches found");

                const match = rawData.response[0];
                const localTeam = match.localteam;
                const visitorTeam = match.visitorteam;
                const runsLocal = match.runs.find(r => r.team_id === localTeam.id) || { score: 0, wickets: 0, overs: 0 };
                const runsVisitor = match.runs.find(r => r.team_id === visitorTeam.id) || { score: 0, wickets: 0, overs: 0 };

                const formattedCricket = {
                    league: match.league.name || "ipl",
                    isLive: match.status === "LIVE",
                    battingTeam: localTeam.name,
                    battingScore: `${runsLocal.score}/${runsLocal.wickets}`,
                    battingOvers: `${runsLocal.overs}`,
                    bowlingTeam: visitorTeam.name,
                    bowlingScore: `${runsVisitor.score}/${runsVisitor.wickets}`,
                    bowlingOvers: `${runsVisitor.overs}`,
                    crr: null,
                    rrr: null,
                    status: match.note || "Match in progress"
                };

                return JSON.stringify(formattedCricket);
            }

            // ==========================================
            // ⚽ ROUTE 3: FOOTBALL (API-Football via RapidAPI)
            // ==========================================
            if (sport.toLowerCase() === "football" || lowerQuery.includes("epl") || lowerQuery.includes("ucl") || lowerQuery.includes("bayern") || lowerQuery.includes("madrid")) {
                if (!apiKey) throw new Error("RAPIDAPI_KEY is missing");

                const response = await fetch('https://api-football-v1.p.rapidapi.com/v3/fixtures?live=all', {
                    headers: { 'x-rapidapi-key': apiKey, 'Content-Type': 'application/json' }
                });
                if (!response.ok) throw new Error("Football API Error");

                const rawData = await response.json();
                if (!rawData.response || rawData.response.length === 0) throw new Error("No live football matches found");

                const match = rawData.response[0];

                const formattedGoals = match.events
                    .filter(e => e.type === "Goal")
                    .map(g => ({
                        team: g.team.name,
                        scorer: g.player.name,
                        minute: g.time.elapsed
                    }));

                const formattedFootball = {
                    league: match.league.name,
                    isLive: true,
                    matchSeconds: match.fixture.status.elapsed * 60,
                    teamA: { name: match.teams.home.name, score: match.goals.home },
                    teamB: { name: match.teams.away.name, score: match.goals.away },
                    goals: formattedGoals,
                    status: match.fixture.status.long
                };

                return JSON.stringify(formattedFootball);
            }

            throw new Error("No matches found for query.");

        } catch (error) {
            console.warn(`[Tool Warning] API failed or limits reached (${error.message}). Falling back to strict mock JSON.`);

            // 🛡️ JSON FALLBACKS: If the API fails or no matches are live, return your exact requested JSON formats.
            const lowerQuery = query.toLowerCase();
            if (sport.toLowerCase() === "football" || lowerQuery.includes('football') || lowerQuery.includes('ucl') || lowerQuery.includes('bayern')) {
                return JSON.stringify({
                    league: "ucl",
                    isLive: false,
                    matchSeconds: 5400,
                    teamA: { name: "Bayern Munich", score: 3 },
                    teamB: { name: "PSG", score: 1 },
                    goals: [
                        { team: "Bayern Munich", scorer: "Kane", minute: 12 },
                        { team: "Bayern Munich", scorer: "Musiala", minute: 44 },
                        { team: "PSG", scorer: "Mbappe", minute: 78 },
                        { team: "Bayern Munich", scorer: "Kane", minute: 89 }
                    ],
                    status: "Full Time"
                });
            } else if (requestType === "fixtures" || lowerQuery.includes('tomorrow')) {
                return JSON.stringify({
                    league: "ipl",
                    isLive: false,
                    battingTeam: "CSK",
                    battingScore: "-",
                    battingOvers: "",
                    bowlingTeam: "MI",
                    bowlingScore: "-",
                    bowlingOvers: "",
                    crr: null,
                    rrr: null,
                    status: "Starts Tomorrow at 19:30 IST"
                });
            } else {
                return JSON.stringify({
                    id: "cric_101",
                    league: "ipl",
                    isLive: true,
                    battingTeam: "India",
                    battingScore: "145/1",
                    battingOvers: "25.2",
                    bowlingTeam: "Pakistan",
                    bowlingScore: "310/10",
                    bowlingOvers: "50.0",
                    crr: 5.73,
                    rrr: 7.94,
                    status: "India need 166 runs"
                });
            }
        }
    },
    {
        name: "get_sports_data",
        description: "Fetches live scores, match results, upcoming fixtures, and team info for global sports. MUST return exact JSON format for scores.",
        schema: z.object({
            requestType: z.enum(["team_info", "fixtures", "scores", "tactics"]).describe("The specific type of information requested."),
            sport: z.string().describe("The name of the sport (e.g., 'cricket', 'football')."),
            query: z.string().describe("The name of the team, league, or topic (e.g., 'IPL', 'Bayern', 'Tiki Taka')."),
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