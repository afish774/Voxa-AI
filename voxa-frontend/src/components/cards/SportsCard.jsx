import React from 'react';
import { motion } from 'framer-motion';

export default function SportsCard({ data }) {
    if (!data || data.type !== 'sports') return null;
    const { teamA, teamB, scoreA, scoreB, status, league } = data;

    // Logic: If the AI sends "-" for scores, the game hasn't started yet!
    const isScheduled = !scoreA || scoreA === '-' || scoreA.toLowerCase() === 'n/a';

    return (
        <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            style={{
                background: "rgba(20, 20, 25, 0.5)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 24,
                padding: "20px 24px",
                width: "min(100%, 380px)",
                color: "#fff",
                marginTop: 16,
                boxShadow: "0 20px 40px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.05)"
            }}
        >
            {/* LEAGUE HEADER */}
            <div style={{ fontSize: 12, fontWeight: 600, color: "#a78bfa", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16, textAlign: "center" }}>
                {league || "Sports Update"}
            </div>

            {/* TEAMS & SCORES */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>

                {/* Team A Profile */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                    <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.02))", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
                        {teamA?.substring(0, 3).toUpperCase()}
                    </div>
                    <span style={{ marginTop: 10, fontSize: 14, fontWeight: 600, textAlign: "center", letterSpacing: "0.02em" }}>{teamA}</span>
                </div>

                {/* Dynamic Center: Score vs "VS" */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0 16px" }}>
                    {isScheduled ? (
                        <div style={{ fontSize: 22, fontWeight: 800, color: "rgba(255,255,255,0.4)" }}>VS</div>
                    ) : (
                        <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: "2px", textShadow: "0 2px 10px rgba(255,255,255,0.2)" }}>
                            {scoreA} - {scoreB}
                        </div>
                    )}
                </div>

                {/* Team B Profile */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                    <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.02))", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
                        {teamB?.substring(0, 3).toUpperCase()}
                    </div>
                    <span style={{ marginTop: 10, fontSize: 14, fontWeight: 600, textAlign: "center", letterSpacing: "0.02em" }}>{teamB}</span>
                </div>
            </div>

            {/* STATUS BAR (Time or Full Time) */}
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.05)", textAlign: "center", fontSize: 13, color: isScheduled ? "#fcd34d" : "rgba(255,255,255,0.6)", fontWeight: 500, letterSpacing: "0.05em" }}>
                {status}
            </div>
        </motion.div>
    );
}