import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export default function SportsCard({ data }) {
    const cardRef = useRef(null);

    // --- 3D INTERACTIVE TILT PHYSICS ---
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x, { stiffness: 200, damping: 25 });
    const mouseYSpring = useSpring(y, { stiffness: 200, damping: 25 });

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["12deg", "-12deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-12deg", "12deg"]);

    // Dynamic glare effect that sweeps across the card
    const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ["100%", "-100%"]);
    const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ["100%", "-100%"]);

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        x.set(mouseX / width - 0.5);
        y.set(mouseY / height - 0.5);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    // --- DATA EXTRACTION ---
    if (!data || data.type !== 'sports') return null;
    const { teamA, teamB, scoreA, scoreB, status, league } = data;

    // Logic checks
    const isScheduled = !scoreA || scoreA === '-' || scoreA.toLowerCase() === 'n/a';
    const isLive = status?.toLowerCase().includes('live') || status?.toLowerCase().includes('need') || (!status?.toLowerCase().includes('won') && !isScheduled);

    // Premium Dark Mode Initials (Creates a sleek placeholder until you have real logos)
    const getLogo = (teamName, colorHex) =>
        `https://ui-avatars.com/api/?name=${encodeURIComponent(teamName)}&background=0A0A0F&color=${colorHex}&size=150&bold=true&font-size=0.45`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, filter: "blur(12px)" }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            style={{
                perspective: "1200px",
                marginTop: 24,
                width: "100%",
                maxWidth: "460px",
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
                    borderRadius: 28,
                    padding: "28px 24px",
                    // Deep, premium dark gradient matching the reference
                    background: "linear-gradient(160deg, #11111a 0%, #08080c 100%)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    boxShadow: "0 40px 80px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.15), inset 0 -4px 20px rgba(0,0,0,0.4)",
                    overflow: "hidden",
                }}
            >
                {/* INTERACTIVE GLARE */}
                <motion.div
                    style={{
                        position: "absolute", inset: "-50%",
                        background: "radial-gradient(circle at center, rgba(255,255,255,0.08) 0%, transparent 60%)",
                        x: glareX, y: glareY,
                        pointerEvents: "none", zIndex: 0,
                    }}
                />

                {/* 3D CONTENT CONTAINER */}
                <div style={{ transformStyle: "preserve-3d", position: "relative", zIndex: 1 }}>

                    {/* TOP HEADER: LEAGUE & LIVE BADGE */}
                    <div style={{ transform: "translateZ(30px)", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, padding: "0 10px" }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.5)", letterSpacing: "0.15em", textTransform: "uppercase" }}>
                            {league || "SPORTS UPDATE"}
                        </div>

                        {/* Dynamic Live/Scheduled Badge */}
                        <div style={{
                            display: "flex", alignItems: "center", gap: 8,
                            background: isLive ? "rgba(16, 185, 129, 0.15)" : "rgba(255,255,255,0.05)",
                            border: `1px solid ${isLive ? "rgba(16, 185, 129, 0.3)" : "rgba(255,255,255,0.1)"}`,
                            padding: "6px 14px", borderRadius: 999
                        }}>
                            {isLive && (
                                <motion.div
                                    animate={{ opacity: [1, 0.4, 1] }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                    style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 10px #10b981" }}
                                />
                            )}
                            <span style={{ fontSize: 11, fontWeight: 800, color: isLive ? "#10b981" : "#94a3b8", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                                {isLive ? "LIVE MATCH" : (isScheduled ? "UPCOMING" : "FULL TIME")}
                            </span>
                        </div>
                    </div>

                    {/* MAIN SCOREBOARD */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", transformStyle: "preserve-3d", padding: "0 10px" }}>

                        {/* TEAM A */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, transform: "translateZ(50px)" }}>
                            <div style={{ width: 72, height: 72, borderRadius: "50%", padding: "3px", background: "linear-gradient(135deg, #38bdf8, #06b6d4)", boxShadow: "0 10px 25px rgba(6, 182, 212, 0.3)" }}>
                                <img src={getLogo(teamA, "06b6d4")} alt={teamA} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", border: "2px solid #000" }} />
                            </div>
                            <span style={{ marginTop: 16, fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.6)", textAlign: "center", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                                {teamA?.substring(0, 15)}{teamA?.length > 15 ? '...' : ''}
                            </span>
                            {!isScheduled && (
                                <span style={{ marginTop: 8, fontSize: 32, fontWeight: 900, color: "#fff", textShadow: "0 4px 12px rgba(0,0,0,0.5)", lineHeight: 1 }}>
                                    {scoreA}
                                </span>
                            )}
                        </div>

                        {/* CENTER DIVIDER (VS) */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0 15px", transform: "translateZ(70px)" }}>
                            <div style={{
                                fontSize: 20, fontWeight: 900, fontStyle: "italic",
                                background: "linear-gradient(to bottom, #ffffff, #64748b)",
                                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                                filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.8))"
                            }}>
                                VS
                            </div>
                        </div>

                        {/* TEAM B */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, transform: "translateZ(50px)" }}>
                            <div style={{ width: 72, height: 72, borderRadius: "50%", padding: "3px", background: "linear-gradient(135deg, #c084fc, #7c3aed)", boxShadow: "0 10px 25px rgba(124, 58, 237, 0.3)" }}>
                                <img src={getLogo(teamB, "c084fc")} alt={teamB} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", border: "2px solid #000" }} />
                            </div>
                            <span style={{ marginTop: 16, fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.6)", textAlign: "center", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                                {teamB?.substring(0, 15)}{teamB?.length > 15 ? '...' : ''}
                            </span>
                            {!isScheduled && (
                                <span style={{ marginTop: 8, fontSize: 32, fontWeight: 900, color: "#fff", textShadow: "0 4px 12px rgba(0,0,0,0.5)", lineHeight: 1 }}>
                                    {scoreB}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* GLOWING STATUS BANNER */}
                    <div style={{ transform: "translateZ(60px)", marginTop: 40 }}>
                        <div style={{
                            width: "100%",
                            background: "linear-gradient(90deg, rgba(255,255,255,0.03), rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
                            borderTop: "1px solid rgba(255,255,255,0.1)",
                            borderBottom: "1px solid rgba(255,255,255,0.05)",
                            padding: "16px", borderRadius: 16,
                            display: "flex", justifyContent: "center", alignItems: "center",
                            boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
                        }}>
                            <span style={{
                                fontSize: 14, fontWeight: 700, letterSpacing: "0.02em",
                                color: isLive ? "#34d399" : (isScheduled ? "#fde047" : "#e2e8f0"),
                                textShadow: isLive ? "0 0 12px rgba(52, 211, 153, 0.4)" : "none",
                                textAlign: "center"
                            }}>
                                {status}
                            </span>
                        </div>
                    </div>

                </div>
            </motion.div>
        </motion.div>
    );
}