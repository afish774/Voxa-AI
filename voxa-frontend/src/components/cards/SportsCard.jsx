import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export default function SportsCard({ data }) {
    const cardRef = useRef(null);

    // --- 3D INTERACTIVE TILT PHYSICS ---
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
    const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["8deg", "-8deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-8deg", "8deg"]);

    // Dynamic glare effect to simulate light moving across the bright glass
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
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{
                perspective: "1200px",
                marginTop: 24,
                width: "100%",
                maxWidth: "380px",
                fontFamily: "'Inter', -apple-system, sans-serif"
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
                    borderRadius: "24px",
                    padding: "24px",
                    // The bright glassmorphic sky-blue gradient matching the reference exactly
                    background: "linear-gradient(135deg, #74cff9 0%, #8ddbfd 50%, #bdeafb 100%)",
                    boxShadow: "0 24px 48px rgba(116, 207, 249, 0.35), inset 0 2px 4px rgba(255,255,255,0.7), inset 0 -2px 10px rgba(255,255,255,0.2)",
                    border: "1px solid rgba(255,255,255,0.6)",
                    color: "#0f172a"
                }}
            >
                {/* 3D GLARE EFFECT */}
                <motion.div
                    style={{
                        position: "absolute", inset: "-50%",
                        background: "radial-gradient(circle at center, rgba(255,255,255,0.5) 0%, transparent 60%)",
                        x: glareX, y: glareY, pointerEvents: "none", zIndex: 0,
                        mixBlendMode: "overlay", borderRadius: "24px"
                    }}
                />

                {/* PROTRUDING TOP-RIGHT ARROW BUTTON */}
                <div style={{
                    position: "absolute",
                    top: -12,
                    right: -12,
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #9fe2fb 0%, #7bd1f7 100%)",
                    boxShadow: "-2px 4px 12px rgba(0,0,0,0.08), inset 0 2px 4px rgba(255,255,255,0.9)",
                    border: "1px solid rgba(255,255,255,0.7)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transform: "translateZ(30px)",
                    zIndex: 10,
                    cursor: "pointer"
                }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="7" y1="17" x2="17" y2="7"></line>
                        <polyline points="7 7 17 7 17 17"></polyline>
                    </svg>
                </div>

                <div style={{ position: "relative", zIndex: 1, transformStyle: "preserve-3d" }}>

                    {/* RED LIVE BADGE */}
                    <div style={{ transform: "translateZ(20px)", marginBottom: 16 }}>
                        <div style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            background: isLive ? "linear-gradient(135deg, #ff5b5b, #e63939)" : "linear-gradient(135deg, #64748b, #475569)",
                            padding: "4px 12px",
                            borderRadius: "16px",
                            boxShadow: isLive ? "0 4px 12px rgba(230, 57, 57, 0.4), inset 0 1px 2px rgba(255,255,255,0.4)" : "inset 0 1px 2px rgba(255,255,255,0.2)"
                        }}>
                            {isLive && (
                                <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff", boxShadow: "0 0 8px #fff" }} />
                            )}
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", letterSpacing: "0.2px" }}>
                                {isLive ? "Live" : "Final"}
                            </span>
                        </div>
                    </div>

                    {/* MAIN CONTENT ROW */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", transform: "translateZ(40px)", marginBottom: 20 }}>

                        {/* Primary Team (Left Side) */}
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontSize: 20, fontWeight: 500, color: "#1e293b", marginBottom: 6, letterSpacing: "-0.5px" }}>
                                {teamA?.length > 15 ? `${teamA.substring(0, 15)}...` : teamA}
                            </span>
                            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                                <span style={{ fontSize: 38, fontWeight: 800, color: "#0f172a", letterSpacing: "-1.5px", lineHeight: 1 }}>
                                    {primaryScore.runs}
                                </span>
                                {primaryScore.overs && (
                                    <span style={{ fontSize: 16, fontWeight: 500, color: "#334155" }}>
                                        {primaryScore.overs}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Secondary Stats (Right Side - Replaces CRR/REQ from image) */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, textAlign: "right", paddingBottom: 2 }}>
                            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 10 }}>
                                <span style={{ fontSize: 14, fontWeight: 800, color: "#1e293b" }}>
                                    {teamB?.substring(0, 3).toUpperCase() || "OPP"}
                                </span>
                                <span style={{ fontSize: 16, fontWeight: 500, color: "#334155" }}>
                                    {secondaryScore.runs}
                                </span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 10 }}>
                                <span style={{ fontSize: 14, fontWeight: 800, color: "#1e293b" }}>
                                    LGE
                                </span>
                                <span style={{ fontSize: 16, fontWeight: 500, color: "#334155" }}>
                                    {league?.substring(0, 6) || "INTL"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* FOOTER TEXT */}
                    <div style={{ transform: "translateZ(20px)" }}>
                        <span style={{ fontSize: 14, fontWeight: 500, color: "#334155", letterSpacing: "-0.2px" }}>
                            {status}
                        </span>
                    </div>

                </div>
            </motion.div>
        </motion.div>
    );
}
