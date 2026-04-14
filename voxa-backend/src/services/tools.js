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

            if (response.status === 429) throw new Error("RATE_LIMIT");
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
            // Upgraded API call to include 24h change for the premium UI
            const data = await fetchWithCacheAndRetry(`https://api.coingecko.com/api/v3/simple/price?ids=${normalizedCoin}&vs_currencies=usd&include_24hr_change=true`, {}, 120000);

            if (data[normalizedCoin] && data[normalizedCoin].usd) {
                const price = data[normalizedCoin].usd;
                const change = data[normalizedCoin].usd_24h_change?.toFixed(2) || "0.00";

                // Formatted Output for the React Frontend to intercept
                return `||CARD:CRYPTO:${normalizedCoin}:${price}:${change}||`;
            }
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

            const cleanQuery = voiceNormalizedQuery.replace(/(yesterday|today|tomorrow|match|score|update|live|next|last|game|schedule|gaming|fixtures|please|of)/gi, '').trim();
            let t1 = cleanQuery, t2 = null;
            if (cleanQuery.includes(' vs ')) {
                const parts = cleanQuery.split(/ vs /i);
                t1 = parts[0].trim(); t2 = parts[1].trim();
            }

            // ==========================================
            // ⚽ ROUTE 1: FOOTBALL (Football-Data.org)
            // ==========================================
            if (sport.toLowerCase() === "football" || cleanQuery.includes("epl") || cleanQuery.includes("ucl") || cleanQuery.includes("madrid") || cleanQuery.includes("city") || cleanQuery.includes("united")) {

                const apiKey = process.env.FOOTBALL_DATA_TOKEN;
                if (!apiKey) throw new Error("FOOTBALL_DATA_TOKEN missing");
                const headers = { 'X-Auth-Token': apiKey };

                const POPULAR_TEAMS = {
                    "arsenal": 57, "aston villa": 58, "chelsea": 61, "everton": 62,
                    "liverpool": 64, "manchester city": 65, "manchester united": 66,
                    "newcastle": 67, "tottenham": 73, "real madrid": 86,
                    "barcelona": 81, "atletico madrid": 78, "bayern munich": 5,
                    "borussia dortmund": 4, "bayer leverkusen": 3, "psg": 524,
                    "juventus": 109, "ac milan": 98, "inter": 108, "napoli": 113, "roma": 100
                };

                let teamId = POPULAR_TEAMS[t1];
                if (!teamId) throw new Error("TEAM_NOT_IN_LOCAL_DB");

                const fixData = await fetchWithCacheAndRetry(`https://api.football-data.org/v4/teams/${teamId}/matches`, { headers }, 30000);
                const allMatches = fixData.matches || [];
                if (allMatches.length === 0) throw new Error("No fixtures found.");

                let match = null;
                const now = new Date().getTime();

                if (t2) {
                    const h2hMatches = allMatches.filter(m => m.homeTeam.name.toLowerCase().includes(t2) || m.awayTeam.name.toLowerCase().includes(t2));
                    if (h2hMatches.length === 0) throw new Error("H2H_NOT_FOUND");
                    match = isUpcoming
                        ? h2hMatches.filter(m => new Date(m.utcDate).getTime() > now).sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())[0]
                        : h2hMatches.filter(m => new Date(m.utcDate).getTime() <= now).sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime())[0];
                } else {
                    match = isUpcoming
                        ? allMatches.filter(m => new Date(m.utcDate).getTime() > now).sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())[0]
                        : allMatches.filter(m => new Date(m.utcDate).getTime() <= now).sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime())[0];
                }

                if (!match) throw new Error("No match found.");

                const isLiveResponse = ["IN_PLAY", "PAUSED"].includes(match.status);
                const isFinishedResponse = match.status === "FINISHED";

                return JSON.stringify({
                    league: match.competition.name || "Football",
                    isLive: isLiveResponse,
                    matchSeconds: isLiveResponse ? 2700 : (isFinishedResponse ? 5400 : 0),
                    teamA: { name: match.homeTeam.name, score: match.score?.fullTime?.home ?? "-" },
                    teamB: { name: match.awayTeam.name, score: match.score?.fullTime?.away ?? "-" },
                    status: isLiveResponse ? "Match Live" : (isFinishedResponse ? "Full Time" : "Scheduled: " + new Date(match.utcDate).toLocaleDateString())
                });
            }

            // ==========================================
            // 🏀 ROUTE 2: BASKETBALL (TheSportsDB)
            // ==========================================
            if (sport.toLowerCase() === "basketball" || cleanQuery.includes("nba")) {
                let match = null;
                if (t2) {
                    const q1 = `${t1.replace(/\s+/g, '_')}_vs_${t2.replace(/\s+/g, '_')}`;
                    let res = await fetchWithCacheAndRetry(`https://www.thesportsdb.com/api/v1/json/3/searchevents.php?e=${encodeURIComponent(q1)}`, {}, 60000);
                    if (!res.event) {
                        const q2 = `${t2.replace(/\s+/g, '_')}_vs_${t1.replace(/\s+/g, '_')}`;
                        res = await fetchWithCacheAndRetry(`https://www.thesportsdb.com/api/v1/json/3/searchevents.php?e=${encodeURIComponent(q2)}`, {}, 60000);
                    }
                    const allMatches = res.event || [];
                    const now = Date.now();
                    match = isUpcoming
                        ? allMatches.filter(m => new Date(m.dateEvent).getTime() >= now).sort((a, b) => new Date(a.dateEvent).getTime() - new Date(b.dateEvent).getTime())[0]
                        : allMatches.filter(m => new Date(m.dateEvent).getTime() <= now).sort((a, b) => new Date(b.dateEvent).getTime() - new Date(a.dateEvent).getTime())[0];
                } else {
                    const teamData = await fetchWithCacheAndRetry(`https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(t1)}`, {}, 86400000);
                    if (!teamData.teams) throw new Error(`Basketball Team not found`);
                    const teamId = teamData.teams[0].idTeam;
                    let fetchUrl = isUpcoming ? `https://www.thesportsdb.com/api/v1/json/3/eventsnext.php?id=${teamId}` : `https://www.thesportsdb.com/api/v1/json/3/eventslast.php?id=${teamId}`;
                    const fixData = await fetchWithCacheAndRetry(fetchUrl, {}, 60000);
                    const eventsArray = isUpcoming ? fixData.events : fixData.results;
                    match = eventsArray?.[0];
                }

                if (!match) throw new Error("No matches found.");

                return JSON.stringify({
                    league: match.strLeague || "NBA", isLive: false,
                    teamA: { name: match.strHomeTeam, score: match.intHomeScore || "-" },
                    teamB: { name: match.strAwayTeam, score: match.intAwayScore || "-" },
                    status: isUpcoming ? `Scheduled: ${match.dateEvent}` : "Final Score"
                });
            }

            // ==========================================
            // 🏏 ROUTE 3: CRICKET (CRICAPI)
            // ==========================================
            if (sport.toLowerCase() === "cricket" || cleanQuery.includes("ipl")) {
                const cricApiKey = process.env.CRICKET_API_KEY;
                if (!cricApiKey) throw new Error("CRICKET_API_KEY missing");
                const matchData = await fetchWithCacheAndRetry(`https://api.cricapi.com/v1/currentMatches?apikey=${cricApiKey}&offset=0`, {}, 30000);
                if (!matchData.data || matchData.data.length === 0) throw new Error("No live cricket data.");
                let targetMatch = t2 ? matchData.data.find(m => m.name?.toLowerCase().includes(t1) && m.name?.toLowerCase().includes(t2)) : matchData.data.find(m => m.name?.toLowerCase().includes(t1)) || matchData.data[0];
                if (!targetMatch) throw new Error("Team not playing.");
                const teamAName = targetMatch.teams?.[0] || "Team A";
                const teamBName = targetMatch.teams?.[1] || "Team B";
                let scoreA = "-", scoreB = "-", oversA = null, crr = null;
                if (targetMatch.score?.length > 0) {
                    const sA = targetMatch.score.find(s => s.inning?.includes(teamAName));
                    const sB = targetMatch.score.find(s => s.inning?.includes(teamBName));
                    if (sA) { scoreA = `${sA.r}/${sA.w}`; oversA = sA.o; const oMath = Math.floor(sA.o) + (((sA.o * 10) % 10) / 6); if (oMath > 0) crr = (sA.r / oMath).toFixed(2); }
                    if (sB) { scoreB = `${sB.r}/${sB.w}`; }
                }
                const isLiveResponse = targetMatch.matchStarted && !targetMatch.matchEnded;
                return JSON.stringify({
                    league: targetMatch.matchType?.toUpperCase() || "Cricket",
                    isLive: isLiveResponse, battingTeam: teamAName, battingScore: scoreA, battingOvers: oversA,
                    bowlingTeam: teamBName, bowlingScore: scoreB, crr: crr, status: targetMatch.status || "Match Info"
                });
            }
            throw new Error("Route not found");
        } catch (error) {
            return JSON.stringify({ status: error.message, error: true });
        }
    },
    {
        name: "get_sports_data",
        description: "Fetches live scores and events.",
        schema: z.object({ requestType: z.enum(["team_info", "fixtures", "scores", "tactics"]), sport: z.string(), query: z.string() }),
    }
);

export const getWeatherTool = tool(
    async ({ location }) => {
        try {
            const geoData = await fetchWithCacheAndRetry(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`, {}, 86400000);
            if (!geoData.results?.length) return `||CARD:WEATHER:${location}:--:Unknown Location||`;
            const { latitude, longitude, name } = geoData.results[0];
            const weatherData = await fetchWithCacheAndRetry(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`, {}, 300000);
            const temp = Math.round(weatherData.current_weather.temperature);
            const code = weatherData.current_weather.weathercode;
            let condition = "Clear";
            if (code >= 51 && code <= 69) condition = "Rain";
            else if (code >= 1 && code <= 3) condition = "Cloudy";
            return `||CARD:WEATHER:${name}:${temp}:${condition}||`;
        } catch (error) { return `||CARD:WEATHER:${location}:--:Network Error||`; }
    },
    { name: "get_weather", description: "Fetches weather data.", schema: z.object({ location: z.string() }) }
);