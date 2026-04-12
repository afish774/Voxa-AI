import React from 'react';
import { motion } from 'framer-motion';

export default function SportsCard({ data }) {
    if (!data || data.type !== 'sports') return null;
    const { teamA, teamB, scoreA, scoreB, status, league } = data;
    const isScheduled = !scoreA || scoreA === '-' || scoreA.toLowerCase() === 'n/a';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{
                background: "#0a0a0a",
                border: "1px solid #222",
                borderRadius: 20,
                padding: "24px",
                width: "min(100%, 380px)",
                color: "#ededed",
                marginTop: 24,
                boxShadow: "0 10px 30px rgba(0,0,0,0.8)"
            }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#666", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    {league || "Live Update"}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: isScheduled ? "#f5a623" : "#10b981", letterSpacing: "0.05em", background: isScheduled ? "rgba(245, 166, 35, 0.1)" : "rgba(16, 185, 129, 0.1)", padding: "4px 10px", borderRadius: 999 }}>
                    {status}
                </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 20, fontWeight: 600 }}>{teamA}</span>
                    <span style={{ fontSize: 24, fontWeight: 700, color: isScheduled ? "#444" : "#fff" }}>{isScheduled ? "-" : scoreA}</span>
                </div>

                <div style={{ height: "1px", width: "100%", background: "#222" }} />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 20, fontWeight: 600 }}>{teamB}</span>
                    <span style={{ fontSize: 24, fontWeight: 700, color: isScheduled ? "#444" : "#fff" }}>{isScheduled ? "-" : scoreB}</span>
                </div>
            </div>
        </motion.div>
    );
}