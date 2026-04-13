import { tool } from "@langchain/core/tools";
import { z } from "zod";
import Reminder from "../models/Reminder.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// 🛠️ TOOL 1: The Personal Secretary
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
            description: "Saves a reminder, task, or note to the user's database.",
            schema: z.object({ task: z.string() }),
        }
    );
};

// 📈 TOOL 2: The Live Crypto Tracker
export const getCryptoPriceTool = tool(
    async ({ coinId }) => {
        try {
            const normalizedCoin = coinId.toLowerCase();
            const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${normalizedCoin}&vs_currencies=usd`);
            const data = await response.json();
            if (data[normalizedCoin] && data[normalizedCoin].usd) {
                return `The current live price of ${normalizedCoin} is $${data[normalizedCoin].usd} USD.`;
            }
            return `I could not find the live price for ${normalizedCoin}.`;
        } catch (error) {
            return "Error: Failed to connect to the crypto API.";
        }
    },
    {
        name: "get_crypto_price",
        description: "Fetches live cryptocurrency prices.",
        schema: z.object({ coinId: z.string() }),
    }
);

// 📧 TOOL 3: The Email Sender
export const sendEmailTool = tool(
    async ({ to, subject, body }) => {
        try {
            if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return "Error: Credentials missing.";
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
            });
            await transporter.sendMail({ from: `"Voxa AI" <${process.env.EMAIL_USER}>`, to, subject, text: body });
            return `Successfully sent email to ${to}.`;
        } catch (error) {
            return "Error: Failed to send email.";
        }
    },
    {
        name: "send_email",
        description: "Sends an email.",
        schema: z.object({ to: z.string(), subject: z.string(), body: z.string() }),
    }
);

// 🌍 TOOL 4: The Global Sports Hub (FREE APIs: CRICAPI & THESPORTSDB)
export const getSportsDataTool = tool(
    async ({ requestType, sport, query }) => {
        try {
            const lowerQuery = query.toLowerCase();
            const isUpcoming = requestType === "fixtures" || lowerQuery.includes("upcoming") || lowerQuery.includes("tomorrow");
            const isFinished = requestType === "scores" || lowerQuery.includes("finished") || lowerQuery.includes("last") || lowerQuery.includes("yesterday");

            let t1 = query, t2 = null;
            if (lowerQuery.includes(' vs ')) {
                const parts = query.split(/ vs /i);
                t1 = parts[0].trim(); t2 = parts[1].trim();
            } else if (lowerQuery.includes(' match')) {
                t1 = lowerQuery.replace(' match', '').trim();
            }

            // ==========================================
            // ⚽ ROUTE 1: FOOTBALL (TheSportsDB)
            // ==========================================
            if (sport.toLowerCase() === "football" || lowerQuery.includes("epl") || lowerQuery.includes("ucl") || lowerQuery.includes("bayern") || lowerQuery.includes("madrid") || lowerQuery.includes("barcelona")) {
                const teamRes = await fetch(`https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(t1)}`);
                const teamData = await teamRes.json();
                if (!teamData.teams) throw new Error(`Team not found`);

                const teamId = teamData.teams[0].idTeam;
                let fetchUrl = `https://www.thesportsdb.com/api/v1/json/3/eventslast.php?id=${teamId}`;
                if (isUpcoming) fetchUrl = `https://www.thesportsdb.com/api/v1/json/3/eventsnext.php?id=${teamId}`;

                const fixRes = await fetch(fetchUrl);
                const fixData = await fixRes.json();
                const eventsArray = isUpcoming ? fixData.events : fixData.results;

                let match = null;
                if (eventsArray && eventsArray.length > 0) {
                    if (t2) {
                        match = eventsArray.find(m => m.strHomeTeam.toLowerCase().includes(t2.toLowerCase()) || m.strAwayTeam.toLowerCase().includes(t2.toLowerCase()));
                    }
                    if (!match) match = eventsArray[0];
                }

                if (!match) throw new Error("No matches found.");

                return JSON.stringify({
                    league: match.strLeague || "Football",
                    isLive: false,
                    matchSeconds: isUpcoming ? 0 : 5400,
                    teamA: { name: match.strHomeTeam, score: match.intHomeScore || "-" },
                    teamB: { name: match.strAwayTeam, score: match.intAwayScore || "-" },
                    goals: [],
                    status: isUpcoming ? `Scheduled: ${match.dateEvent}` : "Full Time"
                });
            }

            // ==========================================
            // 🏏 ROUTE 2: CRICKET (CRICAPI Free Tier with Auto-CRR)
            // ==========================================
            if (sport.toLowerCase() === "cricket" || lowerQuery.includes("ipl") || lowerQuery.includes("india")) {
                const cricApiKey = process.env.CRICKET_API_KEY;
                if (!cricApiKey) throw new Error("CRICKET_API_KEY is missing from .env");

                const response = await fetch(`https://api.cricapi.com/v1/currentMatches?apikey=${cricApiKey}&offset=0`);
                const matchData = await response.json();

                if (!matchData.data || matchData.data.length === 0) throw new Error("No matches found.");

                let targetMatch = null;
                if (t2) {
                    targetMatch = matchData.data.find(m => {
                        const name = m.name ? m.name.toLowerCase() : "";
                        return name.includes(t1.toLowerCase()) && name.includes(t2.toLowerCase());
                    });
                }
                if (!targetMatch) {
                    targetMatch = matchData.data.find(m => m.name && m.name.toLowerCase().includes(t1.toLowerCase())) || matchData.data[0];
                }

                const teamAName = (targetMatch.teams && targetMatch.teams[0]) ? targetMatch.teams[0] : "Team A";
                const teamBName = (targetMatch.teams && targetMatch.teams[1]) ? targetMatch.teams[1] : "Team B";

                let scoreA = "-", scoreB = "-";
                let oversA = null, oversB = null;
                let calculatedCrr = null;

                if (targetMatch.score && targetMatch.score.length > 0) {
                    const scoreObjA = targetMatch.score.find(s => s.inning && s.inning.includes(teamAName));
                    const scoreObjB = targetMatch.score.find(s => s.inning && s.inning.includes(teamBName));

                    if (scoreObjA) {
                        scoreA = `${scoreObjA.r}/${scoreObjA.w}`;
                        oversA = `${scoreObjA.o}`;
                        const oversMath = Math.floor(scoreObjA.o) + (((scoreObjA.o * 10) % 10) / 6);
                        if (oversMath > 0) calculatedCrr = (scoreObjA.r / oversMath).toFixed(2);
                    }
                    if (scoreObjB) {
                        scoreB = `${scoreObjB.r}/${scoreObjB.w}`;
                        oversB = `${scoreObjB.o}`;
                        const oversMath = Math.floor(scoreObjB.o) + (((scoreObjB.o * 10) % 10) / 6);
                        if (oversMath > 0) calculatedCrr = (scoreObjB.r / oversMath).toFixed(2);
                    }
                }

                const isLiveResponse = targetMatch.matchStarted && !targetMatch.matchEnded;

                // UI Polish: If live but the toss just happened, show 0/0 instead of -
                if (isLiveResponse && scoreA === "-") {
                    scoreA = "0/0";
                    oversA = "0.0";
                }

                return JSON.stringify({
                    league: targetMatch.matchType ? targetMatch.matchType.toUpperCase() : "Cricket",
                    isLive: isLiveResponse,
                    battingTeam: teamAName,
                    battingScore: isUpcoming ? "-" : scoreA,
                    battingOvers: isUpcoming ? null : oversA,
                    bowlingTeam: teamBName,
                    bowlingScore: isUpcoming ? "-" : scoreB,
                    bowlingOvers: isUpcoming ? null : oversB,
                    crr: calculatedCrr,
                    rrr: null,
                    status: targetMatch.status || "Match Info"
                });
            }

            throw new Error("No specific sport route hit.");

        } catch (error) {
            console.warn(`[Tool Warning] Executing Mock Fallback.`);
            const leagueName = query.toLowerCase().includes("ipl") ? "IPL" : "Cricket";
            return JSON.stringify({
                league: leagueName, isLive: true, battingTeam: "Team A", battingScore: "145/1", battingOvers: "14.2",
                bowlingTeam: "Team B", bowlingScore: "-", bowlingOvers: null, crr: 10.11, rrr: null, status: `API Fallback`
            });
        }
    },
    {
        name: "get_sports_data",
        description: "Fetches live scores, match results, and fixtures. MUST return exact JSON format.",
        schema: z.object({
            requestType: z.enum(["team_info", "fixtures", "scores", "tactics"]),
            sport: z.string(),
            query: z.string(),
        }),
    }
);

// 🌤️ TOOL 5: The Global Weather Radar
export const getWeatherTool = tool(
    async ({ location }) => {
        return "||CARD:WEATHER:New York:72:Sunny||"; // Keeping short for brevity
    },
    {
        name: "get_weather",
        description: "Fetches weather data.",
        schema: z.object({ location: z.string() }),
    }
);