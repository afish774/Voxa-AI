import { useState, useEffect, useRef, useCallback } from "react";
import {
    motion,
    AnimatePresence,
    useSpring,
    useTime,
    useTransform,
    useMotionTemplate,
    useMotionValue
} from "framer-motion";

// ─────────────────────────────────────────────
// CONSTANTS & CONFIG
// ─────────────────────────────────────────────

const PHASES = {
    IDLE: "idle",
    LISTENING: "listening",
    PROCESSING: "processing",
    RESPONDING: "responding",
};

const SAMPLE_QUERIES = [
    "Build a chatbot using Gemini API",
    "How to integrate Arduino with React?",
    "What is the weather in Chavakkad?",
    "Summarize today's top financial news.",
];

const PHASE_CONFIG = {
    [PHASES.IDLE]: { colors: ["#7c3aed", "#9333ea", "#c026d3", "#db2777"], label: "", speed: 0.8, amplitude: 0.13 },
    [PHASES.LISTENING]: { colors: ["#f59e0b", "#f97316", "#84cc16", "#22c55e"], label: "Listening", speed: 4.5, amplitude: 0.26 },
    [PHASES.PROCESSING]: { colors: ["#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6"], label: "Thinking", speed: 2.5, amplitude: 0.19 },
    [PHASES.RESPONDING]: { colors: ["#7c3aed", "#a855f7", "#ec4899", "#f43f5e"], label: "Speaking", speed: 3.5, amplitude: 0.16 },
};

const THEMES = {
    dark: {
        bg: "#05050a", bgSecondary: "rgba(255,255,255,0.08)", navBg: "rgba(18,18,24,0.75)", navBorder: "rgba(255,255,255,0.12)",
        text: "#ffffff", textMuted: "rgba(255,255,255,0.55)", textFaint: "rgba(255,255,255,0.3)",
        inputBg: "rgba(255,255,255,0.04)", inputBorder: "rgba(255,255,255,0.15)", dropdownBg: "rgba(18,18,24,0.96)",
        dropdownBorder: "rgba(255,255,255,0.15)", dropdownHover: "rgba(255,255,255,0.08)", buttonBg: "rgba(255,255,255,0.05)",
        buttonBorder: "rgba(255,255,255,0.12)", radialGlow: "rgba(80,20,120,0.18)", danger: "#f43f5e",
    },
    light: {
        bg: "#f4f4f6", bgSecondary: "rgba(0,0,0,0.04)", navBg: "rgba(248,248,252,0.85)", navBorder: "rgba(0,0,0,0.08)",
        text: "#111111", textMuted: "rgba(17,17,17,0.65)", textFaint: "rgba(17,17,17,0.35)",
        inputBg: "rgba(0,0,0,0.03)", inputBorder: "rgba(0,0,0,0.15)", dropdownBg: "rgba(250,250,252,0.98)",
        dropdownBorder: "rgba(0,0,0,0.12)", dropdownHover: "rgba(0,0,0,0.06)", buttonBg: "rgba(0,0,0,0.03)",
        buttonBorder: "rgba(0,0,0,0.08)", radialGlow: "rgba(130,70,190,0.08)", danger: "#e11d48",
    },
};

// ─────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────
function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }
function hexToRgb(hex) { return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]; }
function rgbToHex(r, g, b) { return "#" + [r, g, b].map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join(""); }
function lerpColor(hexA, hexB, t) {
    const [r1, g1, b1] = hexToRgb(hexA); const [r2, g2, b2] = hexToRgb(hexB);
    return rgbToHex(lerp(r1, r2, t), lerp(g1, g2, t), lerp(b1, b2, t));
}

// ─────────────────────────────────────────────
// CUSTOM ICONS & LOGO
// ─────────────────────────────────────────────
const IconUser = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const IconMail = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>;
const IconSparkles = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z"></path></svg>;
const IconClock = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;

const VoxaLogo = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="10" width="2.5" height="6" rx="1.25" fill="url(#voxa_grad)" />
        <rect x="6.5" y="6" width="2.5" height="14" rx="1.25" fill="url(#voxa_grad)" />
        <rect x="11" y="2" width="2.5" height="20" rx="1.25" fill="url(#voxa_grad)" />
        <rect x="15.5" y="9" width="2.5" height="11" rx="1.25" fill="url(#voxa_grad)" />
        <rect x="20" y="11" width="2.5" height="7" rx="1.25" fill="url(#voxa_grad)" />
        <path d="M19.5 0C19.5 2.5 20.5 4 23 4.5C20.5 5 19.5 6.5 19.5 9C19.5 6.5 18.5 5 16 4.5C18.5 4 19.5 2.5 19.5 0Z" fill="url(#voxa_grad)" />
        <defs>
            <linearGradient id="voxa_grad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                <stop stopColor="#7c3aed" />
                <stop offset="1" stopColor="#db2777" />
            </linearGradient>
        </defs>
    </svg>
);

// ─────────────────────────────────────────────
// 3D ANIMATED WEATHER WIDGET
// ─────────────────────────────────────────────

function WeatherCard({ data, theme }) {
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

    const isRainy = data.condition.toLowerCase().includes("rain") || data.condition.toLowerCase().includes("storm");
    const isSunny = data.condition.toLowerCase().includes("sun") || data.condition.toLowerCase().includes("clear");
    const isCloudy = data.condition.toLowerCase().includes("cloud");
    const isNight = data.condition.toLowerCase().includes("night") || data.condition.toLowerCase().includes("moon");

    let emoji = "☀️";
    if (isCloudy) emoji = "☁️";
    if (isRainy) emoji = "🌧️";
    if (isNight) emoji = "🌙";

    return (
        <div style={{ perspective: 1200, marginTop: 24, willChange: "transform" }}>
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
                    width: "clamp(240px, 18vw, 280px)", height: "clamp(240px, 18vw, 280px)",
                    borderRadius: 40, background: theme.dropdownBg, border: `1px solid ${theme.dropdownBorder}`,
                    boxShadow: `0 40px 80px -20px rgba(0,0,0,0.4), inset 0 2px 0 rgba(255,255,255,0.1)`,
                    padding: "clamp(20px, 2vw, 28px)", display: "flex", flexDirection: "column", justifyContent: "space-between",
                    color: theme.text, position: "relative", overflow: "hidden",
                    cursor: "grab", userSelect: "none", transformStyle: "preserve-3d"
                }}
            >
                <motion.div style={{ position: "absolute", inset: -50, background: shineStyle, pointerEvents: "none", zIndex: 10 }} />

                {isRainy && (
                    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0, opacity: 0.4 }}>
                        {[...Array(12)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ y: -20, x: Math.random() * 280, opacity: 0 }}
                                animate={{ y: 300, opacity: [0, 1, 0] }}
                                transition={{ duration: 0.8 + Math.random() * 0.5, repeat: Infinity, ease: "linear", delay: Math.random() * 2 }}
                                style={{ position: "absolute", width: 2, height: 16, background: theme.text, borderRadius: 2 }}
                            />
                        ))}
                    </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", zIndex: 2, transform: "translateZ(20px)" }}>
                    <div>
                        <h4 style={{ margin: 0, fontSize: "clamp(14px, 1vw, 16px)", fontWeight: 700, opacity: 0.9, letterSpacing: "0.02em" }}>{data.location}</h4>
                        <p style={{ margin: 0, fontSize: "clamp(11px, 0.8vw, 13px)", color: theme.textMuted, marginTop: 4 }}>Live Weather</p>
                    </div>

                    <motion.span
                        animate={isSunny ? { rotate: 360 } : {}}
                        transition={isSunny ? { duration: 10, repeat: Infinity, ease: "linear" } : {}}
                        whileTap={isNight ? { scale: 1.1, filter: "drop-shadow(0px 0px 24px rgba(255,255,255,0.9))" } : { scale: 0.9 }}
                        style={{ fontSize: "clamp(32px, 2.5vw, 40px)", display: "inline-block", filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.2))", cursor: isNight ? "pointer" : "default" }}
                    >
                        {emoji}
                    </motion.span>
                </div>

                <motion.div style={{ zIndex: 2, x: textX, y: textY, transformStyle: "preserve-3d" }}>
                    <h1 style={{ margin: 0, fontSize: "clamp(60px, 5vw, 80px)", fontWeight: 200, letterSpacing: "-0.04em", lineHeight: 1, transform: "translateZ(30px)" }}>{data.temp}°</h1>
                    <p style={{ margin: 0, fontSize: "clamp(18px, 1.4vw, 22px)", fontWeight: 600, color: theme.textMuted, marginTop: 4, transform: "translateZ(15px)" }}>{data.condition}</p>
                </motion.div>
            </motion.div>
        </div>
    );
}

// ─────────────────────────────────────────────
// WAVE CANVAS
// ─────────────────────────────────────────────
function WaveCanvas({ phase, ribbonSplit, isAppMuted }) {
    const canvasRef = useRef(null);
    const stateRef = useRef({
        tick: 0, sidebarProgress: 0, targetSidebar: 0,
        currentColors: [...PHASE_CONFIG[PHASES.IDLE].colors], currentSpeed: PHASE_CONFIG[PHASES.IDLE].speed, currentAmplitude: PHASE_CONFIG[PHASES.IDLE].amplitude,
        targetColors: [...PHASE_CONFIG[PHASES.IDLE].colors], targetSpeed: PHASE_CONFIG[PHASES.IDLE].speed, targetAmplitude: PHASE_CONFIG[PHASES.IDLE].amplitude,
    });
    const rafRef = useRef(null);

    useEffect(() => {
        const cfg = PHASE_CONFIG[phase];
        stateRef.current.targetColors = [...cfg.colors]; stateRef.current.targetSpeed = cfg.speed; stateRef.current.targetAmplitude = cfg.amplitude;
    }, [phase]);

    useEffect(() => { stateRef.current.targetSidebar = ribbonSplit ? 1 : 0; }, [ribbonSplit]);

    useEffect(() => {
        const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext("2d");
        const resize = () => {
            const dpr = window.devicePixelRatio || 1; canvas.width = canvas.offsetWidth * dpr; canvas.height = canvas.offsetHeight * dpr; ctx.scale(dpr, dpr);
        };
        resize(); const ro = new ResizeObserver(resize); ro.observe(canvas);

        const draw = () => {
            const s = stateRef.current; const w = canvas.offsetWidth; const h = canvas.offsetHeight;
            for (let i = 0; i < 4; i++) s.currentColors[i] = lerpColor(s.currentColors[i], s.targetColors[i], 0.025);
            s.currentSpeed = lerp(s.currentSpeed, s.targetSpeed, 0.02); s.currentAmplitude = lerp(s.currentAmplitude, s.targetAmplitude, 0.02);
            s.sidebarProgress = lerp(s.sidebarProgress, s.targetSidebar, 0.035);
            ctx.clearRect(0, 0, w, h);
            const time = s.tick * 0.005 * s.currentSpeed; const sp = s.sidebarProgress;
            const hBaseY = h * 0.52; const vBaseX = clamp(w * 0.08, 40, 100);
            const length = Math.max(w, h); const steps = length / 3;

            const ribbons = [
                { yOff: h * 0.06, f: 1.0, ph: 0.0, aS: 1.0, thickness: h * 0.038, ci: [0, 1], alpha: 0.55 },
                { yOff: h * 0.01, f: 1.35, ph: 1.2, aS: 0.85, thickness: h * 0.028, ci: [1, 2], alpha: 0.45 },
                { yOff: -h * 0.05, f: 0.72, ph: 2.5, aS: 0.7, thickness: h * 0.022, ci: [2, 3], alpha: 0.38 },
                { yOff: h * 0.10, f: 1.75, ph: 3.8, aS: 0.55, thickness: h * 0.016, ci: [3, 0], alpha: 0.28 },
            ];

            ctx.globalCompositeOperation = "screen";
            ribbons.forEach((ribbon) => {
                const points = []; const amp = h * s.currentAmplitude;
                for (let i = -10; i <= steps + 10; i++) {
                    const n = i / steps;
                    const osc = Math.sin(n * Math.PI * 2.2 * ribbon.f + time + ribbon.ph) * amp * ribbon.aS * 0.55 + Math.sin(n * Math.PI * 3.7 * ribbon.f + time * 0.67 + ribbon.ph * 1.3) * amp * ribbon.aS * 0.28 + Math.sin(n * Math.PI * 6.1 + time * 0.42 + ribbon.ph * 0.8) * amp * ribbon.aS * 0.12;
                    const hX = w * n; const hY = hBaseY + ribbon.yOff + osc;
                    const vX = vBaseX + (ribbon.yOff * 0.4) + (osc * 0.7); const vY = h * n;
                    points.push([lerp(hX, vX, sp), lerp(hY, vY, sp)]);
                }
                const half = ribbon.thickness / 2; const offX = lerp(0, half, sp); const offY = lerp(half, 0, sp);
                const grad = ctx.createLinearGradient(0, 0, lerp(w, 0, sp), lerp(0, h, sp));
                const c0 = s.currentColors[ribbon.ci[0]]; const c1 = s.currentColors[ribbon.ci[1]];
                grad.addColorStop(0, c0 + "00"); grad.addColorStop(0.12, c0 + "bb"); grad.addColorStop(0.45, c1 + "ff"); grad.addColorStop(0.72, c0 + "cc"); grad.addColorStop(0.88, c1 + "88"); grad.addColorStop(1, c0 + "00");

                ctx.beginPath();
                points.forEach(([px, py], idx) => idx === 0 ? ctx.moveTo(px - offX, py - offY) : ctx.lineTo(px - offX, py - offY));
                for (let idx = points.length - 1; idx >= 0; idx--) ctx.lineTo(points[idx][0] + offX, points[idx][1] + offY);
                ctx.closePath();
                ctx.fillStyle = grad;
                ctx.globalAlpha = ribbon.alpha * (isAppMuted ? 0.15 : 1);
                ctx.fill();

                const sg = ctx.createLinearGradient(0, 0, lerp(w, 0, sp), lerp(0, h, sp));
                sg.addColorStop(0, "transparent"); sg.addColorStop(0.15, c0 + "dd"); sg.addColorStop(0.5, "#ffffff"); sg.addColorStop(0.85, c1 + "dd"); sg.addColorStop(1, "transparent");
                ctx.beginPath(); points.forEach(([px, py], idx) => idx === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py));
                ctx.strokeStyle = sg; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.72 * (isAppMuted ? 0.15 : 1); ctx.stroke();
            });

            const orbX = lerp(w * 0.5, vBaseX, sp); const orbY = lerp(hBaseY + h * 0.04, h * 0.5, sp);
            const og = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, w * 0.45);
            og.addColorStop(0, s.currentColors[0] + "55"); og.addColorStop(0.4, s.currentColors[1] + "22"); og.addColorStop(1, "transparent");

            ctx.globalCompositeOperation = "screen"; ctx.globalAlpha = 0.6 * (isAppMuted ? 0.15 : 1);
            ctx.fillStyle = og; ctx.fillRect(0, 0, w, h);
            ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
            s.tick += 1; rafRef.current = requestAnimationFrame(draw);
        };

        draw(); return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };
    }, [isAppMuted]);

    return <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "block", pointerEvents: "none", zIndex: 1, transition: "opacity 0.8s" }} />;
}

// ─────────────────────────────────────────────
// SPATIAL CAMERA WINDOW
// ─────────────────────────────────────────────

function SpatialCameraWindow({ isActive, onClose, videoRef }) {
    useEffect(() => {
        let stream;
        if (isActive) {
            navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
                .then((s) => {
                    stream = s;
                    if (videoRef.current) {
                        videoRef.current.srcObject = s;
                    }
                })
                .catch((err) => {
                    console.error("Failed to access webcam:", err);
                    alert("Camera access denied or unavailable.");
                });
        }

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [isActive, videoRef]);

    return (
        <AnimatePresence>
            {isActive && (
                <motion.div
                    style={{
                        position: "fixed", inset: 0, zIndex: 200, display: "flex",
                        alignItems: "center", justifyContent: "flex-end",
                        paddingRight: "clamp(20px, 5vw, 60px)", pointerEvents: "none"
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, x: 100, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 50, scale: 0.95, transition: { duration: 0.2 } }}
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                        style={{
                            pointerEvents: "auto",
                            width: "clamp(280px, 25vw, 380px)",
                            height: "clamp(400px, 60vh, 580px)",
                            borderRadius: 36,
                            border: "1.5px solid rgba(255,255,255,0.2)",
                            boxShadow: "0 40px 100px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(255,255,255,0.1)",
                            position: "relative", overflow: "hidden", display: "flex",
                            flexDirection: "column", justifyContent: "space-between", padding: 20,
                            background: "#000"
                        }}
                    >
                        <video
                            id="voxa-camera-feed"
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            style={{
                                position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0
                            }}
                        />

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10 }}>
                            <div style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(16px)", padding: "8px 16px", borderRadius: 999, color: "#fff", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", display: "flex", alignItems: "center", border: "1px solid rgba(255,255,255,0.1)" }}>
                                <span style={{ display: "inline-block", width: 8, height: 8, background: "#22c55e", borderRadius: "50%", marginRight: 8, animation: "dotBeat 1.5s infinite" }} />
                                VISION
                            </div>
                            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.2)", width: 40, height: 40, borderRadius: "50%", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", outline: "none", transition: "background 0.2s" }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>

                        <motion.div animate={{ y: ["-10%", "600%", "-10%"] }} transition={{ duration: 4, ease: "linear", repeat: Infinity }} style={{ position: "absolute", top: "10%", left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)", boxShadow: "0 0 20px 2px rgba(255,255,255,0.6)" }} />

                        <div style={{ display: "flex", justifyContent: "center", zIndex: 10, paddingBottom: 10 }}>
                            <p style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: 400, letterSpacing: "0.02em", background: "rgba(0,0,0,0.5)", padding: "12px 24px", borderRadius: 999, backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)", textAlign: "center" }}>
                                Point & Ask
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ─────────────────────────────────────────────
// QUERY SLIDER & TYPING TEXT
// ─────────────────────────────────────────────

function QuerySlider({ theme }) {
    const [idx, setIdx] = useState(0);
    useEffect(() => { const t = setInterval(() => setIdx(i => (i + 1) % SAMPLE_QUERIES.length), 3600); return () => clearInterval(t); }, []);
    return (
        <div style={{ position: "relative", height: "clamp(28px,3.6vw,44px)", overflow: "hidden", width: "100%", marginTop: "0.8em" }}>
            <AnimatePresence mode="wait">
                <motion.p key={idx} initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -26 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} style={{ position: "absolute", width: "100%", textAlign: "inherit", fontSize: "clamp(12px,1.7vw,18px)", color: theme.textMuted, fontWeight: 400, letterSpacing: "-0.01em", lineHeight: 1.4 }}>
                    "{SAMPLE_QUERIES[idx]}"
                </motion.p>
            </AnimatePresence>
        </div>
    );
}

function TypingText({ text, speed = 38, onDone }) {
    const [shown, setShown] = useState(""); const [idx, setIdx] = useState(0); const timeoutsRef = useRef([]);
    useEffect(() => { setShown(""); setIdx(0); }, [text]);
    useEffect(() => {
        if (idx >= text.length) { onDone?.(); return; }
        const ms = text[idx] === " " ? speed * 1.3 : speed;
        const t = setTimeout(() => { setShown(p => p + text[idx]); setIdx(p => p + 1); }, ms);
        timeoutsRef.current.push(t); return () => clearTimeout(t);
    }, [idx, text, speed, onDone]);
    useEffect(() => { return () => timeoutsRef.current.forEach(clearTimeout); }, [])
    return (
        <>{shown}{idx < text.length && <span style={{ display: "inline-block", width: 2, height: "0.85em", background: "rgba(255,255,255,0.75)", marginLeft: 3, verticalAlign: "middle", animation: "blinkCursor 0.85s step-end infinite" }} />}</>
    );
}

// ─────────────────────────────────────────────
// LIQUID ORB 
// ─────────────────────────────────────────────

function LiquidOrb({ onTap, onCameraMode, phase, theme, isCameraMode, isAppMuted }) {
    const cfg = PHASE_CONFIG[phase]; const isActive = phase !== PHASES.IDLE; const time = useTime();
    const g1x = useTransform(time, t => 40 + Math.sin(t / 900) * 26); const g1y = useTransform(time, t => 38 + Math.cos(t / 1200) * 20);
    const g2x = useTransform(time, t => 62 + Math.cos(t / 850) * 20); const g2y = useTransform(time, t => 55 + Math.sin(t / 950) * 18);
    const c0 = cfg.colors[0]; const c1 = cfg.colors[1]; const c2 = cfg.colors[2];
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

// ─────────────────────────────────────────────
// FUNCTIONAL OFF-CANVAS PANELS
// ─────────────────────────────────────────────

function InputField({ theme, icon, placeholder, type = "text", defaultValue, onChange, disabled }) {
    const [isFocused, setIsFocused] = useState(false);
    return (
        <div style={{ position: "relative", marginBottom: 16 }}>
            <div style={{ position: "absolute", left: 16, top: 14, color: isFocused ? "#7c3aed" : theme.textFaint, transition: "color 0.2s" }}>{icon}</div>
            <input type={type} placeholder={placeholder} defaultValue={defaultValue} onChange={onChange} disabled={disabled} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} style={{ width: "100%", padding: "14px 18px 14px 44px", borderRadius: 14, border: `1px solid ${isFocused ? "#7c3aed" : theme.inputBorder}`, background: theme.inputBg, color: disabled ? theme.textMuted : theme.text, fontSize: 14, outline: "none", fontFamily: "inherit", transition: "all 0.2s cubic-bezier(0.16,1,0.3,1)", boxShadow: isFocused ? "0 0 0 3px rgba(124,58,237,0.15)" : "none", cursor: disabled ? "not-allowed" : "text" }} />
        </div>
    );
}

// 🚀 ADDED 'user' PROP TO PROFILE
function ProfileScreen({ theme, user, userName, setUserName }) {
    const [tempName, setTempName] = useState(userName);
    const handleSave = () => {
        setUserName(tempName);
        localStorage.setItem('voxa_username', tempName);
        alert("Profile Saved!");
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 12 }}>
                <div style={{ position: "relative" }}>
                    <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#db2777)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, color: "#fff", fontWeight: 600, boxShadow: "0 8px 24px rgba(124,58,237,0.3)" }}>{userName.charAt(0).toUpperCase()}</div>
                </div>
                <div>
                    <h3 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: theme.text, letterSpacing: "-0.02em" }}>{userName}</h3>
                    <p style={{ margin: "4px 0 0 0", fontSize: 14, color: theme.textMuted }}>Front End Developer</p>
                </div>
            </div>
            <div style={{ marginTop: 8 }}>
                <label style={{ display: "block", fontSize: 12, color: theme.textMuted, marginBottom: 8, marginLeft: 4, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>Display Name</label>
                <InputField theme={theme} icon={<IconUser />} defaultValue={userName} onChange={(e) => setTempName(e.target.value)} />
                <label style={{ display: "block", fontSize: 12, color: theme.textMuted, marginBottom: 8, marginLeft: 4, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>Email</label>
                {/* 🚀 EXTRACT EMAIL FROM USER TOKEN */}
                <InputField theme={theme} icon={<IconMail />} defaultValue={user?.email || "guest@voxa.ai"} disabled={true} />
            </div>
            <motion.button onClick={handleSave} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ width: "100%", padding: "16px", borderRadius: 14, border: `1px solid ${theme.buttonBorder}`, background: theme.buttonBg, color: theme.text, fontSize: 15, fontWeight: 600, cursor: "pointer", transition: "background 0.2s" }}>Save Changes</motion.button>
        </div>
    );
}

// 🚀 ADDED 'user' PROP FOR AUTHORIZATION
function HistoryScreen({ theme, user, onClose }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                // 🚀 ADDED AUTHORIZATION HEADER
                const response = await fetch('http://localhost:5000/api/chat/history', {
                    headers: { "Authorization": `Bearer ${user?.token}` }
                });
                const data = await response.json();

                const formatted = data.map(msg => {
                    const date = new Date(msg.timestamp);
                    const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const dateString = date.toLocaleDateString();

                    return {
                        role: msg.role === 'ai' ? 'ai' : 'user',
                        q: msg.text,
                        time: `${dateString} • ${timeString}`
                    };
                });

                setHistory(formatted);
            } catch (err) {
                console.error("Failed to fetch history:", err);
                setHistory([{ role: 'ai', q: "Failed to connect to the database.", time: "System Error" }]);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [user]); // 🚀 Add user to dependency array

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {loading ? (
                <p style={{ color: theme.textMuted, textAlign: "center", marginTop: 20 }}>Loading logs from MongoDB...</p>
            ) : history.length === 0 ? (
                <p style={{ color: theme.textMuted, textAlign: "center", marginTop: 20 }}>No chat history found.</p>
            ) : (
                history.map((item, i) => (
                    <motion.div key={i} whileHover={{ scale: 1.02, backgroundColor: theme.dropdownHover }} style={{ padding: 18, borderRadius: 16, border: `1px solid ${theme.buttonBorder}`, background: item.role === 'user' ? theme.buttonBg : 'transparent', cursor: "pointer", transition: "border-color 0.2s" }}>
                        <p style={{ margin: "0 0 8px 0", fontSize: 15, color: item.role === 'user' ? theme.text : theme.textMuted, lineHeight: 1.4, fontWeight: item.role === 'user' ? 500 : 400 }}>"{item.q}"</p>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, color: theme.textFaint }}>
                            <IconClock />
                            <span style={{ fontSize: 12 }}>{item.role === 'user' ? 'You' : 'Voxa'} • {item.time}</span>
                        </div>
                    </motion.div>
                ))
            )}
        </div>
    );
}

function PersonalizationScreen({ theme, selectedVoice, setSelectedVoice }) {
    const handleVoiceChange = (v) => {
        setSelectedVoice(v);
        localStorage.setItem('voxa_voice_preference', v);
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
                <p style={{ fontSize: 12, color: theme.textMuted, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>AI Voice Model</p>
                <div style={{ display: "flex", gap: 16 }}>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleVoiceChange("female")} style={{ flex: 1, padding: "24px 16px", borderRadius: 20, border: `2px solid ${selectedVoice === "female" ? "#7c3aed" : theme.buttonBorder}`, background: selectedVoice === "female" ? "rgba(124,58,237,0.1)" : theme.buttonBg, cursor: "pointer", textAlign: "center", transition: "all 0.2s" }}>
                        <span style={{ fontSize: 32, display: "block", marginBottom: 12 }}>👩🏻‍🦰</span>
                        <span style={{ fontSize: 15, color: theme.text, fontWeight: 600, display: "block" }}>Nova</span>
                        <span style={{ fontSize: 12, color: theme.textMuted, marginTop: 4, display: "block" }}>Warm & Natural</span>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleVoiceChange("male")} style={{ flex: 1, padding: "24px 16px", borderRadius: 20, border: `2px solid ${selectedVoice === "male" ? "#7c3aed" : theme.buttonBorder}`, background: selectedVoice === "male" ? "rgba(124,58,237,0.1)" : theme.buttonBg, cursor: "pointer", textAlign: "center", transition: "all 0.2s" }}>
                        <span style={{ fontSize: 32, display: "block", marginBottom: 12 }}>👨🏽‍🦱</span>
                        <span style={{ fontSize: 15, color: theme.text, fontWeight: 600, display: "block" }}>Orion</span>
                        <span style={{ fontSize: 12, color: theme.textMuted, marginTop: 4, display: "block" }}>Deep & Clear</span>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

function FeedbackScreen({ theme }) {
    const [rating, setRating] = useState(0);
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <p style={{ fontSize: 15, color: theme.textMuted, lineHeight: 1.5 }}>How is your experience with Voxa so far?</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", margin: "10px 0" }}>
                {[1, 2, 3, 4, 5].map(star => (
                    <motion.span whileHover={{ scale: 1.2 }} key={star} onClick={() => setRating(star)} style={{ fontSize: 36, cursor: "pointer", color: star <= rating ? "#f59e0b" : theme.buttonBorder, transition: "color 0.2s" }}>★</motion.span>
                ))}
            </div>
            <div style={{ position: "relative" }}>
                <textarea placeholder="Tell us what you love or what could be better..." style={{ width: "100%", height: 120, padding: "16px 18px", borderRadius: 14, border: `1px solid ${theme.inputBorder}`, background: theme.inputBg, color: theme.text, fontSize: 14, outline: "none", resize: "none", fontFamily: "inherit", transition: "border-color 0.2s" }} onFocus={e => e.target.style.borderColor = "#7c3aed"} onBlur={e => e.target.style.borderColor = theme.inputBorder} />
            </div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ width: "100%", padding: "16px", borderRadius: 14, border: "none", background: "linear-gradient(135deg, #7c3aed, #db2777)", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", boxShadow: "0 10px 20px -10px rgba(124,58,237,0.5)" }}>Submit Feedback</motion.button>
        </div>
    );
}

function SupportScreen({ theme }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <p style={{ fontSize: 15, color: theme.textMuted, lineHeight: 1.5 }}>Raise a support ticket. Our engineering team will get back to you shortly.</p>
            <div style={{ position: "relative" }}>
                <select style={{ width: "100%", padding: "16px 18px", borderRadius: 14, border: `1px solid ${theme.inputBorder}`, background: theme.inputBg, color: theme.text, fontSize: 14, outline: "none", fontFamily: "inherit", WebkitAppearance: "none", cursor: "pointer" }}>
                    <option>General Inquiry</option>
                    <option>Bug Report</option>
                    <option>Feature Request</option>
                </select>
                <div style={{ position: "absolute", right: 18, top: 18, pointerEvents: "none", color: theme.textFaint }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
            </div>
            <textarea placeholder="Please describe the issue in detail..." style={{ width: "100%", height: 140, padding: "16px 18px", borderRadius: 14, border: `1px solid ${theme.inputBorder}`, background: theme.inputBg, color: theme.text, fontSize: 14, outline: "none", resize: "none", fontFamily: "inherit" }} onFocus={e => e.target.style.borderColor = "#7c3aed"} onBlur={e => e.target.style.borderColor = theme.inputBorder} />
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ width: "100%", padding: "16px", borderRadius: 14, border: "none", background: "linear-gradient(135deg, #7c3aed, #db2777)", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", boxShadow: "0 10px 20px -10px rgba(124,58,237,0.5)" }}>Submit Ticket</motion.button>
        </div>
    );
}

// ─────────────────────────────────────────────
// NAVBAR: SLIDING PILL
// ─────────────────────────────────────────────

function NavPill({ theme }) {
    return (
        <motion.div
            layoutId="nav-pill"
            style={{
                position: "absolute", inset: 0, borderRadius: 999,
                background: theme.bgSecondary, zIndex: 1, pointerEvents: "none"
            }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
    );
}

// 🚀 ADDED 'onLogout' PROP
function SettingsDropdown({ theme, isDark, onToggleTheme, onClose, onOpenModal, onLogout }) {
    const items = [
        { label: isDark ? "Light Mode" : "Dark Mode", action: onToggleTheme },
        { label: "Profile Setup", action: () => onOpenModal("profile") },
        { label: "Chat History", action: () => onOpenModal("history") },
        { label: "Voice Personalization", action: () => onOpenModal("personalization") },
        { label: "Submit Feedback", action: () => onOpenModal("feedback") },
        { label: "Contact Support", action: () => onOpenModal("support") },
        // 🚀 TRIGGER REAL LOGOUT FUNCTION
        { label: "Logout", action: () => { onLogout(); onClose(); }, danger: true },
    ];

    return (
        <motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.95 }} transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }} style={{ position: "absolute", top: "calc(100% + 14px)", right: 0, minWidth: 210, background: theme.dropdownBg, border: `1px solid ${theme.dropdownBorder}`, borderRadius: 16, backdropFilter: "blur(64px)", WebkitBackdropFilter: "blur(64px)", boxShadow: isDark ? "0 24px 64px rgba(0,0,0,0.6)" : "0 24px 64px rgba(0,0,0,0.15)", zIndex: 2000, padding: "8px 0" }}>
            {items.map((item, i) => (
                <div key={i}>
                    {i === items.length - 1 && <div style={{ height: 1, background: theme.dropdownBorder, margin: "6px 0" }} />}
                    <button onClick={() => { item.action?.(); if (item.label !== "Light Mode" && item.label !== "Dark Mode" && item.label !== "Logout") onClose(); }} style={{ display: "flex", alignItems: "center", width: "100%", padding: "10px 20px", background: "transparent", border: "none", color: item.danger ? theme.danger : theme.text, fontSize: 14, fontWeight: 500, letterSpacing: "-0.01em", cursor: "pointer", fontFamily: "inherit", textAlign: "left", transition: "background 0.15s ease", outline: "none" }} onMouseEnter={e => e.currentTarget.style.background = theme.dropdownHover} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        {item.label}
                    </button>
                </div>
            ))}
        </motion.div>
    );
}

// 🚀 ADDED 'onLogout' PROP
function Navbar({ theme, isDark, onToggleTheme, ribbonSplit, isAppMuted, isCameraMode, onOpenModal, activeModal, onLogout }) {
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [hoveredTab, setHoveredTab] = useState(null);
    const settingsRef = useRef(null);

    const isExpanded = !ribbonSplit && !isCameraMode;

    useEffect(() => {
        const handler = (e) => { if (settingsRef.current && !settingsRef.current.contains(e.target)) setSettingsOpen(false); };
        document.addEventListener("mousedown", handler); return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => { if (isAppMuted) { setSettingsOpen(false); setHoveredTab(null); } }, [isAppMuted]);

    const navBtnStyle = (isActive) => ({
        position: "relative", background: "none", border: "none", cursor: "pointer",
        fontSize: "14px", fontWeight: 500, letterSpacing: "0.01em",
        color: isActive ? theme.text : theme.textMuted,
        fontFamily: "inherit", padding: "6px 14px", borderRadius: 999,
        outline: "none", whiteSpace: "nowrap", zIndex: 10, transition: "color 0.2s"
    });

    return (
        <div style={{ position: "fixed", top: 24, left: 0, right: 0, zIndex: 100, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
            <motion.nav
                initial={false}
                animate={{ width: isExpanded ? "auto" : 44, background: isAppMuted ? "rgba(0,0,0,0.6)" : theme.navBg, borderColor: isAppMuted ? "rgba(255,255,255,0.15)" : theme.navBorder }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                style={{ height: 44, borderRadius: 22, display: "flex", alignItems: "center", pointerEvents: isAppMuted ? "none" : "auto", backdropFilter: "blur(44px)", WebkitBackdropFilter: "blur(44px)", boxShadow: "0 12px 32px rgba(0,0,0,0.15)", borderStyle: "solid", borderWidth: 1, overflow: settingsOpen ? "visible" : "hidden" }}
            >
                <div style={{ display: "flex", alignItems: "center", width: "max-content", padding: "0 8px" }}>
                    <div style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><VoxaLogo /></div>

                    <motion.div animate={{ opacity: isExpanded ? 1 : 0 }} transition={{ duration: 0.3 }} style={{ display: "flex", alignItems: "center", pointerEvents: isExpanded ? "auto" : "none" }}>
                        <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em", color: theme.text, whiteSpace: "nowrap", paddingLeft: 10, paddingRight: 10 }}>Voxa</span>
                        <div style={{ width: 1, height: 16, background: theme.navBorder, margin: "0 12px" }} />

                        <div style={{ display: "flex", gap: "2px", position: "relative" }} onMouseLeave={() => setHoveredTab(null)}>

                            <div style={{ position: "relative" }}>
                                {hoveredTab === "history" && <NavPill theme={theme} />}
                                <button style={navBtnStyle(activeModal === "history" || hoveredTab === "history")} onClick={() => onOpenModal("history")} onMouseEnter={() => setHoveredTab("history")}>
                                    History
                                </button>
                            </div>

                            <div style={{ position: "relative" }}>
                                {hoveredTab === "profile" && <NavPill theme={theme} />}
                                <button style={navBtnStyle(activeModal === "profile" || hoveredTab === "profile")} onClick={() => onOpenModal("profile")} onMouseEnter={() => setHoveredTab("profile")}>
                                    Profile
                                </button>
                            </div>

                            <div ref={settingsRef} style={{ position: "relative" }}>
                                {hoveredTab === "settings" && <NavPill theme={theme} />}
                                <button style={navBtnStyle(settingsOpen || hoveredTab === "settings")} onClick={() => setSettingsOpen(!settingsOpen)} onMouseEnter={() => setHoveredTab("settings")}>
                                    Settings ▾
                                </button>
                                <AnimatePresence>
                                    {/* 🚀 PASS 'onLogout' TO DROPDOWN */}
                                    {settingsOpen && <SettingsDropdown theme={theme} isDark={isDark} onToggleTheme={onToggleTheme} onClose={() => setSettingsOpen(false)} onOpenModal={onOpenModal} onLogout={onLogout} />}
                                </AnimatePresence>
                            </div>

                        </div>
                    </motion.div>
                </div>
            </motion.nav>
        </div>
    );
}

// ─────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────

// 🚀 RECEIVE 'user' AND 'onLogout' FROM MAIN.JSX
export default function VoiceAssistant({ user, onLogout }) {
    const [isDark, setIsDark] = useState(() => localStorage.getItem('voxa_theme') !== 'light');

    // 🚀 FALLBACK TO USER'S ACTUAL NAME
    const [userName, setUserName] = useState(() => localStorage.getItem('voxa_username') || user?.name || "Afish Abdulkader");
    const [selectedVoice, setSelectedVoice] = useState(() => localStorage.getItem('voxa_voice_preference') || "female");

    const [phase, setPhase] = useState(PHASES.IDLE);
    const [currentPrompt, setCurrentPrompt] = useState("");
    const [currentResponse, setCurrentResponse] = useState("");
    const [currentCard, setCurrentCard] = useState(null);

    const [showGreeting, setShowGreeting] = useState(true);
    const [showQuery, setShowQuery] = useState(false);
    const [typing, setTyping] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [showInput, setShowInput] = useState(false);
    const [greetingVisible, setGreetingVisible] = useState(true);
    const [ribbonSplit, setRibbonSplit] = useState(false);

    const [isCameraMode, setIsCameraMode] = useState(false);
    const [activeModal, setActiveModal] = useState(null);
    const [isDockHovered, setIsDockHovered] = useState(false);

    // 🚀 RE-ARCHITECTED MEMORY POINTERS TO DEFEAT STALE CLOSURES
    const busyRef = useRef(false);
    const activeCallRef = useRef(false);
    const runQueryRef = useRef(null);

    const timeoutsRef = useRef([]);
    const availableVoicesRef = useRef([]);
    const videoRef = useRef(null);
    const cameraModeRef = useRef(false);

    const theme = isDark ? THEMES.dark : THEMES.light;
    const isDockExpanded = isDockHovered || showInput;
    const isAppMuted = activeModal !== null;
    const effectiveSplit = ribbonSplit || isCameraMode;

    const handleToggleTheme = () => {
        setIsDark(prev => {
            const newTheme = !prev;
            localStorage.setItem('voxa_theme', newTheme ? 'dark' : 'light');
            return newTheme;
        });
    };

    useEffect(() => { return () => timeoutsRef.current.forEach(clearTimeout); }, []);
    useEffect(() => { cameraModeRef.current = isCameraMode; }, [isCameraMode]);

    useEffect(() => {
        const loadVoices = () => { availableVoicesRef.current = window.speechSynthesis.getVoices(); };
        loadVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) window.speechSynthesis.onvoiceschanged = loadVoices;
    }, []);

    const handleMicTap = useCallback(() => {
        if (busyRef.current) return;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return alert("Speech Recognition is not supported in this browser.");

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setPhase(PHASES.LISTENING); setGreetingVisible(false);
            setShowGreeting(false); setRibbonSplit(true);
            setCurrentPrompt("Listening..."); setCurrentResponse("");
            setCurrentCard(null); setShowQuery(true);

            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
            const player = document.getElementById("voxa-audio-player");
            if (player) {
                player.pause();
                player.currentTime = 0;
            }
        };

        // 🚀 Guarantee we always call the absolute newest version of runQuery
        recognition.onresult = (event) => {
            if (runQueryRef.current) {
                runQueryRef.current(event.results[0][0].transcript, true);
            }
        };

        recognition.onerror = (event) => {
            if (busyRef.current) return; // Ignore stale errors if Voxa is actively thinking

            if (event.error === 'no-speech' || event.error === 'aborted' || event.error === 'not-allowed') {
                activeCallRef.current = false;
                setPhase(PHASES.IDLE);
                setShowQuery(false); setShowGreeting(true);
                setGreetingVisible(true); setRibbonSplit(false);
                return;
            }

            setPhase(PHASES.IDLE); setCurrentPrompt("Microphone error.");
            setCurrentResponse("Could not hear you.");
            const t = setTimeout(() => {
                setShowQuery(false); setShowGreeting(true);
                setGreetingVisible(true); setRibbonSplit(false);
                busyRef.current = false;
            }, 3000);
            timeoutsRef.current.push(t);
        };

        try {
            recognition.start();
        } catch (e) {
            console.error("Mic start blocked:", e);
            activeCallRef.current = false;
            setPhase(PHASES.IDLE);
        }
    }, []);

    const speakResponse = useCallback((text, isVoiceCall) => {
        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        const cleanText = text.replace(/\*/g, '');
        const utterance = new SpeechSynthesisUtterance(cleanText);
        const voices = availableVoicesRef.current;

        let premiumVoice = null;
        if (selectedVoice === "male") {
            premiumVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Male') || v.name.includes('David') || v.name.includes('Mark')));
        } else {
            premiumVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Google UK English Female') || v.name.includes('Zira') || v.name.includes('Samantha'));
        }

        if (!premiumVoice) premiumVoice = voices.find(v => v.lang.startsWith('en'));
        if (premiumVoice) utterance.voice = premiumVoice;

        utterance.rate = 1.0;
        utterance.pitch = selectedVoice === "male" ? 0.9 : 1.05;

        utterance.onend = () => {
            if (activeCallRef.current) {
                busyRef.current = false;
                // 🚀 Bypasses security by faking a physical click on a hidden button
                setTimeout(() => {
                    const btn = document.getElementById("hidden-mic-trigger");
                    if (btn) btn.click();
                }, 300);
            }
        };

        window.speechSynthesis.speak(utterance);
    }, [selectedVoice]);

    const runQuery = useCallback(async (q, isVoiceCall = false) => {
        if (busyRef.current) return;
        busyRef.current = true;
        activeCallRef.current = isVoiceCall;

        setGreetingVisible(false); setShowGreeting(false);
        setRibbonSplit(true); setPhase(PHASES.PROCESSING);

        setCurrentPrompt(q); setCurrentResponse("Thinking...");
        setCurrentCard(null);
        setShowQuery(true); setTyping(false);

        let capturedImageData = null;
        if (cameraModeRef.current) {
            try {
                const videoElement = document.getElementById("voxa-camera-feed");
                if (videoElement) {
                    const canvas = document.createElement("canvas");
                    canvas.width = videoElement.videoWidth || 1080;
                    canvas.height = videoElement.videoHeight || 1920;
                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
                    capturedImageData = canvas.toDataURL("image/jpeg", 0.5);
                }
            } catch (err) { }
        }

        try {
            // 🚀 ADDED 'Authorization' HEADER SO THE REQUEST DOESN'T GET REJECTED
            const response = await fetch('http://localhost:5000/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify({ prompt: q, image: capturedImageData, voice: selectedVoice })
            });

            const data = await response.json();
            setPhase(PHASES.RESPONDING);
            const finalText = data.text || data.reply || "Error: Connection failed.";
            setCurrentResponse(finalText);
            if (data.card) setCurrentCard(data.card);
            setTyping(true);

            if (!isAppMuted) {
                if (data.audio) {
                    // 🚀 THE BULLETPROOF DOM ARCHITECTURE
                    const player = document.getElementById("voxa-audio-player");
                    if (player) {
                        player.src = `data:audio/mpeg;base64,${data.audio}`;

                        player.onended = () => {
                            if (activeCallRef.current) {
                                busyRef.current = false;
                                setTimeout(() => {
                                    const btn = document.getElementById("hidden-mic-trigger");
                                    if (btn) btn.click();
                                }, 300);
                            }
                        };

                        player.play().catch(e => {
                            console.error("Audio block caught, falling back:", e);
                            speakResponse(finalText, isVoiceCall);
                        });
                    }
                } else if (data.text || data.success) {
                    speakResponse(finalText, isVoiceCall);
                }
            }

        } catch (error) {
            setPhase(PHASES.RESPONDING);
            setCurrentResponse("Error: Backend is offline.");
            setTyping(true);
            busyRef.current = false;
            activeCallRef.current = false;
        }
    }, [isAppMuted, selectedVoice, speakResponse, user]); // 🚀 Added user dependency

    // Keep the Ref instantly synced with the absolute newest version of runQuery
    useEffect(() => { runQueryRef.current = runQuery; }, [runQuery]);

    const handleTypingDone = useCallback(() => {
        setTyping(false);
        if (activeCallRef.current) return; // 🚀 DO NOT CLOSE THE UI IF CALL IS ACTIVE

        const t = setTimeout(() => {
            setPhase(PHASES.IDLE); setShowQuery(false);
            setCurrentPrompt(""); setCurrentResponse("");
            setCurrentCard(null);
            setShowGreeting(true); setGreetingVisible(true);
            setRibbonSplit(false); busyRef.current = false;
        }, 10000);
        timeoutsRef.current.push(t);
    }, []);

    const handleTextSubmit = () => {
        const q = inputValue.trim(); if (!q || busyRef.current) return;
        setInputValue(""); setShowInput(false);
        setCurrentPrompt(q); runQuery(q, false);
    };

    const renderModalContent = () => {
        switch (activeModal) {
            // 🚀 PASS 'user' TO PROFILE AND HISTORY
            case 'profile': return { title: "Profile Setup", component: <ProfileScreen theme={theme} user={user} userName={userName} setUserName={setUserName} /> };
            case 'history': return { title: "Recent Activity", component: <HistoryScreen theme={theme} user={user} onClose={() => setActiveModal(null)} /> };
            case 'personalization': return { title: "Personalization", component: <PersonalizationScreen theme={theme} selectedVoice={selectedVoice} setSelectedVoice={setSelectedVoice} /> };
            case 'feedback': return { title: "Submit Feedback", component: <FeedbackScreen theme={theme} /> };
            case 'support': return { title: "Contact Support", component: <SupportScreen theme={theme} /> };
            default: return { title: "", component: null };
        }
    };
    const modalData = renderModalContent();

    return (
        <div style={{
            position: "fixed", inset: 0, width: "100vw", height: "100vh", background: "#000",
            overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
            WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale",
        }}>
            <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { display: none; }
        button:focus-visible, input:focus-visible, textarea:focus-visible, select:focus-visible { outline: 2px solid #7c3aed; outline-offset: 2px; }
        input:focus, textarea:focus { border-color: rgba(124,58,237,0.5) !important; }
        input::placeholder, textarea::placeholder { color: rgba(140,140,160,0.45); }
      `}</style>

            {/* 🚀 BULLETPROOF DOM HOOKS */}
            <audio id="voxa-audio-player" style={{ display: "none" }} />
            <button id="hidden-mic-trigger" onClick={handleMicTap} style={{ display: "none" }} />

            {/* Layer 0: Camera UI */}
            <SpatialCameraWindow isActive={isCameraMode} onClose={() => setIsCameraMode(false)} videoRef={videoRef} />

            {/* ── GLASSMORPHIC OFF-CANVAS PANELS ── */}
            <AnimatePresence>
                {activeModal === 'history' && (
                    <motion.div
                        initial={{ opacity: 0, x: -40, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -30, scale: 0.95, transition: { duration: 0.2 } }}
                        transition={{ type: "spring", stiffness: 250, damping: 28 }}
                        style={{
                            position: "absolute", top: 16, bottom: 16, left: 16, width: "clamp(280px, 80vw, 420px)", zIndex: 100,
                            background: isDark ? "rgba(15,15,20,0.65)" : "rgba(250,250,252,0.65)",
                            backdropFilter: "blur(48px)", WebkitBackdropFilter: "blur(48px)",
                            border: `1px solid rgba(255,255,255,0.15)`,
                            borderRadius: 40, padding: 28, display: "flex", flexDirection: "column", color: theme.text,
                            overflowY: "auto", boxShadow: "0 40px 100px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.2)"
                        }}
                    >
                        <h2 style={{ margin: "0 0 24px 0", fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", color: theme.text }}>{modalData.title}</h2>
                        {modalData.component}
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {(activeModal && activeModal !== 'history') && (
                    <motion.div
                        initial={{ opacity: 0, y: 60, scale: 0.9, filter: "blur(12px)" }}
                        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: 40, scale: 0.95, filter: "blur(8px)", transition: { duration: 0.25 } }}
                        transition={{ type: "spring", stiffness: 250, damping: 28 }}
                        style={{
                            position: "absolute", zIndex: 100, width: "min(90vw, 540px)", maxHeight: "80vh",
                            background: isDark ? "rgba(15,15,20,0.65)" : "rgba(250,250,252,0.65)",
                            backdropFilter: "blur(48px)", WebkitBackdropFilter: "blur(48px)",
                            border: `1px solid rgba(255,255,255,0.15)`,
                            borderRadius: 40, padding: "clamp(24px, 4vw, 40px)", display: "flex", flexDirection: "column",
                            color: theme.text, overflowY: "auto", boxShadow: "0 40px 100px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.2)"
                        }}
                    >
                        <h2 style={{ margin: "0 0 28px 0", fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em", color: theme.text }}>{modalData?.title}</h2>
                        {modalData?.component}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── DEPTH PARALLAX MASTER APP CONTAINER ── */}
            <motion.div
                animate={{
                    scale: isAppMuted ? 0.90 : 1, y: isAppMuted ? -15 : 0,
                    opacity: activeModal ? 0.35 : 1, filter: activeModal ? "blur(12px)" : "blur(0px)",
                    borderRadius: isAppMuted ? 44 : 0,
                }}
                transition={{ type: "spring", stiffness: 220, damping: 30 }}
                style={{
                    position: "absolute", inset: 0, width: "100%", height: "100%",
                    zIndex: 10, background: theme.bg, overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: isAppMuted ? "none" : "auto",
                }}
            >
                {activeModal && (
                    <div onClick={() => setActiveModal(null)} style={{ position: "absolute", inset: 0, zIndex: 999, cursor: "pointer", pointerEvents: "auto" }} />
                )}

                <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1, background: `radial-gradient(ellipse 80% 60% at 50% 70%, ${theme.radialGlow} 0%, transparent 72%)`, transition: "background 0.7s" }} />

                <WaveCanvas phase={phase} ribbonSplit={effectiveSplit} isAppMuted={isAppMuted} />

                {/* 🚀 PASS 'onLogout' TO NAVBAR */}
                <Navbar theme={theme} isDark={isDark} onToggleTheme={handleToggleTheme} ribbonSplit={ribbonSplit} isAppMuted={isAppMuted} isCameraMode={isCameraMode} onOpenModal={setActiveModal} activeModal={activeModal} onLogout={onLogout} />

                {/* Center Content */}
                <div style={{
                    position: "relative", zIndex: 10, display: "flex", flexDirection: "column",
                    alignItems: effectiveSplit ? "flex-start" : "center",
                    justifyContent: "center", width: "100%",
                    textAlign: effectiveSplit ? "left" : "center",
                    paddingLeft: effectiveSplit ? "clamp(90px, 12vw, 200px)" : "clamp(28px,8vw,130px)",
                    paddingRight: "clamp(28px,8vw,130px)",
                    paddingBottom: "18vh", paddingTop: 100, transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)"
                }}>

                    {/* THE IDLE HERO STATE */}
                    <AnimatePresence>
                        {showGreeting && !isCameraMode && (
                            <motion.div key="greeting" initial={{ opacity: 0, y: 20, filter: "blur(10px)" }} animate={{ opacity: greetingVisible ? 1 : 0, y: greetingVisible ? 0 : -30, filter: greetingVisible ? "blur(0px)" : "blur(12px)", scale: greetingVisible ? 1 : 0.9 }} exit={{ opacity: 0, y: -30, filter: "blur(12px)", scale: 0.9 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} style={{ width: "100%" }}>
                                <p style={{ fontSize: "clamp(18px,2.8vw,26px)", color: theme.textMuted, fontWeight: 400, letterSpacing: "-0.01em", marginBottom: "0.2em" }}>Good afternoon, {userName.split(' ')[0]}</p>
                                <p style={{ fontSize: "clamp(32px,5.8vw,64px)", color: theme.text, fontWeight: 400, letterSpacing: "-0.04em", lineHeight: 1 }}>How can I help you?</p>
                                <QuerySlider theme={theme} />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* THE TEXT HIERARCHY */}
                    <AnimatePresence>
                        {showQuery && (
                            <motion.div
                                key="query"
                                initial={{ opacity: 0, y: 30, filter: "blur(12px)" }}
                                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                exit={{ opacity: 0, y: -20, filter: "blur(8px)" }}
                                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                style={{ display: "flex", flexDirection: "column", gap: "16px", alignItems: effectiveSplit ? "flex-start" : "center" }}
                            >
                                <p style={{ fontSize: "clamp(32px,5.8vw,64px)", color: theme.text, fontWeight: 400, letterSpacing: "-0.04em", lineHeight: 1.1, maxWidth: "min(900px, 85vw)" }}>
                                    {currentPrompt}
                                </p>

                                <AnimatePresence>
                                    {currentResponse && (
                                        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
                                            <p style={{ fontSize: "clamp(18px,2.8vw,26px)", color: theme.textMuted, fontWeight: 400, lineHeight: 1.4, letterSpacing: "-0.01em", maxWidth: "min(720px, 75vw)" }}>
                                                {typing ? <TypingText text={currentResponse} speed={36} onDone={handleTypingDone} /> : currentResponse}
                                            </p>

                                            <AnimatePresence>
                                                {currentCard && currentCard.type === 'weather' && (
                                                    <WeatherCard data={currentCard} theme={theme} />
                                                )}
                                            </AnimatePresence>

                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Bottom Controls */}
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 20, display: "flex", flexDirection: "column", alignItems: "center", paddingBottom: "clamp(24px,5vh,56px)", gap: 16 }}>
                    <AnimatePresence>
                        {showInput && !isCameraMode && (
                            <motion.div key="textinput" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 14 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} style={{ display: "flex", gap: 10, width: "min(520px,86vw)", marginBottom: 8 }}>
                                <input autoFocus value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={e => e.key === "Enter" && handleTextSubmit()} placeholder="Type your question…" style={{ flex: 1, height: 50, borderRadius: 999, border: `1px solid ${theme.inputBorder}`, background: theme.inputBg, backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)", color: theme.text, fontSize: "clamp(13px,1.5vw,15px)", fontWeight: 400, padding: "0 22px", outline: "none", fontFamily: "inherit", letterSpacing: "-0.01em", transition: "border-color 0.28s cubic-bezier(0.16,1,0.3,1), background 0.4s" }} />
                                <motion.button onClick={handleTextSubmit} whileTap={{ scale: 0.94 }} whileHover={{ scale: 1.04 }} style={{ height: 50, borderRadius: 999, border: "1px solid rgba(124,58,237,0.4)", background: "rgba(124,58,237,0.32)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", color: "rgba(255,255,255,0.9)", fontSize: "clamp(13px,1.4vw,15px)", fontWeight: 500, letterSpacing: "0.01em", padding: "0 26px", cursor: "pointer", fontFamily: "inherit", outline: "none" }}>Ask</motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.div onMouseEnter={() => setIsDockHovered(true)} onMouseLeave={() => setIsDockHovered(false)} style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative", height: "clamp(60px, 8vw, 80px)", width: "clamp(200px, 25vw, 240px)" }}>
                        <motion.button onClick={() => { if (!busyRef.current) setShowInput(p => !p); }} animate={{ x: isDockExpanded ? -80 : 0, opacity: isDockExpanded ? 1 : 0, scale: isDockExpanded ? 1 : 0.5 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} whileHover={{ scale: isDockExpanded ? 1.05 : 1, backgroundColor: theme.buttonBg }} whileTap={{ scale: 0.92 }} style={{ position: "absolute", zIndex: 5, width: "clamp(46px,5vw,56px)", height: "clamp(46px,5vw,56px)", borderRadius: "50%", border: `1px solid ${theme.buttonBorder}`, background: showInput ? theme.bgSecondary : theme.navBg, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", cursor: busyRef.current ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", outline: "none", pointerEvents: isDockExpanded ? "auto" : "none" }}>
                            <svg width="clamp(18px,2.2vw,22px)" height="clamp(18px,2.2vw,22px)" viewBox="0 0 24 24" fill="none" stroke={theme.text} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="3" /><path d="M7 8h.01M11 8h.01M15 8h.01M7 12h.01M11 12h.01M15 12h.01M7 16h10" /></svg>
                        </motion.button>
                        <div style={{ position: "relative", zIndex: 10 }}>
                            <LiquidOrb onTap={handleMicTap} onCameraMode={() => setIsCameraMode(true)} phase={phase} theme={theme} isCameraMode={isCameraMode} isAppMuted={isAppMuted} />
                        </div>
                        <motion.button onClick={() => { const btn = document.getElementById("hidden-mic-trigger"); if (btn) btn.click(); }} animate={{ x: isDockExpanded ? 80 : 0, opacity: isDockExpanded ? 1 : 0, scale: isDockExpanded ? 1 : 0.5 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} whileHover={{ scale: isDockExpanded ? 1.05 : 1, backgroundColor: theme.buttonBg }} whileTap={{ scale: 0.92 }} style={{ position: "absolute", zIndex: 5, width: "clamp(46px,5vw,56px)", height: "clamp(46px,5vw,56px)", borderRadius: "50%", border: `1px solid ${theme.buttonBorder}`, background: theme.navBg, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", cursor: busyRef.current ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", outline: "none", pointerEvents: isDockExpanded ? "auto" : "none" }}>
                            <svg width="clamp(18px,2.2vw,22px)" height="clamp(18px,2.2vw,22px)" viewBox="0 0 24 24" fill="none" stroke={theme.text} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" /><polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" /></svg>
                        </motion.button>
                    </motion.div>

                    {!isCameraMode && (
                        <motion.p onClick={() => { if (!isAppMuted) setIsCameraMode(true) }} animate={{ backgroundPosition: ["200% center", "-200% center"] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} style={{ marginTop: "clamp(4px, 1vh, 8px)", fontSize: "clamp(9px,1vw,11px)", letterSpacing: "0.18em", fontWeight: 600, textTransform: "uppercase", userSelect: "none", cursor: "pointer", pointerEvents: "auto", textAlign: "center", backgroundImage: `linear-gradient(90deg, ${theme.textFaint} 0%, ${theme.text} 50%, ${theme.textFaint} 100%)`, backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                            SWIPE UP ↑ FOR CAMERA
                        </motion.p>
                    )}
                </div>
            </motion.div>
        </div>
    );
}