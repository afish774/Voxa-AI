import { tool } from "@langchain/core/tools";
import { z } from "zod";
import Reminder from "../models/Reminder.js";
import User from "../models/User.js";
import { google } from "googleapis"; // 🚀 Replaced nodemailer with official Google API
import dotenv from "dotenv";

dotenv.config();

// ============================================================================
// 🧠 ENTERPRISE INFRASTRUCTURE (Untouched)
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
            // 🛠️ SURGICAL FIX: Evict oldest entries to prevent unbounded memory growth (OOM on Render)
            if (apiCache.size > 200) {
                const oldestKey = apiCache.keys().next().value;
                apiCache.delete(oldestKey);
            }
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

// 🚀 UPGRADED: Swapped Nodemailer for the official Google API REST client
export const createSendEmailTool = (userId) => {
    return tool(
        async ({ to, subject, body }) => {
            try {
                if (!userId) return "SYSTEM_ERROR: User ID missing.";

                const user = await User.findById(userId);
                if (!user) return "SYSTEM_ERROR: User not found.";

                // Check if they actually logged in with Google
                if (!user.gmailAccessToken || !user.gmailRefreshToken) {
                    return `Action failed. YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:RECEIPT:Email Failed:Please link your Google Account.||`;
                }

                // 1. Initialize the Google OAuth2 Client
                const oAuth2Client = new google.auth.OAuth2(
                    process.env.GOOGLE_CLIENT_ID,
                    process.env.GOOGLE_CLIENT_SECRET,
                    "https://voxa-ai-zh5o.onrender.com/api/auth/google/callback"
                );

                // 2. Apply the user's specific tokens (Google automatically handles refreshing!)
                oAuth2Client.setCredentials({
                    access_token: user.gmailAccessToken,
                    refresh_token: user.gmailRefreshToken,
                });

                const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

                // 3. Format the email into RFC 2822 MIME format securely
                const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
                const messageParts = [
                    `To: ${to}`,
                    `Subject: ${utf8Subject}`,
                    `Content-Type: text/plain; charset=utf-8`,
                    `MIME-Version: 1.0`,
                    ``, // Empty line separates headers from body
                    body
                ];
                const message = messageParts.join('\n');

                // 4. Gmail API requires strict "Base64URL" encoding
                const encodedMessage = Buffer.from(message)
                    .toString('base64')
                    .replace(/\+/g, '-')
                    .replace(/\//g, '_')
                    .replace(/=+$/, '');

                // 5. Send via the secure REST API
                await gmail.users.messages.send({
                    userId: 'me', // Translates to the authenticated token's email
                    requestBody: { raw: encodedMessage },
                });

                return `Email sent successfully. YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:RECEIPT:Email Sent:${to}||`;
            } catch (error) {
                console.error("[Email Error]:", error);
                return `Email failed. YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:RECEIPT:Email Failed:Token Expired or Network Error||`;
            }
        },
        {
            name: "send_email",
            description: "Sends an email to a specified address.",
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
                const cc = data.current_condition[0]; // 🛠️ SURGICAL FIX: Alias for readability
                const temp = cc.temp_C;
                const conditionDesc = cc.weatherDesc[0].value.toLowerCase();

                let condition = "Clear";
                if (conditionDesc.includes("rain") || conditionDesc.includes("drizzle") || conditionDesc.includes("shower")) condition = "Rain";
                else if (conditionDesc.includes("cloud") || conditionDesc.includes("overcast")) condition = "Cloudy";
                else if (conditionDesc.includes("snow") || conditionDesc.includes("ice")) condition = "Snow";

                // 🛠️ SURGICAL FIX: Extract wind, humidity, rain chance for the WeatherCard bottom row
                const windSpeed = cc.windspeedKmph ? `${cc.windspeedKmph} km/h` : '--';
                const humidity = cc.humidity ? `${cc.humidity}%` : '--';
                let rainChance = '--';
                try {
                    const hourly = data.weather?.[0]?.hourly;
                    if (hourly?.length > 0) {
                        const currentHour = new Date().getHours();
                        const nearestSlot = Math.floor(currentHour / 3) * 300;
                        const entry = hourly.find(h => parseInt(h.time) === nearestSlot) || hourly[0];
                        if (entry?.chanceofrain) rainChance = `${entry.chanceofrain}%`;
                    }
                } catch (e) { /* graceful fallback to '--' */ }

                return `Weather fetched successfully. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:WEATHER:${location}:${temp}:${condition}:${windSpeed}:${humidity}:${rainChance}||`;
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
// 🌍 TOOL 4: The Global Sports Hub (Untouched Omni-Router)
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

            // ==========================================
            // ⚽ ROUTE 1: FOOTBALL (Football-Data.org)
            // ==========================================
            if (fullContextCheck.includes("football") || fullContextCheck.includes("soccer") || fullContextCheck.includes("epl") || fullContextCheck.includes("ucl") || fullContextCheck.includes("madrid") || fullContextCheck.includes("city") || fullContextCheck.includes("united") || fullContextCheck.includes("arsenal") || fullContextCheck.includes("chelsea") || fullContextCheck.includes("liverpool")) {

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

            // ==========================================
            // 🏀 ROUTE 2: BASKETBALL (TheSportsDB)
            // ==========================================
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
                    const eventsArray = isUpcoming ? fixData.events : fixData.results;
                    match = eventsArray?.[0];
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

            // ==========================================
            // 🏏 ROUTE 3: CRICKET (CRICAPI) — Temporal-Aware Scoring Algorithm
            // ==========================================
            else if (fullContextCheck.includes("cricket") || fullContextCheck.includes("ipl") || fullContextCheck.includes("t20") || fullContextCheck.includes("rcb") || fullContextCheck.includes("csk") || fullContextCheck.includes("mi") || fullContextCheck.includes("india")) {
                const cricApiKey = process.env.CRICKET_API_KEY;
                if (!cricApiKey) throw new Error("CRICKET_API_KEY missing");

                // ── Step 1: Temporal Intent Extraction ──────────────────────────
                const isYesterday = /\b(yesterday|last\s*night|last\s*match|previous\s*match|last\s*game)\b/i.test(voiceNormalizedQuery);
                const isTomorrow = /\b(tomorrow|next\s*match|next\s*game|upcoming)\b/i.test(voiceNormalizedQuery);
                const isLiveIntent = /\b(live|current|right\s*now|going\s*on|happening)\b/i.test(voiceNormalizedQuery);
                // Default: if none of the above, treat as "today"
                const isToday = !isYesterday && !isTomorrow;

                // Extract team tokens: strip temporal/noise words, split remainder
                const NOISE_WORDS = /\b(yesterday|today|tomorrow|match|score|update|live|next|last|game|schedule|fixtures|please|of|the|for|in|is|what|was|who|won|how|between|current|right|now|going|on|happening|cricket|ipl|t20|premier|league|indian|result|vs|versus)\b/gi;
                const teamTokens = voiceNormalizedQuery
                    .replace(NOISE_WORDS, '')
                    .trim()
                    .split(/\s+/)
                    .filter(t => t.length > 1);

                console.log(`🏏 [Cricket Engine] Temporal: ${isYesterday ? 'YESTERDAY' : isTomorrow ? 'TOMORROW' : 'TODAY'} | Live: ${isLiveIntent} | Tokens: [${teamTokens.join(', ')}]`);

                // ── Step 2: IST Time Engine ─────────────────────────────────────
                const toIST = (date) => {
                    // Convert any date to IST by creating a formatter and parsing
                    const d = new Date(date);
                    return new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
                };

                const getISTDateString = (date) => {
                    // Returns "YYYY-MM-DD" in IST for comparison
                    const d = new Date(date);
                    return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // en-CA gives YYYY-MM-DD
                };

                const nowIST = toIST(new Date());
                const todayStr = getISTDateString(new Date());

                // Yesterday and tomorrow in IST
                const yesterdayDate = new Date(nowIST);
                yesterdayDate.setDate(yesterdayDate.getDate() - 1);
                const yesterdayStr = getISTDateString(yesterdayDate);

                const tomorrowDate = new Date(nowIST);
                tomorrowDate.setDate(tomorrowDate.getDate() + 1);
                const tomorrowStr = getISTDateString(tomorrowDate);

                // ── Fetch from CricAPI ──────────────────────────────────────────
                const matchData = await fetchWithCacheAndRetry(
                    `https://api.cricapi.com/v1/currentMatches?apikey=${cricApiKey}&offset=0`, {}, 30000
                );
                if (!matchData.data || matchData.data.length === 0) throw new Error("No cricket data available from CricAPI.");

                // ── Step 3: The Scoring Loop ────────────────────────────────────
                const scoredMatches = matchData.data
                    .filter(m => m.name) // Skip malformed entries
                    .map(match => {
                        let score = 0;
                        const matchNameLower = (match.name || '').toLowerCase();
                        const matchSeriesLower = (match.series || '').toLowerCase();

                        // Get match date in IST for temporal comparison
                        const matchDateStr = getISTDateString(match.dateTimeGMT || match.date);

                        // A) Team Match: +100 per token found in match name
                        for (const token of teamTokens) {
                            if (matchNameLower.includes(token)) score += 100;
                        }

                        // B) Context Match: +50 if "ipl" is in query AND in series name
                        if (voiceNormalizedQuery.includes('ipl') && (matchSeriesLower.includes('ipl') || matchSeriesLower.includes('indian premier'))) {
                            score += 50;
                        }

                        // C) Exact Temporal Alignment: +150
                        if (isYesterday && matchDateStr === yesterdayStr) score += 150;
                        else if (isTomorrow && matchDateStr === tomorrowStr) score += 150;
                        else if (isToday && matchDateStr === todayStr) score += 150;

                        // D) Live Bonus: +75 if user wants live AND match is actually live
                        if (isLiveIntent && match.matchStarted === true && match.matchEnded === false) {
                            score += 75;
                        }

                        return { match, score, matchDateStr };
                    })
                    .sort((a, b) => b.score - a.score);

                // ── Step 4: Intelligent Selection & Status Formatting ───────────
                if (scoredMatches.length === 0 || scoredMatches[0].score === 0) {
                    throw new Error("No matches found for this specific query.");
                }

                const bestResult = scoredMatches[0];
                const targetMatch = bestResult.match;

                console.log(`🏏 [Cricket Engine] Best match: "${targetMatch.name}" (score: ${bestResult.score})`);

                // ── Extract team names & scores ─────────────────────────────────
                const teamAName = targetMatch.teams?.[0] || "Team A";
                const teamBName = targetMatch.teams?.[1] || "Team B";
                let scoreA = "-", scoreB = "-", oversA = null, crr = null;

                if (targetMatch.score?.length > 0) {
                    // 🛠️ SURGICAL FIX: Fuzzy matching by first word to prevent '-' scores
                    const firstWordA = teamAName.split(' ')[0].toLowerCase();
                    const firstWordB = teamBName.split(' ')[0].toLowerCase();

                    let sA = targetMatch.score.find(s => s.inning?.toLowerCase().includes(firstWordA));
                    let sB = targetMatch.score.find(s => s.inning?.toLowerCase().includes(firstWordB));

                    // 🛠️ SURGICAL FIX: Array Index Fallback if fuzzy match fails
                    if (!sA && targetMatch.score.length > 0) sA = targetMatch.score[0];
                    if (!sB && targetMatch.score.length > 1) sB = targetMatch.score[1];

                    if (sA) {
                        scoreA = `${sA.r}/${sA.w}`;
                        oversA = sA.o;
                        // Guard against null/NaN overs to prevent Infinity CRR
                        const numOvers = parseFloat(sA.o);
                        if (!isNaN(numOvers) && numOvers > 0) {
                            const oMath = Math.floor(numOvers) + (((numOvers * 10) % 10) / 6);
                            if (oMath > 0) crr = (sA.r / oMath).toFixed(2);
                        }
                    }
                    if (sB) { scoreB = `${sB.r}/${sB.w}`; }
                }

                // Determine match status
                const isLiveResponse = targetMatch.matchStarted === true && targetMatch.matchEnded === false;
                const isFinished = targetMatch.matchEnded === true;
                const isNotStarted = targetMatch.matchStarted === false;

                let statusText;
                if (isLiveResponse) {
                    statusText = targetMatch.status || "Live";
                } else if (isFinished) {
                    statusText = targetMatch.status || "Finished";
                } else if (isNotStarted) {
                    // The "Upcoming Pivot": user asked for live/today, but match hasn't started
                    const matchTimeIST = new Date(targetMatch.dateTimeGMT || targetMatch.date)
                        .toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });
                    statusText = `Scheduled: Today at ${matchTimeIST} IST`;
                } else {
                    statusText = targetMatch.status || "Match Info";
                }

                // 🛠️ SURGICAL FIX: Added explicit teamA and teamB objects for universal UI compatibility
                const cardData = JSON.stringify({
                    league: targetMatch.matchType?.toUpperCase() || "Cricket",
                    isLive: isLiveResponse,
                    battingTeam: teamAName, battingScore: scoreA, battingOvers: oversA,
                    bowlingTeam: teamBName, bowlingScore: scoreB,
                    crr: crr, status: statusText,
                    teamA: { name: teamAName, score: scoreA },
                    teamB: { name: teamBName, score: scoreB }
                });
                return `Sports data fetched. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:SPORTS:${cardData}||`;
            }

            throw new Error("Route not found");

        } catch (error) {
            console.error("[Sports Data Error]:", error.message);
            const errorData = JSON.stringify({
                league: "Sports Data",
                isLive: false,
                teamA: { name: "System", score: "-" },
                teamB: { name: "Error", score: "-" },
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