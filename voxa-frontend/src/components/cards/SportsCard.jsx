import React from 'react';
import { motion } from 'framer-motion';

export default function SportsCard({ data }) {
    // 1. Safety Check
    if (!data || data.type !== 'sports') return null;

    // 2. Extract Data
    const { teamA, teamB, scoreA, scoreB, status, league } = data;

    // 3. Logic: If the AI sends "-" for scores, the game hasn't started yet!
    const isScheduled = !scoreA || scoreA === '-' || scoreA.toLowerCase() === 'n/a';

    return (
        <motion.div
            initial={{ opacity: 0, clipPath: "inset(0% 100% 0% 0%)" }}
            animate={{ opacity: 1, clipPath: "inset(0% 0% 0% 0%)" }}
            exit={{ opacity: 0, clipPath: "inset(0% 0% 0% 100%)" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{
                background: "transparent",
                borderLeft: "3px solid #fff",
                padding: "16px 24px",
                width: "min(100%, 340px)",
                color: "#fff",
                marginTop: 24,
            }}
        >
            <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.6)", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 16 }}>
                {league} • {status}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <span style={{ fontSize: 24, fontWeight: 400, letterSpacing: "-0.02em" }}>{teamA}</span>
                    <span style={{ fontSize: 32, fontWeight: 600, lineHeight: 0.9 }}>{isScheduled ? "" : scoreA}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <span style={{ fontSize: 24, fontWeight: 400, letterSpacing: "-0.02em" }}>{teamB}</span>
                    <span style={{ fontSize: 32, fontWeight: 600, lineHeight: 0.9 }}>{isScheduled ? "" : scoreB}</span>
                </div>
            </div>
        </motion.div>
    );
}