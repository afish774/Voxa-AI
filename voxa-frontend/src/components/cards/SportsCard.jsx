import React from 'react';
import { motion } from 'framer-motion';

export default function SportsCard({ data }) {
    if (!data || data.type !== 'sports') return null;
    const { teamA, teamB, scoreA, scoreB, status, league } = data;

    // Logic: If the AI sends "-" for scores, the game hasn't started yet!
    const isScheduled = !scoreA || scoreA === '-' || scoreA.toLowerCase() === 'n/a';

    return (
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.8, rotateX: 30 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.8, rotateX: -20, filter: "blur(15px)" }}
            transition={{ type: "spring", stiffness: 150, damping: 20 }}
            // Continuous 3D floating effect
            whileInView={{ y: [0, -8, 0] }}
            viewport={{ once: false }}
            style={{
                position: "relative",
                background: "linear-gradient(135deg, rgba(30,30,40,0.85) 0%, rgba(10,10,15,0.95) 100%)",
                backdropFilter: "blur(40px)",
                WebkitBackdropFilter: "blur(40px)",
                borderTop: "1px solid rgba(255, 255, 255, 0.4)",
                borderLeft: "1px solid rgba(255, 255, 255, 0.2)",
                borderRight: "1px solid rgba(255, 255, 255, 0.05)",
                borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                borderRadius: 32,
                padding: "32px",
                width: "min(100%, 420px)",
                color: "#fff",
                marginTop: 24,
                boxShadow: "0 30px 60px rgba(0,0,0,0.7), inset 0 2px 5px rgba(255,255,255,0.2), inset 0 -4px 20px rgba(0,0,0,0.5)",
                transformStyle: "preserve-3d",
                perspective: "1000px",
                overflow: "hidden" // Keeps the lighting sheen contained
            }}
        >
            {/* Animated Light Sheen (Simulates light reflecting off 3D glass) */}
            <motion.div
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 4, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
                style={{
                    position: "absolute",
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: "linear-gradient(115deg, transparent 20%, rgba(255,255,255,0.1) 45%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.1) 55%, transparent 80%)",
                    zIndex: 0,
                    pointerEvents: "none"
                }}
            />

            {/* 3D FLOATING LEAGUE HEADER */}
            <div style={{ position: "relative", zIndex: 1, transform: "translateZ(30px)", display: "flex", justifyContent: "center", marginBottom: 30 }}>
                <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", padding: "6px 16px", borderRadius: 999, fontSize: 12, fontWeight: 800, color: "#e2e8f0", letterSpacing: "0.2em", textTransform: "uppercase", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
                    {league || "Live Match"}
                </div>
            </div>

            {/* TEAMS & SCORES CONTAINER */}
            <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", transformStyle: "preserve-3d" }}>

                {/* TEAM A - 3D LOGO SPECIFIED */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, transform: "translateZ(40px)" }}>
                    <div style={{
                        width: 80, height: 80, borderRadius: "50%",
                        background: "linear-gradient(145deg, #2a2a35, #15151a)",
                        border: "2px solid rgba(255,255,255,0.15)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 15px 35px rgba(0,0,0,0.6), inset 0 4px 10px rgba(255,255,255,0.3), inset 0 -4px 10px rgba(0,0,0,0.5)",
                        position: "relative", overflow: "hidden"
                    }}>
                        {/* If you add Logo URLs later, replace this span with an <img src={teamA_Logo} /> */}
                        <span style={{ fontSize: 24, fontWeight: 900, color: "#fff", textShadow: "0 2px 4px rgba(0,0,0,0.8)", letterSpacing: "1px" }}>
                            {teamA?.substring(0, 3).toUpperCase()}
                        </span>
                    </div>
                    <span style={{ marginTop: 16, fontSize: 16, fontWeight: 700, textAlign: "center", letterSpacing: "0.02em", textShadow: "0 4px 10px rgba(0,0,0,0.8)" }}>{teamA}</span>
                </div>

                {/* DYNAMIC CENTER: Score vs "VS" (Pops out the furthest) */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0 10px", transform: "translateZ(70px)" }}>
                    {isScheduled ? (
                        <div style={{
                            fontSize: 36, fontWeight: 900, fontStyle: "italic",
                            background: "linear-gradient(to bottom, #ffffff, #64748b)",
                            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                            filter: "drop-shadow(0 10px 15px rgba(0,0,0,0.8))"
                        }}>
                            VS
                        </div>
                    ) : (
                        <div style={{
                            display: "flex", alignItems: "center", gap: "12px",
                            background: "rgba(0,0,0,0.3)", padding: "12px 20px", borderRadius: 20,
                            border: "1px solid rgba(255,255,255,0.1)",
                            boxShadow: "0 10px 25px rgba(0,0,0,0.5), inset 0 2px 5px rgba(255,255,255,0.1)"
                        }}>
                            <span style={{ fontSize: 42, fontWeight: 900, textShadow: "0 4px 12px rgba(0,0,0,0.6)" }}>{scoreA}</span>
                            <span style={{ fontSize: 24, color: "rgba(255,255,255,0.3)" }}>-</span>
                            <span style={{ fontSize: 42, fontWeight: 900, textShadow: "0 4px 12px rgba(0,0,0,0.6)" }}>{scoreB}</span>
                        </div>
                    )}
                </div>

                {/* TEAM B - 3D LOGO SPECIFIED */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, transform: "translateZ(40px)" }}>
                    <div style={{
                        width: 80, height: 80, borderRadius: "50%",
                        background: "linear-gradient(145deg, #2a2a35, #15151a)",
                        border: "2px solid rgba(255,255,255,0.15)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 15px 35px rgba(0,0,0,0.6), inset 0 4px 10px rgba(255,255,255,0.3), inset 0 -4px 10px rgba(0,0,0,0.5)",
                        position: "relative", overflow: "hidden"
                    }}>
                        {/* If you add Logo URLs later, replace this span with an <img src={teamB_Logo} /> */}
                        <span style={{ fontSize: 24, fontWeight: 900, color: "#fff", textShadow: "0 2px 4px rgba(0,0,0,0.8)", letterSpacing: "1px" }}>
                            {teamB?.substring(0, 3).toUpperCase()}
                        </span>
                    </div>
                    <span style={{ marginTop: 16, fontSize: 16, fontWeight: 700, textAlign: "center", letterSpacing: "0.02em", textShadow: "0 4px 10px rgba(0,0,0,0.8)" }}>{teamB}</span>
                </div>
            </div>

            {/* 3D STATUS BAR */}
            <div style={{ position: "relative", zIndex: 1, transform: "translateZ(20px)", marginTop: 32, display: "flex", justifyContent: "center" }}>
                <div style={{
                    fontSize: 14, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase",
                    color: isScheduled ? "#fde047" : "#10b981",
                    textShadow: isScheduled ? "0 0 10px rgba(253, 224, 71, 0.4)" : "0 0 10px rgba(16, 185, 129, 0.4)",
                    background: isScheduled ? "rgba(253, 224, 71, 0.1)" : "rgba(16, 185, 129, 0.1)",
                    padding: "8px 24px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)"
                }}>
                    {status}
                </div>
            </div>
        </motion.div>
    );
}