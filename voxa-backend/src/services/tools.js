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

// 🌍 TOOL 4: The Global Sports Hub (LIVE, FINISHED, UPCOMING, & HEAD-TO-HEAD)
export const getSportsDataTool = tool(
    async ({ requestType, sport, query }) => {
        try {
            const lowerQuery = query.toLowerCase();
            const apiKey = process.env.RAPIDAPI_KEY;

            // ==========================================
            // 🧠 INTENT & HEAD-TO-HEAD (H2H) PARSER
            // ==========================================
            const isUpcoming = requestType === "fixtures" || lowerQuery.includes("upcoming") || lowerQuery.includes("tomorrow") || lowerQuery.includes("next");
            const isFinished = requestType === "scores" || lowerQuery.includes("finished") || lowerQuery.includes("result") || lowerQuery.includes("last") || lowerQuery.includes("yesterday");

            // Extract the primary team (t1) and secondary team (t2) if user asks for "A vs B"
            let t1 = query;
            let t2 = null;
            if (lowerQuery.includes(' vs ')) {
                const parts = query.split(/ vs /i);
                t1 = parts[0].trim();
                t2 = parts[1].trim();
            } else if (lowerQuery.includes(' match')) {
                t1 = lowerQuery.replace(' match', '').trim();
            }

            // ==========================================
            // ⚽ ROUTE 1: FOOTBALL (H2H Engine)
            // ==========================================
            if (sport.toLowerCase() === "football" || lowerQuery.includes("epl") || lowerQuery.includes("ucl") || lowerQuery.includes("bayern") || lowerQuery.includes("madrid")) {
                if (!apiKey) throw new Error("RAPIDAPI_KEY is missing");

                const headers = { 'x-rapidapi-key': apiKey, 'Content-Type': 'application/json' };

                // Step 1: Get the Team ID for Team A
                const teamRes = await fetch(`https://api-football-v1.p.rapidapi.com/v3/teams?search=${encodeURIComponent(t1)}`, { headers });
                const teamData = await teamRes.json();

                let match = null;

                if (teamData.response && teamData.response.length > 0) {
                    const teamId = teamData.response[0].team.id;

                    // Step 2: Fetch a wide batch of fixtures so we can filter for Team B
                    let fixUrl = `https://api-football-v1.p.rapidapi.com/v3/fixtures?team=${teamId}&last=30`;
                    if (isUpcoming) fixUrl = `https://api-football-v1.p.rapidapi.com/v3/fixtures?team=${teamId}&next=30`;
                    // If live is requested, we just ask for live
                    else if (!isFinished && lowerQuery.includes("live")) fixUrl = `https://api-football-v1.p.rapidapi.com/v3/fixtures?team=${teamId}&live=all`;

                    const fixRes = await fetch(fixUrl, { headers });
                    const fixData = await fixRes.json();

                    if (fixData.response && fixData.response.length > 0) {
                        // 🚀 H2H FILTERING LOGIC
                        if (t2) {
                            match = fixData.response.find(m =>
                                m.teams.home.name.toLowerCase().includes(t2.toLowerCase()) ||
                                m.teams.away.name.toLowerCase().includes(t2.toLowerCase())
                            );
                        }
                        // If no specific opponent was found or asked for, default to their most recent match
                        if (!match) match = fixData.response[0];
                    }
                }

                if (!match) throw new Error("No football matches found for these teams.");

                // Map the status dynamically
                const isLiveResponse = ["1H", "2H", "HT", "LIVE", "ET", "PEN"].includes(match.fixture.status.short);
                const isFinishedResponse = ["FT", "AET", "PEN"].includes(match.fixture.status.short);

                const formattedGoals = (match.events || [])
                    .filter(e => e.type === "Goal")
                    .map(g => ({
                        team: g.team.name,
                        scorer: g.player.name,
                        minute: g.time.elapsed
                    }));

                const formattedFootball = {
                    league: match.league.name,
                    isLive: isLiveResponse,
                    matchSeconds: isLiveResponse ? (match.fixture.status.elapsed * 60) : (isFinishedResponse ? 5400 : 0),
                    teamA: { name: match.teams.home.name, score: match.goals.home !== null ? match.goals.home : "-" },
                    teamB: { name: match.teams.away.name, score: match.goals.away !== null ? match.goals.away : "-" },
                    goals: formattedGoals,
                    status: match.fixture.status.long // Prints "Not Started", "Full-Time", etc.
                };

                return JSON.stringify(formattedFootball);
            }

            // ==========================================
            // 🏏 ROUTE 2: CRICKET (H2H Engine)
            // ==========================================
            if (sport.toLowerCase() === "cricket" || lowerQuery.includes("ipl") || lowerQuery.includes("india")) {
                if (!apiKey) throw new Error("RAPIDAPI_KEY is missing");
                const headers = { 'x-rapidapi-key': apiKey, 'Content-Type': 'application/json' };

                // Fetching matches
                const response = await fetch('https://api-cricket-v1.p.rapidapi.com/fixtures', { headers });
                const rawData = await response.json();

                if (!rawData.response || rawData.response.length === 0) throw new Error("No cricket matches found. Triggering smart fallback.");

                let match = null;

                // 🚀 H2H FILTERING LOGIC FOR CRICKET
                if (t2) {
                    match = rawData.response.find(m =>
                        (m.localteam.name.toLowerCase().includes(t1.toLowerCase()) || m.visitorteam.name.toLowerCase().includes(t1.toLowerCase())) &&
                        (m.localteam.name.toLowerCase().includes(t2.toLowerCase()) || m.visitorteam.name.toLowerCase().includes(t2.toLowerCase()))
                    );
                }

                // If no exact H2H match was found, look for Team 1's most recent match
                if (!match) {
                    match = rawData.response.find(m =>
                        m.localteam.name.toLowerCase().includes(t1.toLowerCase()) || m.visitorteam.name.toLowerCase().includes(t1.toLowerCase())
                    ) || rawData.response[0]; // Absolute fallback to any match
                }

                const localTeam = match.localteam;
                const visitorTeam = match.visitorteam;
                const runsLocal = match.runs.find(r => r.team_id === localTeam.id) || { score: 0, wickets: 0, overs: 0 };
                const runsVisitor = match.runs.find(r => r.team_id === visitorTeam.id) || { score: 0, wickets: 0, overs: 0 };

                const isLiveResponse = match.status === "LIVE";

                const formattedCricket = {
                    league: match.league.name || "ipl",
                    isLive: isLiveResponse,
                    battingTeam: localTeam.name,
                    battingScore: isUpcoming ? "-" : `${runsLocal.score}/${runsLocal.wickets}`,
                    battingOvers: isUpcoming ? null : `${runsLocal.overs}`,
                    bowlingTeam: visitorTeam.name,
                    bowlingScore: isUpcoming ? "-" : `${runsVisitor.score}/${runsVisitor.wickets}`,
                    bowlingOvers: isUpcoming ? null : `${runsVisitor.overs}`,
                    crr: null,
                    rrr: null,
                    status: match.note || match.status || "Match Info"
                };

                return JSON.stringify(formattedCricket);
            }

            throw new Error("No specific sport route hit.");

        } catch (error) {
            console.warn(`[Tool Warning] API failed (${error.message}). Executing Smart Fallback.`);

            // 🛡️ SMART FALLBACK: Safely uses the H2H parsing even if the API breaks
            const isUpcomingFb = requestType === "fixtures" || query.toLowerCase().includes("upcoming") || query.toLowerCase().includes("tomorrow") || query.toLowerCase().includes("next");

            let fb1 = "Team A", fb2 = "Team B";
            if (query.toLowerCase().includes(' vs ')) {
                const parts = query.split(/ vs /i);
                fb1 = parts[0].trim().toUpperCase();
                fb2 = parts[1].trim().toUpperCase();
            } else {
                fb1 = query.toUpperCase();
            }

            const isFootballFb = sport.toLowerCase() === "football" || query.toLowerCase().includes('football') || query.toLowerCase().includes('ucl');

            if (isFootballFb) {
                return JSON.stringify({
                    league: "Football",
                    isLive: false,
                    matchSeconds: 0,
                    teamA: { name: fb1, score: "-" },
                    teamB: { name: fb2, score: "-" },
                    goals: [],
                    status: isUpcomingFb ? "Scheduled Fixture" : "Data Not Available"
                });
            } else {
                return JSON.stringify({
                    league: query.toLowerCase().includes("ipl") ? "IPL" : "Cricket",
                    isLive: false,
                    battingTeam: fb1,
                    battingScore: "-",
                    battingOvers: null,
                    bowlingTeam: fb2,
                    bowlingScore: "-",
                    bowlingOvers: null,
                    crr: null,
                    rrr: null,
                    status: isUpcomingFb ? "Scheduled Fixture" : "Data Not Available"
                });
            }
        }
    },
    {
        name: "get_sports_data",
        description: "Fetches live scores, match results, upcoming fixtures, and team info for global sports. MUST return exact JSON format for scores.",
        schema: z.object({
            requestType: z.enum(["team_info", "fixtures", "scores", "tactics"]).describe("The specific type of information requested. 'fixtures' for upcoming, 'scores' for recent/live."),
            sport: z.string().describe("The name of the sport (e.g., 'cricket', 'football')."),
            query: z.string().describe("The name of the team, league, or matchup (e.g., 'IPL', 'RCB vs MI', 'Bayern Munich vs PSG')."),
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