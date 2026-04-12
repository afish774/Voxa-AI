import React from 'react';
import { motion } from 'framer-motion';

export default function SportsCard({ data }) {
    if (!data || data.type !== 'sports') return null;
    const { teamA, teamB, scoreA, scoreB, status, league } = data;
    const isScheduled = !scoreA || scoreA === '-' || scoreA.toLowerCase() === 'n/a';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{
                background: "radial-gradient(120% 120% at 50% -20%, rgba(139, 92, 246, 0.15) 0%, rgba(0, 0, 0, 0.6) 100%)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(139, 92, 246, 0.2)",
                borderRadius: 24,
                padding: "24px",
                width: "min(100%, 360px)",
                color: "#fff",
                marginTop: 24,
                boxShadow: "0 20px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)"
            }}
        >
            <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#a78bfa", letterSpacing: "0.1em", textTransform: "uppercase" }}>{league || "SPORTS"}</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>{status}</div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ flex: 1, textAlign: "right", fontSize: 16, fontWeight: 500 }}>{teamA}</div>

                <div style={{ padding: "0 24px" }}>
                    {isScheduled ? (
                        <div style={{ fontSize: 16, fontWeight: 700, color: "#a78bfa" }}>VS</div>
                    ) : (
                        <div style={{ background: "rgba(0,0,0,0.4)", padding: "8px 16px", borderRadius: 12, fontSize: 24, fontWeight: 700, border: "1px solid rgba(255,255,255,0.05)" }}>
                            {scoreA} - {scoreB}
                        </div>
                    )}
                </div>

                <div style={{ flex: 1, textAlign: "left", fontSize: 16, fontWeight: 500 }}>{teamB}</div>
            </div>
        </motion.div>
    );
}