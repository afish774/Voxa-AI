import React from "react";
import { motion, AnimatePresence } from "framer-motion";

/* =========================
   🎨 GLASS + LIGHT SYSTEM
========================= */

const glassStyle = {
    background: "linear-gradient(145deg, rgba(15,23,42,0.8) 0%, rgba(30,41,59,0.8) 100%)",
    backdropFilter: "blur(30px)",
    WebkitBackdropFilter: "blur(30px)",
    border: "1px solid rgba(255,255,255,0.1)",
    boxShadow: `
    0 30px 60px rgba(0,0,0,0.6),
    inset 0 1px 1px rgba(255,255,255,0.15),
    inset 0 -10px 30px rgba(0,0,0,0.4)
  `,
    color: "#fff",
    fontFamily: "'Inter', sans-serif"
};

// Quick Logo Generator Helper
const getLogo = (name, color) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${color}&color=fff&size=120&bold=true`;

/* =========================
   🌈 VOLUMETRIC LIGHT
========================= */

const LightLayer = () => (
    <>
        <div style={{
            position: "absolute", width: "200%", height: "200%", top: "-50%", left: "-50%",
            background: "radial-gradient(circle at 30% 30%, rgba(56, 189, 248, 0.15), transparent 40%)",
            zIndex: 0, pointerEvents: "none"
        }} />
        <motion.div
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            style={{
                position: "absolute", width: "40%", height: "200%", top: "-50%",
                background: "linear-gradient(120deg, transparent, rgba(255,255,255,0.06), transparent)",
                transform: "skewX(-20deg)", zIndex: 0, pointerEvents: "none"
            }}
        />
    </>
);

/* =========================
   ⚽ FOOTBALL (Symmetrical Tension)
========================= */

const Football = ({ teamA, teamB, scoreA, scoreB, status }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flex: 1 }}>
                <img src={getLogo(teamA, "10b981")} alt={teamA} style={{ width: 48, height: 48, borderRadius: "50%" }} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>{teamA?.substring(0, 12)}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1.2, justifyContent: "center" }}>
                <span style={{ fontSize: 36, fontWeight: 800 }}>{scoreA === '-' ? '0' : scoreA}</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: "rgba(255,255,255,0.3)" }}>-</span>
                <span style={{ fontSize: 36, fontWeight: 800 }}>{scoreB === '-' ? '0' : scoreB}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flex: 1 }}>
                <img src={getLogo(teamB, "475569")} alt={teamB} style={{ width: 48, height: 48, borderRadius: "50%" }} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>{teamB?.substring(0, 12)}</span>
            </div>
        </div>
        <div style={{ textAlign: "center", fontSize: 13, color: "#10b981", fontWeight: 700 }}>{status}</div>
    </div>
);

/* =========================
   🏏 CRICKET (Asymmetrical Hierarchy)
========================= */

const Cricket = ({ teamA, teamB, scoreA, scoreB, status }) => {
    const parse = (s) => {
        const parts = (s || '-').split('(');
        return { runs: parts[0].trim(), overs: parts[1] ? `(${parts[1]}` : '' };
    };
    const primary = parse(scoreA);
    const secondary = parse(scoreB);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <img src={getLogo(teamA, "0ea5e9")} alt={teamA} style={{ width: 24, height: 24, borderRadius: 6 }} />
                        <span style={{ fontSize: 15, fontWeight: 700 }}>{teamA?.substring(0, 16)}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                        <span style={{ fontSize: 40, fontWeight: 800, lineHeight: 1 }}>{primary.runs}</span>
                        <span style={{ fontSize: 14, color: "#94a3b8" }}>{primary.overs}</span>
                    </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                    <span style={{ fontSize: 13, color: "#94a3b8" }}>{teamB?.substring(0, 12)}</span>
                    <span style={{ fontSize: 16, fontWeight: 700 }}>{secondary.runs} {secondary.overs}</span>
                </div>
            </div>
            <div style={{ fontSize: 13, color: "#38bdf8", fontWeight: 600, padding: "8px 12px", background: "rgba(0,0,0,0.3)", borderRadius: 8 }}>
                {status}
            </div>
        </div>
    );
};

/* =========================
   🎾 TENNIS & 🏸 BADMINTON (Table Layout)
========================= */

const TableSport = ({ teamA, teamB, scoreA, scoreB, status, icon }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <img src={getLogo(teamA, "8b5cf6")} alt={teamA} style={{ width: 32, height: 32, borderRadius: "50%" }} />
                <span style={{ fontSize: 16, fontWeight: 600 }}>{teamA}</span>
            </div>
            <span style={{ fontSize: 24, fontWeight: 800 }}>{scoreA}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <img src={getLogo(teamB, "475569")} alt={teamB} style={{ width: 32, height: 32, borderRadius: "50%" }} />
                <span style={{ fontSize: 16, fontWeight: 600, color: "#cbd5e1" }}>{teamB}</span>
            </div>
            <span style={{ fontSize: 24, fontWeight: 800, color: "#94a3b8" }}>{scoreB}</span>
        </div>
        <div style={{ fontSize: 13, color: "#a855f7", fontWeight: 600 }}>{icon} {status}</div>
    </div>
);

/* =========================
   🏀 BASKETBALL (Stacked Rows)
========================= */

const Basketball = ({ teamA, teamB, scoreA, scoreB, status }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.05)", padding: "12px", borderRadius: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <img src={getLogo(teamA, "f97316")} alt={teamA} style={{ width: 28, height: 28, borderRadius: 6 }} />
                <span style={{ fontSize: 15, fontWeight: 700 }}>{teamA}</span>
            </div>
            <span style={{ fontSize: 22, fontWeight: 800 }}>{scoreA}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0,0,0,0.2)", padding: "12px", borderRadius: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <img src={getLogo(teamB, "475569")} alt={teamB} style={{ width: 28, height: 28, borderRadius: 6 }} />
                <span style={{ fontSize: 15, fontWeight: 600, color: "#cbd5e1" }}>{teamB}</span>
            </div>
            <span style={{ fontSize: 22, fontWeight: 800, color: "#94a3b8" }}>{scoreB}</span>
        </div>
        <div style={{ textAlign: "center", fontSize: 13, color: "#f97316", fontWeight: 700, marginTop: 4 }}>{status}</div>
    </div>
);

/* =========================
   🧠 SPORT DETECTOR (Beefed up)
========================= */

const getSport = (league = "") => {
    const l = league.toLowerCase();
    if (l.includes("cricket") || l.includes("ipl") || l.includes("t20")) return "cricket";
    if (l.includes("nba") || l.includes("basketball") || l.includes("nfl")) return "basketball";
    if (l.includes("tennis") || l.includes("atp")) return "tennis";
    if (l.includes("badminton") || l.includes("bwf")) return "badminton";
    return "football";
};

/* =========================
   🌌 MAIN SPATIAL CARD
========================= */

export default function VisionSportsCard({ data }) {
    if (!data) return null;

    const { teamA, teamB, scoreA, scoreB, status, league } = data;
    const sport = getSport(league);

    return (
        <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", damping: 20 }}
            style={{
                ...glassStyle,
                position: "relative",
                borderRadius: 28,
                padding: 24,
                width: 360,
                maxWidth: "100%",
                overflow: "hidden",
                marginTop: 20
            }}
        >
            <LightLayer />

            <div style={{ position: "relative", zIndex: 10 }}>

                {/* HEADER */}
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: "1px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>
                        {league || "SPORTS"}
                    </span>
                    {status?.toLowerCase().includes('live') && (
                        <span style={{ fontSize: 11, fontWeight: 800, color: "#ef4444", background: "rgba(239,68,68,0.15)", padding: "2px 8px", borderRadius: 10 }}>LIVE</span>
                    )}
                </div>

                {/* SPORT LAYOUT INJECTION */}
                <AnimatePresence mode="wait">
                    <motion.div key={sport} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                        {sport === "football" && <Football {...data} />}
                        {sport === "cricket" && <Cricket {...data} />}
                        {sport === "tennis" && <TableSport {...data} icon="🎾" />}
                        {sport === "badminton" && <TableSport {...data} icon="🏸" />}
                        {sport === "basketball" && <Basketball {...data} />}
                    </motion.div>
                </AnimatePresence>

            </div>
        </motion.div>
    );
}