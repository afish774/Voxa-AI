import React from 'react';
import { motion } from 'framer-motion';

export default function SportsCard({ data }) {
    if (!data || data.type !== 'sports') return null;
    const { teamA, teamB, scoreA, scoreB, status, league } = data;
    const isScheduled = !scoreA || scoreA === '-' || scoreA.toLowerCase() === 'n/a';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{
                background: "rgba(255, 255, 255, 0.03)",
                backdropFilter: "blur(50px) saturate(200%)",
                WebkitBackdropFilter: "blur(50px) saturate(200%)",
                border: "0.5px solid rgba(255, 255, 255, 0.2)",
                borderRadius: 32,
                padding: "24px",
                width: "min(100%, 360px)",
                color: "#fff",
                marginTop: 24,
                boxShadow: "0 24px 48px rgba(0,0,0,0.2)"
            }}
        >
            <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 20, textAlign: "center" }}>
                {league || "SPORTS"}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                    <span style={{ fontSize: 18, fontWeight: 500, letterSpacing: "-0.02em" }}>{teamA}</span>
                </div>

                <div style={{ padding: "0 20px", display: "flex", justifyContent: "center" }}>
                    {isScheduled ? (
                        <div style={{ fontSize: 18, fontWeight: 400, color: "rgba(255,255,255,0.3)" }}>VS</div>
                    ) : (
                        <div style={{ fontSize: 38, fontWeight: 300, letterSpacing: "-0.04em", display: "flex", gap: "12px" }}>
                            <span>{scoreA}</span>
                            <span style={{ color: "rgba(255,255,255,0.2)" }}>-</span>
                            <span>{scoreB}</span>
                        </div>
                    )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                    <span style={{ fontSize: 18, fontWeight: 500, letterSpacing: "-0.02em" }}>{teamB}</span>
                </div>
            </div>

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: "0.5px solid rgba(255,255,255,0.1)", textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>
                {status}
            </div>
        </motion.div>
    );
}