import React from 'react';
import { motion } from 'framer-motion';

export default function SportsCard({ data }) {
    if (!data || data.type !== 'sports') return null;
    const { teamA, teamB, scoreA, scoreB, status, league } = data;

    // Logic: If the AI sends "-" for scores, the game hasn't started yet!
    const isScheduled = !scoreA || scoreA === '-' || scoreA.toLowerCase() === 'n/a';

    return (
        <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.85, rotateX: 20 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.9, rotateX: -15, filter: "blur(10px)" }}
            transition={{ type: "spring", stiffness: 220, damping: 24 }}
            whileHover={{
                scale: 1.03,
                rotateX: 4,
                rotateY: -4,
                boxShadow: "0 40px 80px rgba(0,0,0,0.8), inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 10px rgba(0,0,0,0.5)"
            }}
            style={{
                background: "linear-gradient(145deg, rgba(30, 30, 35, 0.7), rgba(15, 15, 20, 0.9))",
                backdropFilter: "blur(32px)",
                WebkitBackdropFilter: "blur(32px)",
                borderTop: "1px solid rgba(255, 255, 255, 0.25)",
                borderLeft: "1px solid rgba(255, 255, 255, 0.15)",
                borderRight: "1px solid rgba(255, 255, 255, 0.05)",
                borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                borderRadius: 28,
                padding: "24px 28px",
                width: "min(100%, 400px)",
                color: "#fff",
                marginTop: 20,
                boxShadow: "0 25px 50px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.1), inset 0 -2px 10px rgba(0,0,0,0.3)",
                transformStyle: "preserve-3d",
                perspective: "1200px"
            }}
        >
            {/* 3D FLOATING LEAGUE HEADER */}
            <motion.div
                style={{ fontSize: 13, fontWeight: 800, color: "#c4b5fd", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 24, textAlign: "center", textShadow: "0 2px 6px rgba(0,0,0,0.6)", transform: "translateZ(30px)" }}
            >
                {league || "Live Sports Update"}
            </motion.div>

            {/* TEAMS & SCORES CONTAINER */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", transform: "translateZ(50px)", transformStyle: "preserve-3d" }}>

                {/* Team A Profile */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, transform: "translateZ(20px)" }}>
                    <div style={{ width: 68, height: 68, borderRadius: "50%", background: "linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.02))", border: "1px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 900, boxShadow: "0 12px 24px rgba(0,0,0,0.5), inset 0 2px 8px rgba(255,255,255,0.4)", textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>
                        {teamA?.substring(0, 3).toUpperCase()}
                    </div>
                    <span style={{ marginTop: 14, fontSize: 15, fontWeight: 700, textAlign: "center", letterSpacing: "0.02em", textShadow: "0 2px 6px rgba(0,0,0,0.6)" }}>{teamA}</span>
                </div>

                {/* Dynamic Center: Score vs "VS" */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0 16px", transform: "translateZ(60px)" }}>
                    {isScheduled ? (
                        <div style={{ fontSize: 32, fontWeight: 900, color: "rgba(255,255,255,0.9)", textShadow: "0 8px 16px rgba(0,0,0,0.6), 0 0 20px rgba(167, 139, 250, 0.4)", background: "linear-gradient(to bottom, #fff, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>VS</div>
                    ) : (
                        <div style={{ fontSize: 46, fontWeight: 900, letterSpacing: "3px", background: "linear-gradient(to bottom, #ffffff, #94a3b8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.5)) drop-shadow(0 0 15px rgba(255,255,255,0.2))" }}>
                            {scoreA} - {scoreB}
                        </div>
                    )}
                </div>

                {/* Team B Profile */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, transform: "translateZ(20px)" }}>
                    <div style={{ width: 68, height: 68, borderRadius: "50%", background: "linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.02))", border: "1px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 900, boxShadow: "0 12px 24px rgba(0,0,0,0.5), inset 0 2px 8px rgba(255,255,255,0.4)", textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>
                        {teamB?.substring(0, 3).toUpperCase()}
                    </div>
                    <span style={{ marginTop: 14, fontSize: 15, fontWeight: 700, textAlign: "center", letterSpacing: "0.02em", textShadow: "0 2px 6px rgba(0,0,0,0.6)" }}>{teamB}</span>
                </div>
            </div>

            {/* 3D STATUS BAR */}
            <motion.div
                style={{ marginTop: 28, paddingTop: 18, borderTop: "1px solid rgba(255,255,255,0.1)", textAlign: "center", fontSize: 14, color: isScheduled ? "#fde047" : "#10b981", fontWeight: 800, letterSpacing: "0.1em", transform: "translateZ(25px)", textShadow: "0 2px 6px rgba(0,0,0,0.4)" }}
            >
                {status}
            </motion.div>
        </motion.div>
    );
}