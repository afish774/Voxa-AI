import { tool } from "@langchain/core/tools";
import { z } from "zod";
import Reminder from "../models/Reminder.js";
import User from "../models/User.js";
import { google } from "googleapis";
import dotenv from "dotenv";
import Transaction from "../models/Transaction.js";
import WorkoutLog from "../models/WorkoutLog.js";
import { LRUCache } from "lru-cache"; // ✅ FIX: mongoose import removed — auto-casting handles userId string→ObjectId

dotenv.config();

// ============================================================================
// 🧠 ENTERPRISE LRU CACHE INFRASTRUCTURE
// 🛠️ AUDIT FIX: [BUG-01]
// ============================================================================

const apiCache = new LRUCache({
  max: 150,
  maxSize: 30 * 1024 * 1024,
  sizeCalculation: (value) => {
    try {
      return Buffer.byteLength(JSON.stringify(value), "utf8");
    } catch {
      return 1024;
    }
  },
  ttl: 5 * 60 * 1000,
  allowStale: false,
});

// 🛡️ OMNI-AUDIT FIX: [SEC-API-01] Strip API keys from cache keys.
// API keys embedded in URLs (AVIATIONSTACK, CRICKET, GNEWS, etc.) were used
// verbatim as LRU cache keys. Any logging, error trace, or monitoring tool
// capturing cache keys would leak production credentials. This function
// redacts known key parameters while preserving the rest of the URL for
// cache uniqueness.
const sanitizeCacheKey = (url) => {
  try {
    const u = new URL(url);
    const sensitiveParams = ["apikey", "api_key", "access_key", "token", "key"];
    for (const param of sensitiveParams) {
      if (u.searchParams.has(param)) {
        u.searchParams.set(param, "REDACTED");
      }
    }
    return u.toString();
  } catch {
    // Non-standard URL — strip everything after '?' as a safe fallback
    return url.split("?")[0] || url;
  }
};

const fetchWithCacheAndRetry = async (
  url,
  options = {},
  ttlMs = 60000,
  retries = 2,
  timeoutMs = 8000,
) => {
  // 🛡️ OMNI-AUDIT FIX: [SEC-API-01] Use sanitized key for cache ops and logs
  const cacheKey = sanitizeCacheKey(url);
  const cached = apiCache.get(cacheKey);
  if (cached !== undefined) {
    console.log(`⚡ [Cache Hit] 0ms latency for: ${cacheKey}`);
    return cached;
  }
  for (let i = 0; i <= retries; i++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          Accept: "application/json",
          "User-Agent": "VoxaServer/1.0",
          ...options.headers,
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (response.status === 429) throw new Error("RATE_LIMIT");
      if (response.status === 451) throw new Error("GEO_BLOCKED_451");
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      const data = await response.json();
      apiCache.set(cacheKey, data, { ttl: ttlMs }); // 🛡️ OMNI-AUDIT FIX: [SEC-API-01] sanitized key
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (i === retries) {
        console.error(`[API Error] Failed fetching ${url}:`, error.message);
        throw error;
      }
      const backoffTime = 500 * Math.pow(2, i);
      console.warn(`[Retry ${i + 1}] Waiting ${backoffTime}ms...`);
      await new Promise((res) => setTimeout(res, backoffTime));
    }
  }
};

const normalizeVoiceInput = (query) => {
  let clean = query.toLowerCase();
  const map = {
    "man city": "manchester city",
    "man utd": "manchester united",
    spurs: "tottenham",
    rcb: "royal challengers",
    csk: "chennai super kings",
    mi: "mumbai indians",
    srh: "sunrisers",
    kkr: "kolkata knight",
    pbks: "punjab kings",
    dc: "delhi capitals",
    rr: "rajasthan royals",
    lsg: "lucknow super",
    gt: "gujarat titans",
  };
  for (const [slang, strict] of Object.entries(map)) {
    clean = clean.replace(new RegExp(`\\b${slang}\\b`, "g"), strict);
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
        if (!userId) return "SYSTEM_ERROR: User ID missing.";
        await Reminder.create({ user: userId, task });
        return `Task saved successfully. YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:RECEIPT:Reminder Saved:${task}||`;
      } catch {
        return `Database error. YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:RECEIPT:Failed to Save:Database Error||`;
      }
    },
    {
      name: "save_reminder",
      description: "Saves a reminder or to-do task for the user.",
      schema: z.object({
        // 🛡️ GLOBAL XML FIX: Rationale parameter added
        rationale: z
          .string()
          .describe(
            "Briefly explain why you are calling this tool. This parameter is mandatory to ensure stable XML generation.",
          ),
        task: z.string().describe("The specific task to remember."),
      }),
    },
  );

// ============================================================================
// 🛠️ TOOL 2: Crypto Price (CoinPaprika)
// ============================================================================

export const getCryptoPriceTool = tool(
  async ({ coinId }) => {
    try {
      const normalizedCoin = coinId.toLowerCase().trim();
      const symbols = {
        bitcoin: "btc-bitcoin",
        btc: "btc-bitcoin",
        ethereum: "eth-ethereum",
        eth: "eth-ethereum",
        solana: "sol-solana",
        sol: "sol-solana",
        dogecoin: "doge-dogecoin",
        doge: "doge-dogecoin",
        cardano: "ada-cardano",
        ada: "ada-cardano",
        xrp: "xrp-xrp",
        ripple: "xrp-xrp",
        "binance coin": "bnb-binance-coin",
        bnb: "bnb-binance-coin",
      };
      const paprikaCoin = symbols[normalizedCoin] || "btc-bitcoin";
      const displayName =
        Object.keys(symbols).find((key) => symbols[key] === paprikaCoin) ||
        normalizedCoin;
      const url = `https://api.coinpaprika.com/v1/tickers/${paprikaCoin}`;
      const data = await fetchWithCacheAndRetry(url, {}, 60000);
      if (data?.quotes?.USD) {
        const price = parseFloat(data.quotes.USD.price).toFixed(2);
        const change = parseFloat(data.quotes.USD.percent_change_24h).toFixed(
          2,
        );
        return `Price fetched. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:CRYPTO:${displayName}:${price}:${change}||`;
      }
      return `Data not found. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:CRYPTO:${displayName}:Not Found:0.00||`;
    } catch (error) {
      console.error("[Crypto API Error]:", error);
      return `System error. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:CRYPTO:${coinId}:System Offline:0.00||`;
    }
  },
  {
    name: "get_crypto_price",
    description:
      "Fetches live cryptocurrency prices. You MUST include the ||CARD...|| string in your final message.",
    schema: z.object({
      // 🛡️ GLOBAL XML FIX: Rationale parameter added
      rationale: z
        .string()
        .describe(
          "Briefly explain why you are calling this tool. This parameter is mandatory to ensure stable XML generation.",
        ),
      coinId: z
        .string()
        .describe("The full name of the coin, e.g., bitcoin, ethereum"),
    }),
  },
);

// ============================================================================
// 🛠️ TOOL 3: Send Email (Google Gmail API)
// ============================================================================

export const createSendEmailTool = (userId) =>
  tool(
    async ({ to, subject, body }) => {
      try {
        if (!userId) return "SYSTEM_ERROR: User ID missing.";
        const user = await User.findById(userId);
        if (!user) return "SYSTEM_ERROR: User not found.";
        if (!user.gmailAccessToken || !user.gmailRefreshToken) {
          return `Action failed. YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:RECEIPT:Email Failed:Please link your Google Account.||`;
        }
        const oAuth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.GOOGLE_REDIRECT_URI,
        );
        oAuth2Client.setCredentials({
          access_token: user.gmailAccessToken,
          refresh_token: user.gmailRefreshToken,
        });
        const gmail = google.gmail({ version: "v1", auth: oAuth2Client });
        const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString("base64")}?=`;
        const messageParts = [
          `To: ${to}`,
          `Subject: ${utf8Subject}`,
          `Content-Type: text/plain; charset=utf-8`,
          `MIME-Version: 1.0`,
          ``,
          body,
        ];
        const encodedMessage = Buffer.from(messageParts.join("\n"))
          .toString("base64")
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "");
        await gmail.users.messages.send({
          userId: "me",
          requestBody: { raw: encodedMessage },
        });
        return `Email sent. YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:RECEIPT:Email Sent:${to}||`;
      } catch (error) {
        console.error("[Email Error]:", error);
        return `Email failed. YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:RECEIPT:Email Failed:Token Expired or Network Error||`;
      }
    },
    {
      name: "send_email",
      description: "Sends an email via Gmail.",
      schema: z.object({
        // 🛡️ GLOBAL XML FIX: Rationale parameter added
        rationale: z
          .string()
          .describe(
            "Briefly explain why you are calling this tool. This parameter is mandatory to ensure stable XML generation.",
          ),
        to: z.string().describe("Recipient email address."),
        subject: z.string().describe("Email subject line."),
        body: z.string().describe("Email body text."),
      }),
    },
  );

// ============================================================================
// 🛠️ TOOL 4: Weather — Current Conditions (wttr.in)
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
        const conditionDesc = cc.weatherDesc?.[0]?.value?.toLowerCase() ?? "";
        let condition = "Clear";
        if (
          conditionDesc.includes("rain") ||
          conditionDesc.includes("drizzle") ||
          conditionDesc.includes("shower")
        )
          condition = "Rain";
        else if (
          conditionDesc.includes("cloud") ||
          conditionDesc.includes("overcast")
        )
          condition = "Cloudy";
        else if (
          conditionDesc.includes("snow") ||
          conditionDesc.includes("ice")
        )
          condition = "Snow";
        const windSpeed = cc.windspeedKmph ? `${cc.windspeedKmph} km/h` : "--";
        const humidity = cc.humidity ? `${cc.humidity}%` : "--";
        let rainChance = "--";
        try {
          const hourly = data.weather?.[0]?.hourly;
          if (hourly?.length > 0) {
            let max = 0;
            hourly.forEach((s) => {
              const c = parseInt(s.chanceofrain || "0", 10);
              if (c > max) max = c;
            });
            rainChance = `${max}%`;
          }
        } catch {
          /* fallback */
        }
        return `Weather fetched. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:WEATHER:${location}:${temp}:${condition}:${windSpeed}:${humidity}:${rainChance}||`;
      }
      return `Location unknown. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:WEATHER:${location}:--:Unknown||`;
    } catch (error) {
      console.error("[Weather Error]:", error);
      return `API error. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:WEATHER:${location}:--:Offline||`;
    }
  },
  {
    name: "get_weather",
    description:
      'Fetches CURRENT weather conditions for a city (temperature, condition, wind, humidity). Use this for "what is the weather now / today". For a 7-day weekly forecast use get_weather_forecast instead.',
    schema: z.object({
      // 🛡️ GLOBAL XML FIX: Rationale parameter added
      rationale: z
        .string()
        .describe(
          "Briefly explain why you are calling this tool. This parameter is mandatory to ensure stable XML generation.",
        ),
      location: z.string().describe("City name."),
    }),
  },
);

// ============================================================================
// 🌍 TOOL 5: Global Sports Hub (Football · Basketball · Cricket/IPL)
// ⚠️  DO NOT MODIFY — structured temporal scoring engine preserved verbatim.
// ============================================================================

export const getSportsDataTool = tool(
  async ({
    sport,
    query,
    temporal_intent,
    tournament,
    team_mentions,
    specific_date,
  }) => {
    try {
      if (temporal_intent && !["past", "live", "future", "any"].includes(temporal_intent)) {
        temporal_intent = "any";
      }

      const toIST = (date) =>
        new Date(
          new Date(date).toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
        );
      const getISTDateString = (date) =>
        new Date(date).toLocaleDateString("en-CA", {
          timeZone: "Asia/Kolkata",
        });
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
        specificDateStr = getISTDateString(
          new Date(specific_date.trim() + "T00:00:00+05:30"),
        );
      }
      const voiceNormalizedQuery = normalizeVoiceInput(query);
      const normalizedMentions = (team_mentions ?? []).map((t) =>
        normalizeVoiceInput(t),
      );
      const fullContextCheck =
        `${sport} ${voiceNormalizedQuery} ${tournament ?? ""} ${normalizedMentions.join(" ")}`.toLowerCase();
      const isUpcoming =
        temporal_intent === "future" ||
        voiceNormalizedQuery.includes("upcoming") ||
        voiceNormalizedQuery.includes("tomorrow") ||
        voiceNormalizedQuery.includes("next");
      const t1 = normalizedMentions[0] ?? voiceNormalizedQuery.trim();
      const t2 = normalizedMentions[1] ?? null;

      if (
        fullContextCheck.includes("football") ||
        fullContextCheck.includes("soccer") ||
        fullContextCheck.includes("epl") ||
        fullContextCheck.includes("ucl") ||
        fullContextCheck.includes("madrid") ||
        fullContextCheck.includes("city") ||
        fullContextCheck.includes("united") ||
        fullContextCheck.includes("arsenal") ||
        fullContextCheck.includes("chelsea") ||
        fullContextCheck.includes("liverpool")
      ) {
        const apiKey = process.env.FOOTBALL_DATA_TOKEN;
        if (!apiKey) throw new Error("FOOTBALL_DATA_TOKEN missing");
        const headers = { "X-Auth-Token": apiKey };
        const POPULAR_TEAMS = {
          arsenal: 57,
          "aston villa": 58,
          chelsea: 61,
          everton: 62,
          liverpool: 64,
          "manchester city": 65,
          "manchester united": 66,
          newcastle: 67,
          tottenham: 73,
          "real madrid": 86,
          barcelona: 81,
          "atletico madrid": 78,
          "bayern munich": 5,
          "borussia dortmund": 4,
          "bayer leverkusen": 3,
          psg: 524,
          juventus: 109,
          "ac milan": 98,
          inter: 108,
          napoli: 113,
          roma: 100,
        };
        const teamId = POPULAR_TEAMS[t1];
        if (!teamId) throw new Error("TEAM_NOT_IN_LOCAL_DB");
        const fixData = await fetchWithCacheAndRetry(
          `https://api.football-data.org/v4/teams/${teamId}/matches`,
          { headers },
          30000,
        );
        const allMatches = fixData.matches || [];
        if (!allMatches.length) throw new Error("No fixtures found.");
        const now = new Date().getTime();
        let match = null;
        if (t2) {
          const h2h = allMatches.filter(
            (m) =>
              m.homeTeam.name.toLowerCase().includes(t2) ||
              m.awayTeam.name.toLowerCase().includes(t2),
          );
          if (!h2h.length) throw new Error("H2H_NOT_FOUND");
          match = isUpcoming
            ? h2h
                .filter((m) => new Date(m.utcDate).getTime() > now)
                .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate))[0]
            : h2h
                .filter((m) => new Date(m.utcDate).getTime() <= now)
                .sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate))[0];
        } else {
          match = isUpcoming
            ? allMatches
                .filter((m) => new Date(m.utcDate).getTime() > now)
                .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate))[0]
            : allMatches
                .filter((m) => new Date(m.utcDate).getTime() <= now)
                .sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate))[0];
        }
        if (!match) throw new Error("No match found.");
        const isLiveR = ["IN_PLAY", "PAUSED"].includes(match.status);
        const isFinR = match.status === "FINISHED";
        const cardData = JSON.stringify({
          league: match.competition.name || "Football",
          isLive: isLiveR,
          matchSeconds: isLiveR ? 2700 : isFinR ? 5400 : 0,
          teamA: {
            name: match.homeTeam.name,
            score: match.score?.fullTime?.home ?? "-",
          },
          teamB: {
            name: match.awayTeam.name,
            score: match.score?.fullTime?.away ?? "-",
          },
          status: isLiveR
            ? "Match Live"
            : isFinR
              ? "Full Time"
              : "Scheduled: " + new Date(match.utcDate).toLocaleDateString(),
        });
        return `Sports data fetched. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:SPORTS:${cardData}||`;
      } else if (
        fullContextCheck.includes("basketball") ||
        fullContextCheck.includes("nba") ||
        fullContextCheck.includes("lakers") ||
        fullContextCheck.includes("warriors")
      ) {
        let match = null;
        if (t2) {
          const q1 = `${t1.replace(/\s+/g, "_")}_vs_${t2.replace(/\s+/g, "_")}`;
          let res = await fetchWithCacheAndRetry(
            `https://www.thesportsdb.com/api/v1/json/3/searchevents.php?e=${encodeURIComponent(q1)}`,
            {},
            60000,
          );
          if (!res.event) {
            const q2 = `${t2.replace(/\s+/g, "_")}_vs_${t1.replace(/\s+/g, "_")}`;
            res = await fetchWithCacheAndRetry(
              `https://www.thesportsdb.com/api/v1/json/3/searchevents.php?e=${encodeURIComponent(q2)}`,
              {},
              60000,
            );
          }
          const nowMs = Date.now();
          const all = res.event || [];
          match = isUpcoming
            ? all
                .filter((m) => new Date(m.dateEvent).getTime() >= nowMs)
                .sort(
                  (a, b) => new Date(a.dateEvent) - new Date(b.dateEvent),
                )[0]
            : all
                .filter((m) => new Date(m.dateEvent).getTime() <= nowMs)
                .sort(
                  (a, b) => new Date(b.dateEvent) - new Date(a.dateEvent),
                )[0];
        } else {
          const teamData = await fetchWithCacheAndRetry(
            `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(t1)}`,
            {},
            86400000,
          );
          if (!teamData.teams)
            throw new Error(`Basketball team not found: ${t1}`);
          const teamId = teamData.teams[0].idTeam;
          const fd = await fetchWithCacheAndRetry(
            isUpcoming
              ? `https://www.thesportsdb.com/api/v1/json/3/eventsnext.php?id=${teamId}`
              : `https://www.thesportsdb.com/api/v1/json/3/eventslast.php?id=${teamId}`,
            {},
            60000,
          );
          match = (isUpcoming ? fd.events : fd.results)?.[0];
        }
        if (!match) throw new Error("No basketball matches found.");
        const cardData = JSON.stringify({
          league: match.strLeague || "NBA",
          isLive: false,
          teamA: { name: match.strHomeTeam, score: match.intHomeScore || "-" },
          teamB: { name: match.strAwayTeam, score: match.intAwayScore || "-" },
          status: isUpcoming ? `Scheduled: ${match.dateEvent}` : "Final Score",
        });
        return `Sports data fetched. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:SPORTS:${cardData}||`;
      } else if (
        fullContextCheck.includes("cricket") ||
        fullContextCheck.includes("ipl") ||
        fullContextCheck.includes("t20") ||
        fullContextCheck.includes("odi") ||
        fullContextCheck.includes("test match") ||
        fullContextCheck.includes("rcb") ||
        fullContextCheck.includes("csk") ||
        fullContextCheck.includes("mumbai indians") ||
        fullContextCheck.includes("india") ||
        fullContextCheck.includes("world cup")
      ) {
        const cricApiKey = process.env.CRICKET_API_KEY;
        if (!cricApiKey) throw new Error("CRICKET_API_KEY missing");
        const matchData = await fetchWithCacheAndRetry(
          `https://api.cricapi.com/v1/currentMatches?apikey=${cricApiKey}&offset=0`,
          {},
          30000,
        );
        if (!matchData?.data?.length)
          throw new Error("No cricket data available.");
        const tournamentLower = (tournament ?? "").toLowerCase();
        const isIplQuery =
          tournamentLower.includes("ipl") ||
          tournamentLower.includes("indian premier") ||
          fullContextCheck.includes("ipl") ||
          fullContextCheck.includes("indian premier");
        const scoredMatches = matchData.data
          .filter((m) => Boolean(m.name))
          .map((match) => {
            let score = 0;
            const mnl = (match.name || "").toLowerCase(),
              msl = (match.series || "").toLowerCase();
            const mdo = new Date(match.dateTimeGMT || match.date);
            const mds = getISTDateString(mdo);
            const isLive =
              match.matchStarted === true && match.matchEnded === false;
            const isFin = match.matchEnded === true;
            const isFut =
              match.matchStarted === false && match.matchEnded === false;
            if (
              isIplQuery &&
              (msl.includes("ipl") || msl.includes("indian premier"))
            )
              score += 500;
            else if (
              tournamentLower &&
              (msl.includes(tournamentLower) || mnl.includes(tournamentLower))
            )
              score += 300;
            for (const token of normalizedMentions) {
              if (
                token.length > 1 &&
                (mnl.includes(token) || msl.includes(token))
              )
                score += 100;
            }
            if (specificDateStr && mds === specificDateStr) score += 150;
            switch (temporal_intent) {
              case "live":
                if (isLive) score += 200;
                break;
              case "past":
                if (isFin) {
                  if (mds === yesterdayStr) score += 200;
                  else if (mds === todayStr) score += 150;
                  else score += 50;
                }
                break;
              case "future":
                if (isFut) {
                  if (mds === tomorrowStr) score += 200;
                  else if (mds === todayStr) score += 150;
                  else if (mdo > nowIST) score += 50;
                }
                break;
              case "any":
              default:
                if (isLive) score += 100;
                else if (mds === todayStr) score += 75;
                break;
            }
            return { match, score, mdo };
          })
          .sort((a, b) =>
            b.score !== a.score
              ? b.score - a.score
              : temporal_intent === "future"
                ? a.mdo - b.mdo
                : b.mdo - a.mdo,
          );
        if (!scoredMatches.length || scoredMatches[0].score === 0) {
          const dh = specificDateStr ? ` for ${specificDateStr}` : "";
          const th = tournament ? ` in ${tournament}` : "";
          return `No cricket fixtures found${th}${dh}. Explain naturally. CRITICAL: DO NOT APPEND A ||CARD:...|| STRING.`;
        }
        const tm = scoredMatches[0].match;
        const taN = tm.teams?.[0] || "Team A",
          tbN = tm.teams?.[1] || "Team B";
        let sA = "-",
          sB = "-",
          oA = null,
          crr = null;
        const isLiveR = tm.matchStarted === true && tm.matchEnded === false;
        if (Array.isArray(tm.score) && tm.score.length > 0) {
          const fs = (name, scores) => {
            const words = name
              .toLowerCase()
              .split(" ")
              .filter((w) => w.length > 2);
            for (const w of words) {
              const f = scores.find((s) => s.inning?.toLowerCase().includes(w));
              if (f) return f;
            }
            return null;
          };
          let sa = fs(taN, tm.score) || tm.score[0];
          let sb =
            fs(tbN, tm.score) || (tm.score[1] !== sa ? tm.score[1] : null);
          if (sa) {
            const r = sa.r ?? 0,
              w = sa.w ?? 0;
            sA = `${r}/${w}`;
            oA = sa.o ?? "0.0";
            const n = parseFloat(oA);
            if (!isNaN(n) && n > 0) {
              const om = Math.floor(n) + ((n * 10) % 10) / 6;
              if (om > 0) crr = (r / om).toFixed(2);
            }
          }
          if (sb) {
            const r = sb.r ?? 0,
              w = sb.w ?? 0;
            sB = `${r}/${w}`;
          }
        } else if (isLiveR) {
          sA = "0/0";
          oA = "0.0";
        }
        let statusText;
        if (isLiveR) statusText = tm.status || "Live";
        else if (tm.matchEnded) statusText = tm.status || "Finished";
        else if (!tm.matchStarted) {
          const t = new Date(tm.dateTimeGMT || tm.date).toLocaleTimeString(
            "en-IN",
            {
              timeZone: "Asia/Kolkata",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            },
          );
          statusText = `Scheduled: Today at ${t} IST`;
        } else statusText = tm.status || "Match Info";
        const cardData = JSON.stringify({
          league: tm.matchType?.toUpperCase() || "Cricket",
          isLive: isLiveR,
          battingTeam: taN,
          battingScore: sA,
          battingOvers: oA,
          bowlingTeam: tbN,
          bowlingScore: sB,
          crr,
          status: statusText,
        });
        return `Sports data fetched. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:SPORTS:${cardData}||`;
      }
      throw new Error("Sport route not found.");
    } catch (error) {
      console.error("[Sports Data Error]:", error.message);
      const ed = JSON.stringify({
        league: "Sports Data",
        isLive: false,
        teamA: { name: "System", score: "-" },
        teamB: { name: "Error", score: "-" },
        status: error.message.includes("API_KEY missing")
          ? "API Key Missing"
          : "Data temporarily unavailable",
      });
      return `API Error. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:SPORTS:${ed}||`;
    }
  },
  {
    name: "get_sports_data",
    description: `Fetches live scores, results, and fixtures for Football, Basketball, and Cricket/IPL.
MANDATORY: Populate ALL schema fields.
temporal_intent: "live"=in-progress, "past"=completed, "future"=upcoming, "any"=no time cue.
tournament: league/series name or "". team_mentions: expanded team names, [] if none.
specific_date: "YYYY-MM-DD" if user names a date, else omit.
You MUST include the ||CARD:...|| string verbatim at the end of your response.`,
    schema: z.object({
      // 🛡️ GLOBAL XML FIX: Rationale parameter added
      rationale: z
        .string()
        .describe(
          "Briefly explain why you are calling this tool. This parameter is mandatory to ensure stable XML generation.",
        ),
      sport: z.string().describe("'cricket', 'football', or 'basketball'."),
      query: z.string().describe("User's original query verbatim."),
      temporal_intent: z.string(),
      tournament: z.string(),
      team_mentions: z.array(z.string()),
      specific_date: z
        .string()
        .optional()
        .describe("Exact date 'YYYY-MM-DD' if mentioned by user."),
    }),
  },
);

// ============================================================================
// ✈️  TOOL 6: Live Flight Intelligence (AviationStack)
// 🌟 NEW FEATURE: Flight Tracker
// ============================================================================

export const getFlightTool = tool(
  async ({ flightNumber }) => {
    try {
      const apiKey = process.env.AVIATIONSTACK_API_KEY;
      if (!apiKey) throw new Error("AVIATIONSTACK_API_KEY missing from .env");
      const cleanFlight = flightNumber.toUpperCase().replace(/\s+/g, "");
      const url = `http://api.aviationstack.com/v1/flights?access_key=${apiKey}&flight_iata=${cleanFlight}&limit=1`;
      const data = await fetchWithCacheAndRetry(url, {}, 60000);
      if (!data?.data?.length)
        throw new Error(`No live data found for flight ${cleanFlight}`);
      const f = data.data[0];
      const dep = f.departure || {},
        arr = f.arrival || {};
      const statusMap = {
        scheduled: "Scheduled",
        active: "Airborne",
        landed: "Landed",
        cancelled: "Cancelled",
        incident: "Incident",
        diverted: "Diverted",
      };
      const rawStatus = (f.flight_status || "unknown").toLowerCase();
      const status =
        statusMap[rawStatus] ||
        rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);
      const fmtTime = (iso) =>
        iso
          ? new Date(iso).toLocaleTimeString("en-IN", {
              timeZone: "Asia/Kolkata",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })
          : "--:--";
      const cardPayload = JSON.stringify({
        flightNumber: cleanFlight,
        airline: f.airline?.name || "Unknown Airline",
        status,
        origin: dep.iata || "---",
        originCity: dep.airport || dep.iata || "---",
        destination: arr.iata || "---",
        destinationCity: arr.airport || arr.iata || "---",
        scheduled: fmtTime(dep.scheduled),
        eta: fmtTime(arr.estimated),
        delay: dep.delay ? `${dep.delay} min` : "On Time",
        terminal: dep.terminal || "--",
        gate: dep.gate || "--",
      });
      return `Flight data fetched. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:FLIGHT:${cardPayload}||`;
    } catch (error) {
      console.error("[Flight Error]:", error.message);
      return `Flight lookup failed. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:FLIGHT:${JSON.stringify({ flightNumber, status: "Error", error: error.message })}||`;
    }
  },
  {
    name: "get_flight_info",
    description:
      "Fetches live flight status, departure/arrival times, and delays for any commercial flight by IATA number (e.g., AI131, EK202).",
    schema: z.object({
      // 🛡️ GLOBAL XML FIX: Rationale parameter added
      rationale: z
        .string()
        .describe(
          "Briefly explain why you are calling this tool. This parameter is mandatory to ensure stable XML generation.",
        ),
      flightNumber: z
        .string()
        .describe('IATA flight number e.g. "AI131", "EK202".'),
    }),
  },
);

// ============================================================================
// 📰 TOOL 7: Intelligent News Briefing (GNews API)
// 🌟 NEW FEATURE: News Briefing
// ============================================================================

export const getNewsTool = tool(
  async ({ query, category }) => {
    try {
      const apiKey = process.env.GNEWS_API_KEY;
      if (!apiKey) throw new Error("GNEWS_API_KEY missing from .env");
      const VALID_TOPICS = [
        "breaking-news",
        "world",
        "nation",
        "business",
        "technology",
        "entertainment",
        "sports",
        "science",
        "health",
      ];
      const topicMap = {
        tech: "technology",
        finance: "business",
        economy: "business",
        money: "business",
        movies: "entertainment",
        bollywood: "entertainment",
        cricket: "sports",
        football: "sports",
        ipl: "sports",
        india: "nation",
        politics: "nation",
        space: "science",
        climate: "science",
        covid: "health",
        medical: "health",
      };
      const rawCategory = (category || query || "").toLowerCase();
      let topic = "breaking-news";
      for (const [key, val] of Object.entries(topicMap)) {
        if (rawCategory.includes(key)) {
          topic = val;
          break;
        }
      }
      if (VALID_TOPICS.includes(rawCategory)) topic = rawCategory;
      const url =
        query && query.length > 3 && !VALID_TOPICS.includes(query.toLowerCase())
          ? `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&token=${apiKey}&lang=en&max=5&sortby=publishedAt`
          : `https://gnews.io/api/v4/top-headlines?topic=${topic}&token=${apiKey}&lang=en&max=5`;
      const data = await fetchWithCacheAndRetry(url, {}, 600000);
      if (!data?.articles?.length)
        throw new Error("No articles returned from GNews");
      const articles = data.articles
        .slice(0, 5)
        .map((a) => ({
          title: (a.title || "No Title").substring(0, 100),
          source: a.source?.name || "Unknown",
          url: a.url || "",
          publishedAt: a.publishedAt
            ? new Date(a.publishedAt).toLocaleTimeString("en-IN", {
                timeZone: "Asia/Kolkata",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              }) + " IST"
            : "Recently",
          description: (a.description || "").substring(0, 120),
        }));
      const cardPayload = JSON.stringify({
        category: topic
          .replace("-", " ")
          .replace(/\b\w/g, (c) => c.toUpperCase()),
        articles,
      });
      return `News fetched. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:NEWS:${cardPayload}||`;
    } catch (error) {
      console.error("[News Error]:", error.message);
      return `News fetch failed. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:NEWS:${JSON.stringify({ category: "News", articles: [], error: error.message })}||`;
    }
  },
  {
    name: "get_news",
    description:
      "Fetches latest news headlines by category (technology, sports, business, health, entertainment, world) or specific search query. Do NOT use this for daily briefings — use get_daily_briefing instead.",
    schema: z.object({
      // 🛡️ GLOBAL XML FIX: Rationale parameter added
      rationale: z
        .string()
        .describe(
          "Briefly explain why you are calling this tool. This parameter is mandatory to ensure stable XML generation.",
        ),
      query: z
        .string()
        .describe(
          "Search query or topic keyword e.g. 'AI news', 'India elections'.",
        ),
      category: z
        .string()
        .optional()
        .describe(
          "News category: technology, sports, business, health, entertainment, world, nation, science.",
        ),
    }),
  },
);

// ============================================================================
// 🎬 TOOL 8: Movie & Show Intelligence (OMDB API)
// 🌟 NEW FEATURE: Movie Intelligence
// ============================================================================

export const getMovieTool = tool(
  async ({ title, type }) => {
    try {
        if (type && !["movie", "series"].includes(type)) {
          type = "movie";
        }

      const apiKey = process.env.OMDB_API_KEY;
      if (!apiKey) throw new Error("OMDB_API_KEY missing from .env");
      const mediaType = type === "series" ? "series" : "movie";
      let data = await fetchWithCacheAndRetry(
        `https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${apiKey}&plot=short&type=${mediaType}`,
        {},
        86400000,
      );
      if (data?.Response === "False" || !data?.Title) {
        data = await fetchWithCacheAndRetry(
          `https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${apiKey}&plot=short`,
          {},
          86400000,
        );
        if (data?.Response === "False" || !data?.Title)
          throw new Error(`"${title}" not found in OMDB`);
      }
      const cardPayload = JSON.stringify({
        title: data.Title,
        year: data.Year,
        type: data.Type === "series" ? "TV Series" : "Movie",
        imdbRating: data.imdbRating !== "N/A" ? data.imdbRating : null,
        rottenTomatoes:
          data.Ratings?.find((r) => r.Source === "Rotten Tomatoes")?.Value ||
          null,
        metascore: data.Metascore !== "N/A" ? data.Metascore : null,
        genre: data.Genre || "Unknown",
        director: data.Director !== "N/A" ? data.Director : null,
        cast: data.Actors !== "N/A" ? data.Actors : null,
        runtime: data.Runtime !== "N/A" ? data.Runtime : null,
        plot: data.Plot !== "N/A" ? data.Plot : null,
        poster: data.Poster !== "N/A" ? data.Poster : null,
        rated: data.Rated !== "N/A" ? data.Rated : null,
        awards: data.Awards !== "N/A" ? data.Awards : null,
      });
      return `Movie data fetched. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:MOVIE:${cardPayload}||`;
    } catch (error) {
      console.error("[Movie Error]:", error.message);
      return `Movie lookup failed. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:MOVIE:${JSON.stringify({ title, error: error.message })}||`;
    }
  },
  {
    name: "get_movie_info",
    description:
      "Fetches IMDb rating, Rotten Tomatoes score, cast, plot, director, and runtime for any movie or TV show.",
    schema: z.object({
      // 🛡️ GLOBAL XML FIX: Rationale parameter added
      rationale: z
        .string()
        .describe(
          "Briefly explain why you are calling this tool. This parameter is mandatory to ensure stable XML generation.",
        ),
      title: z
        .string()
        .describe('Movie or show title e.g. "Oppenheimer", "Breaking Bad".'),
      type: z
        .string()
        .optional()
        .describe('"movie" or "series". Omit if unclear.'),
    }),
  },
);

// ============================================================================
// 💱 TOOL 9: Universal Currency Converter (Frankfurter.app — no key needed)
// 🌟 NEW FEATURE: Currency Converter
// ============================================================================

export const getCurrencyTool = tool(
  async ({ amount, fromCurrency, toCurrency }) => {
    try {
      const from = fromCurrency.toUpperCase().trim(),
        to = toCurrency.toUpperCase().trim();
      const amt = parseFloat(amount) || 1;
      const data = await fetchWithCacheAndRetry(
        `https://api.frankfurter.app/latest?amount=${amt}&from=${from}&to=${to}`,
        {},
        3600000,
      );
      if (!data?.rates?.[to])
        throw new Error(`Could not convert ${from} to ${to}`);
      const converted = parseFloat(data.rates[to]);
      const rate = parseFloat((converted / amt).toFixed(6));
      const flags = {
        USD: "🇺🇸",
        EUR: "🇪🇺",
        GBP: "🇬🇧",
        INR: "🇮🇳",
        JPY: "🇯🇵",
        CNY: "🇨🇳",
        AUD: "🇦🇺",
        CAD: "🇨🇦",
        CHF: "🇨🇭",
        SGD: "🇸🇬",
        AED: "🇦🇪",
        SAR: "🇸🇦",
        MYR: "🇲🇾",
        THB: "🇹🇭",
        BDT: "🇧🇩",
        PKR: "🇵🇰",
      };
      const cardPayload = JSON.stringify({
        from,
        to,
        inputAmount: amt,
        convertedAmount: parseFloat(converted.toFixed(4)),
        rate,
        fromFlag: flags[from] || "💱",
        toFlag: flags[to] || "💱",
        timestamp: data.date,
        source: "European Central Bank",
      });
      return `Currency converted. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:CURRENCY:${cardPayload}||`;
    } catch (error) {
      console.error("[Currency Error]:", error.message);
      return `Conversion failed. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:CURRENCY:${JSON.stringify({ from: fromCurrency, to: toCurrency, error: error.message })}||`;
    }
  },
  {
    name: "get_currency_rate",
    description:
      "Converts amounts between world currencies using live ECB rates. No API key required.",
    schema: z.object({
      // 🛡️ GLOBAL XML FIX: Rationale parameter added
      rationale: z
        .string()
        .describe(
          "Briefly explain why you are calling this tool. This parameter is mandatory to ensure stable XML generation.",
        ),
      amount: z.number().describe("Amount to convert e.g. 500."),
      fromCurrency: z
        .string()
        .describe('Source currency ISO code e.g. "USD", "EUR", "INR".'),
      toCurrency: z
        .string()
        .describe('Target currency ISO code e.g. "INR", "JPY", "GBP".'),
    }),
  },
);

// ============================================================================
// 🍳 TOOL 10: Smart Recipe Finder (TheMealDB — no key needed)
// 🌟 NEW FEATURE: Recipe Finder
// ============================================================================

export const getRecipeTool = tool(
  async ({ query, searchType }) => {
    try {
        if (searchType && !["name", "ingredient"].includes(searchType)) {
          searchType = "name";
        }

      let meal = null;
      if (searchType === "ingredient") {
        const fd = await fetchWithCacheAndRetry(
          `https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(query)}`,
          {},
          86400000,
        );
        if (!fd?.meals?.length)
          throw new Error(`No recipes with ingredient: ${query}`);
        const ld = await fetchWithCacheAndRetry(
          `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${fd.meals[0].idMeal}`,
          {},
          86400000,
        );
        meal = ld?.meals?.[0];
      } else {
        const sd = await fetchWithCacheAndRetry(
          `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`,
          {},
          86400000,
        );
        meal = sd?.meals?.[0];
        if (!meal) {
          const rd = await fetchWithCacheAndRetry(
            `https://www.themealdb.com/api/json/v1/1/random.php`,
            {},
            300000,
          );
          meal = rd?.meals?.[0];
        }
      }
      if (!meal) throw new Error("No recipe found");
      const ingredients = [];
      for (let i = 1; i <= 20; i++) {
        const ing = meal[`strIngredient${i}`],
          msr = meal[`strMeasure${i}`];
        if (ing?.trim())
          ingredients.push(`${msr ? msr.trim() + " " : ""}${ing.trim()}`);
      }
      const cardPayload = JSON.stringify({
        name: meal.strMeal,
        category: meal.strCategory || "Main Course",
        area: meal.strArea || "International",
        thumbnail: meal.strMealThumb || null,
        ingredients: ingredients.slice(0, 12),
        instructions: (meal.strInstructions || "See full recipe.").substring(
          0,
          600,
        ),
        youtubeUrl: meal.strYoutube || null,
        sourceUrl:
          meal.strSource || `https://www.themealdb.com/meal/${meal.idMeal}`,
      });
      return `Recipe found. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:RECIPE:${cardPayload}||`;
    } catch (error) {
      console.error("[Recipe Error]:", error.message);
      return `Recipe search failed. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:RECIPE:${JSON.stringify({ name: query, error: error.message })}||`;
    }
  },
  {
    name: "get_recipe",
    description:
      "Finds a recipe by dish name or main ingredient. Returns full ingredients list and cooking instructions.",
    schema: z.object({
      // 🛡️ GLOBAL XML FIX: Rationale parameter added
      rationale: z
        .string()
        .describe(
          "Briefly explain why you are calling this tool. This parameter is mandatory to ensure stable XML generation.",
        ),
      query: z
        .string()
        .describe(
          'Dish name e.g. "chicken biryani" or ingredient e.g. "garlic".',
        ),
      searchType: z
        .string()
        .describe(
          '"name" to search by dish, "ingredient" to search by ingredient.',
        ),
    }),
  },
);

// ============================================================================
// 📈 TOOL 11: Live Stock Market Tracker (Yahoo Finance — no key needed)
// 🌟 NEW FEATURE: Stock Market Tracker
// ============================================================================

export const getStockTool = tool(
  async ({ symbol, companyName }) => {
    try {
      const symbolMap = {
        nifty: "^NSEI",
        "nifty 50": "^NSEI",
        nifty50: "^NSEI",
        sensex: "^BSESN",
        bse: "^BSESN",
        reliance: "RELIANCE.NS",
        tcs: "TCS.NS",
        infosys: "INFY.NS",
        infy: "INFY.NS",
        wipro: "WIPRO.NS",
        hdfc: "HDFCBANK.NS",
        hdfcbank: "HDFCBANK.NS",
        icici: "ICICIBANK.NS",
        icicibank: "ICICIBANK.NS",
        sbi: "SBIN.NS",
        airtel: "BHARTIARTL.NS",
        bajaj: "BAJFINANCE.NS",
        titan: "TITAN.NS",
        adani: "ADANIENT.NS",
        hcl: "HCLTECH.NS",
        hcltech: "HCLTECH.NS",
        zomato: "ZOMATO.NS",
        swiggy: "SWIGGY.NS",
        apple: "AAPL",
        google: "GOOGL",
        alphabet: "GOOGL",
        microsoft: "MSFT",
        amazon: "AMZN",
        tesla: "TSLA",
        meta: "META",
        facebook: "META",
        nvidia: "NVDA",
        netflix: "NFLX",
        uber: "UBER",
        spotify: "SPOT",
        "dow jones": "^DJI",
        sp500: "^GSPC",
        "s&p 500": "^GSPC",
        nasdaq: "^IXIC",
        ftse: "^FTSE",
        nikkei: "^N225",
        "hang seng": "^HSI",
      };
      const lookupKey = (companyName || symbol || "").toLowerCase().trim();
      let resolvedSymbol =
        symbolMap[lookupKey] || symbol?.toUpperCase()?.trim();
      if (!resolvedSymbol)
        return `I couldn't find a stock symbol for "${companyName || symbol}". Some companies like OpenAI are not publicly traded. Please try a ticker like "AAPL" or "RELIANCE.NS".`;
      const data = await fetchWithCacheAndRetry(
        `https://query1.finance.yahoo.com/v8/finance/chart/${resolvedSymbol}?interval=1d&range=1d&includePrePost=false`,
        { headers: { Accept: "application/json" } },
        30000,
      );
      const meta = data?.chart?.result?.[0]?.meta;
      if (!meta) throw new Error(`No data returned for ${resolvedSymbol}`);
      const price = meta.regularMarketPrice,
        prevClose = meta.previousClose || meta.chartPreviousClose;
      const change = prevClose ? parseFloat((price - prevClose).toFixed(2)) : 0;
      const changePct = prevClose
        ? parseFloat(((change / prevClose) * 100).toFixed(2))
        : 0;
      const fmtCap = (cap) => {
        if (!cap) return null;
        if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
        if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
        if (cap >= 1e7) return `₹${(cap / 1e7).toFixed(2)}Cr`;
        return `${cap}`;
      };
      const cardPayload = JSON.stringify({
        symbol: resolvedSymbol,
        name: meta.shortName || meta.longName || resolvedSymbol,
        price: parseFloat(price.toFixed(2)),
        change,
        changePercent: changePct,
        currency: meta.currency || "USD",
        exchange: meta.exchangeName || "",
        high: meta.regularMarketDayHigh
          ? parseFloat(meta.regularMarketDayHigh.toFixed(2))
          : null,
        low: meta.regularMarketDayLow
          ? parseFloat(meta.regularMarketDayLow.toFixed(2))
          : null,
        high52: meta.fiftyTwoWeekHigh
          ? parseFloat(meta.fiftyTwoWeekHigh.toFixed(2))
          : null,
        low52: meta.fiftyTwoWeekLow
          ? parseFloat(meta.fiftyTwoWeekLow.toFixed(2))
          : null,
        marketCap: fmtCap(meta.marketCap),
        isMarketOpen: meta.marketState === "REGULAR",
        marketState: meta.marketState || "CLOSED",
      });
      return `Stock data fetched. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:STOCK:${cardPayload}||`;
    } catch (error) {
      console.error("[Stock Error]:", error.message);
      return `Stock lookup failed. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:STOCK:${JSON.stringify({ symbol, name: companyName, error: error.message })}||`;
    }
  },
  {
    name: "get_stock_price",
    description:
      "Fetches live prices for Indian (NSE/BSE) and global stocks, and market indices like Nifty 50, Sensex, S&P 500, Nasdaq.",
    schema: z.object({
      // 🛡️ GLOBAL XML FIX: Rationale parameter added
      rationale: z
        .string()
        .describe(
          "Briefly explain why you are calling this tool. This parameter is mandatory to ensure stable XML generation.",
        ),
      symbol: z
        .string()
        .optional()
        .describe('Ticker symbol e.g. "AAPL", "RELIANCE.NS", "^NSEI".'),
      companyName: z
        .string()
        .optional()
        .describe('Company name e.g. "Apple", "Reliance", "Nifty".'),
    }),
  },
);

// ============================================================================
// 💊 TOOL 12: Medicine & Drug Intelligence (OpenFDA — no key needed)
// 🌟 NEW FEATURE: Medicine Intelligence
// ============================================================================

export const getMedicineTool = tool(
  async ({ medicineName }) => {
    try {
      const enc = encodeURIComponent(medicineName.toLowerCase().trim());
      const endpoints = [
        `https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${enc}"&limit=1`,
        `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${enc}"&limit=1`,
        `https://api.fda.gov/drug/label.json?search=openfda.substance_name:"${enc}"&limit=1`,
      ];
      let labelData = null;
      for (const ep of endpoints) {
        try {
          const r = await fetchWithCacheAndRetry(ep, {}, 86400000);
          if (r?.results?.length) {
            labelData = r.results[0];
            break;
          }
        } catch {
          continue;
        }
      }
      if (!labelData)
        throw new Error(`No FDA data found for "${medicineName}"`);
      const extract = (arr, max = 200) => {
        if (!arr?.length) return null;
        const t = arr[0].replace(/\n/g, " ").replace(/\s+/g, " ").trim();
        return t.length > max ? t.substring(0, max) + "..." : t;
      };
      const brandNames = labelData.openfda?.brand_name?.slice(0, 3) || [];
      const genericNames = labelData.openfda?.generic_name?.slice(0, 2) || [];
      let warnings = [];
      if (labelData.boxed_warning)
        warnings.push(extract(labelData.boxed_warning, 150));
      if (labelData.warnings) warnings.push(extract(labelData.warnings, 150));
      warnings = warnings.filter(Boolean).slice(0, 2);
      const cardPayload = JSON.stringify({
        name: brandNames[0] || genericNames[0] || medicineName,
        genericName: genericNames[0] || null,
        brandNames: brandNames.slice(0, 3),
        purpose: extract(labelData.indications_and_usage, 200),
        dosage: extract(labelData.dosage_and_administration, 180),
        warnings,
        interactions: extract(labelData.drug_interactions, 200),
        adverseReactions: extract(labelData.adverse_reactions, 180),
        manufacturer: labelData.openfda?.manufacturer_name?.[0] || null,
        hasBlackBoxWarning: Boolean(labelData.boxed_warning),
        disclaimer:
          "Not medical advice. Consult a qualified healthcare professional.",
      });
      return `Medicine data fetched. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:MEDICINE:${cardPayload}||`;
    } catch (error) {
      console.error("[Medicine Error]:", error.message);
      return `Medicine lookup failed. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:MEDICINE:${JSON.stringify({ name: medicineName, error: error.message, disclaimer: "Not medical advice." })}||`;
    }
  },
  {
    name: "get_medicine_info",
    description:
      "Fetches FDA drug information: purpose, dosage, warnings, side effects, and drug interactions.",
    schema: z.object({
      // 🛡️ GLOBAL XML FIX: Rationale parameter added
      rationale: z
        .string()
        .describe(
          "Briefly explain why you are calling this tool. This parameter is mandatory to ensure stable XML generation.",
        ),
      medicineName: z
        .string()
        .describe(
          'Medicine name (brand or generic) e.g. "Metformin", "Ibuprofen".',
        ),
    }),
  },
);

// ============================================================================
// 🌐 TOOL 13: Real-Time Language Translator (MyMemory — no key needed)
// 🌟 NEW FEATURE: Language Translator
// ============================================================================

export const getTranslateTool = tool(
  async ({ text, fromLanguage, toLanguage }) => {
    try {
      const langCodes = {
        english: "en",
        spanish: "es",
        french: "fr",
        german: "de",
        italian: "it",
        portuguese: "pt",
        dutch: "nl",
        russian: "ru",
        arabic: "ar",
        hindi: "hi",
        bengali: "bn",
        urdu: "ur",
        malayalam: "ml",
        tamil: "ta",
        telugu: "te",
        kannada: "kn",
        marathi: "mr",
        gujarati: "gu",
        punjabi: "pa",
        japanese: "ja",
        korean: "ko",
        chinese: "zh",
        mandarin: "zh",
        thai: "th",
        vietnamese: "vi",
        turkish: "tr",
        polish: "pl",
        swedish: "sv",
        danish: "da",
        norwegian: "no",
        finnish: "fi",
        greek: "el",
        hebrew: "iw",
        indonesian: "id",
        malay: "ms",
        swahili: "sw",
        persian: "fa",
        farsi: "fa",
      };
      const fromCode =
        langCodes[fromLanguage?.toLowerCase()] ||
        fromLanguage?.toLowerCase()?.slice(0, 2) ||
        "en";
      const toCode =
        langCodes[toLanguage?.toLowerCase()] ||
        toLanguage?.toLowerCase()?.slice(0, 2) ||
        "hi";
      const data = await fetchWithCacheAndRetry(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${fromCode}|${toCode}`,
        {},
        3600000,
      );
      if (!data?.responseData?.translatedText)
        throw new Error("Translation failed");
      const langNames = Object.fromEntries(
        Object.entries(langCodes).map(([name, code]) => [
          code,
          name.charAt(0).toUpperCase() + name.slice(1),
        ]),
      );
      const needsRomanization = [
        "ar",
        "hi",
        "bn",
        "ml",
        "ta",
        "te",
        "kn",
        "mr",
        "gu",
        "pa",
        "ja",
        "ko",
        "zh",
        "th",
        "fa",
        "iw",
      ].includes(toCode);
      const cardPayload = JSON.stringify({
        original: text,
        translated: data.responseData.translatedText,
        fromLanguage: langNames[fromCode] || fromLanguage,
        toLanguage: langNames[toCode] || toLanguage,
        fromCode,
        toCode,
        needsRomanization,
        quality: data.responseData.match
          ? `${Math.round(data.responseData.match * 100)}%`
          : null,
        poweredBy: "MyMemory Translation API",
      });
      return `Translation complete. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:TRANSLATE:${cardPayload}||`;
    } catch (error) {
      console.error("[Translate Error]:", error.message);
      return `Translation failed. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:TRANSLATE:${JSON.stringify({ original: text, error: error.message })}||`;
    }
  },
  {
    name: "translate_text",
    description:
      "Translates any text into 30+ languages including Hindi, Arabic, Japanese, Spanish, French, Tamil, Malayalam.",
    schema: z.object({
      // 🛡️ GLOBAL XML FIX: Rationale parameter added
      rationale: z
        .string()
        .describe(
          "Briefly explain why you are calling this tool. This parameter is mandatory to ensure stable XML generation.",
        ),
      text: z.string().describe("The text to translate."),
      fromLanguage: z
        .string()
        .describe('Source language name or code e.g. "English", "en".'),
      toLanguage: z
        .string()
        .describe(
          'Target language name or code e.g. "Arabic", "ar", "Hindi", "hi".',
        ),
    }),
  },
);

// ============================================================================
// 📅 TOOL 14: Smart Countdown Intelligence (Pure JS — zero API needed)
// 🌟 NEW FEATURE: Countdown Timer
// ============================================================================

export const getCountdownTool = tool(
  async ({ targetDate, label, isPastQuery }) => {
    try {
      if (!targetDate || !/^\d{4}-\d{2}-\d{2}$/.test(targetDate))
        throw new Error("Provide date as YYYY-MM-DD.");
      const target = new Date(targetDate + "T00:00:00+05:30");
      const nowIST = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
      );
      if (isNaN(target.getTime()))
        throw new Error("Could not parse the target date.");
      const diffMs = target.getTime() - nowIST.getTime();
      const isPast = diffMs < 0,
        abs = Math.abs(diffMs);
      const totalDays = Math.floor(abs / 86400000),
        totalHours = Math.floor(abs / 3600000);
      const weeks = Math.floor(totalDays / 7),
        remainingDays = totalDays % 7;
      const months = Math.floor(totalDays / 30.44),
        years = Math.floor(totalDays / 365.25);
      const dayOfWeek = target.toLocaleDateString("en-US", {
        weekday: "long",
        timeZone: "Asia/Kolkata",
      });
      const formattedDate = target.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      });
      const yearStart = new Date(
        `${target.getFullYear()}-01-01T00:00:00+05:30`,
      );
      const yearEnd = new Date(
        `${target.getFullYear() + 1}-01-01T00:00:00+05:30`,
      );
      const yearProgress = Math.round(
        ((target - yearStart) / (yearEnd - yearStart)) * 100,
      );
      const cardPayload = JSON.stringify({
        label: label || (isPast ? "Past Event" : "Upcoming Event"),
        targetDate,
        formattedDate,
        dayOfWeek,
        isPast,
        totalDays,
        weeks,
        remainingDays,
        totalHours,
        months,
        years,
        yearProgress,
      });
      return `Countdown calculated. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:COUNTDOWN:${cardPayload}||`;
    } catch (error) {
      console.error("[Countdown Error]:", error.message);
      return `Countdown failed. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:COUNTDOWN:${JSON.stringify({ label: label || "Event", error: error.message })}||`;
    }
  },
  {
    name: "get_countdown",
    description:
      'Calculates exact days, weeks, hours until or since any date. Use for: "days until my exam", "how long ago was X", "what day of the week is [date]".',
    schema: z.object({
      // 🛡️ GLOBAL XML FIX: Rationale parameter added
      rationale: z
        .string()
        .describe(
          "Briefly explain why you are calling this tool. This parameter is mandatory to ensure stable XML generation.",
        ),
      targetDate: z.string().describe("Date in YYYY-MM-DD format (IST)."),
      label: z.string().optional().describe('Event name e.g. "Board Exam".'),
      isPastQuery: z.boolean().optional(),
    }),
  },
);

// ============================================================================
// 🕐 TOOL 15: Global Timezone Concierge (Pure JS Intl — zero API needed)
// 🌟 NEW FEATURE: Time Zone Intelligence
// ============================================================================

export const getTimezoneTool = tool(
  async ({ cities }) => {
    try {
      const cityToTZ = {
        mumbai: "Asia/Kolkata",
        delhi: "Asia/Kolkata",
        bangalore: "Asia/Kolkata",
        bengaluru: "Asia/Kolkata",
        chennai: "Asia/Kolkata",
        kolkata: "Asia/Kolkata",
        hyderabad: "Asia/Kolkata",
        pune: "Asia/Kolkata",
        india: "Asia/Kolkata",
        ist: "Asia/Kolkata",
        kochi: "Asia/Kolkata",
        thrissur: "Asia/Kolkata",
        "new york": "America/New_York",
        nyc: "America/New_York",
        "los angeles": "America/Los_Angeles",
        la: "America/Los_Angeles",
        chicago: "America/Chicago",
        "san francisco": "America/Los_Angeles",
        sf: "America/Los_Angeles",
        seattle: "America/Los_Angeles",
        washington: "America/New_York",
        boston: "America/New_York",
        miami: "America/New_York",
        toronto: "America/Toronto",
        canada: "America/Toronto",
        vancouver: "America/Vancouver",
        "sao paulo": "America/Sao_Paulo",
        brazil: "America/Sao_Paulo",
        "mexico city": "America/Mexico_City",
        mexico: "America/Mexico_City",
        london: "Europe/London",
        uk: "Europe/London",
        paris: "Europe/Paris",
        berlin: "Europe/Berlin",
        germany: "Europe/Berlin",
        amsterdam: "Europe/Amsterdam",
        rome: "Europe/Rome",
        italy: "Europe/Rome",
        madrid: "Europe/Madrid",
        spain: "Europe/Madrid",
        moscow: "Europe/Moscow",
        russia: "Europe/Moscow",
        istanbul: "Europe/Istanbul",
        dubai: "Asia/Dubai",
        uae: "Asia/Dubai",
        riyadh: "Asia/Riyadh",
        "saudi arabia": "Asia/Riyadh",
        doha: "Asia/Qatar",
        qatar: "Asia/Qatar",
        kuwait: "Asia/Kuwait",
        bahrain: "Asia/Bahrain",
        tokyo: "Asia/Tokyo",
        japan: "Asia/Tokyo",
        seoul: "Asia/Seoul",
        korea: "Asia/Seoul",
        beijing: "Asia/Shanghai",
        china: "Asia/Shanghai",
        shanghai: "Asia/Shanghai",
        singapore: "Asia/Singapore",
        "hong kong": "Asia/Hong_Kong",
        bangkok: "Asia/Bangkok",
        thailand: "Asia/Bangkok",
        jakarta: "Asia/Jakarta",
        "kuala lumpur": "Asia/Kuala_Lumpur",
        malaysia: "Asia/Kuala_Lumpur",
        karachi: "Asia/Karachi",
        pakistan: "Asia/Karachi",
        dhaka: "Asia/Dhaka",
        bangladesh: "Asia/Dhaka",
        colombo: "Asia/Colombo",
        "sri lanka": "Asia/Colombo",
        kathmandu: "Asia/Kathmandu",
        nepal: "Asia/Kathmandu",
        sydney: "Australia/Sydney",
        melbourne: "Australia/Melbourne",
        brisbane: "Australia/Brisbane",
        australia: "Australia/Sydney",
        perth: "Australia/Perth",
        cairo: "Africa/Cairo",
        egypt: "Africa/Cairo",
        nairobi: "Africa/Nairobi",
        lagos: "Africa/Lagos",
      };
      const now = new Date();
      const getTimeInCity = (cityName) => {
        const key = cityName.toLowerCase().trim();
        const tz = cityToTZ[key] || (key.includes("/") ? key : null);
        if (!tz) return null;
        const timeStr = now.toLocaleTimeString("en-US", {
          timeZone: tz,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        });
        const dateStr = now.toLocaleDateString("en-US", {
          timeZone: tz,
          weekday: "short",
          month: "short",
          day: "numeric",
        });
        const hour = parseInt(
          now.toLocaleTimeString("en-US", {
            timeZone: tz,
            hour: "2-digit",
            hour12: false,
          }),
        );
        const status =
          hour < 6 || hour >= 23
            ? "sleeping"
            : hour >= 9 && hour < 18
              ? "business"
              : "awake";
        const istMs = new Date(
          now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
        ).getTime();
        const tgtMs = new Date(
          now.toLocaleString("en-US", { timeZone: tz }),
        ).getTime();
        const diffH = (tgtMs - istMs) / 3600000;
        const offsetFromIST =
          diffH >= 0
            ? `+${diffH.toFixed(1)}h from IST`
            : `${diffH.toFixed(1)}h from IST`;
        return {
          city: cityName.charAt(0).toUpperCase() + cityName.slice(1),
          time: timeStr,
          date: dateStr,
          timezone: tz,
          status,
          offsetFromIST,
        };
      };
      const results = cities.map(getTimeInCity).filter(Boolean);
      if (!results.length)
        throw new Error("Could not resolve any city names to timezones.");
      return `Timezone data ready. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:TIMEZONE:${JSON.stringify({ cities: results, generatedAt: now.toISOString() })}||`;
    } catch (error) {
      console.error("[Timezone Error]:", error.message);
      return `Timezone lookup failed. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:TIMEZONE:${JSON.stringify({ cities: [], error: error.message })}||`;
    }
  },
  {
    name: "get_timezone",
    description:
      'Gets current local time in one or multiple cities. Handles multi-city conversions like "if it is 3 PM IST what time is it in London and New York?"',
    schema: z.object({
      // 🛡️ GLOBAL XML FIX: Rationale parameter added
      rationale: z
        .string()
        .describe(
          "Briefly explain why you are calling this tool. This parameter is mandatory to ensure stable XML generation.",
        ),
      cities: z
        .array(z.string())
        .describe('Array of city names e.g. ["London", "New York", "Tokyo"].'),
    }),
  },
);

// ============================================================================
// 🏋️ TOOL 16: Voice Fitness & Calorie Coach (CalorieNinjas + MongoDB)
// 🌟 NEW FEATURE: Fitness Coach
// ============================================================================

export const createFitnessTool = (userId) =>
  tool(
    async ({ mode, exercise, duration, sets, reps, foodQuery, unit }) => {
      try {
        if (mode && !["log_workout", "calorie_lookup", "summary"].includes(mode)) {
          mode = "summary";
        }

        if (!userId) return "SYSTEM_ERROR: User ID missing.";
        if (mode === "log_workout") {
          if (!exercise) throw new Error("Exercise name required.");
          const calPerMin = {
            running: 11,
            jogging: 9,
            cycling: 8,
            swimming: 10,
            walking: 4,
            yoga: 3,
            hiit: 12,
            "weight training": 6,
            "strength training": 6,
            pushups: 7,
            "push-ups": 7,
            situps: 5,
            "sit-ups": 5,
            pullups: 8,
            squats: 6,
            plank: 4,
            jumping: 9,
            dancing: 6,
            badminton: 7,
            tennis: 8,
            basketball: 8,
            football: 9,
            cricket: 5,
          };
          const cpm = calPerMin[exercise.toLowerCase().trim()] || 6;
          const mins =
            duration || (sets && reps ? Math.ceil((sets * reps) / 15) : 10);
          const caloriesBurned = Math.round(cpm * mins);
          await WorkoutLog.create({
            user: userId,
            exercise,
            duration: mins,
            caloriesBurned,
            sets: sets || null,
            reps: reps || null,
          });
          const logs = await WorkoutLog.find({ user: userId })
            .sort({ date: -1 })
            .lean();
          let streak = 0;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const seen = new Set();
          for (const w of logs) {
            const d = new Date(w.date);
            d.setHours(0, 0, 0, 0);
            const k = d.toDateString();
            if (!seen.has(k)) {
              seen.add(k);
              const exp = new Date(today);
              exp.setDate(today.getDate() - streak);
              if (d.toDateString() === exp.toDateString()) streak++;
              else break;
            }
          }
          const wa = new Date();
          wa.setDate(wa.getDate() - 7);
          const wl = await WorkoutLog.find({
            user: userId,
            date: { $gte: wa },
          }).lean();
          const weeklyStats = {
            workouts: wl.length,
            minutes: wl.reduce((s, w) => s + (w.duration || 0), 0),
            calories: wl.reduce((s, w) => s + (w.caloriesBurned || 0), 0),
          };
          const cardPayload = JSON.stringify({
            mode: "log",
            exercise,
            duration: mins,
            caloriesBurned,
            sets: sets || null,
            reps: reps || null,
            streak,
            weeklyStats,
            streakLabel:
              streak >= 7
                ? "🔥 Week Streak!"
                : streak >= 3
                  ? "⚡ On a Roll!"
                  : `${streak} Day Streak`,
          });
          return `Workout logged. YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:FITNESS:${cardPayload}||`;
        }
        if (mode === "calorie_lookup") {
          const apiKey = process.env.CALORIENINJAS_API_KEY;
          if (!apiKey)
            throw new Error("CALORIENINJAS_API_KEY missing from .env");
          const q = foodQuery || exercise;
          if (!q) throw new Error("Food query required.");
          const data = await fetchWithCacheAndRetry(
            `https://api.calorieninjas.com/v1/nutrition?query=${encodeURIComponent(q)}`,
            { headers: { "X-Api-Key": apiKey } },
            86400000,
          );
          if (!data?.items?.length)
            throw new Error(`No nutrition data for "${q}"`);
          const t = data.items.reduce(
            (a, i) => ({
              calories: a.calories + i.calories,
              protein: a.protein + i.protein_g,
              carbs: a.carbs + i.carbohydrates_total_g,
              fat: a.fat + i.fat_total_g,
              fiber: a.fiber + (i.fiber_g || 0),
              sodium: a.sodium + (i.sodium_mg || 0),
            }),
            { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 },
          );
          const r1 = (n) => parseFloat(n.toFixed(1));
          const cardPayload = JSON.stringify({
            mode: "nutrition",
            query: q,
            servingSize: unit || "standard serving",
            calories: r1(t.calories),
            protein: r1(t.protein),
            carbs: r1(t.carbs),
            fat: r1(t.fat),
            fiber: r1(t.fiber),
            sodium: r1(t.sodium),
            items: data.items.map((i) => ({
              name: i.name,
              calories: r1(i.calories),
            })),
          });
          return `Nutrition data fetched. YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:FITNESS:${cardPayload}||`;
        }
        if (mode === "summary") {
          const wa = new Date();
          wa.setDate(wa.getDate() - 7);
          const workouts = await WorkoutLog.find({
            user: userId,
            date: { $gte: wa },
          })
            .sort({ date: -1 })
            .lean();
          if (!workouts.length)
            return `No workouts logged this week. Tell user to say "log my workout" to start. CRITICAL: DO NOT APPEND A CARD STRING.`;
          const cardPayload = JSON.stringify({
            mode: "summary",
            period: "This Week",
            totalWorkouts: workouts.length,
            totalMinutes: workouts.reduce((s, w) => s + (w.duration || 0), 0),
            totalCalories: workouts.reduce(
              (s, w) => s + (w.caloriesBurned || 0),
              0,
            ),
            exercises: [...new Set(workouts.map((w) => w.exercise))],
            recentWorkouts: workouts
              .slice(0, 5)
              .map((w) => ({
                exercise: w.exercise,
                duration: w.duration,
                calories: w.caloriesBurned,
                date: new Date(w.date).toLocaleDateString("en-IN", {
                  timeZone: "Asia/Kolkata",
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                }),
              })),
          });
          return `Fitness summary ready. YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:FITNESS:${cardPayload}||`;
        }
        throw new Error("Invalid mode.");
      } catch (error) {
        console.error("[Fitness Error]:", error.message);
        return `Fitness tool error. YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:FITNESS:${JSON.stringify({ mode, error: error.message })}||`;
      }
    },
    {
      name: "log_fitness",
      description:
        "Three-mode fitness tool. log_workout: logs exercise sessions and tracks streaks. calorie_lookup: fetches nutrition data. summary: shows weekly workout stats.",
      schema: z.object({
        // 🛡️ GLOBAL XML FIX: Rationale parameter added
        rationale: z
          .string()
          .describe(
            "Briefly explain why you are calling this tool. This parameter is mandatory to ensure stable XML generation.",
          ),
        mode: z.string(),
        exercise: z.string().optional(),
        duration: z.number().optional(),
        sets: z.number().optional(),
        reps: z.number().optional(),
        foodQuery: z.string().optional(),
        unit: z.string().optional(),
      }),
    },
  );

// ============================================================================
// 🛸 TOOL 17: NASA Space Intelligence (NASA Open APIs)
// 🌟 NEW FEATURE: NASA Space Intelligence
// ============================================================================

export const getNASATool = tool(
  async ({ queryType }) => {
    try {
        if (queryType && !["apod", "neo", "mars"].includes(queryType)) {
          queryType = "apod";
        }

      const apiKey = process.env.NASA_API_KEY || "DEMO_KEY";
      const todayStr = new Date().toISOString().split("T")[0];
      let cardPayload;
      if (queryType === "apod") {
        const data = await fetchWithCacheAndRetry(
          `https://api.nasa.gov/planetary/apod?api_key=${apiKey}&thumbs=true`,
          {},
          3600000,
        );
        // 🎨 UI PIPELINE FIX: APOD gets its own dedicated card type for a
        // premium image-centric widget on the frontend. NEO/Mars stay on NASA.
        cardPayload = JSON.stringify({
          title: data.title,
          date: data.date,
          explanation:
            (data.explanation || "").substring(0, 400) +
            (data.explanation?.length > 400 ? "..." : ""),
          imageUrl:
            data.media_type === "video" ? data.thumbnail_url || null : data.url,
          hdUrl: data.hdurl || data.url,
          mediaType: data.media_type,
          copyright: data.copyright
            ? `© ${data.copyright.trim()}`
            : "NASA/Public Domain",
        });
        return `NASA data fetched. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:APOD:${cardPayload}||`;
      } else if (queryType === "neo") {
        const data = await fetchWithCacheAndRetry(
          `https://api.nasa.gov/neo/rest/v1/feed?start_date=${todayStr}&end_date=${todayStr}&api_key=${apiKey}`,
          {},
          3600000,
        );
        const allNeos = Object.values(data.near_earth_objects || {}).flat();
        const closest = allNeos
          .sort(
            (a, b) =>
              parseFloat(
                a.close_approach_data?.[0]?.miss_distance?.kilometers ||
                  Infinity,
              ) -
              parseFloat(
                b.close_approach_data?.[0]?.miss_distance?.kilometers ||
                  Infinity,
              ),
          )
          .slice(0, 5)
          .map((neo) => ({
            name: neo.name.replace(/[()]/g, ""),
            diameter: `${parseFloat(neo.estimated_diameter?.meters?.estimated_diameter_min || 0).toFixed(0)}–${parseFloat(neo.estimated_diameter?.meters?.estimated_diameter_max || 0).toFixed(0)}m`,
            missDistance: `${(parseFloat(neo.close_approach_data?.[0]?.miss_distance?.kilometers || 0) / 1000).toFixed(0)}k km`,
            velocity: `${parseFloat(neo.close_approach_data?.[0]?.relative_velocity?.kilometers_per_hour || 0).toFixed(0)} km/h`,
            isPotentiallyHazardous: neo.is_potentially_hazardous_asteroid,
          }));
        cardPayload = JSON.stringify({
          type: "neo",
          date: todayStr,
          totalCount: allNeos.length,
          hazardousCount: allNeos.filter(
            (n) => n.is_potentially_hazardous_asteroid,
          ).length,
          asteroids: closest,
        });
      } else if (queryType === "mars") {
        const data = await fetchWithCacheAndRetry(
          `https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/latest_photos?api_key=${apiKey}&page=1`,
          {},
          3600000,
        );
        const photos = (data.latest_photos || [])
          .slice(0, 6)
          .map((p) => ({
            id: p.id,
            sol: p.sol,
            camera: p.camera?.full_name || p.camera?.name || "Unknown",
            imageUrl: p.img_src,
            earthDate: p.earth_date,
          }));
        cardPayload = JSON.stringify({
          type: "mars",
          rover: "Curiosity",
          latestSol: data.latest_photos?.[0]?.sol,
          earthDate: data.latest_photos?.[0]?.earth_date,
          totalPhotos: data.latest_photos?.length || 0,
          photos,
        });
      } else {
        throw new Error("Invalid queryType. Use: apod, neo, or mars.");
      }
      return `NASA data fetched. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:NASA:${cardPayload}||`;
    } catch (error) {
      console.error("[NASA Error]:", error.message);
      return `NASA data fetch failed. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:NASA:${JSON.stringify({ queryType, error: error.message })}||`;
    }
  },
  {
    name: "get_nasa_data",
    // 🛡️ SURGICAL FIX: [GROQ-XML-01] Aggressively explicit description to prevent
    // Groq Llama-3 XML tokenization glitch on single-parameter tools. The model
    // was rushing token generation and emitting malformed XML like:
    //   <function=get_nasa_data{"queryType": "apod"}</function>
    // (missing closing '>'), causing a 400 Bad Request with code 'tool_use_failed'.
    // Verbose description forces the model to slow down and generate correct XML.
    description:
      'Fetches NASA space data. MANDATORY: You MUST pass exactly ONE of these three literal enum strings as queryType: "apod" = Astronomy Picture of the Day, "neo" = Near Earth Asteroids today, "mars" = Latest Mars Curiosity rover photos. Do NOT pass any other value.',
    schema: z.object({
      // 🛡️ GLOBAL XML FIX: Rationale parameter added
      rationale: z
        .string()
        .describe(
          "Briefly explain why you are calling this tool. This parameter is mandatory to ensure stable XML generation.",
        ),
      queryType: z
        .string()
        .describe(
          'MANDATORY: The exact type of NASA data to fetch. You MUST pass the exact string "apod" for Astronomy Picture of the Day, "neo" for Near Earth Objects, or "mars" for Mars rover photos. No other values are accepted.',
        ),
    }),
  },
);

// ============================================================================
// 💰 TOOL 18: Voice-Powered Personal Finance Logger (Pure MongoDB)
// 🌟 NEW FEATURE: Personal Finance Logger
// ============================================================================

export const createFinanceTool = (userId) =>
  tool(
    async ({
      mode,
      transactionType,
      amount,
      category,
      description,
      period,
    }) => {
      try {
        if (mode && !["log", "summary"].includes(mode)) {
          mode = "summary";
        }
        if (transactionType && !["expense", "income"].includes(transactionType)) {
          transactionType = "expense";
        }
        if (period && !["week", "month"].includes(period)) {
          period = "month";
        }

        if (!userId) return "SYSTEM_ERROR: User ID missing.";
        if (mode === "log") {
          if (!amount || amount <= 0) throw new Error("Valid amount required.");
          if (!description) throw new Error("Description required.");
          const type = transactionType === "income" ? "income" : "expense";
          const validCats = [
            "Food",
            "Transport",
            "Entertainment",
            "Health",
            "Shopping",
            "Utilities",
            "Rent",
            "Salary",
            "Freelance",
            "Travel",
            "Education",
            "Investment",
            "Other",
          ];
          const normCat =
            validCats.find(
              (c) => c.toLowerCase() === (category || "").toLowerCase(),
            ) || "Other";
          const tx = await Transaction.create({
            user: userId,
            type,
            amount,
            category: normCat,
            description,
          });
          const cardPayload = JSON.stringify({
            mode: "receipt",
            transactionId: tx._id.toString().slice(-6).toUpperCase(),
            type,
            amount,
            category: normCat,
            description,
            date: new Date().toLocaleDateString("en-IN", {
              timeZone: "Asia/Kolkata",
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
            time: new Date().toLocaleTimeString("en-IN", {
              timeZone: "Asia/Kolkata",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            }),
            typeLabel: type === "income" ? "💰 Income" : "💸 Expense",
          });
          return `Transaction logged. YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:FINANCE:${cardPayload}||`;
        }
        if (mode === "summary") {
          const periodDays = period === "week" ? 7 : 30;
          const since = new Date();
          since.setDate(since.getDate() - periodDays);
          const txs = await Transaction.find({
            user: userId,
            date: { $gte: since },
          })
            .sort({ date: -1 })
            .lean();
          if (!txs.length)
            return `No transactions for the past ${periodDays} days. Tell user to say "log expense: lunch, 280 rupees". CRITICAL: DO NOT APPEND A CARD STRING.`;
          const income = txs
            .filter((t) => t.type === "income")
            .reduce((s, t) => s + t.amount, 0);
          const expenses = txs
            .filter((t) => t.type === "expense")
            .reduce((s, t) => s + t.amount, 0);
          const catMap = {};
          txs
            .filter((t) => t.type === "expense")
            .forEach((t) => {
              catMap[t.category] = (catMap[t.category] || 0) + t.amount;
            });
          const topCategories = Object.entries(catMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, amt]) => ({
              name,
              amount: parseFloat(amt.toFixed(2)),
              percent: Math.round((amt / expenses) * 100) || 0,
            }));
          const cardPayload = JSON.stringify({
            mode: "summary",
            period: period === "week" ? "This Week" : "This Month",
            totalIncome: parseFloat(income.toFixed(2)),
            totalExpenses: parseFloat(expenses.toFixed(2)),
            balance: parseFloat((income - expenses).toFixed(2)),
            transactionCount: txs.length,
            topCategories,
            recentTransactions: txs
              .slice(0, 5)
              .map((t) => ({
                desc: t.description,
                amount: t.type === "expense" ? -t.amount : t.amount,
                category: t.category,
                date: new Date(t.date).toLocaleDateString("en-IN", {
                  timeZone: "Asia/Kolkata",
                  day: "numeric",
                  month: "short",
                }),
              })),
            healthStatus:
              income - expenses > 0
                ? "surplus"
                : income - expenses < 0
                  ? "deficit"
                  : "break-even",
          });
          return `Finance summary ready. YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:FINANCE:${cardPayload}||`;
        }
        throw new Error('Invalid mode. Use "log" or "summary".');
      } catch (error) {
        console.error("[Finance Error]:", error.message);
        return `Finance tool error. YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:FINANCE:${JSON.stringify({ mode, error: error.message })}||`;
      }
    },
    {
      name: "log_finance",
      description:
        "Two-mode personal finance tool. log: records expense/income. summary: shows spending report for week or month.",
      schema: z.object({
        // 🛡️ GLOBAL XML FIX: Rationale parameter added
        rationale: z
          .string()
          .describe(
            "Briefly explain why you are calling this tool. This parameter is mandatory to ensure stable XML generation.",
          ),
        mode: z.string(),
        transactionType: z.string().optional(),
        amount: z.number().optional(),
        category: z.string().optional(),
        description: z.string().optional(),
        period: z.string().optional(),
      }),
    },
  );

// ============================================================================
// 🌤️ TOOL 19: 7-Day Weather Forecast (Open-Meteo — no key needed)
// 🌟 SPRINT 1 — Feature 17: 7-Day Forecast
// ============================================================================

/**
 * Maps WMO weather interpretation codes to human-readable condition labels.
 * Reference: https://open-meteo.com/en/docs (WMO Weather interpretation codes)
 */
const wmoCodeToCondition = (code) => {
  if (code === 0) return "Clear Sky";
  if (code === 1) return "Mainly Clear";
  if (code === 2) return "Partly Cloudy";
  if (code === 3) return "Overcast";
  if (code === 45 || code === 48) return "Foggy";
  if (code >= 51 && code <= 55) return "Drizzle";
  if (code >= 56 && code <= 57) return "Freezing Drizzle";
  if (code >= 61 && code <= 65) return "Rain";
  if (code >= 66 && code <= 67) return "Freezing Rain";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 80 && code <= 82) return "Rain Showers";
  if (code >= 85 && code <= 86) return "Snow Showers";
  if (code === 95) return "Thunderstorm";
  if (code === 96 || code === 99) return "Thunderstorm + Hail";
  return "Unknown";
};

export const getWeatherForecastTool = tool(
  async ({ location }) => {
    try {
        if (units && !["celsius", "fahrenheit"].includes(units)) {
          units = "celsius";
        }

      // ── Step 1: Geocode city name → lat/lon via Open-Meteo geocoding API ──
      // 24h TTL — city coordinates never change
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location.trim())}&count=1&language=en&format=json`;
      const geoData = await fetchWithCacheAndRetry(geoUrl, {}, 86400000);

      if (!geoData?.results?.length) {
        throw new Error(`City "${location}" not found in geocoding database.`);
      }

      const {
        latitude,
        longitude,
        timezone,
        name: cityName,
        country_code,
      } = geoData.results[0];
      const resolvedTZ = timezone || "Asia/Kolkata";

      // ── Step 2: Fetch 7-day forecast from Open-Meteo ─────────────────────
      // 1h TTL — daily forecasts update a few times per day
      const forecastUrl = [
        `https://api.open-meteo.com/v1/forecast`,
        `?latitude=${latitude}`,
        `&longitude=${longitude}`,
        `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max,weathercode,windspeed_10m_max`,
        `&current_weather=true`,
        `&timezone=${encodeURIComponent(resolvedTZ)}`,
        `&forecast_days=7`,
      ].join("");

      const forecastData = await fetchWithCacheAndRetry(
        forecastUrl,
        {},
        3600000,
      );

      if (!forecastData?.daily?.time?.length) {
        throw new Error("Open-Meteo returned no forecast data.");
      }

      const daily = forecastData.daily;

      // ── Step 3: Build 7-day forecast array ───────────────────────────────
      const days = daily.time.map((dateStr, idx) => {
        const dayDate = new Date(dateStr + "T12:00:00");
        return {
          day: dayDate.toLocaleDateString("en-US", { weekday: "short" }),
          date: dayDate.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          }),
          high: Math.round(daily.temperature_2m_max[idx] ?? 0),
          low: Math.round(daily.temperature_2m_min[idx] ?? 0),
          condition: wmoCodeToCondition(daily.weathercode[idx] ?? 0),
          rain: daily.precipitation_probability_max[idx] ?? 0,
          uv:
            daily.uv_index_max[idx] !== undefined
              ? parseFloat(daily.uv_index_max[idx].toFixed(1))
              : null,
          windMax:
            daily.windspeed_10m_max[idx] !== undefined
              ? `${Math.round(daily.windspeed_10m_max[idx])} km/h`
              : "--",
        };
      });

      // ── Step 4: Current conditions from the live weather block ────────────
      const cw = forecastData.current_weather;
      const currentCondition = cw
        ? wmoCodeToCondition(cw.weathercode)
        : days[0]?.condition || "Unknown";
      const currentTemp = cw
        ? Math.round(cw.temperature)
        : days[0]?.high || "--";

      const cardPayload = JSON.stringify({
        location: cityName || location,
        countryCode: country_code || "",
        timezone: resolvedTZ,
        currentTemp,
        currentCondition,
        days,
      });

      return `7-day forecast fetched. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:FORECAST:${cardPayload}||`;
    } catch (error) {
      console.error("[Forecast Error]:", error.message);
      return `Forecast fetch failed. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:FORECAST:${JSON.stringify({ location, error: error.message })}||`;
    }
  },
  {
    name: "get_weather_forecast",
    description:
      "Fetches a 7-day daily weather forecast for any city: high/low temperatures, rain probability, UV index, wind speed. Use this when the user asks about forecast, this week's weather, tomorrow's weather, or \"will it rain on [day]\". For CURRENT conditions only, use get_weather instead.",
    schema: z.object({
      // 🛡️ GLOBAL XML FIX: Rationale parameter added
      rationale: z
        .string()
        .describe(
          "Briefly explain why you are calling this tool. This parameter is mandatory to ensure stable XML generation.",
        ),
      location: z
        .string()
        .describe(
          'City name to get the 7-day forecast for, e.g. "Thrissur", "Mumbai", "London".',
        ),
    }),
  },
);

// ============================================================================
// 🧮 TOOL 20: Advanced Calculator & Unit Converter (Pure JS — zero API needed)
// 🌟 SPRINT 1 — Feature 20: Calculator & Unit Converter
// ============================================================================

/**
 * Formats a number into a clean, readable string.
 * Handles large numbers, decimals, and avoids floating-point noise.
 */
const fmtNum = (n) => {
  if (!isFinite(n) || isNaN(n)) return "Error";
  if (Number.isInteger(n)) return n.toLocaleString("en-IN");
  const abs = Math.abs(n);
  if (abs >= 1e9)
    return (n / 1e9).toFixed(3).replace(/\.?0+$/, "") + " Billion";
  if (abs >= 1e6)
    return (n / 1e6).toFixed(3).replace(/\.?0+$/, "") + " Million";
  // Remove trailing zeros after rounding to 8 significant places
  return parseFloat(n.toPrecision(8)).toLocaleString("en-IN", {
    maximumFractionDigits: 8,
  });
};

/**
 * Unit conversion table — all values are factors relative to the base SI unit.
 * Temperature is handled separately (non-multiplicative conversion).
 * Structure: { unitKey: factorToSIBase }
 */
const UNITS = {
  // Weight — base: kg
  weight: {
    kg: 1,
    kilogram: 1,
    kilograms: 1,
    g: 0.001,
    gram: 0.001,
    grams: 0.001,
    mg: 0.000001,
    lb: 0.453592,
    lbs: 0.453592,
    pound: 0.453592,
    pounds: 0.453592,
    oz: 0.0283495,
    ounce: 0.0283495,
    ounces: 0.0283495,
    stone: 6.35029,
    stones: 6.35029,
    tonne: 1000,
    tonnes: 1000,
    ton: 907.185,
    "metric ton": 1000,
  },
  // Length — base: metres
  length: {
    m: 1,
    meter: 1,
    meters: 1,
    metre: 1,
    metres: 1,
    cm: 0.01,
    centimeter: 0.01,
    centimeters: 0.01,
    mm: 0.001,
    millimeter: 0.001,
    km: 1000,
    kilometer: 1000,
    kilometers: 1000,
    mile: 1609.34,
    miles: 1609.34,
    ft: 0.3048,
    foot: 0.3048,
    feet: 0.3048,
    inch: 0.0254,
    inches: 0.0254,
    '"': 0.0254,
    "'": 0.3048,
    yard: 0.9144,
    yards: 0.9144,
    yd: 0.9144,
    nautical_mile: 1852,
  },
  // Volume — base: litres
  volume: {
    l: 1,
    liter: 1,
    liters: 1,
    litre: 1,
    litres: 1,
    ml: 0.001,
    milliliter: 0.001,
    milliliters: 0.001,
    cup: 0.236588,
    cups: 0.236588,
    gallon: 3.78541,
    gallons: 3.78541,
    "fl oz": 0.0295735,
    "fluid oz": 0.0295735,
    tbsp: 0.0147868,
    tablespoon: 0.0147868,
    tsp: 0.00492892,
    teaspoon: 0.00492892,
    pint: 0.473176,
    pints: 0.473176,
    quart: 0.946353,
    quarts: 0.946353,
  },
  // Speed — base: km/h
  speed: {
    "km/h": 1,
    kph: 1,
    kmph: 1,
    mph: 1.60934,
    "m/s": 3.6,
    "meters per second": 3.6,
    knot: 1.852,
    knots: 1.852,
    "ft/s": 1.09728,
  },
  // Area — base: m²
  area: {
    m2: 1,
    "sq m": 1,
    sqm: 1,
    "square meter": 1,
    "square meters": 1,
    km2: 1e6,
    "sq km": 1e6,
    ft2: 0.092903,
    "sq ft": 0.092903,
    "square foot": 0.092903,
    "square feet": 0.092903,
    acre: 4046.86,
    acres: 4046.86,
    hectare: 10000,
    hectares: 10000,
  },
  // Data — base: bytes
  data: {
    byte: 1,
    bytes: 1,
    b: 1,
    kb: 1024,
    kilobyte: 1024,
    kilobytes: 1024,
    mb: 1048576,
    megabyte: 1048576,
    megabytes: 1048576,
    gb: 1073741824,
    gigabyte: 1073741824,
    gigabytes: 1073741824,
    tb: 1099511627776,
    terabyte: 1099511627776,
    terabytes: 1099511627776,
  },
  // Energy — base: joules
  energy: {
    j: 1,
    joule: 1,
    joules: 1,
    kj: 1000,
    cal: 4.184,
    calorie: 4.184,
    calories: 4.184,
    kcal: 4184,
    wh: 3600,
    kwh: 3600000,
  },
};

/**
 * Attempts to find which unit category a given unit string belongs to.
 * Returns { category, factor } or null if not found.
 */
const resolveUnit = (unitStr) => {
  const key = unitStr.toLowerCase().trim();
  for (const [category, table] of Object.entries(UNITS)) {
    if (table[key] !== undefined) return { category, factor: table[key] };
  }
  return null;
};

/**
 * Temperature conversion — handled separately as it requires additive offsets.
 */
const convertTemperature = (value, from, to) => {
  const f = from.toLowerCase().replace("°", "").trim();
  const t = to.toLowerCase().replace("°", "").trim();
  let celsius;
  if (f === "c" || f === "celsius") celsius = value;
  else if (f === "f" || f === "fahrenheit") celsius = ((value - 32) * 5) / 9;
  else if (f === "k" || f === "kelvin") celsius = value - 273.15;
  else throw new Error(`Unknown temperature unit: ${from}`);

  if (t === "c" || t === "celsius") return celsius;
  if (t === "f" || t === "fahrenheit") return (celsius * 9) / 5 + 32;
  if (t === "k" || t === "kelvin") return celsius + 273.15;
  throw new Error(`Unknown target temperature unit: ${to}`);
};

export const calculateTool = tool(
  async ({
    calculationType,
    expression,
    num1,
    num2,
    num3,
    operator,
    unitFrom,
    unitTo,
  }) => {
    try {
        if (operator && !["+", "-", "*", "/", "^", "sqrt"].includes(operator)) {
          operator = "+";
        }

      let result = null;
      let formula = "";
      let steps = [];
      let extras = {};
      let displayType = calculationType;

      switch (calculationType) {
        // ── Basic arithmetic ──────────────────────────────────────────────
        case "arithmetic": {
          if (num1 === undefined || num1 === null)
            throw new Error("num1 is required.");
          const opSymbols = {
            "+": "+",
            "-": "−",
            "*": "×",
            "/": "÷",
            "^": "^",
            sqrt: "√",
          };
          if (operator === "sqrt") {
            if (num1 < 0)
              throw new Error("Cannot take square root of a negative number.");
            result = Math.sqrt(num1);
            formula = `√${num1} = ${fmtNum(result)}`;
            steps = [`Square root of ${num1}`, `= ${fmtNum(result)}`];
          } else {
            if (num2 === undefined || num2 === null)
              throw new Error("num2 is required for binary operations.");
            if (operator === "/" && num2 === 0)
              throw new Error("Division by zero is undefined.");
            if (operator === "+") result = num1 + num2;
            else if (operator === "-") result = num1 - num2;
            else if (operator === "*") result = num1 * num2;
            else if (operator === "/") result = num1 / num2;
            else if (operator === "^") result = Math.pow(num1, num2);
            else throw new Error(`Unknown operator: ${operator}`);
            formula = `${num1} ${opSymbols[operator] || operator} ${num2} = ${fmtNum(result)}`;
            steps = [
              `${fmtNum(num1)} ${opSymbols[operator] || operator} ${fmtNum(num2)}`,
              `= ${fmtNum(result)}`,
            ];
          }
          break;
        }

        // ── Percentage: "what is X% of Y?" ────────────────────────────────
        case "percentage_value": {
          if (num1 === undefined || num2 === undefined)
            throw new Error("num1 (%) and num2 (base) required.");
          result = (num1 / 100) * num2;
          formula = `${num1}% of ${fmtNum(num2)} = ${fmtNum(result)}`;
          steps = [
            `Convert ${num1}% → decimal: ${num1 / 100}`,
            `Multiply: ${num1 / 100} × ${fmtNum(num2)}`,
            `Result: ${fmtNum(result)}`,
          ];
          displayType = "percentage";
          break;
        }

        // ── Percentage: "X is what % of Y?" ──────────────────────────────
        case "percentage_what": {
          if (num1 === undefined || num2 === undefined)
            throw new Error("num1 (part) and num2 (whole) required.");
          if (num2 === 0) throw new Error("Cannot divide by zero.");
          result = (num1 / num2) * 100;
          formula = `(${fmtNum(num1)} ÷ ${fmtNum(num2)}) × 100 = ${fmtNum(result)}%`;
          steps = [
            `Divide: ${fmtNum(num1)} ÷ ${fmtNum(num2)} = ${fmtNum(num1 / num2)}`,
            `Multiply by 100: ${fmtNum(result)}%`,
          ];
          displayType = "percentage";
          break;
        }

        // ── Tip calculator ─────────────────────────────────────────────────
        case "tip": {
          if (num1 === undefined || num2 === undefined)
            throw new Error("num1 (tip%) and num2 (bill amount) required.");
          const tipAmt = (num1 / 100) * num2;
          const totalAmt = num2 + tipAmt;
          result = tipAmt;
          formula = `${num1}% tip on ${fmtNum(num2)}`;
          steps = [
            `Tip: ${fmtNum(num2)} × ${num1 / 100} = ${fmtNum(tipAmt)}`,
            `Total: ${fmtNum(num2)} + ${fmtNum(tipAmt)} = ${fmtNum(totalAmt)}`,
          ];
          extras = {
            tipAmount: fmtNum(tipAmt),
            totalWithTip: fmtNum(totalAmt),
          };
          break;
        }

        // ── Discount calculator ────────────────────────────────────────────
        case "discount": {
          if (num1 === undefined || num2 === undefined)
            throw new Error(
              "num1 (discount%) and num2 (original price) required.",
            );
          const discAmt = (num1 / 100) * num2;
          const finalPrice = num2 - discAmt;
          result = finalPrice;
          formula = `${num2} − ${num1}% = ${fmtNum(finalPrice)}`;
          steps = [
            `Discount: ${fmtNum(num2)} × ${num1 / 100} = ${fmtNum(discAmt)}`,
            `Final price: ${fmtNum(num2)} − ${fmtNum(discAmt)} = ${fmtNum(finalPrice)}`,
          ];
          extras = {
            discount: fmtNum(discAmt),
            finalPrice: fmtNum(finalPrice),
            savings: fmtNum(discAmt),
          };
          break;
        }

        // ── Unit conversion ───────────────────────────────────────────────
        case "unit_conversion": {
          if (!unitFrom || !unitTo)
            throw new Error(
              "unitFrom and unitTo are required for conversions.",
            );
          if (num1 === undefined)
            throw new Error("num1 (value to convert) required.");

          // Temperature special case
          const tempKeys = [
            "c",
            "f",
            "k",
            "celsius",
            "fahrenheit",
            "kelvin",
            "°c",
            "°f",
            "°k",
          ];
          const fromKey = unitFrom.toLowerCase().replace("°", "").trim();
          const toKey = unitTo.toLowerCase().replace("°", "").trim();
          if (
            tempKeys.some((k) => fromKey.includes(k)) ||
            tempKeys.some((k) => toKey.includes(k))
          ) {
            const converted = convertTemperature(num1, fromKey, toKey);
            result = converted;
            const toLabel =
              toKey === "f" || toKey === "fahrenheit"
                ? "°F"
                : toKey === "k" || toKey === "kelvin"
                  ? "K"
                  : "°C";
            const fromLabel =
              fromKey === "f" || fromKey === "fahrenheit"
                ? "°F"
                : fromKey === "k" || fromKey === "kelvin"
                  ? "K"
                  : "°C";
            formula = `${num1}${fromLabel} = ${fmtNum(converted)}${toLabel}`;
            steps = [
              `Convert ${num1}${fromLabel} to ${toLabel}`,
              `Result: ${fmtNum(converted)}${toLabel}`,
            ];
            break;
          }

          // Standard unit conversion via lookup table
          const fromUnit = resolveUnit(unitFrom);
          const toUnit = resolveUnit(unitTo);
          if (!fromUnit)
            throw new Error(
              `Unrecognised unit: "${unitFrom}". Try km, miles, kg, lbs, l, gallons, etc.`,
            );
          if (!toUnit) throw new Error(`Unrecognised unit: "${unitTo}".`);
          if (fromUnit.category !== toUnit.category)
            throw new Error(
              `Cannot convert ${unitFrom} (${fromUnit.category}) to ${unitTo} (${toUnit.category}) — different measurement types.`,
            );
          const inSI = num1 * fromUnit.factor;
          const converted = inSI / toUnit.factor;
          result = converted;
          formula = `${num1} ${unitFrom} = ${fmtNum(converted)} ${unitTo}`;
          steps = [
            `${num1} ${unitFrom} → SI base: ${fmtNum(inSI)}`,
            `÷ ${toUnit.factor} → ${fmtNum(converted)} ${unitTo}`,
          ];
          break;
        }

        // ── BMI calculator ────────────────────────────────────────────────
        case "bmi": {
          // num1 = weight in kg, num2 = height in cm (LLM must convert feet+inches to cm)
          if (num1 === undefined || num2 === undefined)
            throw new Error(
              "num1 (weight kg) and num2 (height cm) required for BMI.",
            );
          const heightM = num2 > 3 ? num2 / 100 : num2; // accept both cm and m
          const bmi = num1 / (heightM * heightM);
          let category, advice;
          if (bmi < 18.5) {
            category = "Underweight";
            advice = "Consider consulting a nutritionist.";
          } else if (bmi < 25) {
            category = "Normal Weight";
            advice = "Great — maintain your healthy lifestyle!";
          } else if (bmi < 30) {
            category = "Overweight";
            advice = "Light exercise and diet adjustments can help.";
          } else if (bmi < 35) {
            category = "Obese Class I";
            advice = "Consult a healthcare provider for guidance.";
          } else {
            category = "Obese Class II+";
            advice = "Medical consultation is recommended.";
          }
          result = parseFloat(bmi.toFixed(1));
          formula = `BMI = ${num1} kg ÷ (${heightM.toFixed(2)} m)² = ${result}`;
          steps = [
            `Weight: ${num1} kg`,
            `Height: ${heightM.toFixed(2)} m`,
            `BMI = ${num1} ÷ ${(heightM * heightM).toFixed(4)} = ${result}`,
            `Classification: ${category}`,
          ];
          extras = {
            category,
            advice,
            weightKg: num1,
            heightCm: Math.round(heightM * 100),
            normalRange: "18.5 – 24.9",
          };
          displayType = "bmi";
          break;
        }

        // ── Compound interest ─────────────────────────────────────────────
        case "compound_interest": {
          // num1 = principal, num2 = annual rate (%), num3 = years
          if (num1 === undefined || num2 === undefined || num3 === undefined)
            throw new Error(
              "num1 (principal), num2 (rate%), num3 (years) required.",
            );
          const amount = num1 * Math.pow(1 + num2 / 100, num3);
          const interest = amount - num1;
          result = parseFloat(amount.toFixed(2));
          formula = `A = ${fmtNum(num1)} × (1 + ${num2}%)^${num3}`;
          steps = [
            `Principal: ${fmtNum(num1)}`,
            `Rate: ${num2}% per year compounded annually`,
            `Time: ${num3} years`,
            `Interest earned: ${fmtNum(interest)}`,
            `Total amount: ${fmtNum(amount)}`,
          ];
          extras = {
            principal: fmtNum(num1),
            interestEarned: fmtNum(interest),
            totalAmount: fmtNum(amount),
            years: num3,
            rate: `${num2}%`,
          };
          displayType = "compound_interest";
          break;
        }

        // ── Simple interest ───────────────────────────────────────────────
        case "simple_interest": {
          // num1 = principal, num2 = rate (%), num3 = years
          if (num1 === undefined || num2 === undefined || num3 === undefined)
            throw new Error(
              "num1 (principal), num2 (rate%), num3 (years) required.",
            );
          const si = (num1 * num2 * num3) / 100;
          const total = num1 + si;
          result = parseFloat(si.toFixed(2));
          formula = `SI = (${fmtNum(num1)} × ${num2} × ${num3}) ÷ 100`;
          steps = [
            `SI = (P × R × T) / 100`,
            `SI = (${fmtNum(num1)} × ${num2} × ${num3}) / 100`,
            `SI = ${fmtNum(si)}`,
            `Total = ${fmtNum(num1)} + ${fmtNum(si)} = ${fmtNum(total)}`,
          ];
          extras = {
            simpleInterest: fmtNum(si),
            totalAmount: fmtNum(total),
            principal: fmtNum(num1),
          };
          displayType = "simple_interest";
          break;
        }

        // ── Age calculator ────────────────────────────────────────────────
        case "age": {
          // num1 = birth year (or full date string passed via expression)
          if (num1 === undefined)
            throw new Error("num1 (birth year) required.");
          const now = new Date();
          const currentYear = now.getFullYear();
          const age = currentYear - Math.round(num1);
          result = age;
          formula = `${currentYear} − ${Math.round(num1)} = ${age} years`;
          steps = [
            `Current year: ${currentYear}`,
            `Birth year: ${Math.round(num1)}`,
            `Age: ${age} years`,
          ];
          displayType = "age";
          break;
        }

        default:
          throw new Error(
            `Unknown calculationType: "${calculationType}". Supported: arithmetic, percentage_value, percentage_what, tip, discount, unit_conversion, bmi, compound_interest, simple_interest, age.`,
          );
      }

      const cardPayload = JSON.stringify({
        expression: expression || `${calculationType} calculation`,
        result: fmtNum(result),
        rawResult: result,
        formula,
        steps,
        type: displayType,
        extras,
      });

      return `Calculation complete. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:CALCULATOR:${cardPayload}||`;
    } catch (error) {
      console.error("[Calculator Error]:", error.message);
      return `Calculation failed: ${error.message}. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:CALCULATOR:${JSON.stringify({ expression: expression || "", error: error.message, type: calculationType })}||`;
    }
  },
  {
    name: "calculate",
    description: `Performs precise calculations and unit conversions with formula display.

Use for:
- arithmetic: "what is 2450 × 67" (operator: +, -, *, /, ^, sqrt)
- percentage_value: "what is 15% of 8500" (num1=15, num2=8500)
- percentage_what: "45 is what percent of 200" (num1=45, num2=200)
- tip: "15% tip on 850 rupees" (num1=15, num2=850)
- discount: "20% off 1500" (num1=20, num2=1500)
- unit_conversion: "convert 180 lbs to kg" (unitFrom="lbs", unitTo="kg", num1=180)
- bmi: "BMI for 75kg height 177cm" (num1=75, num2=177 — ALWAYS convert height to cm first)
- compound_interest: "10000 at 8% for 5 years" (num1=10000, num2=8, num3=5)
- simple_interest: "5000 principal 6% 3 years" (num1=5000, num2=6, num3=3)
- age: "how old is someone born in 1990" (num1=1990)

IMPORTANT: For BMI with feet+inches height, convert to cm before calling. 5ft 10in = 177.8cm.
Supported units: kg/lbs/oz/stone, m/km/miles/ft/inches, l/ml/cups/gallons, km/h/mph/m/s, m²/ft²/acres/hectares, bytes/KB/MB/GB/TB, °C/°F/K.`,
    schema: z.object({
      // 🛡️ GLOBAL XML FIX: Rationale parameter added
      rationale: z
        .string()
        .describe(
          "Briefly explain why you are calling this tool. This parameter is mandatory to ensure stable XML generation.",
        ),
      calculationType: z
        .enum([
          "arithmetic",
          "percentage_value",
          "percentage_what",
          "tip",
          "discount",
          "unit_conversion",
          "bmi",
          "compound_interest",
          "simple_interest",
          "age",
        ])
        .describe("Type of calculation to perform."),
      expression: z
        .string()
        .describe("User's original expression as spoken, e.g. '15% of 8500'."),
      num1: z.number().describe("Primary number. Required for all types."),
      num2: z
        .number()
        .optional()
        .describe("Secondary number (required for most binary operations)."),
      num3: z
        .number()
        .optional()
        .describe("Third number (years for interest calculations)."),
      operator: z
        .string()
        .optional()
        .describe("Arithmetic operator for type=arithmetic."),
      unitFrom: z
        .string()
        .optional()
        .describe(
          'Source unit for unit_conversion, e.g. "lbs", "miles", "°F".',
        ),
      unitTo: z
        .string()
        .optional()
        .describe('Target unit for unit_conversion, e.g. "kg", "km", "°C".'),
    }),
  },
);

// ============================================================================
// 🗞️ TOOL 21: AI-Powered Daily Briefing (Orchestrator — no new APIs needed)
// 🌟 SPRINT 1 — Feature 21: Daily Briefing
// ============================================================================

/**
 * Embedded motivational quotes — zero API dependency, zero latency, 100% reliable.
 * 30 curated quotes, randomly selected each briefing.
 */
const BRIEFING_QUOTES = [
  {
    text: "The secret of getting ahead is getting started.",
    author: "Mark Twain",
  },
  {
    text: "It always seems impossible until it's done.",
    author: "Nelson Mandela",
  },
  {
    text: "Your time is limited — don't waste it living someone else's life.",
    author: "Steve Jobs",
  },
  {
    text: "Strive not to be a success, but rather to be of value.",
    author: "Albert Einstein",
  },
  {
    text: "The future belongs to those who believe in the beauty of their dreams.",
    author: "Eleanor Roosevelt",
  },
  {
    text: "Success is not final; failure is not fatal: It is the courage to continue that counts.",
    author: "Winston Churchill",
  },
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
  },
  {
    text: "In the middle of every difficulty lies opportunity.",
    author: "Albert Einstein",
  },
  {
    text: "It does not matter how slowly you go as long as you do not stop.",
    author: "Confucius",
  },
  {
    text: "Everything you've ever wanted is on the other side of fear.",
    author: "George Addair",
  },
  { text: "Dream big and dare to fail.", author: "Norman Vaughan" },
  {
    text: "You miss 100% of the shots you don't take.",
    author: "Wayne Gretzky",
  },
  {
    text: "The best time to plant a tree was 20 years ago. The second best time is now.",
    author: "Chinese Proverb",
  },
  {
    text: "Do not go where the path may lead — go where there is no path and leave a trail.",
    author: "Ralph Waldo Emerson",
  },
  {
    text: "You will face many defeats in life, but never let yourself be defeated.",
    author: "Maya Angelou",
  },
  {
    text: "The greatest glory in living lies not in never falling, but in rising every time we fall.",
    author: "Nelson Mandela",
  },
  {
    text: "Never let the fear of striking out keep you from playing the game.",
    author: "Babe Ruth",
  },
  {
    text: "Life is either a daring adventure or nothing at all.",
    author: "Helen Keller",
  },
  {
    text: "The only person you are destined to become is the person you decide to be.",
    author: "Ralph Waldo Emerson",
  },
  {
    text: "Believe you can and you're halfway there.",
    author: "Theodore Roosevelt",
  },
  {
    text: "Act as if what you do makes a difference. It does.",
    author: "William James",
  },
  {
    text: "Success usually comes to those who are too busy to be looking for it.",
    author: "Henry David Thoreau",
  },
  {
    text: "Don't watch the clock; do what it does — keep going.",
    author: "Sam Levenson",
  },
  {
    text: "Hardships often prepare ordinary people for an extraordinary destiny.",
    author: "C.S. Lewis",
  },
  {
    text: "Opportunities don't happen. You create them.",
    author: "Chris Grosser",
  },
  {
    text: "I find that the harder I work, the more luck I seem to have.",
    author: "Thomas Jefferson",
  },
  {
    text: "The starting point of all achievement is desire.",
    author: "Napoleon Hill",
  },
  {
    text: "Happiness is not something ready made — it comes from your own actions.",
    author: "Dalai Lama",
  },
  {
    text: "It is never too late to be what you might have been.",
    author: "George Eliot",
  },
  {
    text: "You are never too old to set another goal or to dream a new dream.",
    author: "C.S. Lewis",
  },
];

export const getDailyBriefingTool = tool(
  async ({ location, includeCrypto, cryptoCoin }) => {
    try {
      const city = (location || "Mumbai").trim();
      const coin = (cryptoCoin || "bitcoin").toLowerCase().trim();

      // ── Run all sub-fetches in parallel for maximum speed ──────────────
      // Promise.allSettled guarantees partial briefing even if some APIs fail.
      const safeLoc = encodeURIComponent(city);
      const gnewsKey = process.env.GNEWS_API_KEY;
      const cryptoSymbols = {
        bitcoin: "btc-bitcoin",
        ethereum: "eth-ethereum",
        btc: "btc-bitcoin",
        eth: "eth-ethereum",
      };
      const paprikaCoin = cryptoSymbols[coin] || "btc-bitcoin";

      const [weatherResult, newsResult, cryptoResult] =
        await Promise.allSettled([
          // Weather: wttr.in (same as getWeatherTool — cache-shared)
          fetchWithCacheAndRetry(
            `https://wttr.in/${safeLoc}?format=j1`,
            {},
            300000,
          ),
          // News: GNews top headlines (skip if no key configured)
          gnewsKey
            ? fetchWithCacheAndRetry(
                `https://gnews.io/api/v4/top-headlines?token=${gnewsKey}&lang=en&max=4&topic=breaking-news`,
                {},
                600000,
              )
            : Promise.reject(new Error("No GNEWS_API_KEY")),
          // Crypto: CoinPaprika (free, no key — cache-shared with getCryptoPriceTool)
          includeCrypto !== false
            ? fetchWithCacheAndRetry(
                `https://api.coinpaprika.com/v1/tickers/${paprikaCoin}`,
                {},
                300000,
              )
            : Promise.reject(new Error("Crypto skipped")),
        ]);

      // ── Assemble sections gracefully from settled results ──────────────

      // Weather section
      let weatherSection = null;
      if (
        weatherResult.status === "fulfilled" &&
        weatherResult.value?.current_condition?.[0]
      ) {
        const cc = weatherResult.value.current_condition[0];
        const condDesc = cc.weatherDesc?.[0]?.value?.toLowerCase() ?? "";
        let condition = "Clear";
        if (condDesc.includes("rain") || condDesc.includes("drizzle"))
          condition = "Rain";
        else if (condDesc.includes("cloud") || condDesc.includes("overcast"))
          condition = "Cloudy";
        else if (condDesc.includes("snow")) condition = "Snow";
        else if (condDesc.includes("thunder")) condition = "Thunderstorm";
        // Today's forecast for high/low
        const todayForecast = weatherResult.value.weather?.[0];
        const high = todayForecast?.maxtempC ?? cc.temp_C;
        const low = todayForecast?.mintempC ?? cc.temp_C;
        let rainChance = "--";
        try {
          const h = todayForecast?.hourly;
          if (h?.length) {
            let max = 0;
            h.forEach((s) => {
              const c = parseInt(s.chanceofrain || "0", 10);
              if (c > max) max = c;
            });
            rainChance = `${max}%`;
          }
        } catch {
          /* ignore */
        }
        weatherSection = {
          city,
          temp: cc.temp_C,
          condition,
          high,
          low,
          humidity: cc.humidity ? `${cc.humidity}%` : "--",
          rainChance,
        };
      }

      // News section
      let newsSection = null;
      if (
        newsResult.status === "fulfilled" &&
        newsResult.value?.articles?.length
      ) {
        newsSection = newsResult.value.articles.slice(0, 4).map((a) => ({
          title: (a.title || "").substring(0, 90),
          source: a.source?.name || "Unknown",
          url: a.url || "",
          publishedAt: a.publishedAt
            ? new Date(a.publishedAt).toLocaleTimeString("en-IN", {
                timeZone: "Asia/Kolkata",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              }) + " IST"
            : "Recently",
        }));
      }

      // Crypto section
      let cryptoSection = null;
      if (
        cryptoResult.status === "fulfilled" &&
        cryptoResult.value?.quotes?.USD
      ) {
        const q = cryptoResult.value.quotes.USD;
        cryptoSection = {
          coin: cryptoResult.value.name || coin,
          symbol: cryptoResult.value.symbol || coin.toUpperCase(),
          price: parseFloat(q.price).toFixed(2),
          change24h: parseFloat(q.percent_change_24h).toFixed(2),
          trend: parseFloat(q.percent_change_24h) >= 0 ? "up" : "down",
        };
      }

      // Quote section — always present (zero API dependency)
      const quote =
        BRIEFING_QUOTES[Math.floor(Math.random() * BRIEFING_QUOTES.length)];

      // ── Build date and greeting ────────────────────────────────────────
      const now = new Date();
      const hour = parseInt(
        now.toLocaleTimeString("en-IN", {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          hour12: false,
        }),
      );
      const greeting =
        hour < 12
          ? "Good Morning"
          : hour < 17
            ? "Good Afternoon"
            : "Good Evening";
      const dateStr = now.toLocaleDateString("en-US", {
        timeZone: "Asia/Kolkata",
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      // Track which sections were successfully loaded
      const sections = ["date", "quote"];
      if (weatherSection) sections.push("weather");
      if (newsSection) sections.push("news");
      if (cryptoSection) sections.push("crypto");

      const cardPayload = JSON.stringify({
        greeting,
        date: dateStr,
        weather: weatherSection,
        headlines: newsSection,
        crypto: cryptoSection,
        quote,
        sections,
        generatedAt: now.toISOString(),
      });

      return `Daily briefing ready. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:BRIEFING:${cardPayload}||`;
    } catch (error) {
      console.error("[Briefing Error]:", error.message);
      // Even on total failure, return a minimal briefing with just the quote
      const quote =
        BRIEFING_QUOTES[Math.floor(Math.random() * BRIEFING_QUOTES.length)];
      const now = new Date();
      const dateStr = now.toLocaleDateString("en-US", {
        timeZone: "Asia/Kolkata",
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const fallback = JSON.stringify({
        greeting: "Good Day",
        date: dateStr,
        weather: null,
        headlines: null,
        crypto: null,
        quote,
        sections: ["date", "quote"],
        error: error.message,
      });
      return `Partial briefing. CRITICAL DIRECTIVE: YOU MUST APPEND THIS EXACT STRING TO YOUR RESPONSE: ||CARD:BRIEFING:${fallback}||`;
    }
  },
  {
    name: "get_daily_briefing",
    description:
      'Generates a comprehensive personalized morning/evening briefing: current weather, top news headlines, crypto price, and a motivational quote. Use when user says "give me my briefing", "brief me", "morning briefing", "daily update", "what\'s happening today", or "daily summary". Pass the user\'s city from RAG memory if known.',
    schema: z.object({
      // 🛡️ GLOBAL XML FIX: Rationale parameter added
      rationale: z
        .string()
        .describe(
          "Briefly explain why you are calling this tool. This parameter is mandatory to ensure stable XML generation.",
        ),
      location: z
        .string()
        .describe(
          "User's city for weather data, e.g. 'Thrissur', 'Mumbai'. Use saved location from RAG memory if available, else default to 'Mumbai'.",
        ),
      includeCrypto: z
        .boolean()
        .optional()
        .describe("Set to false to skip the crypto section. Default: true."),
      cryptoCoin: z
        .string()
        .optional()
        .describe(
          "Cryptocurrency to include, e.g. 'bitcoin', 'ethereum'. Default: bitcoin.",
        ),
    }),
  },
);
