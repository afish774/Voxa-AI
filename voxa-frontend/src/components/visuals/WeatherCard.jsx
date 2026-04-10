import React, { useRef } from "react";
import { motion, useSpring, useTransform, useMotionTemplate, useMotionValue } from "framer-motion";

export default function WeatherCard({ data, theme }) {
    const cardRef = useRef(null);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const smoothX = useSpring(mouseX, { damping: 20, stiffness: 150 });
    const smoothY = useSpring(mouseY, { damping: 20, stiffness: 150 });

    const rotateX = useTransform(smoothY, [-0.5, 0.5], [12, -12]);
    const rotateY = useTransform(smoothX, [-0.5, 0.5], [-12, 12]);
    const shineX = useTransform(smoothX, [-0.5, 0.5], ["100%", "0%"]);
    const shineY = useTransform(smoothY, [-0.5, 0.5], ["100%", "0%"]);
    const shineStyle = useMotionTemplate`radial-gradient(circle at ${shineX} ${shineY}, rgba(255,255,255,0.15) 0%, transparent 60%)`;

    const textX = useTransform(smoothX, [-0.5, 0.5], [4, -4]);
    const textY = useTransform(smoothY, [-0.5, 0.5], [4, -4]);

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
        mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
    };
    const handleMouseLeave = () => { mouseX.set(0); mouseY.set(0); };

    const cond = data?.condition?.toLowerCase() || "";
    const isRainy = cond.includes("rain") || cond.includes("storm") || cond.includes("drizzle") || cond.includes("shower") || cond.includes("thunder");
    const isSunny = cond.includes("sun") || cond.includes("clear") || cond.includes("fair");
    const isCloudy = cond.includes("cloud") || cond.includes("overcast") || cond.includes("fog");
    const isNight = cond.includes("night") || cond.includes("moon") || cond.includes("dark");
    const isSnowy = cond.includes("snow") || cond.includes("winter") || cond.includes("ice") || cond.includes("freez") || cond.includes("cold") || cond.includes("chill");
    const isWindy = cond.includes("wind") || cond.includes("autumn") || cond.includes("fall") || cond.includes("breeze") || cond.includes("gust");

    let emoji = "☀️";
    let overlayGradient = "linear-gradient(135deg, rgba(250,204,21,0.25), rgba(217,119,6,0.05))";

    if (isSunny) overlayGradient = "linear-gradient(135deg, rgba(250,204,21,0.25), rgba(217,119,6,0.05))";
    if (isCloudy) { emoji = "☁️"; overlayGradient = "linear-gradient(135deg, rgba(148,163,184,0.35), rgba(71,85,105,0.1))"; }
    if (isNight) { emoji = "🌙"; overlayGradient = "linear-gradient(135deg, rgba(56,189,248,0.1), rgba(30,58,138,0.25))"; }
    if (isWindy) { emoji = "💨"; overlayGradient = "linear-gradient(135deg, rgba(245,158,11,0.25), rgba(180,83,9,0.15))"; }
    if (isRainy) { emoji = "🌧️"; overlayGradient = "linear-gradient(135deg, rgba(59,130,246,0.35), rgba(29,78,216,0.15))"; }
    if (isSnowy) { emoji = "❄️"; overlayGradient = "linear-gradient(135deg, rgba(186,230,253,0.45), rgba(125,211,252,0.15))"; }

    if (isSunny && !isCloudy && !isRainy && !isSnowy && !isWindy && !isNight) emoji = "☀️";

    return (
        <div style={{ position: "relative", perspective: 1200, marginTop: 24, willChange: "transform" }}>
            <motion.div
                ref={cardRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onTouchMove={(e) => handleMouseMove(e.touches[0])}
                onTouchEnd={handleMouseLeave}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1, rotateX, rotateY }}
                transition={{
                    type: "spring", stiffness: 300, damping: 25, delay: 0.2,
                    rotateX: { type: "spring", stiffness: 150, damping: 20 },
                    rotateY: { type: "spring", stiffness: 150, damping: 20 },
                }}
                style={{
                    width: "min(85vw, 320px)",
                    height: "min(85vw, 320px)",
                    borderRadius: "clamp(24px, 6vw, 36px)",
                    background: theme.dropdownBg,
                    border: `1px solid ${theme.dropdownBorder}`,
                    boxShadow: `0 30px 60px -20px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.15)`,
                    padding: "clamp(20px, 5vw, 28px)", display: "flex", flexDirection: "column", justifyContent: "space-between",
                    color: theme.text, position: "relative", overflow: "hidden",
                    cursor: "grab", userSelect: "none", transformStyle: "preserve-3d",
                    backdropFilter: "blur(30px) saturate(150%)", WebkitBackdropFilter: "blur(30px) saturate(150%)"
                }}
            >
                <div style={{ position: "absolute", inset: 0, background: overlayGradient, pointerEvents: "none", zIndex: 1, borderRadius: 40 }} />
                <motion.div style={{ position: "absolute", inset: -50, background: shineStyle, pointerEvents: "none", zIndex: 10 }} />

                {isRainy && (
                    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 2, opacity: 0.5 }}>
                        {[...Array(12)].map((_, i) => (
                            <motion.div key={i} initial={{ y: -20, x: Math.random() * 280, opacity: 0 }} animate={{ y: 300, opacity: [0, 1, 0] }} transition={{ duration: 0.8 + Math.random() * 0.5, repeat: Infinity, ease: "linear", delay: Math.random() * 2 }} style={{ position: "absolute", width: 2, height: 16, background: theme.text, borderRadius: 2 }} />
                        ))}
                    </div>
                )}
                {isSnowy && (
                    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 2, opacity: 0.7 }}>
                        {[...Array(15)].map((_, i) => (
                            <motion.div key={i} initial={{ y: -20, x: Math.random() * 280, opacity: 0, scale: Math.random() * 0.5 + 0.5 }} animate={{ y: 300, x: "+=20", opacity: [0, 1, 0] }} transition={{ duration: 1.5 + Math.random(), repeat: Infinity, ease: "linear", delay: Math.random() * 2 }} style={{ position: "absolute", width: 6, height: 6, background: theme.text, borderRadius: "50%", boxShadow: `0 0 4px ${theme.text}` }} />
                        ))}
                    </div>
                )}
                {isWindy && !isSnowy && !isRainy && (
                    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 2, opacity: 0.6 }}>
                        {[...Array(8)].map((_, i) => (
                            <motion.div key={i} initial={{ y: -20 + Math.random() * 50, x: -20, opacity: 0, rotate: 0 }} animate={{ y: 150 + Math.random() * 150, x: 280, opacity: [0, 1, 0], rotate: 360 }} transition={{ duration: 2 + Math.random(), repeat: Infinity, ease: "linear", delay: Math.random() * 2 }} style={{ position: "absolute", width: 8, height: 8, background: i % 2 === 0 ? "#f59e0b" : "#d97706", borderRadius: "2px 8px 2px 8px" }} />
                        ))}
                    </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", zIndex: 5, transform: "translateZ(20px)" }}>
                    <div>
                        <h4 style={{ margin: 0, fontSize: "clamp(16px, 4vw, 18px)", fontWeight: 700, opacity: 0.9, letterSpacing: "0.02em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "min(45vw, 180px)" }}>{data?.location}</h4>
                        <p style={{ margin: 0, fontSize: "clamp(13px, 3.5vw, 14px)", color: theme.textMuted, marginTop: 4 }}>Live Weather</p>
                    </div>

                    <motion.span
                        animate={isSunny ? { rotate: 360 } : isWindy ? { x: [-5, 5, -5] } : {}}
                        transition={isSunny ? { duration: 10, repeat: Infinity, ease: "linear" } : isWindy ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : {}}
                        whileTap={isNight ? { scale: 1.1, filter: "drop-shadow(0px 0px 24px rgba(255,255,255,0.9))" } : { scale: 0.9 }}
                        style={{ fontSize: "clamp(36px, 10vw, 44px)", display: "inline-block", filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.3))", cursor: isNight ? "pointer" : "default" }}
                    >
                        {emoji}
                    </motion.span>
                </div>

                <motion.div style={{ zIndex: 5, x: textX, y: textY, transformStyle: "preserve-3d" }}>
                    <h1 style={{ margin: 0, fontSize: "clamp(64px, 16vw, 90px)", fontWeight: 200, letterSpacing: "-0.04em", lineHeight: 1, transform: "translateZ(30px)" }}>{data?.temp}°</h1>
                    <p style={{ margin: 0, fontSize: "clamp(18px, 4.5vw, 22px)", fontWeight: 600, color: theme.textMuted, marginTop: 4, transform: "translateZ(15px)" }}>{data?.condition}</p>
                </motion.div>
            </motion.div>
        </div>
    );
}