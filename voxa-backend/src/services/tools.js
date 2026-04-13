import { tool } from "@langchain/core/tools";
import { z } from "zod";
import Reminder from "../models/Reminder.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// ============================================================================
// 🧠 ENTERPRISE INFRASTRUCTURE 
// ============================================================================

const apiCache = new Map();

const fetchWithCacheAndRetry = async (url, options = {}, ttlMs = 60000, retries = 1, timeoutMs = 6000) => {
    const cacheKey = url;
    if (apiCache.has(cacheKey)) {
        const cached = apiCache.get(cacheKey);
        if (Date.now() - cached.timestamp < ttlMs) {
            console.log(`⚡ [Cache Hit] 0ms latency for: ${url}`);
            return cached.data;
        }
        apiCache.delete(cacheKey);
    }

    for (let i = 0; i <= retries; i++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const response = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(timeoutId);
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

            const data = await response.json();
            apiCache.set(cacheKey, { timestamp: Date.now(), data });
            return data;

        } catch (error) {
            clearTimeout(timeoutId);
            if (i === retries) throw error;
            await new Promise(res => setTimeout(res, 500));
        }
    }
};

const normalizeVoiceInput = (query) => {
    let clean = query.toLowerCase();
    const map = {
        "man city": "manchester city",
        "man utd": "manchester united",
        "spurs": "tottenham",
        "rcb": "royal challengers",
        "csk": "chennai super kings",
        "mi": "mumbai indians",
        "srh": "sunrisers",
        "kkr": "kolkata knight",
        "pbks": "punjab kings",
        "dc": "delhi capitals",
        "rr": "rajasthan royals",
        "lsg": "lucknow super",
        "gt": "gujarat titans"
    };
    for (const [slang, strict] of Object.entries(map)) {
        clean = clean.replace(new RegExp(`\\b${slang}\\b`, 'g'), strict);
    }
    return clean;
};

// ============================================================================
// 🛠️ STANDARD TOOLS 
// ============================================================================

export const createReminderTool = (userId) => {
    return tool(
        async ({ task }) => {
            try {
                if (!userId) return "Error: User ID is missing.";
                await Reminder.create({ user: userId, task: task });
                return `Successfully saved reminder: "${task}".`;
            } catch (error) {
                return "Error: Failed to save reminder.";
            }
        },
        { name: "save_reminder", description: "Saves a reminder.", schema: z.object({ task: z.string() }) }
    );
};

export const getCryptoPriceTool = tool(
    async ({ coinId }) => {
        try {
            const normalizedCoin = coinId.toLowerCase().trim();
            const data = await fetchWithCacheAndRetry(`https://api.coingecko.com/api/v3/simple/price?ids=${normalizedCoin}&vs_currencies=usd`, {}, 120000);
            if (data[normalizedCoin] && data[normalizedCoin].usd) return `Live price of ${normalizedCoin} is $${data[normalizedCoin].usd} USD.`;
            return `I could not find the live price for ${normalizedCoin}.`;
        } catch (error) {
            return "Error: Failed to connect to crypto API.";
        }
    },
    { name: "get_crypto_price", description: "Fetches live crypto prices.", schema: z.object({ coinId: z.string() }) }
);

export const sendEmailTool = tool(
    async ({ to, subject, body }) => {
        try {
            if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return "Error: Credentials missing.";
            const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } });
            await transporter.sendMail({ from: `"Voxa AI" <${process.env.EMAIL_USER}>`, to, subject, text: body });
            return `Successfully sent email to ${to}.`;
        } catch (error) {
            return "Error: Failed to send email.";
        }
    },
    {
        name: "send_email",
        description: "Sends an email.",
        schema: z.object({ to: z.string().describe("The exact, valid email address."), subject: z.string(), body: z.string() })
    }
);

// ============================================================================
// 🌍 TOOL 4: The Global Sports Hub
// ============================================================================

export const getSportsDataTool = tool(
    async ({ requestType, sport, query }) => {
        try {
            const voiceNormalizedQuery = normalizeVoiceInput(query);
            const isUpcoming = requestType === "fixtures" || voiceNormalizedQuery.includes("upcoming") || voiceNormalizedQuery.includes("tomorrow") || voiceNormalizedQuery.includes("next");
            const isFinished = requestType === "scores" || voiceNormalizedQuery.includes("finished") || voiceNormalizedQuery.includes("last") || voiceNormalizedQuery.includes("yesterday");

            const cleanQuery = voiceNormalizedQuery.replace(/(yesterday|today|tomorrow|match|score|update|live|next|last|game|schedule|gaming|fixtures|please|of)/gi, '').trim();
            let t1 = cleanQuery, t2 = null;
            if (cleanQuery.includes(' vs ')) {
                const parts = cleanQuery.split(/ vs /i);
                t1 = parts[0].trim(); t2 = parts[1].trim();
            }

            // ==========================================
            // ⚽ ROUTE 1: FOOTBALL (DIRECT API-SPORTS)
            // ==========================================
            if (sport.toLowerCase() === "football" || cleanQuery.includes("epl") || cleanQuery.includes("ucl") || cleanQuery.includes("madrid") || cleanQuery.includes("city") || cleanQuery.includes("united") || cleanQuery.includes("arsenal") || cleanQuery.includes("chelsea")) {

                const apiKey = process.env.FOOTBALL_API_KEY;
                if (!apiKey) throw new Error("FOOTBALL_API_KEY missing from .env");
                const headers = { 'x-apisports-key': apiKey, 'Content-Type': 'application/json' };

                const POPULAR_TEAMS = {
                    "manchester city": 50, "manchester united": 33, "chelsea": 49,
                    "arsenal": 42, "liverpool": 40, "tottenham": 47,
                    "real madrid": 54, "barcelona": 52, "atletico madrid": 53,
                    "bayern munich": 157, "borussia dortmund": 165,
                    "psg": 85, "juventus": 496, "ac milan": 489, "inter": 505
                };

                let teamId = POPULAR_TEAMS[t1];

                if (!teamId) {
                    const teamData = await fetchWithCacheAndRetry(`https://v3.football.api-sports.io/teams?search=${encodeURIComponent(t1)}`, { headers }, 86400000);

                    // 🚀 ERROR INTERCEPTOR 
                    if (teamData.errors && Object.keys(teamData.errors).length > 0) {
                        throw new Error(`API-Sports Error: ${JSON.stringify(teamData.errors)}`);
                    }

                    if (!teamData.response || teamData.response.length === 0) throw new Error(`Team not found`);
                    teamId = teamData.response[0].team.id;
                }

                let fetchUrl = `https://v3.football.api-sports.io/fixtures?team=${teamId}&last=15`;
                if (isUpcoming) fetchUrl = `https://v3.football.api-sports.io/fixtures?team=${teamId}&next=15`;
                else if (!isFinished && voiceNormalizedQuery.includes("live")) fetchUrl = `https://v3.football.api-sports.io/fixtures?team=${teamId}&live=all`;

                const fixData = await fetchWithCacheAndRetry(fetchUrl, { headers }, 30000);

                // 🚀 ERROR INTERCEPTOR
                if (fixData.errors && Object.keys(fixData.errors).length > 0) {
                    throw new Error(`API-Sports Error: ${JSON.stringify(fixData.errors)}`);
                }

                let eventsArray = fixData.response;

                if ((!eventsArray || eventsArray.length === 0) && !isUpcoming && !isFinished) {
                    const fbData = await fetchWithCacheAndRetry(`https://v3.football.api-sports.io/fixtures?team=${teamId}&last=10`, { headers }, 60000);

                    if (fbData.errors && Object.keys(fbData.errors).length > 0) {
                        throw new Error(`API-Sports Error: ${JSON.stringify(fbData.errors)}`);
                    }

                    eventsArray = fbData.response;
                }

                if (!eventsArray || eventsArray.length === 0) throw new Error("No fixtures found.");

                let match = eventsArray[0];
                if (t2) {
                    const h2hMatch = eventsArray.find(m => m.teams.home.name.toLowerCase().includes(t2) || m.teams.away.name.toLowerCase().includes(t2));
                    if (h2hMatch) match = h2hMatch;
                    else throw new Error("H2H_NOT_FOUND");
                }

                const isLiveResponse = ["1H", "2H", "HT", "LIVE", "ET", "PEN"].includes(match.fixture.status.short);
                const isFinishedResponse = ["FT", "AET", "PEN"].includes(match.fixture.status.short);

                const formattedGoals = (match.events || []).filter(e => e.type === "Goal").map(g => ({
                    team: g.team.name, scorer: g.player.name, minute: g.time.elapsed
                }));

                return JSON.stringify({
                    league: match.league.name || "Football", isLive: isLiveResponse,
                    matchSeconds: isLiveResponse ? (match.fixture.status.elapsed * 60) : (isFinishedResponse ? 5400 : 0),
                    teamA: { name: match.teams.home.name, score: match.goals.home !== null ? match.goals.home : "-" },
                    teamB: { name: match.teams.away.name, score: match.goals.away !== null ? match.goals.away : "-" },
                    goals: formattedGoals,
                    status: (isLiveResponse ? "Match Live" : (isUpcoming ? `Scheduled: ${new Date(match.fixture.date).toLocaleDateString()}` : "Full Time"))
                });
            }

            // ==========================================
            // 🏀 ROUTE 2: BASKETBALL (TheSportsDB)
            // ==========================================
            if (sport.toLowerCase() === "basketball" || cleanQuery.includes("nba") || cleanQuery.includes("lakers") || cleanQuery.includes("warriors")) {
                const teamData = await fetchWithCacheAndRetry(`https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(t1)}`, {}, 86400000);
                if (!teamData.teams) throw new Error(`Basketball Team not found`);

                const teamId = teamData.teams[0].idTeam;
                let fetchUrl = `https://www.thesportsdb.com/api/v1/json/3/eventslast.php?id=${teamId}`;
                if (isUpcoming) fetchUrl = `https://www.thesportsdb.com/api/v1/json/3/eventsnext.php?id=${teamId}`;

                const fixData = await fetchWithCacheAndRetry(fetchUrl, {}, 60000);
                const eventsArray = isUpcoming ? fixData.events : fixData.results;

                if (!eventsArray || eventsArray.length === 0) throw new Error("No matches found.");

                let match = eventsArray[0];
                if (t2) {
                    const h2hMatch = eventsArray.find(m => m.strHomeTeam.toLowerCase().includes(t2) || m.strAwayTeam.toLowerCase().includes(t2));
                    if (h2hMatch) match = h2hMatch;
                    else throw new Error("H2H_NOT_FOUND");
                }

                return JSON.stringify({
                    league: match.strLeague || "NBA", isLive: false, quarter: isUpcoming ? null : "Final", quarterSeconds: 0,
                    teamA: { name: match.strHomeTeam, score: match.intHomeScore || "-" },
                    teamB: { name: match.strAwayTeam, score: match.intAwayScore || "-" },
                    status: (isUpcoming ? `Scheduled: ${match.dateEvent}` : "Final Score")
                });
            }

            // ==========================================
            // 🏏 ROUTE 3: CRICKET (CRICAPI)
            // ==========================================
            if (sport.toLowerCase() === "cricket" || cleanQuery.includes("ipl") || cleanQuery.includes("india") || cleanQuery.includes("csk") || cleanQuery.includes("rcb") || cleanQuery.includes("super kings") || cleanQuery.includes("challengers")) {
                const cricApiKey = process.env.CRICKET_API_KEY;
                if (!cricApiKey) throw new Error("CRICKET_API_KEY missing");

                const matchData = await fetchWithCacheAndRetry(`https://api.cricapi.com/v1/currentMatches?apikey=${cricApiKey}&offset=0`, {}, 30000);
                if (!matchData.data || matchData.data.length === 0) throw new Error("No live cricket data found.");

                let targetMatch = null;

                if (t2) {
                    targetMatch = matchData.data.find(m => m.name && m.name.toLowerCase().includes(t1) && m.name.toLowerCase().includes(t2));
                    if (!targetMatch) {
                        throw new Error("H2H_NOT_FOUND");
                    }
                } else {
                    targetMatch = matchData.data.find(m => m.name && m.name.toLowerCase().includes(t1)) || matchData.data[0];
                }

                if (!targetMatch) throw new Error("Team not playing currently.");

                const teamAName = (targetMatch.teams && targetMatch.teams[0]) ? targetMatch.teams[0] : "Team A";
                const teamBName = (targetMatch.teams && targetMatch.teams[1]) ? targetMatch.teams[1] : "Team B";

                let scoreA = "-", scoreB = "-", oversA = null, oversB = null, calculatedCrr = null;

                if (targetMatch.score && targetMatch.score.length > 0) {
                    const sA = targetMatch.score.find(s => s.inning && s.inning.includes(teamAName));
                    const sB = targetMatch.score.find(s => s.inning && s.inning.includes(teamBName));

                    if (sA) {
                        scoreA = `${sA.r}/${sA.w}`; oversA = `${sA.o}`;
                        const oMath = Math.floor(sA.o) + (((sA.o * 10) % 10) / 6);
                        if (oMath > 0) calculatedCrr = (sA.r / oMath).toFixed(2);
                    }
                    if (sB) {
                        scoreB = `${sB.r}/${sB.w}`; oversB = `${sB.o}`;
                        const oMath = Math.floor(sB.o) + (((sB.o * 10) % 10) / 6);
                        if (oMath > 0) calculatedCrr = (sB.r / oMath).toFixed(2);
                    }
                }

                const isLiveResponse = targetMatch.matchStarted && !targetMatch.matchEnded;
                if (isLiveResponse && scoreA === "-") { scoreA = "0/0"; oversA = "0.0"; }

                return JSON.stringify({
                    league: targetMatch.matchType ? targetMatch.matchType.toUpperCase() : "Cricket",
                    isLive: isLiveResponse, battingTeam: teamAName, battingScore: scoreA, battingOvers: oversA,
                    bowlingTeam: teamBName, bowlingScore: scoreB, bowlingOvers: oversB,
                    crr: calculatedCrr, rrr: null, status: targetMatch.status || "Match Info"
                });
            }

            throw new Error("No specific sport route hit.");

        } catch (error) {
            console.warn(`[Tool Warning] API/Match Failed: ${error.message}`);

            const voiceNormalizedQuery = normalizeVoiceInput(query);
            const cleanQ = voiceNormalizedQuery.replace(/(yesterday|today|tomorrow|match|score|update|live|next|last|game|schedule|gaming|fixtures|please|of)/gi, '').trim();

            const isFB = sport.toLowerCase() === "football" || cleanQ.toLowerCase().includes("ucl") || cleanQ.toLowerCase().includes("city");
            const isBB = sport.toLowerCase() === "basketball" || cleanQ.toLowerCase().includes("nba");

            let fb1 = cleanQ || "Team 1", fb2 = "TBD Opponent";
            if (cleanQ.includes(' vs ')) {
                const p = cleanQ.split(/ vs /i); fb1 = p[0].trim(); fb2 = p[1].trim();
            }

            const toTitleCase = (str) => str.replace(/\b\w/g, l => l.toUpperCase());
            fb1 = toTitleCase(fb1);
            if (fb2 !== "TBD Opponent") fb2 = toTitleCase(fb2);

            let failReason = "Match Data Unavailable";
            if (error.message === "H2H_NOT_FOUND") failReason = "Match not in recent API window";
            if (error.message === "DUMMY_DATA") failReason = "Schedule Locked in Free Tier";
            if (error.message.includes("API-Sports Error")) failReason = "API Access Issue (Check Logs)";

            if (isBB) return JSON.stringify({ league: "NBA", isLive: false, quarter: null, quarterSeconds: 0, teamA: { name: fb1, score: "-" }, teamB: { name: fb2, score: "-" }, status: failReason });
            if (isFB) return JSON.stringify({ league: "Football", isLive: false, matchSeconds: 0, teamA: { name: fb1, score: "-" }, teamB: { name: fb2, score: "-" }, goals: [], status: failReason });

            return JSON.stringify({ league: cleanQ.toLowerCase().includes("ipl") ? "IPL" : "Cricket", isLive: false, battingTeam: fb1, battingScore: "-", battingOvers: null, bowlingTeam: fb2, bowlingScore: "-", bowlingOvers: null, crr: null, rrr: null, status: failReason });
        }
    },
    {
        name: "get_sports_data",
        description: "Fetches live scores, match results, and fixtures. MUST return exact JSON format.",
        schema: z.object({
            requestType: z.enum(["team_info", "fixtures", "scores", "tactics"]),
            sport: z.string(),
            query: z.string().describe("Extract ONLY pure team names. Remove words like 'yesterday', 'score'."),
        }),
    }
);

export const getWeatherTool = tool(
    async ({ location }) => {
        try {
            const geoData = await fetchWithCacheAndRetry(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`, {}, 86400000);
            if (!geoData.results || geoData.results.length === 0) return `||CARD:WEATHER:${location}:--:Unknown Location||`;
            const { latitude, longitude, name } = geoData.results[0];
            const weatherData = await fetchWithCacheAndRetry(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`, {}, 300000);
            const temp = Math.round(weatherData.current_weather.temperature);
            const code = weatherData.current_weather.weathercode;
            let condition = "Clear";
            if (code >= 51 && code <= 69) condition = "Rain";
            else if (code >= 71 && code <= 79) condition = "Snow";
            else if (code >= 80 && code <= 99) condition = "Storm";
            else if (code >= 1 && code <= 3) condition = "Cloudy";
            return `||CARD:WEATHER:${name}:${temp}:${condition}||`;
        } catch (error) {
            return `||CARD:WEATHER:${location}:--:Network Error||`;
        }
    },
    {
        name: "get_weather",
        description: "Fetches highly accurate, real-time weather data.",
        schema: z.object({ location: z.string() }),
    }
);