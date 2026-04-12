import React from 'react';
import { motion } from 'framer-motion';

export default function SportsCard({ data }) {
    // --- DATA EXTRACTION ---
    if (!data || data.type !== 'sports') return null;
    const { teamA, teamB, scoreA, scoreB, status, league } = data;

    // Determine if the match is live based on the status string
    const isLive = status?.toLowerCase().includes('live') ||
        status?.toLowerCase().includes('need') ||
        status?.toLowerCase().includes('opt') ||
        (!status?.toLowerCase().includes('won') && scoreA !== '-');

    // Extract overs if they exist in the score string (e.g., "145/6 (20 OV)")
    const parseScore = (scoreStr) => {
        if (!scoreStr || scoreStr === '-') return { runs: '-', overs: '' };
        const parts = scoreStr.split('(');
        return {
            runs: parts[0].trim(),
            overs: parts[1] ? `(${parts[1]}` : ''
        };
    };

    const primaryScore = parseScore(scoreA);
    const secondaryScore = parseScore(scoreB);

    return (
        <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95, filter: "blur(10px)" }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            style={{
                marginTop: 24,
                width: "100%",
                maxWidth: "400px",
                fontFamily: "'Inter', -apple-system, sans-serif",
                position: "relative",
                borderRadius: "28px",
                padding: "24px 28px",
                // Premium ultra-smooth blue glass gradient
                background: "linear-gradient(145deg, #7ad3fa 0%, #a4e1fb 50%, #cbf0fc 100%)",
                boxShadow: "0 24px 48px rgba(122, 211, 250, 0.25), inset 0 2px 6px rgba(255,255,255,0.8), inset 0 -2px 10px rgba(255,255,255,0.2)",
                border: "1px solid rgba(255,255,255,0.7)",
                color: "#0f172a",
                overflow: "hidden"
            }}
        >
            {/* INNER 3D ANIMATION: Sweeping Diagonal Glare */}
            <motion.div
                animate={{ left: ["-150%", "200%"] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", repeatDelay: 2.5 }}
                style={{
                    position: "absolute", top: 0, bottom: 0, width: "40%",
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)",
                    transform: "skewX(-25deg)", zIndex: 0
                }}
            />

            {/* INNER 3D ANIMATION: Subtle Floating Background Glow */}
            <motion.div
                animate={{ y: [-10, 10, -10], scale: [1, 1.05, 1] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                style={{
                    position: "absolute", top: -20, right: -20, width: 160, height: 160,
                    background: "radial-gradient(circle, rgba(255,255,255,0.7) 0%, transparent 70%)",
                    zIndex: 0
                }}
            />

            <div style={{ position: "relative", zIndex: 1 }}>

                {/* RED LIVE BADGE (Staggered Entrance) */}
                <motion.div
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1, type: "spring" }}
                    style={{ marginBottom: 20 }}
                >
                    <div style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        background: isLive ? "linear-gradient(135deg, #ff4b4b, #e62929)" : "linear-gradient(135deg, #64748b, #475569)",
                        padding: "6px 14px", borderRadius: "16px",
                        boxShadow: isLive ? "0 4px 12px rgba(230, 41, 41, 0.3), inset 0 1px 2px rgba(255,255,255,0.4)" : "inset 0 1px 2px rgba(255,255,255,0.2)"
                    }}>
                        {isLive && (
                            <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff", boxShadow: "0 0 8px #fff" }} />
                        )}
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                            {isLive ? "Live" : "Final"}
                        </span>
                    </div>
                </motion.div>

                {/* MAIN CONTENT ROW */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>

                    {/* Primary Team (Left Side) */}
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                        style={{ display: "flex", flexDirection: "column" }}
                    >
                        <span style={{ fontSize: 20, fontWeight: 600, color: "#1e293b", marginBottom: 4, letterSpacing: "-0.5px" }}>
                            {teamA?.length > 15 ? `${teamA.substring(0, 15)}...` : teamA}
                        </span>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                            {/* Subtle Breathing Animation on the main score */}
                            <motion.span
                                animate={{ y: [0, -2, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                style={{ fontSize: 44, fontWeight: 800, color: "#0f172a", letterSpacing: "-1.5px", lineHeight: 1 }}
                            >
                                {primaryScore.runs}
                            </motion.span>
                            {primaryScore.overs && (
                                <span style={{ fontSize: 16, fontWeight: 600, color: "#334155" }}>
                                    {primaryScore.overs}
                                </span>
                            )}
                        </div>
                    </motion.div>

                    {/* Secondary Stats (Right Side) */}
                    <motion.div
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3, type: "spring" }}
                        style={{ display: "flex", flexDirection: "column", gap: 6, textAlign: "right", paddingBottom: 4 }}
                    >
                        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 13, fontWeight: 800, color: "#475569", letterSpacing: "0.5px" }}>
                                {teamB?.substring(0, 3).toUpperCase() || "OPP"}
                            </span>
                            <span style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                                {secondaryScore.runs}
                            </span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 13, fontWeight: 800, color: "#475569", letterSpacing: "0.5px" }}>
                                LGE
                            </span>
                            <span style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                                {league?.substring(0, 6) || "INTL"}
                            </span>
                        </div>
                    </motion.div>
                </div>

                {/* FOOTER TEXT */}
                <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4, type: "spring" }}
                    style={{ paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.4)" }}
                >
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", letterSpacing: "-0.2px" }}>
                        {status}
                    </span>
                </motion.div>

            </div>
        </motion.div>
    );
}