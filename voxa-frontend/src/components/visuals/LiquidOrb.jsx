import React from "react";
import { motion, useTime, useTransform, useMotionTemplate } from "framer-motion";
import { PHASE_CONFIG, PHASES } from "../../config/constants";

export default function LiquidOrb({ onTap, onCameraMode, phase, theme, isCameraMode, isAppMuted }) {
    const cfg = PHASE_CONFIG[phase];
    const isActive = phase !== PHASES.IDLE;
    const time = useTime();

    const g1x = useTransform(time, t => 40 + Math.sin(t / 900) * 26);
    const g1y = useTransform(time, t => 38 + Math.cos(t / 1200) * 20);
    const g2x = useTransform(time, t => 62 + Math.cos(t / 850) * 20);
    const g2y = useTransform(time, t => 55 + Math.sin(t / 950) * 18);

    const c0 = cfg.colors[0];
    const c1 = cfg.colors[1];
    const c2 = cfg.colors[2];

    const liquidGradient = useMotionTemplate`radial-gradient(circle at ${g1x}% ${g1y}%, ${c0}cc 0%, transparent 58%), radial-gradient(circle at ${g2x}% ${g2y}%, ${c1}aa 0%, transparent 52%), radial-gradient(circle at 50% 50%, ${c2}66 0%, transparent 68%)`;
    const glowShadow = isActive ? `0 0 0 1px rgba(255,255,255,0.12), 0 0 36px 14px ${c0}44, 0 0 72px 28px ${c1}28` : `0 0 0 1px ${theme.navBorder}, 0 8px 28px rgba(0,0,0,0.22)`;

    return (
        <motion.button
            onClick={onTap}
            onPanEnd={(e, info) => {
                if (info.offset.y < -50 && !isCameraMode && !isAppMuted) {
                    onCameraMode();
                    onTap();
                }
            }}
            whileTap={{ scale: 0.94 }} whileHover={{ scale: 1.05 }}
            style={{
                position: "relative", width: "clamp(56px,6.5vw,68px)", height: "clamp(56px,6.5vw,68px)", borderRadius: "50%",
                border: isActive || isCameraMode ? "1.5px solid rgba(255,255,255,0.22)" : `1px solid ${theme.navBorder}`,
                background: isActive ? "transparent" : theme.navBg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: isCameraMode ? "0 0 30px rgba(255,255,255,0.2)" : glowShadow, overflow: "hidden", outline: "none", touchAction: "none", flexShrink: 0,
            }}
        >
            {(isActive || isCameraMode) && <motion.div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: isCameraMode ? "rgba(255,255,255,0.8)" : liquidGradient }} />}
            {isActive && !isCameraMode && <div style={{ position: "absolute", top: "11%", left: "17%", width: "40%", height: "28%", borderRadius: "50%", background: "rgba(255,255,255,0.18)", filter: "blur(5px)", pointerEvents: "none" }} />}

            {!isCameraMode ? (
                <svg style={{ position: "relative", zIndex: 2 }} width="clamp(20px,2.4vw,24px)" height="clamp(20px,2.4vw,24px)" viewBox="0 0 24 24" fill="none" stroke={isActive ? "#ffffff" : theme.text} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
            ) : (
                <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} style={{ width: 14, height: 14, borderRadius: "50%", background: "#fff", position: "relative", zIndex: 2 }} />
            )}
        </motion.button>
    );
}