import { tool } from "@langchain/core/tools";
import { z } from "zod";
import Reminder from "../models/Reminder.js";
import User from "../models/User.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// ============================================================================
// 🧠 ENTERPRISE INFRASTRUCTURE
// ============================================================================
const apiCache = new Map();

const fetchWithCacheAndRetry = async (url, options = {}, ttlMs = 60000, retries = 2, timeoutMs = 8000) => {
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
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'VoxaServer/1.0',
                    ...options.headers
                },
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (response.status === 429) throw new Error("RATE_LIMIT");
            if (response.status === 451) throw new Error("GEO_BLOCKED_451");
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

            const data = await response.json();
            apiCache.set(cacheKey, { timestamp: Date.now(), data });
            return data;

        } catch (error) {
            clearTimeout(timeoutId);
            if (i === retries) {
                console.error(`[API Error] Failed fetching ${url}:`, error.message);
                throw error;
            }
            const backoffTime = 500 * Math.pow(2, i);
            console.warn(`[Retry ${i + 1}] Network issue, waiting ${backoffTime}ms...`);
            await new Promise(res => setTimeout(res, backoffTime));
        }
    }
};

const normalizeVoiceInput = (query) => {
    let clean = query.toLowerCase();
    const map = {
        "man city": "manchester city", "man utd": "manchester united",
        "spurs": "tottenham", "rcb": "royal challengers",
        "csk": "chennai super kings", "mi": "mumbai indians",
        "srh": "sunrisers", "kkr": "kolkata knight",
        "pbks": "punjab kings", "dc": "delhi capitals",
        "rr": "rajasthan royals", "lsg": "lucknow super",
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
                if (!userId) return "SYSTEM_ERROR: User ID missing.";
                await Reminder.create({ user: userId, task: task });
                return `Task saved successfully. YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:RECEIPT:Reminder Saved:${task}||`;
            } catch (error) {
                return `Database error. YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:RECEIPT:Failed to Save:Database Error||`;
            }
        },
        {
            name: "save_reminder",
            description: "Saves a reminder or to-do task.",
            schema: z.object({ task: z.string().describe("The specific task to remember.") })
        }
    );
};

export const getCryptoPriceTool = tool(
    async ({ coinId }) => {
        try {
            const normalizedCoin = coinId.toLowerCase().trim();
            const symbols = {
                "bitcoin": "btc-bitcoin", "btc": "btc-bitcoin",
                "ethereum": "eth-ethereum", "eth": "eth-ethereum",
                "solana": "sol-solana", "sol": "sol-solana",
                "dogecoin": "doge-dogecoin", "doge": "doge-dogecoin",
                "cardano": "ada-cardano", "ada": "ada-cardano",
                "xrp": "xrp-xrp", "ripple": "xrp-xrp",
                "binance coin": "bnb-binance-coin", "bnb": "bnb-binance-coin"
            };

            const paprikacoin = symbols[normalizedCoin] || "btc-bitcoin";
            const displayName = Object.keys(symbols).find(key => symbols[key] === paprikacoin) || normalizedCoin;

            const url = `https://api.coinpaprika.com/v1/tickers/${paprikacoin}`;
            const data = await fetchWithCacheAndRetry(url, {}, 60000);

            if (data && data.quotes && data.quotes.USD) {
                const price = parseFloat(data.quotes.USD.price).toFixed(2);
                const change = parseFloat(data.quotes.USD.percent_change_24h).toFixed(2);
                return `The price was fetched successfully. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:CRYPTO:${displayName}:${price}:${change}||`;
            }
            return `Data not found. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:CRYPTO:${displayName}:Not Found:0.00||`;
        } catch (error) {
            console.error("[Crypto API Error]:", error);
            return `System error occurred. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:CRYPTO:${coinId}:System Offline:0.00||`;
        }
    },
    {
        name: "get_crypto_price",
        description: "Fetches live cryptocurrency prices. You MUST include the ||CARD...|| string provided in the tool output in your final message.",
        schema: z.object({ coinId: z.string().describe("The full name of the coin, e.g., bitcoin, ethereum") })
    }
);

export const createSendEmailTool = (userId) => {
    return tool(
        async ({ to, subject, body }) => {
            try {
                if (!userId) return "SYSTEM_ERROR: User ID missing.";

                const user = await User.findById(userId);
                if (!user) return "SYSTEM_ERROR: User not found.";

                if (!user.gmailAccessToken && !user.gmailRefreshToken) {
                    return `Action failed. YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:RECEIPT:Email Failed:Please link your Google Account.||`;
                }

                // Nodemailer automatically handles token refresh using the refreshToken!
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        type: 'OAuth2',
                        user: user.email,
                        clientId: process.env.GOOGLE_CLIENT_ID,
                        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                        refreshToken: user.gmailRefreshToken,
                        accessToken: user.gmailAccessToken
                    }
                });

                await transporter.sendMail({
                    from: `"${user.name}" <${user.email}>`,
                    to,
                    subject,
                    text: body
                });

                return `Email sent successfully. YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:RECEIPT:Email Sent:${to}||`;
            } catch (error) {
                console.error("[Email Error]:", error);
                return `Email failed. YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:RECEIPT:Email Failed:Token Expired or Network Error||`;
            }
        },
        {
            name: "send_email",
            description: "Sends an email from the user's Gmail account to a specified recipient address.",
            schema: z.object({ to: z.string(), subject: z.string(), body: z.string() })
        }
    );
};

export const getWeatherTool = tool(
    async ({ location }) => {
        try {
            const safeLoc = encodeURIComponent(location.trim());
            const url = `https://wttr.in/${safeLoc}?format=j1`;
            const data = await fetchWithCacheAndRetry(url, {}, 300000);

            if (data && data.current_condition && data.current_condition[0]) {
                const temp = data.current_condition[0].temp_C;
                const conditionDesc = data.current_condition[0].weatherDesc[0].value.toLowerCase();

                let condition = "Clear";
                if (conditionDesc.includes("rain") || conditionDesc.includes("drizzle") || conditionDesc.includes("shower")) condition = "Rain";
                else if (conditionDesc.includes("cloud") || conditionDesc.includes("overcast")) condition = "Cloudy";
                else if (conditionDesc.includes("snow") || conditionDesc.includes("ice")) condition = "Snow";

                return `Weather fetched successfully. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:WEATHER:${location}:${temp}:${condition}||`;
            }
            return `Location unknown. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:WEATHER:${location}:--:Unknown||`;
        } catch (error) {
            console.error("[Weather Error]:", error);
            return `API error. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:WEATHER:${location}:--:Offline||`;
        }
    },
    {
        name: "get_weather",
        description: "Fetches weather data. You MUST include the ||CARD...|| string provided in the tool output in your final message.",
        schema: z.object({ location: z.string().describe("The city to check.") })
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
            const fullContextCheck = `${sport} ${voiceNormalizedQuery}`.toLowerCase();
            const cleanQuery = voiceNormalizedQuery.replace(/(yesterday|today|tomorrow|match|score|update|live|next|last|game|schedule|gaming|fixtures|please|of|the|for)/gi, '').trim();

            let t1 = cleanQuery;
            let t2 = null;
            if (cleanQuery.includes(' vs ')) {
                const parts = cleanQuery.split(/ vs /i);
                t1 = parts[0].trim();
                t2 = parts[1].trim();
            }

            // ⚽ FOOTBALL
            if (fullContextCheck.includes("football") || fullContextCheck.includes("soccer") || fullContextCheck.includes("epl") || fullContextCheck.includes("ucl") || fullContextCheck.includes("madrid") || fullContextCheck.includes("city") || fullContextCheck.includes("united") || fullContextCheck.includes("arsenal") || fullContextCheck.includes("chelsea") || fullContextCheck.includes("liverpool")) {
                const apiKey = process.env.FOOTBALL_DATA_TOKEN;
                if (!apiKey) throw new Error("FOOTBALL_DATA_TOKEN missing");

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

                const fixData = await fetchWithCacheAndRetry(`https://api.football-data.org/v4/teams/${teamId}/matches`, { headers: { 'X-Auth-Token': apiKey } }, 30000);
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

                const cardData = JSON.stringify({
                    league: match.competition.name || "Football",
                    isLive: isLiveResponse,
                    matchSeconds: isLiveResponse ? 2700 : (isFinishedResponse ? 5400 : 0),
                    teamA: { name: match.homeTeam.name, score: match.score?.fullTime?.home ?? "-" },
                    teamB: { name: match.awayTeam.name, score: match.score?.fullTime?.away ?? "-" },
                    status: isLiveResponse ? "Match Live" : (isFinishedResponse ? "Full Time" : "Scheduled: " + new Date(match.utcDate).toLocaleDateString())
                });
                return `Sports data fetched. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:SPORTS:${cardData}||`;
            }

            // 🏀 BASKETBALL
            else if (fullContextCheck.includes("basketball") || fullContextCheck.includes("nba") || fullContextCheck.includes("lakers") || fullContextCheck.includes("warriors")) {
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
                    match = isUpcoming ? fixData.events?.[0] : fixData.results?.[0];
                }

                if (!match) throw new Error("No matches found.");

                const cardData = JSON.stringify({
                    league: match.strLeague || "NBA", isLive: false,
                    teamA: { name: match.strHomeTeam, score: match.intHomeScore || "-" },
                    teamB: { name: match.strAwayTeam, score: match.intAwayScore || "-" },
                    status: isUpcoming ? `Scheduled: ${match.dateEvent}` : "Final Score"
                });
                return `Sports data fetched. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:SPORTS:${cardData}||`;
            }

            // 🏏 CRICKET
            else if (fullContextCheck.includes("cricket") || fullContextCheck.includes("ipl") || fullContextCheck.includes("t20") || fullContextCheck.includes("rcb") || fullContextCheck.includes("csk") || fullContextCheck.includes("mi") || fullContextCheck.includes("india")) {
                const cricApiKey = process.env.CRICKET_API_KEY;
                if (!cricApiKey) throw new Error("CRICKET_API_KEY missing");

                const matchData = await fetchWithCacheAndRetry(`https://api.cricapi.com/v1/currentMatches?apikey=${cricApiKey}&offset=0`, {}, 30000);
                if (!matchData.data || matchData.data.length === 0) throw new Error("No live cricket data.");

                t1 = t1 || "match";
                let targetMatch = null;

                if (t2) {
                    targetMatch = matchData.data.find(m => m.name?.toLowerCase().includes(t1) && m.name?.toLowerCase().includes(t2));
                } else if (t1 !== "match") {
                    targetMatch = matchData.data.find(m => m.name?.toLowerCase().includes(t1));
                }

                if (!targetMatch) targetMatch = matchData.data[0];
                if (!targetMatch) throw new Error("No active cricket matches found.");

                const teamAName = targetMatch.teams?.[0] || "Team A";
                const teamBName = targetMatch.teams?.[1] || "Team B";
                let scoreA = "-", scoreB = "-", oversA = null, crr = null;

                if (targetMatch.score?.length > 0) {
                    const sA = targetMatch.score.find(s => s.inning?.includes(teamAName));
                    const sB = targetMatch.score.find(s => s.inning?.includes(teamBName));
                    if (sA) {
                        scoreA = `${sA.r}/${sA.w}`;
                        oversA = sA.o;
                        const oMath = Math.floor(sA.o) + (((sA.o * 10) % 10) / 6);
                        if (oMath > 0) crr = (sA.r / oMath).toFixed(2);
                    }
                    if (sB) scoreB = `${sB.r}/${sB.w}`;
                }
                const isLiveResponse = targetMatch.matchStarted && !targetMatch.matchEnded;

                const cardData = JSON.stringify({
                    league: targetMatch.matchType?.toUpperCase() || "Cricket",
                    isLive: isLiveResponse, battingTeam: teamAName, battingScore: scoreA, battingOvers: oversA,
                    bowlingTeam: teamBName, bowlingScore: scoreB, crr: crr, status: targetMatch.status || "Match Info"
                });
                return `Sports data fetched. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:SPORTS:${cardData}||`;
            }

            throw new Error("Route not found");
        } catch (error) {
            console.error("[Sports Data Error]:", error.message);
            const errorData = JSON.stringify({
                league: "Sports Data", isLive: false,
                teamA: { name: "System", score: "-" }, teamB: { name: "Error", score: "-" },
                status: error.message.includes("CRICKET_API_KEY missing") ? "API Key Missing" : "Data temporarily unavailable"
            });
            return `API Error. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:SPORTS:${errorData}||`;
        }
    },
    {
        name: "get_sports_data",
        description: "Fetches live scores and results. You MUST include the ||CARD...|| string provided in the tool output in your final message.",
        schema: z.object({
            requestType: z.enum(["team_info", "fixtures", "scores", "tactics"]),
            sport: z.string(),
            query: z.string()
        }),
    }
);