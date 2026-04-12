import React from 'react';
import { motion } from 'framer-motion';

export default function SportsCard({ data }) {
    if (!data || data.type !== 'sports') return null;
    const { teamA, teamB, scoreA, scoreB, status, league } = data;

    // Logic: If the AI sends "-" for scores, the game hasn't started yet!
    const isScheduled = !scoreA || scoreA === '-' || scoreA.toLowerCase() === 'n/a';

    // Dynamic Logo Generator (Premium Dark Mode Initials)
    const getLogo = (teamName) =>
        `https://ui-avatars.com/api/?name=${encodeURIComponent(teamName)}&background=111116&color=ffffff&size=120&bold=true&font-size=0.4`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
            transition={{ type: "spring", stiffness: 200, damping: 24 }}
            style={{
                display: "flex",
                justifyContent: "center",
                width: "100%",
                marginTop: 24,
                perspective: "1000px" // Required for the 3D depth
            }}
        >
            <motion.div
                whileHover={{
                    scale: 1.02,
                    rotateX: 2,
                    rotateY: -2,
                    boxShadow: "0 30px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.2)"
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                style={{
                    position: "relative",
                    width: "min(100%, 400px)",
                    borderRadius: 28,
                    padding: "28px",
                    background: "linear-gradient(160deg, rgba(35,35,45,0.7) 0%, rgba(15,15,20,0.9) 100%)",
                    backdropFilter: "blur(40px)",
                    WebkitBackdropFilter: "blur(40px)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
                    transformStyle: "preserve-3d"
                }}
            >
                {/* PREMIUM HEADER */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, transform: "translateZ(20px)" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.15em", textTransform: "uppercase" }}>
                        {league || "Live Match"}
                    </span>
                    <span style={{
                        fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                        color: isScheduled ? "#fbbf24" : "#34d399",
                        background: isScheduled ? "rgba(251, 191, 36, 0.1)" : "rgba(52, 211, 153, 0.1)",
                        padding: "4px 10px", borderRadius: 6
                    }}>
                        {status}
                    </span>
                </div>

                {/* 3D TEAMS & SCORE ALIGNMENT */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", transformStyle: "preserve-3d" }}>

                    {/* TEAM A */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, transform: "translateZ(40px)" }}>
                        <motion.div
                            whileHover={{ scale: 1.05, transform: "translateZ(50px)" }}
                            style={{ width: 64, height: 64, borderRadius: "50%", background: "#111", border: "1px solid rgba(255,255,255,0.15)", overflow: "hidden", boxShadow: "0 10px 20px rgba(0,0,0,0.4)" }}
                        >
                            <img src={getLogo(teamA)} alt={teamA} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </motion.div>
                        <span style={{ marginTop: 12, fontSize: 14, fontWeight: 600, color: "#fff", textAlign: "center", letterSpacing: "-0.01em" }}>{teamA}</span>
                    </div>

                    {/* SCORE / VS (Pops out to the front) */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0 16px", transform: "translateZ(60px)" }}>
                        {isScheduled ? (
                            <div style={{ fontSize: 24, fontWeight: 800, color: "rgba(255,255,255,0.4)" }}>VS</div>
                        ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <span style={{ fontSize: 40, fontWeight: 700, color: "#fff", letterSpacing: "-0.03em" }}>{scoreA}</span>
                                <span style={{ fontSize: 20, fontWeight: 500, color: "rgba(255,255,255,0.3)" }}>-</span>
                                <span style={{ fontSize: 40, fontWeight: 700, color: "#fff", letterSpacing: "-0.03em" }}>{scoreB}</span>
                            </div>
                        )}
                    </div>

                    {/* TEAM B */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, transform: "translateZ(40px)" }}>
                        <motion.div
                            whileHover={{ scale: 1.05, transform: "translateZ(50px)" }}
                            style={{ width: 64, height: 64, borderRadius: "50%", background: "#111", border: "1px solid rgba(255,255,255,0.15)", overflow: "hidden", boxShadow: "0 10px 20px rgba(0,0,0,0.4)" }}
                        >
                            <img src={getLogo(teamB)} alt={teamB} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </motion.div>
                        <span style={{ marginTop: 12, fontSize: 14, fontWeight: 600, color: "#fff", textAlign: "center", letterSpacing: "-0.01em" }}>{teamB}</span>
                    </div>

                </div>
            </motion.div>
        </motion.div>
    );
}