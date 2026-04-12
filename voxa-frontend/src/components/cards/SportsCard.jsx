import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- UTILS: LOGOS ---
const getLogo = (name, hex) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${hex}&color=fff&size=150&bold=true`;

// --- ROUTER: DETECT SPORT ---
const getSportType = (league = "") => {
    const l = league.toLowerCase();
    if (l.includes('ipl') || l.includes('cricket') || l.includes('t20') || l.includes('odi')) return 'cricket';
    if (l.includes('nba') || l.includes('basketball')) return 'basketball';
    if (l.includes('wimbledon') || l.includes('tennis') || l.includes('atp')) return 'tennis';
    if (l.includes('badminton') || l.includes('bwf')) return 'badminton';
    return 'football'; // Default
};

// ==========================================
// 🏏 1. CRICKET (Asymmetrical: Runs + Overs + Target)
// ==========================================
const CricketLayout = ({ teamA, teamB, scoreA, scoreB, status }) => {
    const parse = (s) => {
        if (!s || s === '-') return { runs: '-', overs: '' };
        const parts = s.split('(');
        return { runs: parts[0].trim(), overs: parts[1] ? `(${parts[1]}` : '' };
    };
    const primary = parse(scoreA);
    const secondary = parse(scoreB);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "8px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <img src={getLogo(teamA, "0ea5e9")} alt={teamA} style={{ width: 28, height: 28, borderRadius: 6 }} />
                        <span style={{ fontSize: 16, fontWeight: 700, color: "#f8fafc" }}>{teamA?.substring(0, 16)}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                        <motion.span animate={{ y: [0, -2, 0] }} transition={{ duration: 4, repeat: Infinity }} style={{ fontSize: 44, fontWeight: 800, color: "#fff", lineHeight: 1 }}>
                            {primary.runs}
                        </motion.span>
                        <span style={{ fontSize: 15, fontWeight: 600, color: "#94a3b8" }}>{primary.overs}</span>
                    </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8" }}>{teamB?.substring(0, 12)}</span>
                    <span style={{ fontSize: 18, fontWeight: 700, color: "#cbd5e1" }}>{secondary.runs} {secondary.overs}</span>
                </div>
            </div>
            <div style={{ padding: "10px 14px", background: "rgba(0,0,0,0.3)", borderRadius: 12, borderLeft: "3px solid #0ea5e9" }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#38bdf8" }}>{status}</span>
            </div>
        </div>
    );
};

// ==========================================
// ⚽ 2. FOOTBALL (Symmetrical: Score + Time/Status)
// ==========================================
const FootballLayout = ({ teamA, teamB, scoreA, scoreB, status }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "8px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: 10 }}>
                <motion.img animate={{ y: [0, -4, 0] }} transition={{ duration: 4, repeat: Infinity }} src={getLogo(teamA, "10b981")} alt={teamA} style={{ width: 56, height: 56, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.1)" }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: "#f8fafc", textAlign: "center" }}>{teamA?.substring(0, 12)}</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1.2 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 46, fontWeight: 800, color: "#fff" }}>{scoreA === '-' ? '0' : scoreA}</span>
                    <span style={{ fontSize: 20, fontWeight: 800, color: "#64748b" }}>-</span>
                    <span style={{ fontSize: 46, fontWeight: 800, color: "#fff" }}>{scoreB === '-' ? '0' : scoreB}</span>
                </div>
                <div style={{ padding: "4px 12px", background: "rgba(16, 185, 129, 0.15)", borderRadius: 12, border: "1px solid rgba(16, 185, 129, 0.3)" }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#10b981", letterSpacing: "1px" }}>{status}</span>
                </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: 10 }}>
                <motion.img animate={{ y: [0, -4, 0] }} transition={{ duration: 4, repeat: Infinity, delay: 1 }} src={getLogo(teamB, "475569")} alt={teamB} style={{ width: 56, height: 56, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.1)" }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: "#f8fafc", textAlign: "center" }}>{teamB?.substring(0, 12)}</span>
            </div>
        </div>
    </div>
);

// ==========================================
// 🏀 3. BASKETBALL (Stacked: Score + Quarter/Time)
// ==========================================
const BasketballLayout = ({ teamA, teamB, scoreA, scoreB, status }) => {
    const Row = ({ team, score, accent, isPrimary }) => (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.05)", padding: "12px 16px", borderRadius: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <img src={getLogo(team, accent)} alt={team} style={{ width: 32, height: 32, borderRadius: "50%" }} />
                <span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{team?.substring(0, 18)}</span>
            </div>
            <span style={{ fontSize: 28, fontWeight: 800, color: "#fff" }}>{score}</span>
        </div>
    );
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "8px 0" }}>
            <Row team={teamA} score={scoreA} accent="f97316" />
            <Row team={teamB} score={scoreB} accent="475569" />
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#f97316" }}>{status}</span>
            </div>
        </div>
    );
};

// ==========================================
// 🎾 4. TENNIS (Table: Sets + Current Points)
// ==========================================
const TennisLayout = ({ teamA, teamB, scoreA, scoreB, status }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "8px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#fff", flex: 1 }}>{teamA?.substring(0, 15)}</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: "#a855f7", width: 40, textAlign: "right" }}>{scoreA}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px" }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#cbd5e1", flex: 1 }}>{teamB?.substring(0, 15)}</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: "#94a3b8", width: 40, textAlign: "right" }}>{scoreB}</span>
        </div>
        <div style={{ marginTop: 12, padding: "8px 12px", background: "rgba(168, 85, 247, 0.15)", borderRadius: 8, display: "inline-block", alignSelf: "flex-start" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#d8b4fe" }}>🎾 {status}</span>
        </div>
    </div>
);

// ==========================================
// 🏸 5. BADMINTON (Table: Games + Current Points)
// ==========================================
const BadmintonLayout = ({ teamA, teamB, scoreA, scoreB, status }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "8px 0" }}>
        <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: 12 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: "#fff", flex: 1 }}>{teamA?.substring(0, 15)}</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: "#ec4899", width: 50, textAlign: "center" }}>{scoreA}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: 12 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: "#cbd5e1", flex: 1 }}>{teamB?.substring(0, 15)}</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: "#94a3b8", width: 50, textAlign: "center" }}>{scoreB}</span>
        </div>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#f472b6", textAlign: "center", marginTop: 8 }}>{status}</span>
    </div>
);

// ==========================================
// MASTER CARD SHELL (VisionOS Style)
// ==========================================
export default function SportsCard({ data }) {
    if (!data || data.type !== 'sports') return null;
    const { teamA, teamB, scoreA, scoreB, status, league } = data;

    const sportType = getSportType(league);
    const isLive = status?.toLowerCase().includes('live') || status?.toLowerCase().includes('need') || (!status?.toLowerCase().includes('won') && scoreA !== '-');

    return (
        <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            style={{
                marginTop: 24, width: "100%", maxWidth: "420px", fontFamily: "'Inter', sans-serif",
                position: "relative", borderRadius: 28, padding: "20px 24px",
                background: "linear-gradient(160deg, #111827 0%, #0f172a 100%)",
                boxShadow: "0 30px 60px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,255,255,0.1), inset 0 -2px 10px rgba(0,0,0,0.4)",
                border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden"
            }}
        >
            {/* INNER 3D ANIMATION: Sweeping Glare */}
            <motion.div
                animate={{ left: ["-100%", "200%"] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", repeatDelay: 2 }}
                style={{ position: "absolute", top: 0, bottom: 0, width: "40%", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)", transform: "skewX(-20deg)", zIndex: 0, pointerEvents: "none" }}
            />

            <div style={{ position: "relative", zIndex: 10 }}>

                {/* GLOBAL HEADER: League & Live Indicator */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 18 }}>
                            {sportType === 'cricket' ? '🏏' : sportType === 'football' ? '⚽' : sportType === 'basketball' ? '🏀' : sportType === 'tennis' ? '🎾' : '🏸'}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "1px", textTransform: "uppercase" }}>
                            {league || "SPORTS"}
                        </span>
                    </div>

                    <div style={{
                        display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 999,
                        background: isLive ? "rgba(239, 68, 68, 0.15)" : "rgba(255,255,255,0.05)",
                        border: `1px solid ${isLive ? "rgba(239, 68, 68, 0.3)" : "rgba(255,255,255,0.1)"}`
                    }}>
                        {isLive && <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", boxShadow: "0 0 8px #ef4444" }} />}
                        <span style={{ fontSize: 11, fontWeight: 700, color: isLive ? "#ef4444" : "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>
                            {isLive ? "LIVE" : "FINAL"}
                        </span>
                    </div>
                </div>

                {/* DYNAMIC POLYMORPHIC LAYOUT */}
                <AnimatePresence mode="wait">
                    <motion.div key={sportType} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1, type: "spring" }}>
                        {sportType === 'cricket' && <CricketLayout teamA={teamA} teamB={teamB} scoreA={scoreA} scoreB={scoreB} status={status} />}
                        {sportType === 'football' && <FootballLayout teamA={teamA} teamB={teamB} scoreA={scoreA} scoreB={scoreB} status={status} />}
                        {sportType === 'basketball' && <BasketballLayout teamA={teamA} teamB={teamB} scoreA={scoreA} scoreB={scoreB} status={status} />}
                        {sportType === 'tennis' && <TennisLayout teamA={teamA} teamB={teamB} scoreA={scoreA} scoreB={scoreB} status={status} />}
                        {sportType === 'badminton' && <BadmintonLayout teamA={teamA} teamB={teamB} scoreA={scoreA} scoreB={scoreB} status={status} />}
                    </motion.div>
                </AnimatePresence>

            </div>
        </motion.div>
    );
}