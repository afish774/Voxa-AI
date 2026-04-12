import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export default function SportsCard({ data }) {
    const cardRef = useRef(null);

    // --- 3D INTERACTIVE TILT PHYSICS ---
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Smooth out the mouse movement for a premium "heavy" feel
    const mouseXSpring = useSpring(x, { stiffness: 150, damping: 20 });
    const mouseYSpring = useSpring(y, { stiffness: 150, damping: 20 });

    // Map the mouse position to rotation degrees (max 15 degrees tilt)
    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

    // Dynamic glare effect that moves with the tilt
    const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ["100%", "-100%"]);
    const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ["100%", "-100%"]);

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        // Snap back to center when mouse leaves
        x.set(0);
        y.set(0);
    };

    // --- DATA EXTRACTION & SAFETY ---
    if (!data || data.type !== 'sports') return null;
    const { teamA, teamB, scoreA, scoreB, status, league } = data;
    const isScheduled = !scoreA || scoreA === '-' || scoreA.toLowerCase() === 'n/a';

    // Dynamic Logo Generator (Premium Dark Mode Initials)
    const getLogo = (teamName) =>
        `https://ui-avatars.com/api/?name=${encodeURIComponent(teamName)}&background=1a1a24&color=ffffff&size=150&bold=true&font-size=0.4`;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            style={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                perspective: "1200px", // Crucial for the 3D effect
                marginTop: 24,
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
                    width: "min(100%, 420px)",
                    borderRadius: 32,
                    padding: "32px",
                    background: "linear-gradient(145deg, rgba(30, 30, 40, 0.6), rgba(10, 10, 15, 0.9))",
                    backdropFilter: "blur(40px)",
                    WebkitBackdropFilter: "blur(40px)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    boxShadow: "0 30px 60px rgba(0,0,0,0.6), inset 0 2px 10px rgba(255,255,255,0.1)",
                    overflow: "hidden", // Keeps the glare inside the card
                }}
            >
                {/* INTERACTIVE GLARE EFFECT */}
                <motion.div
                    style={{
                        position: "absolute",
                        top: "-50%", left: "-50%", right: "-50%", bottom: "-50%",
                        background: "radial-gradient(circle at center, rgba(255,255,255,0.15) 0%, transparent 50%)",
                        x: glareX,
                        y: glareY,
                        pointerEvents: "none",
                        zIndex: 0,
                    }}
                />

                {/* 3D FLOATING CONTENT CONTAINER */}
                <div style={{ transformStyle: "preserve-3d", position: "relative", zIndex: 1 }}>

                    {/* LEAGUE HEADER (Floats slightly up) */}
                    <div style={{ transform: "translateZ(30px)", display: "flex", justifyContent: "center", marginBottom: 32 }}>
                        <div style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", padding: "6px 18px", borderRadius: 999, fontSize: 12, fontWeight: 700, color: "#cbd5e1", letterSpacing: "0.15em", textTransform: "uppercase", boxShadow: "0 8px 16px rgba(0,0,0,0.4)" }}>
                            {league || "Sports Update"}
                        </div>
                    </div>

                    {/* TEAMS & SCORES */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", transformStyle: "preserve-3d" }}>

                        {/* TEAM A - LOGO SPECIFIED (Floats high) */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, transform: "translateZ(50px)" }}>
                            <div style={{ width: 84, height: 84, borderRadius: "50%", padding: "4px", background: "linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0.05))", boxShadow: "0 15px 30px rgba(0,0,0,0.5)" }}>
                                <img
                                    src={getLogo(teamA)}
                                    alt={teamA}
                                    style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", border: "1px solid rgba(0,0,0,0.5)" }}
                                />
                            </div>
                            <span style={{ marginTop: 16, fontSize: 15, fontWeight: 700, color: "#fff", textAlign: "center", textShadow: "0 4px 10px rgba(0,0,0,0.8)" }}>{teamA}</span>
                        </div>

                        {/* SCORE / VS (Floats the highest for depth) */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0 10px", transform: "translateZ(80px)" }}>
                            {isScheduled ? (
                                <div style={{ fontSize: 32, fontWeight: 900, color: "#94a3b8", textShadow: "0 10px 20px rgba(0,0,0,0.6)" }}>VS</div>
                            ) : (
                                <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(0,0,0,0.4)", padding: "12px 24px", borderRadius: 24, border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 15px 25px rgba(0,0,0,0.6)" }}>
                                    <span style={{ fontSize: 48, fontWeight: 800, color: "#fff", textShadow: "0 4px 10px rgba(0,0,0,0.5)" }}>{scoreA}</span>
                                    <span style={{ fontSize: 24, color: "rgba(255,255,255,0.2)" }}>-</span>
                                    <span style={{ fontSize: 48, fontWeight: 800, color: "#fff", textShadow: "0 4px 10px rgba(0,0,0,0.5)" }}>{scoreB}</span>
                                </div>
                            )}
                        </div>

                        {/* TEAM B - LOGO SPECIFIED (Floats high) */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, transform: "translateZ(50px)" }}>
                            <div style={{ width: 84, height: 84, borderRadius: "50%", padding: "4px", background: "linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0.05))", boxShadow: "0 15px 30px rgba(0,0,0,0.5)" }}>
                                <img
                                    src={getLogo(teamB)}
                                    alt={teamB}
                                    style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", border: "1px solid rgba(0,0,0,0.5)" }}
                                />
                            </div>
                            <span style={{ marginTop: 16, fontSize: 15, fontWeight: 700, color: "#fff", textAlign: "center", textShadow: "0 4px 10px rgba(0,0,0,0.8)" }}>{teamB}</span>
                        </div>
                    </div>

                    {/* STATUS BAR (Floats up) */}
                    <div style={{ transform: "translateZ(40px)", marginTop: 36, display: "flex", justifyContent: "center" }}>
                        <div style={{
                            fontSize: 13, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase",
                            color: isScheduled ? "#fde047" : "#34d399",
                            background: isScheduled ? "rgba(253, 224, 71, 0.15)" : "rgba(52, 211, 153, 0.15)",
                            padding: "8px 20px", borderRadius: 12, border: "1px solid", borderColor: isScheduled ? "rgba(253, 224, 71, 0.3)" : "rgba(52, 211, 153, 0.3)",
                            boxShadow: isScheduled ? "0 4px 15px rgba(253, 224, 71, 0.2)" : "0 4px 15px rgba(52, 211, 153, 0.2)"
                        }}>
                            {status}
                        </div>
                    </div>

                </div>
            </motion.div>
        </motion.div>
    );
}