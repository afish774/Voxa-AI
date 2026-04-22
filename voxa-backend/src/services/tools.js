import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import Reminder from '../models/Reminder.js';
import User from '../models/User.js';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import { LRUCache } from 'lru-cache';

dotenv.config();

// ============================================================================
// 🧠 ENTERPRISE INFRASTRUCTURE
// ============================================================================

const apiCache = new LRUCache({
    max: 150,
    maxSize: 30 * 1024 * 1024, // 30 MB
    sizeCalculation: (value) => {
        try {
            return Buffer.byteLength(JSON.stringify(value), 'utf8');
        } catch {
            return 1024;
        }
    },
    ttl: 5 * 60 * 1000, // 5 minutes default
    allowStale: false,
});

const fetchWithCacheAndRetry = async (
    url,
    options = {},
    ttlMs = 60000,
    retries = 2,
    timeoutMs = 8000
) => {
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
                    'User-Agent': 'VoxaServer/2.0',
                    ...options.headers,
                },
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (response.status === 429) throw new Error('RATE_LIMIT');
            if (response.status === 451) throw new Error('GEO_BLOCKED_451');
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

            const data = await response.json();
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

                const oAuth2Client = new google.auth.OAuth2(
                    process.env.GOOGLE_CLIENT_ID,
                    process.env.GOOGLE_CLIENT_SECRET,
                    process.env.GOOGLE_REDIRECT_URI
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
                    /* fallback */
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
// ============================================================================

export const getSportsDataTool = tool(
    async ({ sport, query, temporal_intent, tournament, team_mentions, specific_date }) => {
        try {
            // ── Shared IST helpers ──────────────────────────────────────────────
            const toIST = (date) => new Date(new Date(date).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
            const getISTDateString = (date) => new Date(date).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

            const nowIST = toIST(new Date());
            const todayStr = getISTDateString(new Date());

            const yesterdayDate = new Date(nowIST);
            yesterdayDate.setDate(yesterdayDate.getDate() - 1);
            const yesterdayStr = getISTDateString(yesterdayDate);

            const tomorrowDate = new Date(nowIST);
            tomorrowDate.setDate(tomorrowDate.getDate() + 1);
            const tomorrowStr = getISTDateString(tomorrowDate);

            let specificDateStr = null;
            if (specific_date && /^\d{4}-\d{2}-\d{2}$/.test(specific_date.trim())) {
                specificDateStr = getISTDateString(new Date(specific_date.trim() + 'T00:00:00+05:30'));
            }

            const voiceNormalizedQuery = normalizeVoiceInput(query);
            const normalizedMentions = (team_mentions ?? []).map((t) => normalizeVoiceInput(t));

            const fullContextCheck = `${sport} ${voiceNormalizedQuery} ${tournament ?? ''} ${normalizedMentions.join(' ')}`.toLowerCase();

            const isUpcoming =
                temporal_intent === 'future' ||
                voiceNormalizedQuery.includes('upcoming') ||
                voiceNormalizedQuery.includes('tomorrow') ||
                voiceNormalizedQuery.includes('next');

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
                    arsenal: 57, 'aston villa': 58, chelsea: 61, everton: 62,
                    liverpool: 64, 'manchester city': 65, 'manchester united': 66,
                    newcastle: 67, tottenham: 73, 'real madrid': 86,
                    barcelona: 81, 'atletico madrid': 78, 'bayern munich': 5,
                    'borussia dortmund': 4, 'bayer leverkusen': 3, psg: 524,
                    juventus: 109, 'ac milan': 98, inter: 108, napoli: 113, roma: 100,
                };

                const teamId = POPULAR_TEAMS[t1];
                if (!teamId) throw new Error('TEAM_NOT_IN_LOCAL_DB');

                const fixData = await fetchWithCacheAndRetry(`https://api.football-data.org/v4/teams/${teamId}/matches`, { headers }, 30000);
                const allMatches = fixData.matches || [];
                if (allMatches.length === 0) throw new Error('No fixtures found.');

                const now = new Date().getTime();
                let match = null;

                if (t2) {
                    const h2h = allMatches.filter((m) => m.homeTeam.name.toLowerCase().includes(t2) || m.awayTeam.name.toLowerCase().includes(t2));
                    if (h2h.length === 0) throw new Error('H2H_NOT_FOUND');
                    match = isUpcoming
                        ? h2h.filter((m) => new Date(m.utcDate).getTime() > now).sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())[0]
                        : h2h.filter((m) => new Date(m.utcDate).getTime() <= now).sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime())[0];
                } else {
                    match = isUpcoming
                        ? allMatches.filter((m) => new Date(m.utcDate).getTime() > now).sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())[0]
                        : allMatches.filter((m) => new Date(m.utcDate).getTime() <= now).sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime())[0];
                }

                if (!match) throw new Error('No match found.');

                const isLiveResponse = ['IN_PLAY', 'PAUSED'].includes(match.status);
                const isFinishedResponse = match.status === 'FINISHED';

                const cardData = JSON.stringify({
                    league: match.competition.name || 'Football',
                    isLive: isLiveResponse,
                    matchSeconds: isLiveResponse ? 2700 : isFinishedResponse ? 5400 : 0,
                    teamA: { name: match.homeTeam.name, score: match.score?.fullTime?.home ?? '-' },
                    teamB: { name: match.awayTeam.name, score: match.score?.fullTime?.away ?? '-' },
                    status: isLiveResponse ? 'Match Live' : isFinishedResponse ? 'Full Time' : 'Scheduled: ' + new Date(match.utcDate).toLocaleDateString(),
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
                    let res = await fetchWithCacheAndRetry(`https://www.thesportsdb.com/api/v1/json/3/searchevents.php?e=${encodeURIComponent(q1)}`, {}, 60000);
                    if (!res.event) {
                        const q2 = `${t2.replace(/\s+/g, '_')}_vs_${t1.replace(/\s+/g, '_')}`;
                        res = await fetchWithCacheAndRetry(`https://www.thesportsdb.com/api/v1/json/3/searchevents.php?e=${encodeURIComponent(q2)}`, {}, 60000);
                    }
                    const allMatches = res.event || [];
                    const nowMs = Date.now();
                    match = isUpcoming
                        ? allMatches.filter((m) => new Date(m.dateEvent).getTime() >= nowMs).sort((a, b) => new Date(a.dateEvent).getTime() - new Date(b.dateEvent).getTime())[0]
                        : allMatches.filter((m) => new Date(m.dateEvent).getTime() <= nowMs).sort((a, b) => new Date(b.dateEvent).getTime() - new Date(a.dateEvent).getTime())[0];
                } else {
                    const teamData = await fetchWithCacheAndRetry(`https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(t1)}`, {}, 86400000);
                    if (!teamData.teams) throw new Error(`Basketball team not found: ${t1}`);
                    const teamId = teamData.teams[0].idTeam;
                    const fetchUrl = isUpcoming ? `https://www.thesportsdb.com/api/v1/json/3/eventsnext.php?id=${teamId}` : `https://www.thesportsdb.com/api/v1/json/3/eventslast.php?id=${teamId}`;
                    const fixData = await fetchWithCacheAndRetry(fetchUrl, {}, 60000);
                    const eventsArray = isUpcoming ? fixData.events : fixData.results;
                    match = eventsArray?.[0];
                }

                if (!match) throw new Error('No basketball matches found.');

                const cardData = JSON.stringify({
                    league: match.strLeague || 'NBA',
                    isLive: false,
                    teamA: { name: match.strHomeTeam, score: match.intHomeScore || '-' },
                    teamB: { name: match.strAwayTeam, score: match.intAwayScore || '-' },
                    status: isUpcoming ? `Scheduled: ${match.dateEvent}` : 'Final Score',
                });
                return `Sports data fetched. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:SPORTS:${cardData}||`;
            }

            // ==================================================================
            // 🏏 ROUTE 3: CRICKET — NATIVE IN-HOUSE FETCHER (No RapidAPI)
            // Architecture: 3-source waterfall.
            //   Primary   → ESPN Cricinfo hs-consumer-api (public, unauthenticated)
            //   Secondary → Cricbuzz public web JSON endpoint (no proxy, no key)
            //   Tertiary  → IPLT20 official score feed (IPL-specific queries only)
            // All sources are normalised into one canonical schema before the
            // existing scoring engine processes them — zero downstream changes.
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
                // ── Shared browser-like headers — required by all three sources ──
                const cricketHeaders = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Origin': 'https://www.espncricinfo.com',
                    'Referer': 'https://www.espncricinfo.com/',
                };

                // ── ESPN Cricinfo endpoints ──────────────────────────────────────
                const ESPN_CURRENT = 'https://hs-consumer-api.espncricinfo.com/v1/pages/matches/current?lang=en&latest=true';
                const ESPN_UPCOMING = 'https://hs-consumer-api.espncricinfo.com/v1/pages/matches/upcoming?lang=en&onlyMatchCards=true';
                const ESPN_RECENT = 'https://hs-consumer-api.espncricinfo.com/v1/pages/matches/recent?lang=en&onlyMatchCards=true';

                // ── Cricbuzz public web-JSON endpoints (zero auth, same feed their site uses)
                const CBZ_LIVE = 'https://www.cricbuzz.com/api/cricket-match/live-matches';
                const CBZ_UPCOMING = 'https://www.cricbuzz.com/api/cricket-match/upcoming-matches';
                const CBZ_RECENT = 'https://www.cricbuzz.com/api/cricket-match/recent-matches';

                // ── IPL T20 official score feed (IPL-specific fallback) ──────────
                const IPL_LIVE = 'https://ipl-stats-sports-mechanic.s3.ap-south-1.amazonaws.com/ipl/feeds/standings.js?callback=onStandingData';

                // ────────────────────────────────────────────────────────────────
                // normalizeMatchData()
                // The single canonical normaliser. Accepts raw match objects from
                // ESPN Cricinfo, Cricbuzz web-JSON, or IPL feeds and returns the
                // exact structure the Voxa scoring engine requires.
                // ────────────────────────────────────────────────────────────────
                const normalizeMatchData = (raw, source = 'espn') => {
                    try {
                        if (source === 'espn') {
                            // ESPN Cricinfo hs-consumer-api match card structure
                            const ms = raw.matchScore || {};
                            const mInfo = raw.match || raw;
                            const t1 = mInfo.team1 || {};
                            const t2 = mInfo.team2 || {};
                            const series = mInfo.series || mInfo.tournament || {};

                            // State mapping: ESPN uses 'live'|'completed'|'upcoming'|'innings break' etc.
                            const stateRaw = (mInfo.state || mInfo.matchPlayingStatus || '').toLowerCase();
                            const matchStarted = !stateRaw.includes('preview') && !stateRaw.includes('upcoming') && stateRaw !== '';
                            const matchEnded = stateRaw.includes('complete') || stateRaw.includes('finished') || stateRaw.includes('result') || stateRaw.includes('ended');

                            // Score extraction — ESPN nests per-innings in `inningScores[]`
                            const buildScoreArr = (scoreObj, teamName) => {
                                const inningScores = scoreObj?.inningScores || [];
                                if (inningScores.length > 0) {
                                    return inningScores.map((inn) => ({
                                        inning: inn.inningName || teamName,
                                        r: inn.runs ?? 0,
                                        w: inn.wickets ?? 0,
                                        o: inn.overs ?? '0.0',
                                    }));
                                }
                                // Fallback to flat score if inningScores absent
                                if (scoreObj?.runs != null) {
                                    return [{
                                        inning: teamName,
                                        r: scoreObj.runs ?? 0,
                                        w: scoreObj.wickets ?? 0,
                                        o: scoreObj.overs ?? '0.0',
                                    }];
                                }
                                return [];
                            };

                            const scoreArr = [
                                ...buildScoreArr(ms.team1Score, t1.longName || t1.name || 'Team A'),
                                ...buildScoreArr(ms.team2Score, t2.longName || t2.name || 'Team B'),
                            ];

                            return {
                                id: (mInfo.objectId || mInfo.id || '').toString(),
                                name: `${t1.longName || t1.name || 'TBD'} vs ${t2.longName || t2.name || 'TBD'}`,
                                series: series.longName || series.name || '',
                                date: new Date(mInfo.startDate || mInfo.startTime || Date.now()),
                                matchStarted,
                                matchEnded,
                                status: mInfo.statusText || mInfo.matchStatusText || (matchEnded ? 'Finished' : matchStarted ? 'In Progress' : 'Upcoming'),
                                teams: [t1.longName || t1.name || 'Team A', t2.longName || t2.name || 'Team B'],
                                score: scoreArr,
                            };
                        }

                        if (source === 'cricbuzz') {
                            // Cricbuzz public web-JSON structure
                            const info = raw.matchInfo || raw;
                            const score = raw.matchScore || {};
                            const t1 = info.team1 || {};
                            const t2 = info.team2 || {};

                            const stateRaw = (info.state || '').toLowerCase();
                            const matchStarted = stateRaw !== 'preview' && stateRaw !== 'upcoming';
                            const matchEnded = stateRaw === 'complete' || stateRaw === 'result';

                            return {
                                id: (info.matchId || info.id || '').toString(),
                                name: `${t1.teamName || 'TBD'} vs ${t2.teamName || 'TBD'}`,
                                series: info.seriesName || '',
                                date: new Date(parseInt(info.startDate || '0')),
                                matchStarted,
                                matchEnded,
                                status: info.status || (matchEnded ? 'Finished' : matchStarted ? 'In Progress' : 'Upcoming'),
                                teams: [t1.teamName || 'Team A', t2.teamName || 'Team B'],
                                score: [
                                    {
                                        inning: t1.teamName || 'Team A',
                                        r: score?.team1Score?.inngs1?.runs ?? 0,
                                        w: score?.team1Score?.inngs1?.wickets ?? 0,
                                        o: score?.team1Score?.inngs1?.overs ?? '0.0',
                                    },
                                    {
                                        inning: t2.teamName || 'Team B',
                                        r: score?.team2Score?.inngs1?.runs ?? 0,
                                        w: score?.team2Score?.inngs1?.wickets ?? 0,
                                        o: score?.team2Score?.inngs1?.overs ?? '0.0',
                                    },
                                ],
                            };
                        }

                        // source === 'ipl' — IPLT20 standings/live feed
                        // This feed returns team standings; we synthesise a lightweight
                        // match stub so the scoring engine can still surface IPL context.
                        if (source === 'ipl') {
                            const t1 = raw.Team1 || raw.HomeTeam || {};
                            const t2 = raw.Team2 || raw.AwayTeam || {};
                            return {
                                id: (raw.MatchID || raw.matchid || '').toString(),
                                name: `${t1.Name || t1.ShortName || 'TBD'} vs ${t2.Name || t2.ShortName || 'TBD'}`,
                                series: 'IPL 2026',
                                date: raw.StartDate ? new Date(raw.StartDate) : new Date(),
                                matchStarted: raw.MatchStarted === true || raw.Status === 'Live',
                                matchEnded: raw.MatchEnded === true || raw.Status === 'Result',
                                status: raw.StatusText || raw.Status || 'IPL Match',
                                teams: [t1.Name || t1.ShortName || 'TBD', t2.Name || t2.ShortName || 'TBD'],
                                score: [
                                    {
                                        inning: t1.Name || t1.ShortName || 'Team A',
                                        r: parseInt(raw.Team1Runs || 0),
                                        w: parseInt(raw.Team1Wickets || 0),
                                        o: raw.Team1Overs || '0.0',
                                    },
                                    {
                                        inning: t2.Name || t2.ShortName || 'Team B',
                                        r: parseInt(raw.Team2Runs || 0),
                                        w: parseInt(raw.Team2Wickets || 0),
                                        o: raw.Team2Overs || '0.0',
                                    },
                                ],
                            };
                        }

                        return null;
                    } catch (normErr) {
                        console.warn('[normalizeMatchData] Skipping malformed entry:', normErr.message);
                        return null;
                    }
                };

                // ── SOURCE A: ESPN Cricinfo (primary) ────────────────────────────
                // Fetch all three ESPN feeds in parallel — same latency as one request.
                let mergedMatches = [];

                try {
                    const espnFetchOpts = { headers: cricketHeaders };
                    const [espnCurrent, espnUpcoming, espnRecent] = await Promise.allSettled([
                        fetchWithCacheAndRetry(ESPN_CURRENT, espnFetchOpts, 30000),
                        fetchWithCacheAndRetry(ESPN_UPCOMING, espnFetchOpts, 300000),
                        fetchWithCacheAndRetry(ESPN_RECENT, espnFetchOpts, 120000),
                    ]);

                    // ESPN wraps matches in `content.matchCards[]` or `matches[]`
                    const extractEspnMatches = (result) => {
                        if (result.status !== 'fulfilled') return [];
                        const data = result.value;
                        // Try the standard matchCards envelope first
                        if (Array.isArray(data?.content?.matchCards)) {
                            return data.content.matchCards.map((mc) => mc.match || mc).filter(Boolean);
                        }
                        // Fallback: flat matches array
                        if (Array.isArray(data?.matches)) return data.matches;
                        // Some current endpoints wrap in content.matches
                        if (Array.isArray(data?.content?.matches)) return data.content.matches;
                        return [];
                    };

                    const espnRaw = [
                        ...extractEspnMatches(espnCurrent),
                        ...extractEspnMatches(espnUpcoming),
                        ...extractEspnMatches(espnRecent),
                    ];

                    const seenIds = new Set();
                    for (const raw of espnRaw) {
                        const normalized = normalizeMatchData(raw, 'espn');
                        if (normalized?.id && !seenIds.has(normalized.id) && normalized.name !== 'TBD vs TBD') {
                            seenIds.add(normalized.id);
                            mergedMatches.push(normalized);
                        }
                    }
                    console.log(`[Cricket/ESPN] Normalised ${mergedMatches.length} matches from ESPN Cricinfo.`);
                } catch (espnErr) {
                    console.warn('[Cricket/ESPN] Primary source failed:', espnErr.message);
                }

                // ── SOURCE B: Cricbuzz public web-JSON (secondary fallback) ──────
                if (mergedMatches.length === 0) {
                    console.log('[Cricket] ESPN returned 0 matches. Falling back to Cricbuzz web-JSON...');
                    try {
                        const cbzFetchOpts = {
                            headers: {
                                ...cricketHeaders,
                                'Origin': 'https://www.cricbuzz.com',
                                'Referer': 'https://www.cricbuzz.com/',
                            }
                        };
                        const [cbzLive, cbzUpcoming, cbzRecent] = await Promise.allSettled([
                            fetchWithCacheAndRetry(CBZ_LIVE, cbzFetchOpts, 30000),
                            fetchWithCacheAndRetry(CBZ_UPCOMING, cbzFetchOpts, 300000),
                            fetchWithCacheAndRetry(CBZ_RECENT, cbzFetchOpts, 120000),
                        ]);

                        // Cricbuzz web-JSON nests matches inside typeMatches[].seriesMatches[].seriesAdWrapper.matches
                        const extractCbzMatches = (result) => {
                            if (result.status !== 'fulfilled') return [];
                            const data = result.value;
                            const out = [];
                            for (const type of (data?.typeMatches || [])) {
                                for (const series of (type.seriesMatches || [])) {
                                    const arr = series.seriesAdWrapper?.matches || series.matches || [];
                                    out.push(...arr);
                                }
                            }
                            // Flat fallback
                            if (out.length === 0 && Array.isArray(data?.matches)) out.push(...data.matches);
                            return out;
                        };

                        const cbzRaw = [
                            ...extractCbzMatches(cbzLive),
                            ...extractCbzMatches(cbzUpcoming),
                            ...extractCbzMatches(cbzRecent),
                        ];

                        const seenIds = new Set();
                        for (const raw of cbzRaw) {
                            const normalized = normalizeMatchData(raw, 'cricbuzz');
                            if (normalized?.id && !seenIds.has(normalized.id) && normalized.name !== 'TBD vs TBD') {
                                seenIds.add(normalized.id);
                                mergedMatches.push(normalized);
                            }
                        }
                        console.log(`[Cricket/Cricbuzz] Normalised ${mergedMatches.length} matches from Cricbuzz web-JSON.`);
                    } catch (cbzErr) {
                        console.warn('[Cricket/Cricbuzz] Secondary source failed:', cbzErr.message);
                    }
                }

                // ── SOURCE C: IPLT20 official feed (tertiary — IPL-specific only) ─
                const isIplQueryEarly =
                    fullContextCheck.includes('ipl') ||
                    fullContextCheck.includes('indian premier') ||
                    (tournament ?? '').toLowerCase().includes('ipl');

                if (mergedMatches.length === 0 && isIplQueryEarly) {
                    console.log('[Cricket] All sources empty for IPL query. Trying IPLT20 official feed...');
                    try {
                        const iplRaw = await fetchWithCacheAndRetry(
                            IPL_LIVE,
                            {
                                headers: {
                                    ...cricketHeaders,
                                    'Origin': 'https://www.iplt20.com',
                                    'Referer': 'https://www.iplt20.com/',
                                }
                            },
                            60000
                        );
                        // The IPLT20 feed is JSONP: `onStandingData({...})` — strip the wrapper
                        const iplJson = typeof iplRaw === 'string'
                            ? JSON.parse(iplRaw.replace(/^[^(]+\(/, '').replace(/\);?\s*$/, ''))
                            : iplRaw;

                        const iplMatches = iplJson?.Standings?.Standing || iplJson?.matches || [];
                        const seenIds = new Set();
                        for (const raw of iplMatches) {
                            const normalized = normalizeMatchData(raw, 'ipl');
                            if (normalized?.id && !seenIds.has(normalized.id)) {
                                seenIds.add(normalized.id);
                                mergedMatches.push(normalized);
                            }
                        }
                        console.log(`[Cricket/IPLT20] Normalised ${mergedMatches.length} entries from IPLT20 feed.`);
                    } catch (iplErr) {
                        console.warn('[Cricket/IPLT20] Tertiary source failed:', iplErr.message);
                    }
                }

                if (mergedMatches.length === 0) {
                    throw new Error('No cricket data available. All three sources (ESPN, Cricbuzz, IPLT20) failed or returned empty feeds.');
                }

                const tournamentLower = (tournament ?? '').toLowerCase();
                const isIplQuery =
                    tournamentLower.includes('ipl') ||
                    tournamentLower.includes('indian premier') ||
                    fullContextCheck.includes('ipl') ||
                    fullContextCheck.includes('indian premier');

                const scoredMatches = mergedMatches
                    .filter((m) => Boolean(m.name))
                    .map((match) => {
                        let score = 0;
                        const matchNameLower = (match.name || '').toLowerCase();
                        const matchSeriesLower = (match.series || '').toLowerCase();
                        const matchDateObj = new Date(match.date);
                        const matchDateStr = getISTDateString(matchDateObj);

                        const isMatchLive = match.matchStarted === true && match.matchEnded === false;
                        const isMatchFinished = match.matchEnded === true;
                        const isMatchFuture = match.matchStarted === false && match.matchEnded === false;

                        // ── STRICT TOURNAMENT GATE ────────────────────────────────
                        const isTournamentRequested = isIplQuery || tournamentLower !== '';
                        const matchesTournament =
                            (isIplQuery && (matchSeriesLower.includes('ipl') || matchSeriesLower.includes('indian premier'))) ||
                            (tournamentLower !== '' && (matchSeriesLower.includes(tournamentLower) || matchNameLower.includes(tournamentLower)));

                        if (isTournamentRequested && !matchesTournament) {
                            return { match, score: 0, matchDateObj, matchDateStr };
                        }

                        // ── Tier A: Tournament priority ──────────────────────────
                        if (matchesTournament) {
                            score += isIplQuery ? 500 : 300;
                        }

                        // ── Tier B: Team name token matching ─────────────────────
                        for (const token of normalizedMentions) {
                            if (token.length > 1 && (matchNameLower.includes(token) || matchSeriesLower.includes(token))) {
                                score += 100;
                            }
                        }

                        // ── Tier C: Structured temporal intent (IST-accurate) ────
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
                        if (temporal_intent === 'future') return a.matchDateObj - b.matchDateObj;
                        return b.matchDateObj - a.matchDateObj;
                    });

                if (scoredMatches.length === 0 || scoredMatches[0].score === 0) {
                    const dateHint = specificDateStr ? ` for ${specificDateStr}` : '';
                    const tournamentHint = tournament ? ` in ${tournament}` : (isIplQuery ? ` in IPL` : '');
                    return (
                        `No cricket fixtures were found${tournamentHint}${dateHint} in the current live feed. ` +
                        `Explain to the user naturally that there are no scheduled or active matches matching ` +
                        `their request right now. CRITICAL: DO NOT APPEND A ||CARD:...|| STRING.`
                    );
                }

                const targetMatch = scoredMatches[0].match;

                // ── MULTI-MATCH CONTEXT PAYLOAD ─────────────────────────
                const scheduleKeywords = ['schedule', 'fixture', 'fixtures', 'upcoming', 'coming up', 'next matches', 'matches this week', 'calendar'];
                const isScheduleQuery = temporal_intent === 'future' || scheduleKeywords.some((kw) => voiceNormalizedQuery.includes(kw));

                let miniScheduleContext = '';

                if (isScheduleQuery) {
                    const upcomingMatches = scoredMatches
                        .filter(({ match: m, score }) => m.matchStarted === false && m.matchEnded === false && score > 0)
                        .sort((a, b) => a.matchDateObj - b.matchDateObj)
                        .slice(0, 5);

                    if (upcomingMatches.length > 0) {
                        const scheduleLines = upcomingMatches.map(({ match: m, matchDateStr: ds }, idx) => `${idx + 1}. ${m.name} on ${ds}`);
                        miniScheduleContext = `Here is the upcoming schedule to read to the user: ` + scheduleLines.join(', ') + `. `;
                    } else {
                        miniScheduleContext = `No upcoming fixtures were found matching the request. Inform the user that the schedule may not yet be published. `;
                    }
                }

                // ── Score extraction ────────────────────────────────────────────
                const teamAName = targetMatch.teams?.[0] || 'Team A';
                const teamBName = targetMatch.teams?.[1] || 'Team B';
                let scoreA = '-';
                let scoreB = '-';
                let oversA = null;
                let crr = null;

                const isLiveResponse = targetMatch.matchStarted === true && targetMatch.matchEnded === false;

                if (Array.isArray(targetMatch.score) && targetMatch.score.length > 0) {
                    const findScore = (teamName, scores) => {
                        const words = (teamName || '').toLowerCase().split(' ').filter((w) => w.length > 2);
                        for (const w of words) {
                            const found = scores.find((s) => s.inning?.toLowerCase().includes(w));
                            if (found) return found;
                        }
                        return null;
                    };

                    let sA = findScore(teamAName, targetMatch.score);
                    let sB = findScore(teamBName, targetMatch.score);

                    if (!sA && targetMatch.score[0]) sA = targetMatch.score[0];
                    if (!sB && targetMatch.score[1] && targetMatch.score[1] !== sA) sB = targetMatch.score[1];

                    if (sA) {
                        const r = sA.r ?? 0;
                        const w = sA.w ?? 0;
                        scoreA = `${r}/${w}`;
                        oversA = sA.o ?? '0.0';
                        const numOvers = parseFloat(oversA);
                        if (!isNaN(numOvers) && numOvers > 0) {
                            const oMath = Math.floor(numOvers) + (((numOvers * 10) % 10) / 6);
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

                const isFinished = targetMatch.matchEnded === true;
                const isNotStarted = targetMatch.matchStarted === false;

                let statusText;
                if (isLiveResponse) {
                    statusText = targetMatch.status || 'Live';
                } else if (isFinished) {
                    statusText = targetMatch.status || 'Finished';
                } else if (isNotStarted) {
                    const matchTimeIST = new Date(targetMatch.date).toLocaleTimeString('en-IN', {
                        timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true,
                    });
                    statusText = `Scheduled: Today at ${matchTimeIST} IST`;
                } else {
                    statusText = targetMatch.status || 'Match Info';
                }

                const cardData = JSON.stringify({
                    league: targetMatch.series?.toUpperCase() || 'Cricket',
                    isLive: isLiveResponse,
                    battingTeam: teamAName,
                    battingScore: scoreA,
                    battingOvers: oversA,
                    bowlingTeam: teamBName,
                    bowlingScore: scoreB,
                    crr,
                    status: statusText,
                });

                return (
                    `Sports data fetched. ` +
                    miniScheduleContext +
                    `CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:SPORTS:${cardData}||`
                );
            }

            throw new Error('Sport route not found. Supported: football, basketball, cricket/IPL.');
        } catch (error) {
            console.error('[Sports Data Error]:', error.message);
            const errorData = JSON.stringify({
                league: 'Sports Data',
                isLive: false,
                teamA: { name: 'System', score: '-' },
                teamB: { name: 'Error', score: '-' },
                status: 'Data temporarily unavailable',
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
            sport: z.string().describe("The sport: 'cricket', 'football', or 'basketball'."),
            query: z.string().describe("The user's original natural language query, verbatim."),
            temporal_intent: z.enum(['past', 'live', 'future', 'any']).describe("LLM-classified temporal focus. 'past'=completed, 'live'=in progress, 'future'=upcoming, 'any'=no time cue."),
            tournament: z.string().describe("Tournament or league name mentioned by the user (e.g. 'IPL', 'World Cup'). Empty string if none."),
            team_mentions: z.array(z.string()).describe('Team names mentioned by the user with abbreviations expanded. Empty array if no teams mentioned.'),
            specific_date: z.string().optional().describe("Exact date mentioned by the user in ISO 8601 format 'YYYY-MM-DD' (IST). E.g. 'april 22 2026' → '2026-04-22'. Omit or pass empty string if no specific date was mentioned."),
        }),
    }
);