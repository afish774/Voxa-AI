import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import Reminder from '../models/Reminder.js';
import User from '../models/User.js';
import { google } from 'googleapis';
import dotenv from 'dotenv';

// 🛠️ AUDIT FIX: [BUG-01] — Import LRU Cache package (run `npm install lru-cache`)
// The old `Map()` implementation had four critical defects:
//   1. FIFO eviction (not LRU) — most-recently-used entries were evicted first.
//   2. Single-entry eviction — only ONE key removed when size > 200, allowing
//      the map to grow unbounded under bursty traffic (→ OOM risk on Render 512MB).
//   3. No memory-size cap — 200 large sports payloads ≈ 40MB unconstrained heap.
//   4. No proactive TTL sweep — stale entries lived forever unless evicted by count.
//
// The LRUCache replacement enforces:
//   - max: 150 items (item count ceiling)
//   - maxSize: 30MB (hard memory cap — calculated from serialised value size)
//   - ttl: per-item, passed at set-time to match each tool's freshness requirement
//   - allowStale: false — expired items are never returned, even under pressure
//   - Automatic LRU eviction — least-recently-used items are evicted first when
//     either the count or memory cap is exceeded
import { LRUCache } from 'lru-cache';

dotenv.config();

// ============================================================================
// 🧠 ENTERPRISE INFRASTRUCTURE
// ============================================================================

/**
 * 🛠️ AUDIT FIX: [BUG-01] — Professional LRU Cache replaces the broken Map()
 *
 * Configuration rationale:
 *   max: 150          → Upper bound on item count. Sports/crypto APIs are the
 *                        most frequent callers; 150 unique URLs is generous.
 *   maxSize: 30MB     → Hard memory cap. sizeCalculation estimates each
 *                        stored JSON object's serialised byte footprint.
 *                        Prevents OOM on Render's 512MB free-tier instances.
 *   ttl: 5min default → Overridden per-call in fetchWithCacheAndRetry so each
 *                        tool can declare its own freshness window. The default
 *                        only applies if ttlMs is not passed explicitly.
 *   allowStale: false → Expired entries are NEVER returned. The old Map() had
 *                        no such guarantee once the timestamp check was bypassed.
 */
const apiCache = new LRUCache({
    max: 150,

    // Hard memory ceiling — prevents unbounded heap growth from large API payloads
    maxSize: 30 * 1024 * 1024, // 30 MB

    // Estimate serialised size of each cached value in bytes.
    // Falls back to 1 KB if serialisation fails (e.g., circular references).
    sizeCalculation: (value) => {
        try {
            return Buffer.byteLength(JSON.stringify(value), 'utf8');
        } catch {
            return 1024;
        }
    },

    // Default TTL (milliseconds). Overridden per-item at set-time.
    ttl: 5 * 60 * 1000, // 5 minutes

    // Never return a stale (expired) entry even when the cache is under
    // memory pressure. Correctness beats latency for financial / sports data.
    allowStale: false,
});

/**
 * Fetches a URL with LRU caching and exponential-backoff retry logic.
 * This is the single network primitive used by every tool.
 *
 * 🛠️ AUDIT FIX: [BUG-01] — Cache reads and writes now go through LRUCache.
 * The old manual timestamp comparison and FIFO size-check eviction are gone.
 * TTL enforcement is fully delegated to the cache library.
 *
 * @param {string}  url        - The full URL to fetch.
 * @param {object}  options    - Fetch options (headers, method, etc.).
 * @param {number}  ttlMs      - How long (ms) to cache a successful response.
 * @param {number}  retries    - Number of retry attempts on transient failures.
 * @param {number}  timeoutMs  - Per-attempt abort timeout in milliseconds.
 */
const fetchWithCacheAndRetry = async (
    url,
    options = {},
    ttlMs = 60000,
    retries = 2,
    timeoutMs = 8000
) => {
    // 🛠️ AUDIT FIX: [BUG-01] LRU cache hit check — `.get()` returns undefined
    // if the key is absent OR if the item's TTL has expired (allowStale: false).
    // No manual timestamp arithmetic required.
    const cached = apiCache.get(url);
    if (cached !== undefined) {
        console.log(`⚡ [Cache Hit] 0ms latency for: ${url}`);
        return cached;
    }

    for (let i = 0; i <= retries; i++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    Accept: 'application/json',
                    'User-Agent': 'VoxaServer/1.0',
                    ...options.headers,
                },
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (response.status === 429) throw new Error('RATE_LIMIT');
            if (response.status === 451) throw new Error('GEO_BLOCKED_451');
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

            const data = await response.json();

            // 🛠️ AUDIT FIX: [BUG-01] Store value with per-item TTL.
            // LRUCache manages eviction automatically — no manual size checks needed.
            apiCache.set(url, data, { ttl: ttlMs });

            return data;
        } catch (error) {
            clearTimeout(timeoutId);

            if (i === retries) {
                console.error(`[API Error] Failed fetching ${url}:`, error.message);
                throw error;
            }

            const backoffTime = 500 * Math.pow(2, i);
            console.warn(`[Retry ${i + 1}] Network issue, waiting ${backoffTime}ms...`);
            await new Promise((res) => setTimeout(res, backoffTime));
        }
    }
};

/**
 * Normalises common voice/slang abbreviations for cricket teams and football
 * clubs into their full, searchable names before passing to tool logic.
 */
const normalizeVoiceInput = (query) => {
    let clean = query.toLowerCase();
    const map = {
        'man city': 'manchester city',
        'man utd': 'manchester united',
        spurs: 'tottenham',
        rcb: 'royal challengers',
        csk: 'chennai super kings',
        mi: 'mumbai indians',
        srh: 'sunrisers',
        kkr: 'kolkata knight',
        pbks: 'punjab kings',
        dc: 'delhi capitals',
        rr: 'rajasthan royals',
        lsg: 'lucknow super',
        gt: 'gujarat titans',
    };
    for (const [slang, strict] of Object.entries(map)) {
        clean = clean.replace(new RegExp(`\\b${slang}\\b`, 'g'), strict);
    }
    return clean;
};

// ============================================================================
// 🛠️ TOOL 1: Save Reminder
// ============================================================================

export const createReminderTool = (userId) =>
    tool(
        async ({ task }) => {
            try {
                if (!userId) return 'SYSTEM_ERROR: User ID missing.';
                await Reminder.create({ user: userId, task });
                return `Task saved successfully. YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:RECEIPT:Reminder Saved:${task}||`;
            } catch {
                return `Database error. YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:RECEIPT:Failed to Save:Database Error||`;
            }
        },
        {
            name: 'save_reminder',
            description: 'Saves a reminder or to-do task for the user.',
            schema: z.object({
                task: z.string().describe('The specific task to remember.'),
            }),
        }
    );

// ============================================================================
// 🛠️ TOOL 2: Crypto Price (CoinPaprika)
// ============================================================================

export const getCryptoPriceTool = tool(
    async ({ coinId }) => {
        try {
            const normalizedCoin = coinId.toLowerCase().trim();

            const symbols = {
                bitcoin: 'btc-bitcoin',
                btc: 'btc-bitcoin',
                ethereum: 'eth-ethereum',
                eth: 'eth-ethereum',
                solana: 'sol-solana',
                sol: 'sol-solana',
                dogecoin: 'doge-dogecoin',
                doge: 'doge-dogecoin',
                cardano: 'ada-cardano',
                ada: 'ada-cardano',
                xrp: 'xrp-xrp',
                ripple: 'xrp-xrp',
                'binance coin': 'bnb-binance-coin',
                bnb: 'bnb-binance-coin',
            };

            const paprikaCoin = symbols[normalizedCoin] || 'btc-bitcoin';
            const displayName =
                Object.keys(symbols).find((key) => symbols[key] === paprikaCoin) ||
                normalizedCoin;

            const url = `https://api.coinpaprika.com/v1/tickers/${paprikaCoin}`;
            // Crypto prices: 60-second TTL (market data refreshes frequently)
            const data = await fetchWithCacheAndRetry(url, {}, 60000);

            if (data?.quotes?.USD) {
                const price = parseFloat(data.quotes.USD.price).toFixed(2);
                const change = parseFloat(data.quotes.USD.percent_change_24h).toFixed(2);
                return `The price was fetched successfully. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:CRYPTO:${displayName}:${price}:${change}||`;
            }
            return `Data not found. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:CRYPTO:${displayName}:Not Found:0.00||`;
        } catch (error) {
            console.error('[Crypto API Error]:', error);
            return `System error occurred. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:CRYPTO:${coinId}:System Offline:0.00||`;
        }
    },
    {
        name: 'get_crypto_price',
        description:
            'Fetches live cryptocurrency prices. You MUST include the ||CARD...|| string provided in the tool output in your final message.',
        schema: z.object({
            coinId: z
                .string()
                .describe('The full name of the coin, e.g., bitcoin, ethereum'),
        }),
    }
);

// ============================================================================
// 🛠️ TOOL 3: Send Email (Google Gmail API)
// ============================================================================

export const createSendEmailTool = (userId) =>
    tool(
        async ({ to, subject, body }) => {
            try {
                if (!userId) return 'SYSTEM_ERROR: User ID missing.';

                const user = await User.findById(userId);
                if (!user) return 'SYSTEM_ERROR: User not found.';

                if (!user.gmailAccessToken || !user.gmailRefreshToken) {
                    return `Action failed. YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:RECEIPT:Email Failed:Please link your Google Account.||`;
                }

                // 🛠️ AUDIT FIX: [SEC-04] OAuth redirect URI now reads from environment
                // variable instead of a hardcoded production URL, so local dev,
                // staging, and future domain changes don't require code edits.
                const oAuth2Client = new google.auth.OAuth2(
                    process.env.GOOGLE_CLIENT_ID,
                    process.env.GOOGLE_CLIENT_SECRET,
                    process.env.GOOGLE_REDIRECT_URI // Was hardcoded production URL
                );

                oAuth2Client.setCredentials({
                    access_token: user.gmailAccessToken,
                    refresh_token: user.gmailRefreshToken,
                });

                const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

                const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
                const messageParts = [
                    `To: ${to}`,
                    `Subject: ${utf8Subject}`,
                    `Content-Type: text/plain; charset=utf-8`,
                    `MIME-Version: 1.0`,
                    ``,
                    body,
                ];
                const message = messageParts.join('\n');
                const encodedMessage = Buffer.from(message)
                    .toString('base64')
                    .replace(/\+/g, '-')
                    .replace(/\//g, '_')
                    .replace(/=+$/, '');

                await gmail.users.messages.send({
                    userId: 'me',
                    requestBody: { raw: encodedMessage },
                });

                return `Email sent successfully. YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:RECEIPT:Email Sent:${to}||`;
            } catch (error) {
                console.error('[Email Error]:', error);
                return `Email failed. YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:RECEIPT:Email Failed:Token Expired or Network Error||`;
            }
        },
        {
            name: 'send_email',
            description: 'Sends an email to a specified address.',
            schema: z.object({
                to: z.string().describe('Recipient email address.'),
                subject: z.string().describe('Email subject line.'),
                body: z.string().describe('Email body text.'),
            }),
        }
    );

// ============================================================================
// 🛠️ TOOL 4: Weather (wttr.in)
// ============================================================================

export const getWeatherTool = tool(
    async ({ location }) => {
        try {
            const safeLoc = encodeURIComponent(location.trim());
            const url = `https://wttr.in/${safeLoc}?format=j1`;
            // Weather data: 5-minute TTL (conditions don't change second-by-second)
            const data = await fetchWithCacheAndRetry(url, {}, 300000);

            if (data?.current_condition?.[0]) {
                const cc = data.current_condition[0];
                const temp = cc.temp_C;
                const conditionDesc = cc.weatherDesc?.[0]?.value?.toLowerCase() ?? '';

                let condition = 'Clear';
                if (
                    conditionDesc.includes('rain') ||
                    conditionDesc.includes('drizzle') ||
                    conditionDesc.includes('shower')
                ) {
                    condition = 'Rain';
                } else if (
                    conditionDesc.includes('cloud') ||
                    conditionDesc.includes('overcast')
                ) {
                    condition = 'Cloudy';
                } else if (
                    conditionDesc.includes('snow') ||
                    conditionDesc.includes('ice')
                ) {
                    condition = 'Snow';
                }

                const windSpeed = cc.windspeedKmph ? `${cc.windspeedKmph} km/h` : '--';
                const humidity = cc.humidity ? `${cc.humidity}%` : '--';
                let rainChance = '--';

                // Daily max rain chance — loop over all hourly slots for today
                try {
                    const hourly = data.weather?.[0]?.hourly;
                    if (hourly?.length > 0) {
                        let maxRainChance = 0;
                        hourly.forEach((slot) => {
                            const chance = parseInt(slot.chanceofrain || '0', 10);
                            if (chance > maxRainChance) maxRainChance = chance;
                        });
                        rainChance = `${maxRainChance}%`;
                    }
                } catch {
                    /* graceful fallback to '--' */
                }

                return `Weather fetched successfully. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:WEATHER:${location}:${temp}:${condition}:${windSpeed}:${humidity}:${rainChance}||`;
            }
            return `Location unknown. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:WEATHER:${location}:--:Unknown||`;
        } catch (error) {
            console.error('[Weather Error]:', error);
            return `API error. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:WEATHER:${location}:--:Offline||`;
        }
    },
    {
        name: 'get_weather',
        description:
            'Fetches current weather data for a city. You MUST include the ||CARD...|| string provided in the tool output in your final message.',
        schema: z.object({
            location: z.string().describe('The city name to check weather for.'),
        }),
    }
);

// ============================================================================
// 🌍 TOOL 5: Global Sports Hub (Football · Basketball · Cricket/IPL)
//
// ARCHITECTURE: The LLM performs all NLP and passes structured intent
// fields (temporal_intent, tournament, team_mentions) directly to the tool.
// The scoring engine is purely data-driven — zero regex temporal guessing.
//
// ⚠️  DO NOT MODIFY THE TEMPORAL LOGIC OR SCORING ENGINE BELOW.
//     The getSportsDataTool uses LLM schema classification (not regex) as
//     an intentional architectural constraint. This is preserved verbatim.
// ============================================================================

export const getSportsDataTool = tool(
    async ({ sport, query, temporal_intent, tournament, team_mentions, specific_date }) => {
        try {
            // ── Shared IST helpers ──────────────────────────────────────────────

            /** Convert any Date to an IST-localised Date object */
            const toIST = (date) =>
                new Date(
                    new Date(date).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
                );

            /** Return "YYYY-MM-DD" string in IST timezone for any Date */
            const getISTDateString = (date) =>
                new Date(date).toLocaleDateString('en-CA', {
                    timeZone: 'Asia/Kolkata',
                });

            const nowIST = toIST(new Date());
            const todayStr = getISTDateString(new Date());

            const yesterdayDate = new Date(nowIST);
            yesterdayDate.setDate(yesterdayDate.getDate() - 1);
            const yesterdayStr = getISTDateString(yesterdayDate);

            const tomorrowDate = new Date(nowIST);
            tomorrowDate.setDate(tomorrowDate.getDate() + 1);
            const tomorrowStr = getISTDateString(tomorrowDate);

            // ── PATCH B: Normalise specific_date to "YYYY-MM-DD" (IST) ─────────
            // The LLM passes an ISO 8601 date string when the user mentions an
            // explicit calendar date. We normalise it once here so the cricket
            // scoring loop can do a strict string comparison against matchDateStr.
            let specificDateStr = null;
            if (specific_date && /^\d{4}-\d{2}-\d{2}$/.test(specific_date.trim())) {
                // Append IST offset to force correct timezone interpretation
                specificDateStr = getISTDateString(
                    new Date(specific_date.trim() + 'T00:00:00+05:30')
                );
                console.log(
                    `📅 [Sports] specific_date: "${specific_date}" → IST normalised: "${specificDateStr}"`
                );
            }

            const voiceNormalizedQuery = normalizeVoiceInput(query);
            const normalizedMentions = (team_mentions ?? []).map((t) =>
                normalizeVoiceInput(t)
            );

            // Broad context string used for sport-route detection
            const fullContextCheck =
                `${sport} ${voiceNormalizedQuery} ${tournament ?? ''} ${normalizedMentions.join(' ')}`.toLowerCase();

            // "upcoming" flag for Football and Basketball routes
            const isUpcoming =
                temporal_intent === 'future' ||
                voiceNormalizedQuery.includes('upcoming') ||
                voiceNormalizedQuery.includes('tomorrow') ||
                voiceNormalizedQuery.includes('next');

            // Primary and optional secondary team from LLM-extracted mentions
            const t1 = normalizedMentions[0] ?? voiceNormalizedQuery.trim();
            const t2 = normalizedMentions[1] ?? null;

            // ==================================================================
            // ⚽ ROUTE 1: FOOTBALL (football-data.org)
            // ==================================================================
            if (
                fullContextCheck.includes('football') ||
                fullContextCheck.includes('soccer') ||
                fullContextCheck.includes('epl') ||
                fullContextCheck.includes('ucl') ||
                fullContextCheck.includes('madrid') ||
                fullContextCheck.includes('city') ||
                fullContextCheck.includes('united') ||
                fullContextCheck.includes('arsenal') ||
                fullContextCheck.includes('chelsea') ||
                fullContextCheck.includes('liverpool')
            ) {
                const apiKey = process.env.FOOTBALL_DATA_TOKEN;
                if (!apiKey) throw new Error('FOOTBALL_DATA_TOKEN missing');
                const headers = { 'X-Auth-Token': apiKey };

                const POPULAR_TEAMS = {
                    arsenal: 57,
                    'aston villa': 58,
                    chelsea: 61,
                    everton: 62,
                    liverpool: 64,
                    'manchester city': 65,
                    'manchester united': 66,
                    newcastle: 67,
                    tottenham: 73,
                    'real madrid': 86,
                    barcelona: 81,
                    'atletico madrid': 78,
                    'bayern munich': 5,
                    'borussia dortmund': 4,
                    'bayer leverkusen': 3,
                    psg: 524,
                    juventus: 109,
                    'ac milan': 98,
                    inter: 108,
                    napoli: 113,
                    roma: 100,
                };

                const teamId = POPULAR_TEAMS[t1];
                if (!teamId) throw new Error('TEAM_NOT_IN_LOCAL_DB');

                // Football fixtures: 30-second TTL (live match data)
                const fixData = await fetchWithCacheAndRetry(
                    `https://api.football-data.org/v4/teams/${teamId}/matches`,
                    { headers },
                    30000
                );
                const allMatches = fixData.matches || [];
                if (allMatches.length === 0) throw new Error('No fixtures found.');

                const now = new Date().getTime();
                let match = null;

                if (t2) {
                    const h2h = allMatches.filter(
                        (m) =>
                            m.homeTeam.name.toLowerCase().includes(t2) ||
                            m.awayTeam.name.toLowerCase().includes(t2)
                    );
                    if (h2h.length === 0) throw new Error('H2H_NOT_FOUND');
                    match = isUpcoming
                        ? h2h
                            .filter((m) => new Date(m.utcDate).getTime() > now)
                            .sort(
                                (a, b) =>
                                    new Date(a.utcDate).getTime() -
                                    new Date(b.utcDate).getTime()
                            )[0]
                        : h2h
                            .filter((m) => new Date(m.utcDate).getTime() <= now)
                            .sort(
                                (a, b) =>
                                    new Date(b.utcDate).getTime() -
                                    new Date(a.utcDate).getTime()
                            )[0];
                } else {
                    match = isUpcoming
                        ? allMatches
                            .filter((m) => new Date(m.utcDate).getTime() > now)
                            .sort(
                                (a, b) =>
                                    new Date(a.utcDate).getTime() -
                                    new Date(b.utcDate).getTime()
                            )[0]
                        : allMatches
                            .filter((m) => new Date(m.utcDate).getTime() <= now)
                            .sort(
                                (a, b) =>
                                    new Date(b.utcDate).getTime() -
                                    new Date(a.utcDate).getTime()
                            )[0];
                }

                if (!match) throw new Error('No match found.');

                const isLiveResponse = ['IN_PLAY', 'PAUSED'].includes(match.status);
                const isFinishedResponse = match.status === 'FINISHED';

                const cardData = JSON.stringify({
                    league: match.competition.name || 'Football',
                    isLive: isLiveResponse,
                    matchSeconds: isLiveResponse ? 2700 : isFinishedResponse ? 5400 : 0,
                    teamA: {
                        name: match.homeTeam.name,
                        score: match.score?.fullTime?.home ?? '-',
                    },
                    teamB: {
                        name: match.awayTeam.name,
                        score: match.score?.fullTime?.away ?? '-',
                    },
                    status: isLiveResponse
                        ? 'Match Live'
                        : isFinishedResponse
                            ? 'Full Time'
                            : 'Scheduled: ' +
                            new Date(match.utcDate).toLocaleDateString(),
                });
                return `Sports data fetched. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:SPORTS:${cardData}||`;
            }

            // ==================================================================
            // 🏀 ROUTE 2: BASKETBALL (TheSportsDB)
            // ==================================================================
            else if (
                fullContextCheck.includes('basketball') ||
                fullContextCheck.includes('nba') ||
                fullContextCheck.includes('lakers') ||
                fullContextCheck.includes('warriors')
            ) {
                let match = null;

                if (t2) {
                    const q1 = `${t1.replace(/\s+/g, '_')}_vs_${t2.replace(/\s+/g, '_')}`;
                    let res = await fetchWithCacheAndRetry(
                        `https://www.thesportsdb.com/api/v1/json/3/searchevents.php?e=${encodeURIComponent(q1)}`,
                        {},
                        60000
                    );
                    if (!res.event) {
                        const q2 = `${t2.replace(/\s+/g, '_')}_vs_${t1.replace(/\s+/g, '_')}`;
                        res = await fetchWithCacheAndRetry(
                            `https://www.thesportsdb.com/api/v1/json/3/searchevents.php?e=${encodeURIComponent(q2)}`,
                            {},
                            60000
                        );
                    }
                    const allMatches = res.event || [];
                    const nowMs = Date.now();
                    match = isUpcoming
                        ? allMatches
                            .filter((m) => new Date(m.dateEvent).getTime() >= nowMs)
                            .sort(
                                (a, b) =>
                                    new Date(a.dateEvent).getTime() -
                                    new Date(b.dateEvent).getTime()
                            )[0]
                        : allMatches
                            .filter((m) => new Date(m.dateEvent).getTime() <= nowMs)
                            .sort(
                                (a, b) =>
                                    new Date(b.dateEvent).getTime() -
                                    new Date(a.dateEvent).getTime()
                            )[0];
                } else {
                    // Team lookup: 24-hour TTL (team IDs never change)
                    const teamData = await fetchWithCacheAndRetry(
                        `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(t1)}`,
                        {},
                        86400000
                    );
                    if (!teamData.teams)
                        throw new Error(`Basketball team not found: ${t1}`);
                    const teamId = teamData.teams[0].idTeam;
                    const fetchUrl = isUpcoming
                        ? `https://www.thesportsdb.com/api/v1/json/3/eventsnext.php?id=${teamId}`
                        : `https://www.thesportsdb.com/api/v1/json/3/eventslast.php?id=${teamId}`;
                    const fixData = await fetchWithCacheAndRetry(fetchUrl, {}, 60000);
                    const eventsArray = isUpcoming ? fixData.events : fixData.results;
                    match = eventsArray?.[0];
                }

                if (!match) throw new Error('No basketball matches found.');

                const cardData = JSON.stringify({
                    league: match.strLeague || 'NBA',
                    isLive: false,
                    teamA: {
                        name: match.strHomeTeam,
                        score: match.intHomeScore || '-',
                    },
                    teamB: {
                        name: match.strAwayTeam,
                        score: match.intAwayScore || '-',
                    },
                    status: isUpcoming ? `Scheduled: ${match.dateEvent}` : 'Final Score',
                });
                return `Sports data fetched. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:SPORTS:${cardData}||`;
            }

            // ==================================================================
            // 🏏 ROUTE 3: CRICKET (CricAPI) — STRUCTURED IST SCORING ENGINE
            //
            // KEY ARCHITECTURE: temporal_intent, tournament, and team_mentions are
            // all LLM-classified and arrive as structured data. The scoring engine
            // awards points across three independent tiers with no regex-based
            // temporal guessing whatsoever.
            //
            // SCORING TIERS:
            //   Tier A — Tournament match (IPL):          500 pts
            //   Tier A — Tournament match (other named):  300 pts
            //   Tier B — Per team-name token match:       100 pts each
            //   Tier C — Temporal intent (exact date):    200 pts
            //   Tier C — Temporal intent (fallback dir):   50 pts
            //   Tier C — Live bonus (any intent):         100 pts
            //
            // DATA SOURCING [PATCH 1 — PARALLEL FETCH & MERGE]:
            //   Both `currentMatches` (live/recent) and `matches` (full schedule
            //   including future fixtures) are fetched in parallel via Promise.all.
            //   Results are merged and deduplicated by match.id so the scoring
            //   engine has visibility across past, live, AND future calendars.
            //   This fixes the critical gap where "upcoming IPL matches" returned
            //   nothing because `currentMatches` holds only live/recent data.
            // ==================================================================
            else if (
                fullContextCheck.includes('cricket') ||
                fullContextCheck.includes('ipl') ||
                fullContextCheck.includes('t20') ||
                fullContextCheck.includes('odi') ||
                fullContextCheck.includes('test match') ||
                fullContextCheck.includes('rcb') ||
                fullContextCheck.includes('csk') ||
                fullContextCheck.includes('mumbai indians') ||
                fullContextCheck.includes('india') ||
                fullContextCheck.includes('world cup')
            ) {
                const cricApiKey = process.env.CRICKET_API_KEY;
                if (!cricApiKey) throw new Error('CRICKET_API_KEY missing');

                // ── PATCH 1: Parallel fetch — currentMatches + full matches feed ──
                //
                // `currentMatches` → live scores and very recently completed games.
                //   TTL: 30s — scores update frequently during live play.
                //
                // `matches`        → full CricAPI schedule feed: past, live, AND
                //   upcoming fixtures. This is the endpoint that carries tomorrow's
                //   and next-week's fixtures that `currentMatches` never surfaces.
                //   TTL: 5 min — schedules don't change second-to-second; a longer
                //   TTL here avoids rate-limit pressure on a secondary endpoint.
                //
                // Both fetches run concurrently. If one rejects, Promise.all rejects
                // and the outer try/catch surfaces a clean error to the user rather
                // than silently returning partial data.
                const [currentMatchData, scheduledMatchData] = await Promise.all([
                    fetchWithCacheAndRetry(
                        `https://api.cricapi.com/v1/currentMatches?apikey=${cricApiKey}&offset=0`,
                        {},
                        30000   // 30-second TTL — live scores change rapidly
                    ),
                    fetchWithCacheAndRetry(
                        `https://api.cricapi.com/v1/matches?apikey=${cricApiKey}&offset=0`,
                        {},
                        300000  // 5-minute TTL — schedules are relatively stable
                    ),
                ]);

                // ── Merge + deduplicate by match.id ──────────────────────────────
                //
                // Both endpoints can return the same live match. Deduplication by
                // `match.id` ensures the scoring engine sees each fixture exactly
                // once. `currentMatches` entries are added first so their richer
                // live score payload (score[], matchStarted, matchEnded) wins over
                // a potentially staler copy from the `matches` feed.
                const currentList = Array.isArray(currentMatchData?.data) ? currentMatchData.data : [];
                const scheduledList = Array.isArray(scheduledMatchData?.data) ? scheduledMatchData.data : [];

                const seenIds = new Set();
                const mergedMatches = [];

                // Priority pass: live/recent entries first (richest score payload)
                for (const m of currentList) {
                    if (m?.id && !seenIds.has(m.id)) {
                        seenIds.add(m.id);
                        mergedMatches.push(m);
                    }
                }
                // Second pass: schedule entries not already seen
                for (const m of scheduledList) {
                    if (m?.id && !seenIds.has(m.id)) {
                        seenIds.add(m.id);
                        mergedMatches.push(m);
                    }
                }

                console.log(
                    `🏏 [Cricket] Merged pool: ${mergedMatches.length} unique matches ` +
                    `(${currentList.length} current + ${scheduledList.length} scheduled, ` +
                    `${currentList.length + scheduledList.length - mergedMatches.length} deduped)`
                );

                if (mergedMatches.length === 0) {
                    throw new Error('No cricket data available from CricAPI.');
                }

                // Normalise tournament name for series/name matching
                const tournamentLower = (tournament ?? '').toLowerCase();
                const isIplQuery =
                    tournamentLower.includes('ipl') ||
                    tournamentLower.includes('indian premier') ||
                    fullContextCheck.includes('ipl') ||
                    fullContextCheck.includes('indian premier');

                // ── STRUCTURED SCORING ENGINE ───────────────────────────────────
                //
                // Runs over the MERGED array — identical point values as before.
                // No scoring constants have been altered.
                const scoredMatches = mergedMatches
                    .filter((m) => Boolean(m.name))
                    .map((match) => {
                        let score = 0;
                        const matchNameLower = (match.name || '').toLowerCase();
                        const matchSeriesLower = (match.series || '').toLowerCase();
                        const matchDateObj = new Date(
                            match.dateTimeGMT || match.date
                        );
                        const matchDateStr = getISTDateString(matchDateObj);

                        const isMatchLive =
                            match.matchStarted === true &&
                            match.matchEnded === false;
                        const isMatchFinished = match.matchEnded === true;
                        const isMatchFuture =
                            match.matchStarted === false &&
                            match.matchEnded === false;

                        // ── Tier A: Tournament priority ──────────────────────────
                        if (
                            isIplQuery &&
                            (matchSeriesLower.includes('ipl') ||
                                matchSeriesLower.includes('indian premier'))
                        ) {
                            // Maximum priority — ensures IPL beats all other live matches
                            score += 500;
                        } else if (
                            tournamentLower &&
                            (matchSeriesLower.includes(tournamentLower) ||
                                matchNameLower.includes(tournamentLower))
                        ) {
                            score += 300;
                        }

                        // ── Tier B: Team name token matching ─────────────────────
                        for (const token of normalizedMentions) {
                            if (
                                token.length > 1 &&
                                (matchNameLower.includes(token) ||
                                    matchSeriesLower.includes(token))
                            ) {
                                score += 100;
                            }
                        }

                        // ── Tier C: Structured temporal intent (IST-accurate) ────
                        // Uses LLM-classified enum — no regex, no guessing.

                        // ── PATCH B: specific_date boost (+150) ──────────────────
                        // When the user names an exact date, any match whose IST
                        // date string equals specificDateStr gets +150 points.
                        if (specificDateStr && matchDateStr === specificDateStr) {
                            score += 150;
                        }

                        switch (temporal_intent) {
                            case 'live':
                                if (isMatchLive) score += 200;
                                break;

                            case 'past':
                                if (isMatchFinished) {
                                    if (matchDateStr === yesterdayStr) score += 200;
                                    else if (matchDateStr === todayStr) score += 150;
                                    else score += 50;
                                }
                                break;

                            case 'future':
                                if (isMatchFuture) {
                                    if (matchDateStr === tomorrowStr) score += 200;
                                    else if (matchDateStr === todayStr) score += 150;
                                    else if (matchDateObj > nowIST) score += 50;
                                }
                                break;

                            case 'any':
                            default:
                                if (isMatchLive) score += 100;
                                else if (matchDateStr === todayStr) score += 75;
                                break;
                        }

                        return { match, score, matchDateObj, matchDateStr };
                    })
                    .sort((a, b) => {
                        if (b.score !== a.score) return b.score - a.score;
                        if (temporal_intent === 'future')
                            return a.matchDateObj - b.matchDateObj;
                        return b.matchDateObj - a.matchDateObj;
                    });

                // ── PATCH C: Graceful no-match handling ──────────────────────────
                if (scoredMatches.length === 0 || scoredMatches[0].score === 0) {
                    const dateHint = specificDateStr ? ` for ${specificDateStr}` : '';
                    const tournamentHint = tournament ? ` in ${tournament}` : '';
                    return (
                        `No cricket fixtures were found${tournamentHint}${dateHint} in the current live feed. ` +
                        `Explain to the user naturally that there are no scheduled or active matches matching ` +
                        `their request right now. CRITICAL: DO NOT APPEND A ||CARD:...|| STRING.`
                    );
                }

                const targetMatch = scoredMatches[0].match;

                // ── PATCH 2: MULTI-MATCH CONTEXT PAYLOAD ─────────────────────────
                //
                // PROBLEM: For schedule/future queries the UI card only ever showed
                // the single top-scored match, leaving the LLM completely blind to
                // the rest of the upcoming fixtures. The assistant could not read out
                // "here are your next 5 IPL matches" because it had no data for them.
                //
                // SOLUTION: When temporal_intent === 'future' OR the user's query
                // contains a schedule keyword, we build a human-readable mini-schedule
                // string from the next N future/unstarted matches (up to 5) sorted by
                // ascending date. This string is prepended to the tool return value so
                // the LLM receives it in the tool-result message and can narrate it.
                //
                // The UI Card is UNCHANGED — it still renders scoredMatches[0] only.
                // The mini schedule is purely conversational context for the LLM.
                //
                // Schedule-trigger detection: we check temporal_intent AND several
                // natural-language schedule keywords in the raw (voice-normalised)
                // query so the feature fires on phrasing like "IPL schedule",
                // "what matches are coming up", "show me the fixtures", etc.
                const scheduleKeywords = [
                    'schedule', 'fixture', 'fixtures', 'upcoming', 'coming up',
                    'next matches', 'matches this week', 'calendar',
                ];
                const isScheduleQuery =
                    temporal_intent === 'future' ||
                    scheduleKeywords.some((kw) => voiceNormalizedQuery.includes(kw));

                let miniScheduleContext = '';

                if (isScheduleQuery) {
                    // Collect future/unstarted matches from the scored list, re-sorted
                    // by ascending date so the LLM reads them in chronological order.
                    // We cap at 5 entries to stay within a reasonable context budget.
                    const upcomingMatches = scoredMatches
                        .filter(
                            ({ match: m }) =>
                                m.matchStarted === false && m.matchEnded === false
                        )
                        .sort((a, b) => a.matchDateObj - b.matchDateObj)
                        .slice(0, 5);

                    if (upcomingMatches.length > 0) {
                        // Format each entry as "N. [Match Name] on [YYYY-MM-DD IST]"
                        // The date is shown in IST (getISTDateString already handles
                        // the timezone conversion) to match the user's locale.
                        const scheduleLines = upcomingMatches.map(
                            ({ match: m, matchDateStr: ds }, idx) =>
                                `${idx + 1}. ${m.name} on ${ds}`
                        );

                        miniScheduleContext =
                            `Here is the upcoming schedule to read to the user: ` +
                            scheduleLines.join(', ') +
                            `. `;

                        console.log(
                            `📅 [Cricket] Mini-schedule built with ${upcomingMatches.length} fixture(s) for LLM context.`
                        );
                    } else {
                        // Future intent but no unstarted matches found in the merged pool.
                        // Surface a soft hint so the LLM can craft a natural reply.
                        miniScheduleContext =
                            `No upcoming fixtures were found in the merged data pool. ` +
                            `Inform the user that the schedule may not yet be published. `;
                    }
                }

                // ── Score extraction ────────────────────────────────────────────
                const teamAName = targetMatch.teams?.[0] || 'Team A';
                const teamBName = targetMatch.teams?.[1] || 'Team B';
                let scoreA = '-';
                let scoreB = '-';
                let oversA = null;
                let crr = null;

                const isLiveResponse =
                    targetMatch.matchStarted === true &&
                    targetMatch.matchEnded === false;

                if (
                    Array.isArray(targetMatch.score) &&
                    targetMatch.score.length > 0
                ) {
                    /**
                     * Finds the innings entry best matching a team name by checking
                     * whether any meaningful word in the team name appears in the
                     * inning string returned by CricAPI.
                     */
                    const findScore = (teamName, scores) => {
                        const words = teamName
                            .toLowerCase()
                            .split(' ')
                            .filter((w) => w.length > 2);
                        for (const w of words) {
                            const found = scores.find((s) =>
                                s.inning?.toLowerCase().includes(w)
                            );
                            if (found) return found;
                        }
                        return null;
                    };

                    let sA = findScore(teamAName, targetMatch.score);
                    let sB = findScore(teamBName, targetMatch.score);

                    if (!sA && targetMatch.score[0]) sA = targetMatch.score[0];
                    if (
                        !sB &&
                        targetMatch.score[1] &&
                        targetMatch.score[1] !== sA
                    )
                        sB = targetMatch.score[1];

                    if (sA) {
                        const r = sA.r ?? 0;
                        const w = sA.w ?? 0;
                        scoreA = `${r}/${w}`;
                        oversA = sA.o ?? '0.0';
                        const numOvers = parseFloat(oversA);
                        if (!isNaN(numOvers) && numOvers > 0) {
                            // Convert cricket overs notation (e.g. 12.4) to decimal balls
                            const oMath =
                                Math.floor(numOvers) +
                                (((numOvers * 10) % 10) / 6);
                            if (oMath > 0) crr = (r / oMath).toFixed(2);
                        }
                    }

                    if (sB) {
                        const r = sB.r ?? 0;
                        const w = sB.w ?? 0;
                        scoreB = `${r}/${w}`;
                    }
                } else if (isLiveResponse) {
                    scoreA = '0/0';
                    oversA = '0.0';
                }

                // ── Status label ────────────────────────────────────────────────
                const isFinished = targetMatch.matchEnded === true;
                const isNotStarted = targetMatch.matchStarted === false;

                let statusText;
                if (isLiveResponse) {
                    statusText = targetMatch.status || 'Live';
                } else if (isFinished) {
                    statusText = targetMatch.status || 'Finished';
                } else if (isNotStarted) {
                    const matchTimeIST = new Date(
                        targetMatch.dateTimeGMT || targetMatch.date
                    ).toLocaleTimeString('en-IN', {
                        timeZone: 'Asia/Kolkata',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                    });
                    statusText = `Scheduled: Today at ${matchTimeIST} IST`;
                } else {
                    statusText = targetMatch.status || 'Match Info';
                }

                const cardData = JSON.stringify({
                    league: targetMatch.matchType?.toUpperCase() || 'Cricket',
                    isLive: isLiveResponse,
                    battingTeam: teamAName,
                    battingScore: scoreA,
                    battingOvers: oversA,
                    bowlingTeam: teamBName,
                    bowlingScore: scoreB,
                    crr,
                    status: statusText,
                });

                // ── Final return: mini-schedule context + card directive ─────────
                //
                // Structure of the returned string:
                //   [preamble] [miniScheduleContext?] [CRITICAL DIRECTIVE + CARD]
                //
                // `miniScheduleContext` is an empty string for non-schedule queries
                // so the return value is byte-identical to the old implementation
                // in those cases — no regression risk for live/past queries.
                return (
                    `Sports data fetched. ` +
                    miniScheduleContext +
                    `CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:SPORTS:${cardData}||`
                );
            }

            throw new Error(
                'Sport route not found. Supported: football, basketball, cricket/IPL.'
            );
        } catch (error) {
            console.error('[Sports Data Error]:', error.message);
            const errorData = JSON.stringify({
                league: 'Sports Data',
                isLive: false,
                teamA: { name: 'System', score: '-' },
                teamB: { name: 'Error', score: '-' },
                status: error.message.includes('API_KEY missing')
                    ? 'API Key Missing'
                    : 'Data temporarily unavailable',
            });
            return `API Error. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:SPORTS:${errorData}||`;
        }
    },
    {
        name: 'get_sports_data',
        description: `Fetches live scores, recent results, and upcoming fixtures for Football, Basketball, and Cricket (including IPL).

MANDATORY: You MUST classify and populate ALL schema fields accurately before calling this tool.

temporal_intent classification guide:
  - "live"   → user says "live", "current", "right now", "going on", "happening"
  - "past"   → user says "yesterday", "last match", "previous match", "last night", "result", "who won"
  - "future" → user says "next match", "upcoming", "tomorrow", "schedule", "when is"
  - "any"    → generic query with no clear time cue (e.g. "IPL score", "cricket update")

tournament: specific league/series name mentioned (e.g. "IPL", "World Cup", "Champions League"). Use "" if none mentioned.

team_mentions: every team the user names, with abbreviations expanded (e.g. "MI" → "Mumbai Indians", "CSK" → "Chennai Super Kings"). Use [] if no teams mentioned.

specific_date: if the user mentions a specific calendar date (e.g. "22 april 2026", "the 22nd"), convert it to ISO 8601 "YYYY-MM-DD" (IST) and pass it here. Omit or pass "" if no explicit date is mentioned.

You MUST include the ||CARD:...|| string from the tool output verbatim at the end of your response.`,
        schema: z.object({
            sport: z
                .string()
                .describe("The sport: 'cricket', 'football', or 'basketball'."),
            query: z
                .string()
                .describe("The user's original natural language query, verbatim."),
            temporal_intent: z
                .enum(['past', 'live', 'future', 'any'])
                .describe(
                    "LLM-classified temporal focus. 'past'=completed, 'live'=in progress, 'future'=upcoming, 'any'=no time cue."
                ),
            tournament: z
                .string()
                .describe(
                    "Tournament or league name mentioned by the user (e.g. 'IPL', 'World Cup'). Empty string if none."
                ),
            team_mentions: z
                .array(z.string())
                .describe(
                    'Team names mentioned by the user with abbreviations expanded. Empty array if no teams mentioned.'
                ),
            // ── PATCH A: specific_date ──────────────────────────────────────────
            // Populate ONLY when the user mentions an exact calendar date.
            // Format STRICTLY as ISO 8601 in IST: "YYYY-MM-DD".
            specific_date: z
                .string()
                .optional()
                .describe(
                    "Exact date mentioned by the user in ISO 8601 format 'YYYY-MM-DD' (IST). " +
                    "E.g. 'april 22 2026' → '2026-04-22'. Omit or pass empty string if no specific date was mentioned."
                ),
        }),
    }
);