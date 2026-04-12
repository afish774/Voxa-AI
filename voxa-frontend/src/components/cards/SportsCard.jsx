import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export default function SportsCard({ data }) {
    const cardRef = useRef(null);

    // --- 3D INTERACTIVE TILT PHYSICS ---
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
    const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

    // Dynamic glare effect
    const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ["100%", "-100%"]);
    const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ["100%", "-100%"]);

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        x.set((e.clientX - rect.left) / rect.width - 0.5);
        y.set((e.clientY - rect.top) / rect.height - 0.5);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    // --- DATA EXTRACTION ---
    if (!data || data.type !== 'sports') return null;
    const { teamA, teamB, scoreA, scoreB, status, league } = data;

    const isScheduled = !scoreA || scoreA === '-' || scoreA.toLowerCase() === 'n/a';
    const isLive = status?.toLowerCase().includes('live') || status?.toLowerCase().includes('need') || status?.toLowerCase().includes('opt') || (!status?.toLowerCase().includes('won') && !isScheduled);

    // Squared, broadcast-style logos
    const getLogo = (teamName) =>
        `https://ui-avatars.com/api/?name=${encodeURIComponent(teamName)}&background=2a2b36&color=ffffff&size=120&bold=true`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{
                perspective: "1200px",
                marginTop: 24,
                width: "100%",
                maxWidth: "380px"
            }}
        >
            <motion.div
                ref={cardRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{
                    rotateX,
                    rotateY,
                    transformStyle: "preserve-3d",
                    position: "relative",
                    width: "100%",
                    borderRadius: 16,
                    overflow: "hidden",
                    // Sleek, professional broadcast grey background
                    background: "#1a1b23",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.1)",
                    border: "1px solid rgba(255,255,255,0.08)",
                }}
            >
                {/* 3D GLARE EFFECT */}
                <motion.div
                    style={{
                        position: "absolute", inset: "-50%",
                        background: "radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, transparent 60%)",
                        x: glareX, y: glareY, pointerEvents: "none", zIndex: 0
                    }}
                />

                <div style={{ position: "relative", zIndex: 1, transformStyle: "preserve-3d" }}>

                    {/* HEADER (League & Live Indicator) */}
                    <div style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)",
                        background: "rgba(0,0,0,0.2)", transform: "translateZ(20px)"
                    }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            {league || "SPORTS"}
                        </span>
                        {isLive && (
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", boxShadow: "0 0 8px #ef4444" }} />
                                <span style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", letterSpacing: "0.5px" }}>LIVE</span>
                            </div>
                        )}
                    </div>

                    {/* TEAMS AND SCORES (Horizontal Stacked Layout) */}
                    <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 16, transform: "translateZ(40px)" }}>

                        {/* TEAM A ROW */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <img src={getLogo(teamA)} alt={teamA} style={{ width: 32, height: 32, borderRadius: "6px", objectFit: "cover" }} />
                                <span style={{ fontSize: 16, fontWeight: 700, color: "#fff", textTransform: "uppercase" }}>
                                    {teamA?.length > 18 ? `${teamA.substring(0, 18)}...` : teamA}
                                </span>
                            </div>
                            <span style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>
                                {isScheduled ? "-" : scoreA}
                            </span>
                        </div>

                        {/* TEAM B ROW */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <img src={getLogo(teamB)} alt={teamB} style={{ width: 32, height: 32, borderRadius: "6px", objectFit: "cover" }} />
                                <span style={{ fontSize: 16, fontWeight: 700, color: "#fff", textTransform: "uppercase" }}>
                                    {teamB?.length > 18 ? `${teamB.substring(0, 18)}...` : teamB}
                                </span>
                            </div>
                            <span style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>
                                {isScheduled ? "-" : scoreB}
                            </span>
                        </div>

                    </div>

                    {/* STATUS FOOTER */}
                    <div style={{
                        padding: "12px 16px", background: "rgba(0,0,0,0.3)",
                        borderTop: "1px solid rgba(255,255,255,0.05)", transform: "translateZ(30px)"
                    }}>
                        <span style={{
                            fontSize: 13, fontWeight: 500,
                            color: isLive ? "#fbbf24" : "rgba(255,255,255,0.7)",
                            display: "block", lineHeight: 1.4
                        }}>
                            {status}
                        </span>
                    </div>

                </div>
            </motion.div>
        </motion.div>
    );
}