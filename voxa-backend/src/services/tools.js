import { tool } from "@langchain/core/tools";
import { z } from "zod";
import Reminder from "../models/Reminder.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// 🛡️ ENTERPRISE NETWORK ENGINE: Auto-Retry + Timeout
// Prevents Voxa from freezing and auto-recovers from temporary free API failures
const fetchWithRetry = async (url, options = {}, retries = 1, timeoutMs = 6000) => {
    for (let i = 0; i <= retries; i++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const response = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(timeoutId);
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (i === retries) throw error;
            await new Promise(res => setTimeout(res, 500)); // Wait 500ms before retrying
        }
    }
};

// 🛠️ TOOL 1: The Personal Secretary
export const createReminderTool = (userId) => {
    return tool(
        async ({ task }) => {
            try {
                if (!userId) return "Error: User ID is missing. Cannot save to database.";
                await Reminder.create({ user: userId, task: task });
                return `Successfully saved reminder: "${task}". Tell the user it has been saved to their database.`;
            } catch (error) {
                console.error("[Tool Error] Reminder:", error.message);
                return "Error: Failed to save reminder to the secure database.";
            }
        },
        {
            name: "save_reminder",
            description: "Saves a reminder, task, or note to the user's database. Use this anytime the user asks you to 'remind me to...' or 'save this note...'",
            schema: z.object({ task: z.string().describe("The specific task or note to save (e.g., 'buy milk', 'call mom at 5pm')") }),
        }
    );
};

// 📈 TOOL 2: The Live Crypto Tracker
export const getCryptoPriceTool = tool(
    async ({ coinId }) => {
        try {
            const normalizedCoin = coinId.toLowerCase().trim();
            const response = await fetchWithRetry(`https://api.coingecko.com/api/v3/simple/price?ids=${normalizedCoin}&vs_currencies=usd`);
            const data = await response.json();

            if (data[normalizedCoin] && data[normalizedCoin].usd) {
                return `The current live price of ${normalizedCoin} is $${data[normalizedCoin].usd} USD.`;
            }
            return `I could not find the live price for ${normalizedCoin}. Please ensure it is a valid, full cryptocurrency name.`;
        } catch (error) {
            console.error("[Tool Error] Crypto API:", error.message);
            return "Error: Failed to connect to the live cryptocurrency market. The service might be busy.";
        }
    },
    {
        name: "get_crypto_price",
        description: "Fetches live cryptocurrency prices in USD.",
        schema: z.object({ coinId: z.string().describe("The FULL name of the cryptocurrency (e.g., 'bitcoin', 'ethereum'). Do NOT use abbreviations like BTC.") }),
    }
);

// 📧 TOOL 3: The Email Sender
export const sendEmailTool = tool(
    async ({ to, subject, body }) => {
        try {
            if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
                return "Error: Email credentials are not configured on the server environment.";
            }
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
            });
            await transporter.sendMail({ from: `"Voxa AI" <${process.env.EMAIL_USER}>`, to, subject, text: body });
            return `Successfully sent email to ${to}. Tell the user the email has been dispatched.`;
        } catch (error) {
            console.error("[Tool Error] Nodemailer:", error.message);
            return "Error: Failed to send the email due to a network or authentication issue.";
        }
    },
    {
        name: "send_email",
        description: "Sends an email to a specified email address.",
        schema: z.object({
            to: z.string().email().describe("The exact, valid email address to send the message to."),
            subject: z.string().describe("A brief, professional subject line for the email."),
            body: z.string().describe("The main text content of the email.")
        }),
    }
);

// 🌍 TOOL 4: The Global Sports Hub (Football, Cricket, AND Basketball)
export const getSportsDataTool = tool(
    async ({ requestType, sport, query }) => {
        try {
            const lowerQuery = query.toLowerCase();

            // Intent & Date Parsing
            const isUpcoming = requestType === "fixtures" || lowerQuery.includes("upcoming") || lowerQuery.includes("tomorrow") || lowerQuery.includes("next");
            const isFinished = requestType === "scores" || lowerQuery.includes("finished") || lowerQuery.includes("last") || lowerQuery.includes("yesterday");

            const cleanQuery = query.replace(/(yesterday|today|tomorrow|match|score|update|live|next|last|game|schedule|gaming|fixtures|please|of)/gi, '').trim();
            let t1 = cleanQuery, t2 = null;
            if (cleanQuery.toLowerCase().includes(' vs ')) {
                const parts = cleanQuery.split(/ vs /i);
                t1 = parts[0].trim(); t2 = parts[1].trim();
            }

            // ==========================================
            // ⚽ ROUTE 1: FOOTBALL (API-Football)
            // ==========================================
            if (sport.toLowerCase() === "football" || lowerQuery.includes("epl") || lowerQuery.includes("ucl") || lowerQuery.includes("madrid") || lowerQuery.includes("city")) {
                const apiKey = process.env.RAPIDAPI_KEY;
                if (!apiKey) throw new Error("RAPIDAPI_KEY is missing");
                const headers = { 'x-rapidapi-key': apiKey, 'Content-Type': 'application/json' };

                const teamRes = await fetchWithRetry(`https://api-football-v1.p.rapidapi.com/v3/teams?search=${encodeURIComponent(t1)}`, { headers });
                const teamData = await teamRes.json();
                if (!teamData.response || teamData.response.length === 0) throw new Error(`Football Team not found`);

                const teamId = teamData.response[0].team.id;
                let fetchUrl = `https://api-football-v1.p.rapidapi.com/v3/fixtures?team=${teamId}&last=15`;
                if (isUpcoming) fetchUrl = `https://api-football-v1.p.rapidapi.com/v3/fixtures?team=${teamId}&next=15`;
                else if (!isFinished && lowerQuery.includes("live")) fetchUrl = `https://api-football-v1.p.rapidapi.com/v3/fixtures?team=${teamId}&live=all`;

                const fixRes = await fetchWithRetry(fetchUrl, { headers });
                const fixData = await fixRes.json();
                let eventsArray = fixData.response;

                if ((!eventsArray || eventsArray.length === 0) && !isUpcoming && !isFinished) {
                    const fbRes = await fetchWithRetry(`https://api-football-v1.p.rapidapi.com/v3/fixtures?team=${teamId}&last=10`, { headers });
                    const fbData = await fbRes.json();
                    eventsArray = fbData.response;
                }

                if (!eventsArray || eventsArray.length === 0) throw new Error("No fixtures found.");

                let match = eventsArray[0];
                let statusSuffix = "";

                if (t2) {
                    const h2hMatch = eventsArray.find(m =>
                        m.teams.home.name.toLowerCase().includes(t2.toLowerCase()) ||
                        m.teams.away.name.toLowerCase().includes(t2.toLowerCase())
                    );
                    if (h2hMatch) match = h2hMatch;
                    else statusSuffix = " (H2H not in recent logs)";
                }

                const isLiveResponse = ["1H", "2H", "HT", "LIVE", "ET", "PEN"].includes(match.fixture.status.short);
                const isFinishedResponse = ["FT", "AET", "PEN"].includes(match.fixture.status.short);

                const formattedGoals = (match.events || []).filter(e => e.type === "Goal").map(g => ({
                    team: g.team.name, scorer: g.player.name, minute: g.time.elapsed
                }));

                return JSON.stringify({
                    league: match.league.name || "Football",
                    isLive: isLiveResponse,
                    matchSeconds: isLiveResponse ? (match.fixture.status.elapsed * 60) : (isFinishedResponse ? 5400 : 0),
                    teamA: { name: match.teams.home.name, score: match.goals.home !== null ? match.goals.home : "-" },
                    teamB: { name: match.teams.away.name, score: match.goals.away !== null ? match.goals.away : "-" },
                    goals: formattedGoals,
                    status: (isLiveResponse ? "Match Live" : (isUpcoming ? `Scheduled: ${new Date(match.fixture.date).toLocaleDateString()}` : "Full Time")) + statusSuffix
                });
            }

            // ==========================================
            // 🏀 ROUTE 2: BASKETBALL (TheSportsDB Free Tier)
            // ==========================================
            if (sport.toLowerCase() === "basketball" || lowerQuery.includes("nba") || lowerQuery.includes("lakers") || lowerQuery.includes("warriors")) {
                const teamRes = await fetchWithRetry(`https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(t1)}`);
                const teamData = await teamRes.json();
                if (!teamData.teams) throw new Error(`Basketball Team not found`);

                const teamId = teamData.teams[0].idTeam;
                let fetchUrl = `https://www.thesportsdb.com/api/v1/json/3/eventslast.php?id=${teamId}`;
                if (isUpcoming) fetchUrl = `https://www.thesportsdb.com/api/v1/json/3/eventsnext.php?id=${teamId}`;

                const fixRes = await fetchWithRetry(fetchUrl);
                const fixData = await fixRes.json();
                const eventsArray = isUpcoming ? fixData.events : fixData.results;

                if (!eventsArray || eventsArray.length === 0) throw new Error("No matches found.");

                let match = eventsArray[0];
                let statusSuffix = "";

                if (t2) {
                    const h2hMatch = eventsArray.find(m =>
                        m.strHomeTeam.toLowerCase().includes(t2.toLowerCase()) ||
                        m.strAwayTeam.toLowerCase().includes(t2.toLowerCase())
                    );
                    if (h2hMatch) match = h2hMatch;
                    else statusSuffix = " (H2H not in recent logs)";
                }

                return JSON.stringify({
                    league: match.strLeague || "NBA",
                    isLive: false, // Free API doesn't support live ticking clocks
                    quarter: isUpcoming ? null : "Final",
                    quarterSeconds: 0,
                    teamA: { name: match.strHomeTeam, score: match.intHomeScore || "-" },
                    teamB: { name: match.strAwayTeam, score: match.intAwayScore || "-" },
                    status: (isUpcoming ? `Scheduled: ${match.dateEvent}` : "Final Score") + statusSuffix
                });
            }

            // ==========================================
            // 🏏 ROUTE 3: CRICKET (CRICAPI)
            // ==========================================
            if (sport.toLowerCase() === "cricket" || lowerQuery.includes("ipl") || lowerQuery.includes("india")) {
                const cricApiKey = process.env.CRICKET_API_KEY;
                if (!cricApiKey) throw new Error("CRICKET_API_KEY is missing");

                const response = await fetchWithRetry(`https://api.cricapi.com/v1/currentMatches?apikey=${cricApiKey}&offset=0`);
                const matchData = await response.json();

                if (!matchData.data || matchData.data.length === 0) throw new Error("No live cricket data found.");

                let targetMatch = null;
                let statusSuffix = "";

                if (t2) {
                    targetMatch = matchData.data.find(m => {
                        const name = m.name ? m.name.toLowerCase() : "";
                        return name.includes(t1.toLowerCase()) && name.includes(t2.toLowerCase());
                    });
                    if (!targetMatch) {
                        targetMatch = matchData.data.find(m => m.name && m.name.toLowerCase().includes(t1.toLowerCase()));
                        statusSuffix = " (Archived)";
                    }
                } else {
                    targetMatch = matchData.data.find(m => m.name && m.name.toLowerCase().includes(t1.toLowerCase())) || matchData.data[0];
                }

                if (!targetMatch) throw new Error("Team not playing currently.");

                const teamAName = (targetMatch.teams && targetMatch.teams[0]) ? targetMatch.teams[0] : "Team A";
                const teamBName = (targetMatch.teams && targetMatch.teams[1]) ? targetMatch.teams[1] : "Team B";

                let scoreA = "-", scoreB = "-", oversA = null, oversB = null, calculatedCrr = null;

                if (targetMatch.score && targetMatch.score.length > 0) {
                    const scoreObjA = targetMatch.score.find(s => s.inning && s.inning.includes(teamAName));
                    const scoreObjB = targetMatch.score.find(s => s.inning && s.inning.includes(teamBName));

                    if (scoreObjA) {
                        scoreA = `${scoreObjA.r}/${scoreObjA.w}`; oversA = `${scoreObjA.o}`;
                        const oversMath = Math.floor(scoreObjA.o) + (((scoreObjA.o * 10) % 10) / 6);
                        if (oversMath > 0) calculatedCrr = (scoreObjA.r / oversMath).toFixed(2);
                    }
                    if (scoreObjB) {
                        scoreB = `${scoreObjB.r}/${scoreObjB.w}`; oversB = `${scoreObjB.o}`;
                        const oversMath = Math.floor(scoreObjB.o) + (((scoreObjB.o * 10) % 10) / 6);
                        if (oversMath > 0) calculatedCrr = (scoreObjB.r / oversMath).toFixed(2);
                    }
                }

                const isLiveResponse = targetMatch.matchStarted && !targetMatch.matchEnded;
                if (isLiveResponse && scoreA === "-") { scoreA = "0/0"; oversA = "0.0"; }

                return JSON.stringify({
                    league: targetMatch.matchType ? targetMatch.matchType.toUpperCase() : "Cricket",
                    isLive: isLiveResponse, battingTeam: teamAName, battingScore: scoreA, battingOvers: oversA,
                    bowlingTeam: teamBName, bowlingScore: scoreB, bowlingOvers: oversB,
                    crr: calculatedCrr, rrr: null, status: (targetMatch.status || "Match Info") + statusSuffix
                });
            }

            throw new Error("No specific sport route hit.");

        } catch (error) {
            console.warn(`[Tool Warning] Sports API Failed: ${error.message}`);

            // 🛡️ DYNAMIC UI PRESERVER (Never breaks the React layout)
            const cleanQuery = query.replace(/(yesterday|today|tomorrow|match|score|update|live|next|last|game|schedule|gaming|fixtures|please|of)/gi, '').trim();
            const isFootballFb = sport.toLowerCase() === "football" || cleanQuery.toLowerCase().includes("ucl") || cleanQuery.toLowerCase().includes("city");
            const isBasketballFb = sport.toLowerCase() === "basketball" || cleanQuery.toLowerCase().includes("nba");

            let fb1 = cleanQuery || "Team 1", fb2 = "TBD Opponent";
            if (cleanQuery.toLowerCase().includes(' vs ')) {
                const parts = cleanQuery.split(/ vs /i);
                fb1 = parts[0].trim(); fb2 = parts[1].trim();
            }

            const fallbackDate = new Date();
            fallbackDate.setDate(fallbackDate.getDate() + 1);
            const formattedDate = fallbackDate.toLocaleDateString();

            if (isBasketballFb) {
                return JSON.stringify({
                    league: "NBA", isLive: false, quarter: null, quarterSeconds: 0,
                    teamA: { name: fb1, score: "-" }, teamB: { name: fb2, score: "-" },
                    status: "API Timeout / Rate Limit Reached"
                });
            } else if (isFootballFb) {
                return JSON.stringify({
                    league: "Football", isLive: false, matchSeconds: 0,
                    teamA: { name: fb1, score: "-" }, teamB: { name: fb2, score: "-" },
                    goals: [], status: "API Timeout / Rate Limit Reached"
                });
            } else {
                return JSON.stringify({
                    league: cleanQuery.toLowerCase().includes("ipl") ? "IPL" : "Cricket", isLive: false,
                    battingTeam: fb1, battingScore: "-", battingOvers: null,
                    bowlingTeam: fb2, bowlingScore: "-", bowlingOvers: null,
                    crr: null, rrr: null, status: "API Timeout / Rate Limit Reached"
                });
            }
        }
    },
    {
        name: "get_sports_data",
        description: "Fetches live scores, match results, and fixtures. MUST return exact JSON format.",
        schema: z.object({
            requestType: z.enum(["team_info", "fixtures", "scores", "tactics"]),
            sport: z.string(),
            query: z.string().describe("Extract ONLY pure team names. Format as 'Team A vs Team B' or 'Team A'. Remove words like 'yesterday', 'score', 'next'."),
        }),
    }
);

// 🌤️ TOOL 5: The Global Weather Radar
export const getWeatherTool = tool(
    async ({ location }) => {
        try {
            const geoRes = await fetchWithRetry(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`);
            const geoData = await geoRes.json();

            if (!geoData.results || geoData.results.length === 0) {
                return `||CARD:WEATHER:${location}:--:Unknown Location||`;
            }

            const { latitude, longitude, name } = geoData.results[0];
            const weatherRes = await fetchWithRetry(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
            const weatherData = await weatherRes.json();

            const temp = Math.round(weatherData.current_weather.temperature);
            const code = weatherData.current_weather.weathercode;

            let condition = "Clear";
            if (code >= 51 && code <= 69) condition = "Rain";
            else if (code >= 71 && code <= 79) condition = "Snow";
            else if (code >= 80 && code <= 99) condition = "Storm";
            else if (code >= 1 && code <= 3) condition = "Cloudy";

            return `||CARD:WEATHER:${name}:${temp}:${condition}||`;
        } catch (error) {
            console.error("[Tool Error] Weather API:", error.message);
            return `||CARD:WEATHER:${location}:--:Network Error||`;
        }
    },
    {
        name: "get_weather",
        description: "Fetches highly accurate, real-time weather data.",
        schema: z.object({ location: z.string().describe("The name of the city or region (e.g., 'London', 'Tokyo').") }),
    }
);