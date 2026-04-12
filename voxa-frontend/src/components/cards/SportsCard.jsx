import React from 'react';
import { motion } from 'framer-motion';

// --- HELPER: LOGO GENERATOR ---
const getLogo = (name, color) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${color}&color=fff&size=120&bold=true`;

// --- HELPER: SPORT DETECTION & THEMING ---
const getSportConfig = (league = "") => {
    const l = league.toLowerCase();
    if (l.includes('ipl') || l.includes('t20') || l.includes('cricket') || l.includes('odi') || l.includes('test')) {
        return { type: 'cricket', bg: "linear-gradient(145deg, #0f172a 0%, #1e293b 100%)", glow: "rgba(56, 189, 248, 0.15)", accent: "38bdf8" }; // Sky Blue
    }
    if (l.includes('nba') || l.includes('basketball') || l.includes('nfl')) {
        return { type: 'basketball', bg: "linear-gradient(145deg, #18181b 0%, #27272a 100%)", glow: "rgba(249, 115, 22, 0.15)", accent: "f97316" }; // Sunset Orange
    }
    // Default to Football / Soccer
    return { type: 'football', bg: "linear-gradient(145deg, #022c22 0%, #064e3b 100%)", glow: "rgba(16, 185, 129, 0.15)", accent: "10b981" }; // Emerald Green
};

export default function SportsCard({ data }) {
    if (!data || data.type !== 'sports') return null;
    const { teamA, teamB, scoreA, scoreB, status, league } = data;

    const isLive = status?.toLowerCase().includes('live') || status?.toLowerCase().includes('need') || (!status?.toLowerCase().includes('won') && scoreA !== '-');
    const isScheduled = scoreA === '-' || !scoreA;
    const config = getSportConfig(league);

    // --- CRICKET SCORE PARSER ---
    const parseCricketScore = (scoreStr) => {
        if (!scoreStr || scoreStr === '-') return { runs: '-', overs: '' };
        const parts = scoreStr.split('(');
        return { runs: parts[0].trim(), overs: parts[1] ? `(${parts[1]}` : '' };
    };

    // ==========================================
    // 1. THE "OVAL" LAYOUT (CRICKET)
    // ==========================================
    const CricketLayout = () => {
        const primary = parseCricketScore(scoreA);
        const secondary = parseCricketScore(scoreB);
        return (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: 18, fontWeight: 600, color: "rgba(255,255,255,0.9)", marginBottom: 4 }}>
                        {teamA?.length > 15 ? `${teamA.substring(0, 15)}...` : teamA}
                    </span>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                        <motion.span animate={{ y: [0, -2, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} style={{ fontSize: 42, fontWeight: 800, color: "#fff", letterSpacing: "-1px", lineHeight: 1 }}>
                            {primary.runs}
                        </motion.span>
                        {primary.overs && <span style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>{primary.overs}</span>}
                    </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, textAlign: "right", paddingBottom: 4 }}>
                    <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.4)" }}>{teamB?.substring(0, 3).toUpperCase() || "OPP"}</span>
                        <span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{secondary.runs}</span>
                    </div>
                </div>
            </div>
        );
    };

    // ==========================================
    // 2. THE "PITCH" LAYOUT (FOOTBALL / SOCCER)
    // ==========================================
    const FootballLayout = () => (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, padding: "0 10px" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                <motion.img animate={{ y: [0, -3, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} src={getLogo(teamA, config.accent)} alt={teamA} style={{ width: 48, height: 48, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.1)", marginBottom: 12 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.8)", textAlign: "center", textTransform: "uppercase" }}>
                    {teamA?.substring(0, 12)}
                </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 16px" }}>
                <span style={{ fontSize: 36, fontWeight: 800, color: "#fff" }}>{isScheduled ? "-" : scoreA}</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: "rgba(255,255,255,0.2)" }}>VS</span>
                <span style={{ fontSize: 36, fontWeight: 800, color: "#fff" }}>{isScheduled ? "-" : scoreB}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                <motion.img animate={{ y: [0, -3, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }} src={getLogo(teamB, "475569")} alt={teamB} style={{ width: 48, height: 48, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.1)", marginBottom: 12 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.8)", textAlign: "center", textTransform: "uppercase" }}>
                    {teamB?.substring(0, 12)}
                </span>
            </div>
        </div>
    );

    // ==========================================
    // 3. THE "COURT" LAYOUT (BASKETBALL / NFL)
    // ==========================================
    const BasketballLayout = () => (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.03)", padding: "10px 16px", borderRadius: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <img src={getLogo(teamA, config.accent)} alt={teamA} style={{ width: 28, height: 28, borderRadius: 6 }} />
                    <span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{teamA?.substring(0, 18)}</span>
                </div>
                <span style={{ fontSize: 24, fontWeight: 800, color: "#fff" }}>{isScheduled ? "-" : scoreA}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.03)", padding: "10px 16px", borderRadius: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <img src={getLogo(teamB, "475569")} alt={teamB} style={{ width: 28, height: 28, borderRadius: 6 }} />
                    <span style={{ fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>{teamB?.substring(0, 18)}</span>
                </div>
                <span style={{ fontSize: 24, fontWeight: 800, color: "rgba(255,255,255,0.8)" }}>{isScheduled ? "-" : scoreB}</span>
            </div>
        </div>
    );

    // ==========================================
    // MASTER RENDER
    // ==========================================
    return (
        <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95, filter: "blur(10px)" }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            style={{
                marginTop: 24, width: "100%", maxWidth: "420px", fontFamily: "'Inter', -apple-system, sans-serif",
                position: "relative", borderRadius: "28px", padding: "24px",
                background: config.bg,
                boxShadow: `0 24px 48px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.1), inset 0 -2px 10px rgba(0,0,0,0.4)`,
                border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden"
            }}
        >
            {/* INNER 3D ANIMATION: Sweeping Volumetric Light Glare */}
            <motion.div
                animate={{ left: ["-100%", "200%"] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", repeatDelay: 3 }}
                style={{
                    position: "absolute", top: 0, bottom: 0, width: "30%",
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
                    transform: "skewX(-25deg)", zIndex: 0, pointerEvents: "none"
                }}
            />

            {/* INNER 3D ANIMATION: Dynamic Sport-Specific Glow */}
            <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                style={{
                    position: "absolute", top: -40, right: -40, width: 200, height: 200,
                    background: `radial-gradient(circle, ${config.glow} 0%, transparent 70%)`, zIndex: 0, pointerEvents: "none"
                }}
            />

            <div style={{ position: "relative", zIndex: 1 }}>

                {/* HEADER ROW */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: `rgba(255,255,255,0.4)`, letterSpacing: "1px", textTransform: "uppercase" }}>
                        {league || "SPORTS"}
                    </span>

                    <div style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        background: isLive ? "rgba(239, 68, 68, 0.15)" : "rgba(255,255,255,0.05)",
                        border: `1px solid ${isLive ? "rgba(239, 68, 68, 0.3)" : "rgba(255,255,255,0.1)"}`,
                        padding: "4px 12px", borderRadius: "16px"
                    }}>
                        {isLive && <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", boxShadow: "0 0 8px #ef4444" }} />}
                        <span style={{ fontSize: 11, fontWeight: 700, color: isLive ? "#ef4444" : "rgba(255,255,255,0.5)", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                            {isLive ? "Live" : "Final"}
                        </span>
                    </div>
                </div>

                {/* DYNAMIC POLYMORPHIC LAYOUT RENDERING */}
                <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1, type: "spring" }}>
                    {config.type === 'cricket' && <CricketLayout />}
                    {config.type === 'football' && <FootballLayout />}
                    {config.type === 'basketball' && <BasketballLayout />}
                </motion.div>

                {/* FOOTER TEXT */}
                <motion.div
                    initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, type: "spring" }}
                    style={{ paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "center" }}
                >
                    <span style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.6)", letterSpacing: "0.2px", textAlign: "center" }}>
                        {status}
                    </span>
                </motion.div>

            </div>
        </motion.div>
    );
}