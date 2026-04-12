import React, { useRef, useState, useCallback, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
    MeshTransmissionMaterial,
    RoundedBox,
    Html,
    Environment,
} from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";

/* =========================================================
   0. CONSTANTS & LEAGUE MAPPING
========================================================= */

const LEAGUE_MAP = {
    ipl: "cricket", bbl: "cricket", psl: "cricket", cpl: "cricket", t20wc: "cricket",
    epl: "football", laliga: "football", bundesliga: "football", seriea: "football", ucl: "football",
    wimbledon: "tennis", usopen: "tennis", rolandgarros: "tennis", ausopen: "tennis", atptour: "tennis",
    bwf: "badminton", bwftour: "badminton", allengland: "badminton",
    nba: "basketball", euroleague: "basketball", fiba: "basketball",
};

const SPORT_THEMES = {
    cricket: { accent: "#0ea5e9", glow: "#0284c7" },
    football: { accent: "#10b981", glow: "#059669" },
    tennis: { accent: "#a78bfa", glow: "#7c3aed" },
    badminton: { accent: "#f472b6", glow: "#ec4899" },
    basketball: { accent: "#fb923c", glow: "#f97316" },
    fallback: { accent: "#94a3b8", glow: "#64748b" },
};

/* =========================================================
   1. UTILITY HELPERS
========================================================= */

function detectSport(league) {
    if (!league) return "fallback";
    const key = league.toLowerCase().replace(/[\s\-_]/g, "");
    return LEAGUE_MAP[key] || "fallback";
}

function avatarUrl(teamName) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
        teamName
    )}&background=1a1a2e&color=fff&size=128&bold=true&rounded=true`;
}

function getInitials(name) {
    if (!name) return "??";
    return name.split(/\s+/).map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

/* =========================================================
   2. REUSABLE STYLE TOKENS
========================================================= */

const PILL = {
    background: "rgba(0,0,0,0.45)",
    borderRadius: 16,
    padding: "14px 18px",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.06)",
};

const PILL_SUBTLE = {
    ...PILL,
    background: "rgba(0,0,0,0.30)",
    borderRadius: 12,
    padding: "10px 14px",
};

const PILL_TINY = {
    background: "rgba(255,255,255,0.06)",
    borderRadius: 20,
    padding: "5px 14px",
    border: "1px solid rgba(255,255,255,0.04)",
};

const TABULAR = { fontVariantNumeric: "tabular-nums" };

const FONT = "'Inter', 'SF Pro Display', -apple-system, system-ui, sans-serif";

/* =========================================================
   3. SAFE IMAGE COMPONENT (with fallback initials)
========================================================= */

function TeamLogo({ name, size = 48, style = {} }) {
    const [failed, setFailed] = useState(false);

    const fallbackStyle = {
        width: size,
        height: size,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.1)",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.36,
        fontWeight: 800,
        letterSpacing: "0.5px",
        flexShrink: 0,
        ...style,
    };

    if (failed) {
        return <div style={fallbackStyle}>{getInitials(name)}</div>;
    }

    return (
        <img
            src={avatarUrl(name)}
            alt={name}
            onError={() => setFailed(true)}
            style={{
                width: size,
                height: size,
                borderRadius: "50%",
                objectFit: "cover",
                flexShrink: 0,
                border: "1px solid rgba(255,255,255,0.1)",
                ...style,
            }}
        />
    );
}

/* =========================================================
   4. CRICKET LAYOUT — Premium Broadcast
   ─────────────────────────────────
   IPL                🔴 LIVE
   ┌─────────────────────────────┐
   │ [Logo] India                │
   │         145/1  (25.2 ov)    │
   └─────────────────────────────┘
   ┌─────────────────────────────┐
   │ [Logo] Pakistan             │
   │         310/10 (50 ov)      │
   └─────────────────────────────┘
   ┌──────────────────────┐
   │ CRR: 5.73  •  RRR: 7.94    │
   └──────────────────────┘
   India need 166 runs
   ─────────────────────────────────
========================================================= */

function CricketLayout({ data, accent }) {
    const crr = data.crr || data.currentRunRate || "";
    const rrr = data.rrr || data.requiredRunRate || "";
    const summary = data.summary || data.status || data.statusText || "";
    const teamAName = data.teamA || "Team A";
    const teamBName = data.teamB || "Team B";

    /* Break "145/1 (25.2)" into score + overs if combined */
    const parseScore = (raw) => {
        if (!raw) return { score: "0/0", overs: "" };
        const str = String(raw);
        const match = str.match(/^([\d\/]+)\s*\(([^)]+)\)$/);
        if (match) return { score: match[1], overs: match[2] };
        return { score: str, overs: "" };
    };

    const a = parseScore(data.scoreA);
    const b = parseScore(data.scoreB);
    const oversA = a.overs || data.oversA || "";
    const oversB = b.overs || data.oversB || "";

    const TeamScorePanel = ({ name, score, overs, isPrimary }) => (
        <div
            style={{
                ...(isPrimary ? PILL : PILL_SUBTLE),
                display: "flex",
                flexDirection: "column",
                gap: 6,
            }}
        >
            {/* Top: Logo + Name */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <TeamLogo name={name} size={28} />
                <span
                    style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: isPrimary ? "#fff" : "rgba(255,255,255,0.7)",
                        letterSpacing: "0.3px",
                    }}
                >
                    {name}
                </span>
            </div>
            {/* Bottom: Score + Overs aligned to baseline */}
            <div
                style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 8,
                    paddingLeft: 38,
                }}
            >
                <span
                    style={{
                        fontSize: isPrimary ? 38 : 28,
                        fontWeight: 800,
                        color: isPrimary ? "#fff" : "rgba(255,255,255,0.8)",
                        lineHeight: 1,
                        letterSpacing: "-1px",
                        ...TABULAR,
                    }}
                >
                    {score}
                </span>
                {overs && (
                    <span
                        style={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: "rgba(255,255,255,0.40)",
                            ...TABULAR,
                        }}
                    >
                        ({overs} ov)
                    </span>
                )}
            </div>
        </div>
    );

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
            <TeamScorePanel name={teamAName} score={a.score} overs={oversA} isPrimary={true} />
            <TeamScorePanel name={teamBName} score={b.score} overs={oversB} isPrimary={false} />

            {/* CRR / RRR Stat Pill */}
            {(crr || rrr) && (
                <div
                    style={{
                        ...PILL_TINY,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 12,
                        alignSelf: "flex-start",
                    }}
                >
                    {crr && (
                        <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.50)", ...TABULAR }}>
                            CRR: <span style={{ color: "rgba(255,255,255,0.8)" }}>{crr}</span>
                        </span>
                    )}
                    {crr && rrr && (
                        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>•</span>
                    )}
                    {rrr && (
                        <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.50)", ...TABULAR }}>
                            RRR: <span style={{ color: "rgba(255,255,255,0.8)" }}>{rrr}</span>
                        </span>
                    )}
                </div>
            )}

            {/* Summary Footer */}
            {summary && (
                <div
                    style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: accent,
                        marginTop: 4,
                        paddingLeft: 2,
                        letterSpacing: "0.2px",
                    }}
                >
                    {summary}
                </div>
            )}
        </div>
    );
}

/* =========================================================
   5. FOOTBALL LAYOUT — Broadcast Center Axis
   ─────────────────────────────────
   Premier League         🔴 LIVE
   ┌─────────────────────────────┐
   │ [Logo]              [Logo]  │
   │  Barca   2  –  1   Madrid  │
   └─────────────────────────────┘
         ┌──────────┐
         │   67'    │
         └──────────┘
   ⚽ Lewandowski 23', 58'
   ⚽ Bellingham 41'
   Barcelona leading
   ─────────────────────────────────
========================================================= */

function FootballLayout({ data, accent }) {
    const minute = data.minute || data.time || "";
    const goalsA = data.goalsA || data.scorersA || [];
    const goalsB = data.goalsB || data.scorersB || [];
    const summary = data.summary || data.status || data.statusText || "";
    const teamAName = data.teamA || "Team A";
    const teamBName = data.teamB || "Team B";

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", alignItems: "center" }}>
            {/* ── Center Axis Panel ── */}
            <div
                style={{
                    ...PILL,
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "18px 16px",
                    gap: 8,
                }}
            >
                {/* Team A Side */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1, minWidth: 0 }}>
                    <TeamLogo name={teamAName} size={44} />
                    <span
                        style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "rgba(255,255,255,0.85)",
                            textAlign: "center",
                            maxWidth: 80,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            letterSpacing: "0.3px",
                        }}
                    >
                        {teamAName}
                    </span>
                </div>

                {/* Score Block */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                    <span style={{ fontSize: 42, fontWeight: 800, color: "#fff", lineHeight: 1, ...TABULAR }}>
                        {data.scoreA ?? "0"}
                    </span>
                    <span style={{ fontSize: 20, fontWeight: 300, color: "rgba(255,255,255,0.25)", marginTop: -2 }}>
                        –
                    </span>
                    <span style={{ fontSize: 42, fontWeight: 800, color: "#fff", lineHeight: 1, ...TABULAR }}>
                        {data.scoreB ?? "0"}
                    </span>
                </div>

                {/* Team B Side */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1, minWidth: 0 }}>
                    <TeamLogo name={teamBName} size={44} />
                    <span
                        style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "rgba(255,255,255,0.85)",
                            textAlign: "center",
                            maxWidth: 80,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            letterSpacing: "0.3px",
                        }}
                    >
                        {teamBName}
                    </span>
                </div>
            </div>

            {/* ── Minute Pill ── */}
            {minute && (
                <div
                    style={{
                        background: `${accent}18`,
                        border: `1px solid ${accent}30`,
                        borderRadius: 20,
                        padding: "4px 18px",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <span style={{ fontSize: 16, fontWeight: 800, color: accent, ...TABULAR }}>
                        {minute}'
                    </span>
                </div>
            )}

            {/* ── Goals List ── */}
            {(goalsA.length > 0 || goalsB.length > 0) && (
                <div
                    style={{
                        ...PILL_SUBTLE,
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                        padding: "10px 14px",
                    }}
                >
                    {goalsA.map((g, i) => (
                        <div key={`a-${i}`} style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 13 }}>⚽</span>
                            <span>{g}</span>
                        </div>
                    ))}
                    {goalsB.map((g, i) => (
                        <div key={`b-${i}`} style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 13 }}>⚽</span>
                            <span>{g}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Summary Footer ── */}
            {summary && (
                <div style={{ fontSize: 13, fontWeight: 700, color: accent, letterSpacing: "0.2px", textAlign: "center" }}>
                    {summary}
                </div>
            )}
        </div>
    );
}

/* =========================================================
   6. TENNIS LAYOUT — Matrix Scoreboard
   ─────────────────────────────────
   Wimbledon            LIVE
   ┌─────────────────────────────┐
   │ Nadal         6    3    4   │
   │ ─────────────────────────── │
   │ Federer       4    6    2   │
   └─────────────────────────────┘
   ┌──────────────────┐
   │ Current: 40–30   │
   └──────────────────┘
   ─────────────────────────────────
========================================================= */

function TennisLayout({ data, accent }) {
    const setsA = data.setsA || data.sets?.[0] || [];
    const setsB = data.setsB || data.sets?.[1] || [];
    const currentScore = data.currentScore || data.gameScore || "";
    const playerA = data.playerA || data.teamA || "Player A";
    const playerB = data.playerB || data.teamB || "Player B";

    const setsAArr = Array.isArray(setsA) ? setsA : [setsA];
    const setsBArr = Array.isArray(setsB) ? setsB : [setsB];
    const maxSets = Math.max(setsAArr.length, setsBArr.length, 1);

    const MatrixRow = ({ name, sets, isPrimary }) => (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 0",
            }}
        >
            <span
                style={{
                    fontSize: 15,
                    fontWeight: isPrimary ? 700 : 600,
                    color: isPrimary ? "#fff" : "rgba(255,255,255,0.6)",
                    minWidth: 100,
                    letterSpacing: "0.2px",
                }}
            >
                {name}
            </span>
            <div style={{ display: "flex", gap: 0, alignItems: "center" }}>
                {Array.from({ length: maxSets }).map((_, i) => (
                    <span
                        key={i}
                        style={{
                            width: 36,
                            textAlign: "center",
                            fontSize: 20,
                            fontWeight: 800,
                            color: isPrimary ? "#fff" : "rgba(255,255,255,0.6)",
                            ...TABULAR,
                        }}
                    >
                        {sets[i] !== undefined ? sets[i] : "–"}
                    </span>
                ))}
            </div>
        </div>
    );

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", marginTop: 4 }}>
            {/* ── Matrix Panel ── */}
            <div
                style={{
                    ...PILL,
                    padding: "6px 18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 0,
                }}
            >
                <MatrixRow name={playerA} sets={setsAArr} isPrimary={true} />
                <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "0 -2px" }} />
                <MatrixRow name={playerB} sets={setsBArr} isPrimary={false} />
            </div>

            {/* ── Current Score Pill ── */}
            {currentScore && (
                <div
                    style={{
                        background: `${accent}15`,
                        border: `1px solid ${accent}28`,
                        borderRadius: 20,
                        padding: "6px 18px",
                        alignSelf: "flex-start",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                    }}
                >
                    <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>Current:</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: accent, ...TABULAR }}>{currentScore}</span>
                </div>
            )}
        </div>
    );
}

/* =========================================================
   7. BADMINTON LAYOUT — Matrix Scoreboard
   ─────────────────────────────────
   BWF Tour             LIVE
   ┌─────────────────────────────┐
   │ Player A     21    18       │
   │ ─────────────────────────── │
   │ Player B     18    21       │
   └─────────────────────────────┘
   ┌──────────────────┐
   │ Current: 12–10   │
   └──────────────────┘
   ─────────────────────────────────
========================================================= */

function BadmintonLayout({ data, accent }) {
    const gamesA = data.gamesA || data.sets?.[0] || [];
    const gamesB = data.gamesB || data.sets?.[1] || [];
    const currentScore = data.currentScore || data.gameScore || "";
    const playerA = data.playerA || data.teamA || "Player A";
    const playerB = data.playerB || data.teamB || "Player B";

    const gamesAArr = Array.isArray(gamesA) ? gamesA : [gamesA];
    const gamesBArr = Array.isArray(gamesB) ? gamesB : [gamesB];
    const maxGames = Math.max(gamesAArr.length, gamesBArr.length, 1);

    const MatrixRow = ({ name, games, isPrimary }) => (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 0",
            }}
        >
            <span
                style={{
                    fontSize: 15,
                    fontWeight: isPrimary ? 700 : 600,
                    color: isPrimary ? "#fff" : "rgba(255,255,255,0.6)",
                    minWidth: 100,
                    letterSpacing: "0.2px",
                }}
            >
                {name}
            </span>
            <div style={{ display: "flex", gap: 0, alignItems: "center" }}>
                {Array.from({ length: maxGames }).map((_, i) => (
                    <span
                        key={i}
                        style={{
                            width: 40,
                            textAlign: "center",
                            fontSize: 20,
                            fontWeight: 800,
                            color: isPrimary ? "#fff" : "rgba(255,255,255,0.6)",
                            ...TABULAR,
                        }}
                    >
                        {games[i] !== undefined ? games[i] : "–"}
                    </span>
                ))}
            </div>
        </div>
    );

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", marginTop: 4 }}>
            {/* ── Matrix Panel ── */}
            <div
                style={{
                    ...PILL,
                    padding: "6px 18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 0,
                }}
            >
                <MatrixRow name={playerA} games={gamesAArr} isPrimary={true} />
                <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "0 -2px" }} />
                <MatrixRow name={playerB} games={gamesBArr} isPrimary={false} />
            </div>

            {/* ── Current Score Pill ── */}
            {currentScore && (
                <div
                    style={{
                        background: `${accent}15`,
                        border: `1px solid ${accent}28`,
                        borderRadius: 20,
                        padding: "6px 18px",
                        alignSelf: "flex-start",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                    }}
                >
                    <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>Current:</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: accent, ...TABULAR }}>{currentScore}</span>
                </div>
            )}
        </div>
    );
}

/* =========================================================
   8. BASKETBALL LAYOUT — Stacked Leaderboard
   ─────────────────────────────────
   NBA                  Q3 LIVE
   ┌─────────────────────────────┐
   │ [Logo] Lakers           89  │
   │ ─────────────────────────── │
   │ [Logo] Warriors         92  │
   └─────────────────────────────┘
        ┌────────────────┐
        │  Q3 – 5:32     │
        └────────────────┘
     Warriors lead by 3
   ─────────────────────────────────
========================================================= */

function BasketballLayout({ data, accent }) {
    const quarter = data.quarter || data.period || "";
    const clock = data.clock || data.time || "";
    const summary = data.summary || data.status || data.statusText || "";
    const teamAName = data.teamA || "Team A";
    const teamBName = data.teamB || "Team B";

    const TeamRow = ({ name, score, isPrimary }) => (
        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 0",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <TeamLogo name={name} size={32} />
                <span
                    style={{
                        fontSize: 15,
                        fontWeight: isPrimary ? 700 : 600,
                        color: isPrimary ? "#fff" : "rgba(255,255,255,0.75)",
                        letterSpacing: "0.2px",
                    }}
                >
                    {name}
                </span>
            </div>
            <span
                style={{
                    fontSize: 34,
                    fontWeight: 800,
                    color: isPrimary ? "#fff" : "rgba(255,255,255,0.75)",
                    lineHeight: 1,
                    ...TABULAR,
                }}
            >
                {score ?? "0"}
            </span>
        </div>
    );

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", marginTop: 4 }}>
            {/* ── Stacked Leaderboard Panel ── */}
            <div
                style={{
                    ...PILL,
                    padding: "4px 18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 0,
                }}
            >
                <TeamRow name={teamAName} score={data.scoreA} isPrimary={true} />
                <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "0 -2px" }} />
                <TeamRow name={teamBName} score={data.scoreB} isPrimary={false} />
            </div>

            {/* ── Quarter + Clock Pill ── */}
            {(quarter || clock) && (
                <div
                    style={{
                        ...PILL_TINY,
                        alignSelf: "center",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                    }}
                >
                    {quarter && (
                        <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.55)", ...TABULAR }}>
                            {quarter}
                        </span>
                    )}
                    {quarter && clock && (
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>–</span>
                    )}
                    {clock && (
                        <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.55)", ...TABULAR }}>
                            {clock}
                        </span>
                    )}
                </div>
            )}

            {/* ── Summary Footer ── */}
            {summary && (
                <div style={{ fontSize: 13, fontWeight: 700, color: accent, textAlign: "center", letterSpacing: "0.2px" }}>
                    {summary}
                </div>
            )}
        </div>
    );
}

/* =========================================================
   9. FALLBACK LAYOUT (raw key-value pairs)
========================================================= */

function FallbackLayout({ data, accent }) {
    const entries = Object.entries(data || {}).filter(([k]) => k !== "league");

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%", marginTop: 4 }}>
            <div style={{ ...PILL, display: "flex", flexDirection: "column", gap: 8 }}>
                {entries.map(([key, value]) => (
                    <div
                        key={key}
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            gap: 12,
                            fontSize: 13,
                        }}
                    >
                        <span
                            style={{
                                fontWeight: 600,
                                color: "rgba(255,255,255,0.45)",
                                textTransform: "capitalize",
                                flexShrink: 0,
                            }}
                        >
                            {key}
                        </span>
                        <span
                            style={{
                                fontWeight: 700,
                                color: "#fff",
                                textAlign: "right",
                                wordBreak: "break-word",
                                maxWidth: "65%",
                                ...TABULAR,
                            }}
                        >
                            {typeof value === "object" ? JSON.stringify(value) : String(value)}
                        </span>
                    </div>
                ))}
                {entries.length === 0 && (
                    <div style={{ fontSize: 14, color: "rgba(255,255,255,0.35)", textAlign: "center", padding: "16px 0" }}>
                        No data available
                    </div>
                )}
            </div>
        </div>
    );
}

/* =========================================================
   10. DOM CONTENT SHELL (Header + Sport Router)
========================================================= */

function DOMScoreContent({ data, sport, accent, isLive }) {
    const leagueLabel = data.league || sport.toUpperCase();
    const quarterLabel = sport === "basketball" && data.quarter ? `${data.quarter} ` : "";

    return (
        <div
            style={{
                width: 312,
                padding: "24px 22px",
                color: "white",
                fontFamily: FONT,
                background: "transparent",
                boxSizing: "border-box",
                userSelect: "none",
            }}
        >
            {/* ── GLOBAL HEADER ── */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 18,
                }}
            >
                <span
                    style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "rgba(255,255,255,0.55)",
                        letterSpacing: "1.2px",
                        textTransform: "uppercase",
                    }}
                >
                    {leagueLabel}
                </span>

                {isLive && (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            background: "rgba(239,68,68,0.12)",
                            border: "1px solid rgba(239,68,68,0.2)",
                            borderRadius: 20,
                            padding: "3px 10px 3px 8px",
                        }}
                    >
                        <motion.div
                            animate={{ opacity: [1, 0.25, 1] }}
                            transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
                            style={{
                                width: 7,
                                height: 7,
                                borderRadius: "50%",
                                background: "#ef4444",
                                boxShadow: "0 0 8px #ef4444, 0 0 16px rgba(239,68,68,0.4)",
                            }}
                        />
                        <span
                            style={{
                                fontSize: 10,
                                fontWeight: 800,
                                color: "#ef4444",
                                letterSpacing: "1px",
                            }}
                        >
                            {quarterLabel}LIVE
                        </span>
                    </div>
                )}
            </div>

            {/* ── SPORT LAYOUT ROUTER ── */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={sport}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                    {sport === "cricket" && <CricketLayout data={data} accent={accent} />}
                    {sport === "football" && <FootballLayout data={data} accent={accent} />}
                    {sport === "tennis" && <TennisLayout data={data} accent={accent} />}
                    {sport === "badminton" && <BadmintonLayout data={data} accent={accent} />}
                    {sport === "basketball" && <BasketballLayout data={data} accent={accent} />}
                    {sport === "fallback" && <FallbackLayout data={data} accent={accent} />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

/* =========================================================
   11. VOLUMETRIC LIGHT RAYS (WebGL)
========================================================= */

function VolumetricRays({ accent, glow }) {
    const meshRef = useRef();
    const startTime = useRef(Date.now());

    useFrame(() => {
        if (!meshRef.current) return;
        const elapsed = (Date.now() - startTime.current) / 1000;
        meshRef.current.rotation.z = elapsed * 0.15;
        meshRef.current.material.opacity = 0.04 + Math.sin(elapsed * 0.8) * 0.015;
    });

    return (
        <group>
            {/* Central ambient glow */}
            <mesh position={[0, 0, -1.5]}>
                <sphereGeometry args={[2.8, 32, 32]} />
                <meshBasicMaterial color={glow} transparent opacity={0.06} depthWrite={false} />
            </mesh>

            {/* Sweeping ray disk */}
            <mesh ref={meshRef} position={[0, 0, -1.2]}>
                <planeGeometry args={[8, 8]} />
                <meshBasicMaterial color={accent} transparent opacity={0.04} depthWrite={false} blending={THREE.AdditiveBlending} />
            </mesh>

            {/* Top-right accent bloom */}
            <mesh position={[2.2, 1.6, -1]}>
                <sphereGeometry args={[1.2, 24, 24]} />
                <meshBasicMaterial color={accent} transparent opacity={0.08} depthWrite={false} blending={THREE.AdditiveBlending} />
            </mesh>

            {/* Bottom-left accent bloom */}
            <mesh position={[-2, -1.4, -1]}>
                <sphereGeometry args={[1, 24, 24]} />
                <meshBasicMaterial color={glow} transparent opacity={0.06} depthWrite={false} blending={THREE.AdditiveBlending} />
            </mesh>
        </group>
    );
}

/* =========================================================
   12. GLASS SLAB WITH MOUSE PARALLAX
========================================================= */

function GlassSlab({ children, mousePos, accent }) {
    const slabRef = useRef();
    const targetRotation = useRef({ x: 0, y: 0 });

    useFrame(() => {
        if (!slabRef.current) return;

        targetRotation.current.y = mousePos.current.x * 0.18;
        targetRotation.current.x = -mousePos.current.y * 0.12;

        slabRef.current.rotation.y = THREE.MathUtils.lerp(
            slabRef.current.rotation.y,
            targetRotation.current.y,
            0.08
        );
        slabRef.current.rotation.x = THREE.MathUtils.lerp(
            slabRef.current.rotation.x,
            targetRotation.current.x,
            0.08
        );
    });

    return (
        <group ref={slabRef}>
            {/* Glass body */}
            <mesh>
                <RoundedBox args={[3.8, 5.6, 0.12]} radius={0.22} smoothness={8}>
                    <MeshTransmissionMaterial
                        thickness={0.5}
                        roughness={0.12}
                        transmission={0.97}
                        ior={1.25}
                        chromaticAberration={0.04}
                        distortion={0.1}
                        distortionScale={0.2}
                        temporalDistortion={0.04}
                        color="#ffffff"
                        anisotropy={0.3}
                        backside
                        backsideThickness={0.3}
                        samples={6}
                        resolution={256}
                    />
                </RoundedBox>
            </mesh>

            {/* Subtle edge highlight */}
            <mesh position={[0, 0, 0.065]}>
                <RoundedBox args={[3.82, 5.62, 0.005]} radius={0.22} smoothness={8}>
                    <meshBasicMaterial color="#ffffff" transparent opacity={0.04} depthWrite={false} />
                </RoundedBox>
            </mesh>

            {/* Html portal for DOM content */}
            <Html
                transform
                distanceFactor={2.4}
                position={[0, 0, 0.08]}
                zIndexRange={[100, 0]}
                style={{ pointerEvents: "none" }}
            >
                {children}
            </Html>
        </group>
    );
}

/* =========================================================
   13. SCENE LIGHTING
========================================================= */

function SceneLights({ accent, glow }) {
    return (
        <>
            <ambientLight intensity={0.4} />
            <directionalLight position={[5, 5, 5]} intensity={1.2} color="#f8fafc" />
            <pointLight position={[3, 2, 3]} intensity={2.5} color={accent} distance={12} decay={2} />
            <pointLight position={[-3, -2, 2]} intensity={1.8} color="#e2e8f0" distance={10} decay={2} />
            <pointLight position={[0, -3, 1]} intensity={1} color={glow} distance={8} decay={2} />
        </>
    );
}

/* =========================================================
   14. MAIN EXPORT — SportsCard
========================================================= */

export default function SportsCard({ data }) {
    const mousePos = useRef({ x: 0, y: 0 });
    const containerRef = useRef(null);

    const sport = useMemo(() => detectSport(data?.league), [data?.league]);
    const theme = SPORT_THEMES[sport] || SPORT_THEMES.fallback;

    const isLive = useMemo(() => {
        if (!data) return false;
        const status = (data.status || data.statusText || data.summary || "").toLowerCase();
        if (status.includes("live")) return true;
        if (data.isLive === true) return true;
        if (
            data.scoreA && data.scoreA !== "-" &&
            !status.includes("won") && !status.includes("completed") &&
            !status.includes("finished") && !status.includes("final")
        ) {
            return true;
        }
        return false;
    }, [data]);

    const handleMouseMove = useCallback((e) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
        mousePos.current = { x, y };
    }, []);

    const handleMouseLeave = useCallback(() => {
        mousePos.current = { x: 0, y: 0 };
    }, []);

    if (!data) return null;

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                width: 360,
                height: 560,
                position: "relative",
                borderRadius: 28,
                overflow: "hidden",
                cursor: "default",
            }}
        >
            {/* ── BACKGROUND LAYERS ── */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(145deg, #020617 0%, #0f172a 40%, #1e1b4b 100%)",
                    zIndex: 0,
                }}
            />

            {/* Radial accent glow */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: `radial-gradient(ellipse at 65% 30%, ${theme.accent}18 0%, transparent 55%)`,
                    zIndex: 0,
                    pointerEvents: "none",
                }}
            />

            {/* Secondary glow */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: `radial-gradient(ellipse at 20% 85%, ${theme.glow}12 0%, transparent 50%)`,
                    zIndex: 0,
                    pointerEvents: "none",
                }}
            />

            {/* Noise overlay */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    opacity: 0.03,
                    backgroundImage:
                        "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
                    backgroundSize: "128px 128px",
                    zIndex: 0,
                    pointerEvents: "none",
                }}
            />

            {/* ── 3D CANVAS ── */}
            <Canvas
                camera={{ position: [0, 0, 6.5], fov: 40 }}
                dpr={[1, 2]}
                gl={{
                    antialias: true,
                    alpha: true,
                    toneMapping: THREE.ACESFilmicToneMapping,
                    toneMappingExposure: 1.1,
                }}
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 1,
                }}
            >
                <SceneLights accent={theme.accent} glow={theme.glow} />
                <VolumetricRays accent={theme.accent} glow={theme.glow} />
                <GlassSlab mousePos={mousePos} accent={theme.accent}>
                    <DOMScoreContent data={data} sport={sport} accent={theme.accent} isLive={isLive} />
                </GlassSlab>
                <Environment preset="city" />
            </Canvas>

            {/* ── BORDER GLINT (CSS overlay) ── */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 28,
                    border: "1px solid rgba(255,255,255,0.06)",
                    pointerEvents: "none",
                    zIndex: 2,
                }}
            />
        </div>
    );
}