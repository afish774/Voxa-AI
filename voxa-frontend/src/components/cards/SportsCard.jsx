import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- UTILS: LOGOS & THEMING ---
const getLogo = (name, hex) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${hex}&color=fff&size=150&bold=true`;

// --- THE ROUTER: DETECTS SPORT & ASSIGNS EXACT THEMES ---
const getSportConfig = (league = "") => {
    const l = league.toLowerCase();

    // 1. Cricket
    if (l.includes('ipl') || l.includes('t20') || l.includes('cricket') || l.includes('odi') || l.includes('test')) {
        return { type: 'cricket', bg: "linear-gradient(145deg, #0f172a 0%, #1e293b 100%)", glow: "rgba(56, 189, 248, 0.2)", accent: "0ea5e9" };
    }
    // 2. Basketball & American Football
    if (l.includes('nba') || l.includes('basketball') || l.includes('nfl')) {
        return { type: 'basketball', bg: "linear-gradient(145deg, #18181b 0%, #27272a 100%)", glow: "rgba(249, 115, 22, 0.15)", accent: "f97316" };
    }
    // 3. Tennis & Racket Sports
    if (l.includes('wimbledon') || l.includes('atp') || l.includes('tennis') || l.includes('open')) {
        return { type: 'tennis', bg: "linear-gradient(145deg, #2e1065 0%, #4c1d95 100%)", glow: "rgba(167, 139, 250, 0.2)", accent: "8b5cf6" };
    }
    // 4. Default to Football / Soccer
    return { type: 'football', bg: "linear-gradient(145deg, #064e3b 0%, #022c22 100%)", glow: "rgba(16, 185, 129, 0.2)", accent: "10b981" };
};

// ==========================================
// THE 4 PROFESSIONAL LAYOUT ENGINES
// ==========================================

// 🏏 OPTION 1: CRICKET (Asymmetrical Progression)
const CricketLayout = ({ teamA, teamB, scoreA, scoreB, accent }) => {
    const parse = (s) => {
        if (!s || s === '-') return { runs: '-', overs: '' };
        const parts = s.split('(');
        return { runs: parts[0].trim(), overs: parts[1] ? `(${parts[1]}` : '' };
    };
    const primary = parse(scoreA);
    const secondary = parse(scoreB);

    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <img src={getLogo(teamA, accent)} alt={teamA} style={{ width: 36, height: 36, borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.5)" }} />
                    <span style={{ fontSize: 16, fontWeight: 700, color: "#f8fafc", letterSpacing: "0.5px" }}>{teamA?.substring(0, 16)}</span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: 48, fontWeight: 800, color: "#fff", letterSpacing: "-2px", lineHeight: 1, textShadow: "0 4px 16px rgba(0,0,0,0.4)" }}>{primary.runs}</span>
                    <span style={{ fontSize: 16, fontWeight: 600, color: "#94a3b8" }}>{primary.overs}</span>
                </div>
            </div>

            <div style={{ width: 1, height: 60, background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.1), transparent)" }} />

            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, minWidth: 100 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#94a3b8" }}>{teamB?.substring(0, 3).toUpperCase()}</span>
                    <img src={getLogo(teamB, "334155")} alt={teamB} style={{ width: 24, height: 24, borderRadius: 6 }} />
                </div>
                <span style={{ fontSize: 18, fontWeight: 700, color: "#cbd5e1" }}>{secondary.runs}</span>
            </div>
        </div>
    );
};

// ⚽ OPTION 2: FOOTBALL (Symmetrical Tension)
const FootballLayout = ({ teamA, teamB, scoreA, scoreB, accent, isScheduled }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: 12 }}>
            <img src={getLogo(teamA, accent)} alt={teamA} style={{ width: 56, height: 56, borderRadius: "50%", boxShadow: `0 8px 24px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.2)` }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#f8fafc", textAlign: "center" }}>{teamA?.substring(0, 12)}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, flex: 1.5 }}>
            <span style={{ fontSize: 42, fontWeight: 800, color: "#fff", textShadow: "0 4px 16px rgba(0,0,0,0.5)" }}>{isScheduled ? "-" : scoreA}</span>
            <div style={{ padding: "4px 12px", background: "rgba(0,0,0,0.3)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#64748b" }}>VS</span>
            </div>
            <span style={{ fontSize: 42, fontWeight: 800, color: "#fff", textShadow: "0 4px 16px rgba(0,0,0,0.5)" }}>{isScheduled ? "-" : scoreB}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: 12 }}>
            <img src={getLogo(teamB, "475569")} alt={teamB} style={{ width: 56, height: 56, borderRadius: "50%", boxShadow: `0 8px 24px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.2)` }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#f8fafc", textAlign: "center" }}>{teamB?.substring(0, 12)}</span>
        </div>
    </div>
);

// 🏀 OPTION 3: BASKETBALL / NFL (Stacked Broadcast Ticket)
const BasketballLayout = ({ teamA, teamB, scoreA, scoreB, accent, isScheduled }) => {
    // Determine winner for highlight logic
    const aNum = parseInt(scoreA); const bNum = parseInt(scoreB);
    const aWins = !isScheduled && !isNaN(aNum) && !isNaN(bNum) && aNum > bNum;
    const bWins = !isScheduled && !isNaN(aNum) && !isNaN(bNum) && bNum > aNum;

    const Row = ({ team, score, isPrimary, isWinning }) => (
        <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            background: isWinning ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.2)",
            padding: "12px 20px", borderRadius: 16,
            border: isWinning ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent"
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <img src={getLogo(team, isPrimary ? accent : "475569")} alt={team} style={{ width: 32, height: 32, borderRadius: 8 }} />
                <span style={{ fontSize: 16, fontWeight: isWinning ? 800 : 600, color: isWinning ? "#fff" : "#94a3b8" }}>{team?.substring(0, 18)}</span>
            </div>
            <span style={{ fontSize: 24, fontWeight: 800, color: isWinning ? "#fff" : "#64748b" }}>{isScheduled ? "-" : score}</span>
        </div>
    );

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "8px 0" }}>
            <Row team={teamA} score={scoreA} isPrimary={true} isWinning={aWins || (!aWins && !bWins)} />
            <Row team={teamB} score={scoreB} isPrimary={false} isWinning={bWins} />
        </div>
    );
};

// 🎾 OPTION 4: TENNIS / GENERIC (Head-to-Head Split)
const TennisLayout = ({ teamA, teamB, scoreA, scoreB, accent, isScheduled }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, padding: "10px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <img src={getLogo(teamA, accent)} alt={teamA} style={{ width: 40, height: 40, borderRadius: "50%" }} />
                <span style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>{teamA?.substring(0, 14)}</span>
            </div>
            <span style={{ fontSize: 28, fontWeight: 800, color: "#fff" }}>{isScheduled ? "-" : scoreA}</span>
        </div>
        <div style={{ width: "100%", height: 1, background: "rgba(255,255,255,0.1)" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <img src={getLogo(teamB, "475569")} alt={teamB} style={{ width: 40, height: 40, borderRadius: "50%" }} />
                <span style={{ fontSize: 18, fontWeight: 700, color: "#cbd5e1" }}>{teamB?.substring(0, 14)}</span>
            </div>
            <span style={{ fontSize: 28, fontWeight: 800, color: "#cbd5e1" }}>{isScheduled ? "-" : scoreB}</span>
        </div>
    </div>
);

// ==========================================
// THE MASTER CARD SHELL
// ==========================================
export default function SportsCard({ data }) {
    if (!data || data.type !== 'sports') return null;
    const { teamA, teamB, scoreA, scoreB, status, league } = data;

    const isLive = status?.toLowerCase().includes('live') || status?.toLowerCase().includes('need') || (!status?.toLowerCase().includes('won') && scoreA !== '-');
    const isScheduled = scoreA === '-' || !scoreA;
    const config = getSportConfig(league);

    return (
        <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -20, scale: 0.95, filter: "blur(10px)" }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            style={{
                marginTop: 24, width: "100%", maxWidth: "440px", fontFamily: "'SF Pro Display', 'Inter', sans-serif",
                position: "relative", borderRadius: 32, padding: "24px 28px",
                background: config.bg,
                boxShadow: `0 32px 64px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,255,255,0.1), inset 0 -4px 12px rgba(0,0,0,0.5)`,
                border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden"
            }}
        >
            {/* AMBIENT 3D BACKGROUND GLOW */}
            <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                style={{ position: "absolute", top: -50, right: -50, width: 250, height: 250, background: `radial-gradient(circle, ${config.glow} 0%, transparent 70%)`, pointerEvents: "none" }}
            />

            {/* SWEEPING VOLUMETRIC LIGHT GLARE */}
            <motion.div
                animate={{ left: ["-150%", "250%"] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", repeatDelay: 2 }}
                style={{ position: "absolute", top: 0, bottom: 0, width: "30%", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)", transform: "skewX(-20deg)", pointerEvents: "none" }}
            />

            <div style={{ position: "relative", zIndex: 10 }}>

                {/* GLOBAL HEADER ROW */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.4)", letterSpacing: "1.5px", textTransform: "uppercase" }}>
                        {league || "SPORTS"}
                    </span>

                    <div style={{
                        display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 999,
                        background: isLive ? "rgba(239, 68, 68, 0.15)" : "rgba(255,255,255,0.05)",
                        border: `1px solid ${isLive ? "rgba(239, 68, 68, 0.3)" : "rgba(255,255,255,0.1)"}`
                    }}>
                        {isLive && <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", boxShadow: "0 0 10px #ef4444" }} />}
                        <span style={{ fontSize: 12, fontWeight: 700, color: isLive ? "#ef4444" : "rgba(255,255,255,0.5)", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                            {isLive ? "Live" : "Final"}
                        </span>
                    </div>
                </div>

                {/* DYNAMIC LAYOUT INJECTION */}
                <AnimatePresence mode="wait">
                    <motion.div key={config.type} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1, type: "spring" }}>
                        {config.type === 'cricket' && <CricketLayout teamA={teamA} teamB={teamB} scoreA={scoreA} scoreB={scoreB} accent={config.accent} />}
                        {config.type === 'football' && <FootballLayout teamA={teamA} teamB={teamB} scoreA={scoreA} scoreB={scoreB} accent={config.accent} isScheduled={isScheduled} />}
                        {config.type === 'basketball' && <BasketballLayout teamA={teamA} teamB={teamB} scoreA={scoreA} scoreB={scoreB} accent={config.accent} isScheduled={isScheduled} />}
                        {config.type === 'tennis' && <TennisLayout teamA={teamA} teamB={teamB} scoreA={scoreA} scoreB={scoreB} accent={config.accent} isScheduled={isScheduled} />}
                    </motion.div>
                </AnimatePresence>

                {/* GLOBAL STATUS FOOTER */}
                <motion.div
                    initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, type: "spring" }}
                    style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "center" }}
                >
                    <span style={{ fontSize: 14, fontWeight: 500, color: isLive ? "#fbbf24" : "rgba(255,255,255,0.6)", letterSpacing: "0.2px", textAlign: "center" }}>
                        {status}
                    </span>
                </motion.div>

            </div>
        </motion.div>
    );
}