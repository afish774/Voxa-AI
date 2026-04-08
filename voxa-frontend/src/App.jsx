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
  "What is a long ball counter formation?",
  "Write a MERN stack authentication guide.",
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
      if (w === 0 || h === 0) { rafRef.current = requestAnimationFrame(draw); return; }

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

      const isMobile = w < h;
      const baseDim = isMobile ? w * 1.6 : h;
      const freqScale = isMobile ? 0.5 : 1.0;

      ctx.globalCompositeOperation = "screen";
      ribbons.forEach((ribbon) => {
        const points = []; const amp = baseDim * s.currentAmplitude;
        for (let i = -10; i <= steps + 10; i++) {
          const n = i / steps;
          const osc = Math.sin(n * Math.PI * 2.2 * ribbon.f * freqScale + time + ribbon.ph) * amp * ribbon.aS * 0.55
            + Math.sin(n * Math.PI * 3.7 * ribbon.f * freqScale + time * 0.67 + ribbon.ph * 1.3) * amp * ribbon.aS * 0.28
            + Math.sin(n * Math.PI * 6.1 * freqScale + time * 0.42 + ribbon.ph * 0.8) * amp * ribbon.aS * 0.12;
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
// SPATIAL CAMERA WINDOW (Mobile Premium Upgrade)
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
            alignItems: "center", justifyContent: "center",
            padding: "env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)",
            pointerEvents: "none"
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            style={{
              pointerEvents: "auto",
              width: "min(92vw, 420px)",
              height: "min(80dvh, 600px)",
              borderRadius: "clamp(24px, 5vw, 40px)",
              border: "1px solid rgba(255,255,255,0.15)",
              boxShadow: "0 40px 100px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.15)",
              position: "relative", overflow: "hidden", display: "flex",
              flexDirection: "column", justifyContent: "space-between", padding: "clamp(12px, 4vw, 24px)",
              background: "#000"
            }}
          >
            <video id="voxa-camera-feed" ref={videoRef} autoPlay playsInline muted style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10 }}>
              <div style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(20px) saturate(150%)", WebkitBackdropFilter: "blur(20px) saturate(150%)", padding: "8px 16px", borderRadius: 999, color: "#fff", fontSize: 13, fontWeight: 600, letterSpacing: "0.08em", display: "flex", alignItems: "center", border: "1px solid rgba(255,255,255,0.15)" }}>
                <span style={{ display: "inline-block", width: 8, height: 8, background: "#22c55e", borderRadius: "50%", marginRight: 8, animation: "dotBeat 1.5s infinite" }} />
                VISION
              </div>
              <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(20px) saturate(150%)", WebkitBackdropFilter: "blur(20px) saturate(150%)", border: "1px solid rgba(255,255,255,0.2)", width: 44, height: 44, borderRadius: "50%", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", outline: "none", transition: "background 0.2s" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <motion.div animate={{ y: ["-10%", "600%", "-10%"] }} transition={{ duration: 4, ease: "linear", repeat: Infinity }} style={{ position: "absolute", top: "10%", left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)", boxShadow: "0 0 20px 2px rgba(255,255,255,0.6)" }} />

            <div style={{ display: "flex", justifyContent: "center", zIndex: 10, paddingBottom: 10 }}>
              <p style={{ color: "rgba(255,255,255,0.9)", fontSize: 14, fontWeight: 500, letterSpacing: "0.02em", background: "rgba(0,0,0,0.5)", padding: "12px 28px", borderRadius: 999, backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.15)", textAlign: "center" }}>
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
function QuerySlider({ theme, onSelect }) {
  const [idx, setIdx] = useState(Math.floor(Math.random() * SAMPLE_QUERIES.length));

  useEffect(() => {
    const t = setInterval(() => {
      setIdx(Math.floor(Math.random() * SAMPLE_QUERIES.length));
    }, 4500);
    return () => clearInterval(t);
  }, []);

  // 🚀 THE FIX: Inline `height` is completely removed from the style block.
  // The CSS class `.query-slider-container` now fully controls the height,
  // preventing the text from being horizontally cut in half when it wraps.
  return (
    <div className="query-slider-container" style={{ position: "relative", overflow: "hidden", width: "100%", cursor: "pointer", padding: "0 10px" }} onClick={() => onSelect(SAMPLE_QUERIES[idx])}>
      <AnimatePresence mode="wait">
        <motion.p key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} style={{ position: "absolute", width: "100%", left: 0, textAlign: "center", fontSize: "clamp(13px, 1.5vw, 15px)", color: theme.textMuted, fontWeight: 400, letterSpacing: "-0.01em", lineHeight: 1.4, transition: "color 0.2s" }} onMouseEnter={(e) => e.target.style.color = theme.text} onMouseLeave={(e) => e.target.style.color = theme.textMuted}>
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
    if (idx >= text?.length) { onDone?.(); return; }
    const ms = text[idx] === " " ? speed * 1.3 : speed;
    const t = setTimeout(() => { setShown(p => p + text[idx]); setIdx(p => p + 1); }, ms);
    timeoutsRef.current.push(t); return () => clearTimeout(t);
  }, [idx, text, speed, onDone]);
  useEffect(() => { return () => timeoutsRef.current.forEach(clearTimeout); }, [])
  return (
    <>{shown}{idx < text?.length && <span style={{ display: "inline-block", width: 2, height: "0.85em", background: "rgba(255,255,255,0.75)", marginLeft: 3, verticalAlign: "middle", animation: "blinkCursor 0.85s step-end infinite" }} />}</>
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
      <input
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        onChange={onChange}
        disabled={disabled}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          width: "100%", padding: "14px 18px 14px 44px", borderRadius: 14,
          border: `1px solid ${isFocused ? "#7c3aed" : theme.inputBorder}`,
          background: theme.inputBg, color: disabled ? theme.textMuted : theme.text,
          fontSize: "16px",
          outline: "none", fontFamily: "inherit", transition: "all 0.2s cubic-bezier(0.16,1,0.3,1)",
          boxShadow: isFocused ? "0 0 0 3px rgba(124,58,237,0.15)" : "none",
          cursor: disabled ? "not-allowed" : "text",
          WebkitAppearance: "none"
        }}
      />
    </div>
  );
}

function ProfileScreen({ theme, user, userName, setUserName }) {
  const [tempName, setTempName] = useState(userName);
  const handleSave = () => {
    setUserName(tempName);
    try { localStorage.setItem('voxa_username', tempName); } catch (e) { }
    alert("Profile Saved locally! (Backend update coming soon)");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 12 }}>
        <div style={{ position: "relative" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#db2777)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, color: "#fff", fontWeight: 600, boxShadow: "0 8px 24px rgba(124,58,237,0.3)" }}>{userName?.charAt(0).toUpperCase() || "V"}</div>
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: theme.text, letterSpacing: "-0.02em" }}>{userName}</h3>
          <p style={{ margin: "4px 0 0 0", fontSize: 14, color: theme.textMuted }}>Voxa AI User</p>
        </div>
      </div>
      <div style={{ marginTop: 8 }}>
        <label style={{ display: "block", fontSize: 12, color: theme.textMuted, marginBottom: 8, marginLeft: 4, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>Display Name</label>
        <InputField theme={theme} icon={<IconUser />} defaultValue={userName} onChange={(e) => setTempName(e.target.value)} />
        <label style={{ display: "block", fontSize: 12, color: theme.textMuted, marginBottom: 8, marginLeft: 4, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>Email (Read Only)</label>
        <InputField theme={theme} icon={<IconMail />} defaultValue={user?.email || "guest@voxa.ai"} disabled={true} />
      </div>
      <motion.button onClick={handleSave} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ width: "100%", padding: "16px", borderRadius: 14, border: `1px solid ${theme.buttonBorder}`, background: theme.buttonBg, color: theme.text, fontSize: 15, fontWeight: 600, cursor: "pointer", transition: "background 0.2s" }}>Save Changes</motion.button>
    </div>
  );
}

function HistoryScreen({ theme, user, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch('https://voxa-ai-zh5o.onrender.com/api/chat/history', {
          headers: { "Authorization": `Bearer ${user?.token}` }
        });
        const data = await response.json();
        if (Array.isArray(data)) {
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
        }
      } catch (err) {
        console.error("Failed to fetch history:", err);
        setHistory([{ role: 'ai', q: "Failed to connect to the database.", time: "System Error" }]);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user]);

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
    try { localStorage.setItem('voxa_voice_preference', v); } catch (e) { }
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
        <textarea placeholder="Tell us what you love or what could be better..." style={{ width: "100%", height: 120, padding: "16px 18px", borderRadius: 14, border: `1px solid ${theme.inputBorder}`, background: theme.inputBg, color: theme.text, fontSize: "16px", outline: "none", resize: "none", fontFamily: "inherit", transition: "border-color 0.2s", WebkitAppearance: "none" }} onFocus={e => e.target.style.borderColor = "#7c3aed"} onBlur={e => e.target.style.borderColor = theme.inputBorder} />
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
        <select style={{ width: "100%", padding: "16px 18px", borderRadius: 14, border: `1px solid ${theme.inputBorder}`, background: theme.inputBg, color: theme.text, fontSize: "16px", outline: "none", fontFamily: "inherit", WebkitAppearance: "none", cursor: "pointer" }}>
          <option>General Inquiry</option>
          <option>Bug Report</option>
          <option>Feature Request</option>
        </select>
        <div style={{ position: "absolute", right: 18, top: 18, pointerEvents: "none", color: theme.textFaint }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </div>
      </div>
      <textarea placeholder="Please describe the issue in detail..." style={{ width: "100%", height: 140, padding: "16px 18px", borderRadius: 14, border: `1px solid ${theme.inputBorder}`, background: theme.inputBg, color: theme.text, fontSize: "16px", outline: "none", resize: "none", fontFamily: "inherit", WebkitAppearance: "none" }} onFocus={e => e.target.style.borderColor = "#7c3aed"} onBlur={e => e.target.style.borderColor = theme.inputBorder} />
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

function SettingsDropdown({ theme, isDark, onToggleTheme, onClose, onOpenModal, onLogout }) {
  const items = [
    { label: isDark ? "Light Mode" : "Dark Mode", action: onToggleTheme },
    { label: "Profile Setup", action: () => onOpenModal("profile") },
    { label: "Chat History", action: () => onOpenModal("history") },
    { label: "Voice Personalization", action: () => onOpenModal("personalization") },
    { label: "Submit Feedback", action: () => onOpenModal("feedback") },
    { label: "Contact Support", action: () => onOpenModal("support") },
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
    <div style={{ position: "fixed", top: "clamp(16px, 3vh, 24px)", left: 0, right: 0, zIndex: 100, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
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

export default function VoiceAssistant({ user, onLogout }) {
  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem('voxa_theme') !== 'light'; } catch (e) { return true; }
  });

  const [userName, setUserName] = useState(() => {
    try { return user?.name || localStorage.getItem('voxa_username') || "Guest"; } catch (e) { return user?.name || "Guest"; }
  });

  const [selectedVoice, setSelectedVoice] = useState(() => {
    try { return localStorage.getItem('voxa_voice_preference') || "female"; } catch (e) { return "female"; }
  });

  const [phase, setPhase] = useState(PHASES.IDLE);

  const [currentPrompt, setCurrentPrompt] = useState("");
  const [currentResponse, setCurrentResponse] = useState("");
  const [currentCard, setCurrentCard] = useState(null);
  const [typing, setTyping] = useState(false);

  const [inputValue, setInputValue] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [isCameraMode, setIsCameraMode] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [isDockHovered, setIsDockHovered] = useState(false);

  const [showGreeting, setShowGreeting] = useState(true);
  const [showQuery, setShowQuery] = useState(false);
  const [greetingVisible, setGreetingVisible] = useState(true);
  const [ribbonSplit, setRibbonSplit] = useState(false);

  const [greetingText, setGreetingText] = useState("Good day");
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreetingText("Good morning");
    else if (hour < 18) setGreetingText("Good afternoon");
    else setGreetingText("Good evening");
  }, []);

  const loopRef = useRef({
    isVoiceCall: false,
    isBotSpeaking: false,
    pendingHangup: false,
    silenceTimer: null,
    audioPlayer: null,
  });

  const micRef = useRef(null);
  const videoRef = useRef(null);
  const cameraModeRef = useRef(false);
  const availableVoicesRef = useRef([]);
  const timeoutsRef = useRef([]);

  const theme = isDark ? THEMES.dark : THEMES.light;
  const isDockExpanded = isDockHovered || showInput;
  const isAppMuted = activeModal !== null;
  const effectiveSplit = ribbonSplit || isCameraMode;
  const isIdle = phase === PHASES.IDLE;

  const handleToggleTheme = () => {
    setIsDark(prev => {
      const newTheme = !prev;
      try { localStorage.setItem('voxa_theme', newTheme ? 'dark' : 'light'); } catch (e) { }
      return newTheme;
    });
  };

  useEffect(() => { return () => timeoutsRef.current.forEach(clearTimeout); }, []);
  useEffect(() => { cameraModeRef.current = isCameraMode; }, [isCameraMode]);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      const loadVoices = () => { availableVoicesRef.current = window.speechSynthesis.getVoices(); };
      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }, []);

  // ─────────────────────────────────────────────
  // THE ENGINE
  // ─────────────────────────────────────────────

  const endCall = useCallback(() => {
    console.log("📞 [CALL ENDED]");
    loopRef.current.isVoiceCall = false;
    loopRef.current.isBotSpeaking = false;
    loopRef.current.pendingHangup = false;

    if (loopRef.current.silenceTimer) clearTimeout(loopRef.current.silenceTimer);

    if (micRef.current) {
      try { micRef.current.stop(); } catch (e) { }
    }
    if (loopRef.current.audioPlayer) {
      try { loopRef.current.audioPlayer.pause(); loopRef.current.audioPlayer.currentTime = 0; } catch (e) { }
    }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    setPhase(PHASES.IDLE);
    setCurrentCard(null);
    setShowQuery(false);
    setShowGreeting(true);
    setGreetingVisible(true);
    setRibbonSplit(false);
    setIsCameraMode(false);
  }, []);

  const startSilenceTimer = useCallback(() => {
    if (loopRef.current.silenceTimer) clearTimeout(loopRef.current.silenceTimer);
    loopRef.current.silenceTimer = setTimeout(() => {
      console.log("⏱️ [15s TIMEOUT] Silence detected. Hanging up.");
      endCall();
    }, 15000);
  }, [endCall]);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = 'en-US';

    rec.onstart = () => {
      console.log("🎙️ [MIC STARTED]");
      if (loopRef.current.isVoiceCall && !loopRef.current.isBotSpeaking) {
        setPhase(PHASES.LISTENING);
        setCurrentPrompt("Listening...");
        startSilenceTimer();
      }
    };

    rec.onresult = (e) => {
      const transcript = e.results[e.results.length - 1][0].transcript.trim();
      if (!transcript) return;

      startSilenceTimer();

      if (loopRef.current.isBotSpeaking) {
        console.log("🛡️ [SHIELD ACTIVE] Ignored Echo:", transcript);
        return;
      }

      console.log("🗣️ [USER SAID]:", transcript);
      if (window.activeRunQuery) window.activeRunQuery(transcript);
    };

    rec.onend = () => {
      console.log("🔌 [MIC DEAD NATIVELY]");
      if (loopRef.current.isVoiceCall && !loopRef.current.isBotSpeaking) {
        setTimeout(() => {
          try { rec.start(); } catch (e) { }
        }, 200);
      }
    };

    micRef.current = rec;
  }, [startSilenceTimer]);

  const handleOrbTap = () => {
    if (loopRef.current.isBotSpeaking) return;

    if (loopRef.current.isVoiceCall) {
      endCall();
    } else {
      console.log("📞 [CALL STARTED]");
      loopRef.current.isVoiceCall = true;
      loopRef.current.isBotSpeaking = false;
      loopRef.current.pendingHangup = false;

      setPhase(PHASES.LISTENING);
      setGreetingVisible(false);
      setShowGreeting(false);
      setRibbonSplit(true);
      setShowQuery(true);
      setCurrentPrompt("Listening...");
      setCurrentResponse("");
      setCurrentCard(null);

      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      if (loopRef.current.audioPlayer) {
        try { loopRef.current.audioPlayer.pause(); loopRef.current.audioPlayer.currentTime = 0; } catch (e) { }
      }

      try { micRef.current.start(); } catch (e) { }
    }
  };

  const triggerVoiceContinuation = useCallback(() => {
    loopRef.current.isBotSpeaking = false;
    if (loopRef.current.pendingHangup) {
      console.log("👋 [HANGING UP] Audio finished.");
      endCall();
    } else if (loopRef.current.isVoiceCall) {
      setPhase(PHASES.LISTENING);
      setCurrentPrompt("Listening...");
      setCurrentResponse("");
      if (micRef.current) { try { micRef.current.start(); } catch (e) { } }
      startSilenceTimer();
    }
  }, [endCall, startSilenceTimer]);

  const runQuery = async (q) => {
    loopRef.current.isBotSpeaking = true;
    if (loopRef.current.silenceTimer) clearTimeout(loopRef.current.silenceTimer);
    if (micRef.current) {
      try { micRef.current.abort(); console.log("🔇 [MIC HARD MUTED]"); } catch (e) { }
    }

    if (q && typeof q === 'string') {
      const exitRegex = /\b(okay|ok)?\s*(goodbye|bye|see ya|see you|end conversation|close the chat|close chat|that'?s it|that'?s all|stop listening|stop|exit|cancel|quit|we are done|we'?re done|no more|good night|stop the mic)\b/i;
      if (exitRegex.test(q)) {
        loopRef.current.pendingHangup = true;
        console.log("👋 [SMART HANGUP TRIGGERED] Exit phrase matched.");
      }
    }

    setPhase(PHASES.PROCESSING);
    setGreetingVisible(false);
    setShowGreeting(false);
    setRibbonSplit(true);
    setShowQuery(true);
    setTyping(false);
    setCurrentPrompt(q); setCurrentResponse("Thinking...");
    setCurrentCard(null);

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
      const response = await fetch("https://voxa-ai-zh5o.onrender.com/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          prompt: q,
          image: capturedImageData,
          voice: selectedVoice
        }),
      });

      const data = await response.json();

      if (data.endCall === true) {
        loopRef.current.pendingHangup = true;
      }

      setPhase(PHASES.RESPONDING);
      const finalText = data.text || data.reply || "Error: Connection failed.";
      setCurrentResponse(finalText);
      if (data.card) setCurrentCard(data.card);
      setTyping(true);

      if (!isAppMuted) {
        if (data.audio && loopRef.current.audioPlayer) {
          loopRef.current.audioPlayer.src = `data:audio/mpeg;base64,${data.audio}`;
          loopRef.current.audioPlayer.play().catch(e => {
            console.error("Audio playback blocked:", e);
            triggerVoiceContinuation();
          });
        } else {
          triggerVoiceContinuation();
        }
      }
    } catch (err) {
      console.error(err);
      setPhase(PHASES.RESPONDING);
      setCurrentResponse("Network error.");
      triggerVoiceContinuation();
    }
  };

  const handleAudioEnd = useCallback(() => {
    console.log("✅ [AUDIO FINISHED]");
    setTimeout(() => { triggerVoiceContinuation(); }, 500);
  }, [triggerVoiceContinuation]);

  useEffect(() => { window.activeRunQuery = runQuery; }, [runQuery]);

  const handleTextSubmit = () => {
    const q = inputValue.trim();
    if (!q || loopRef.current.isBotSpeaking) return;

    setInputValue("");
    setShowInput(false);

    loopRef.current.isVoiceCall = false;
    loopRef.current.pendingHangup = false;
    if (loopRef.current.silenceTimer) clearTimeout(loopRef.current.silenceTimer);

    if (micRef.current) {
      try { micRef.current.stop(); } catch (e) { }
    }

    runQuery(q);
  };

  const handleRandomQuerySelect = (query) => {
    setInputValue(query);
    setShowInput(true);
  };

  const handleTypingDone = () => {
    setTyping(false);
  };

  const renderModalContent = () => {
    switch (activeModal) {
      case 'profile': return { title: "Profile Setup", component: <ProfileScreen theme={theme} user={user} userName={userName} setUserName={setUserName} /> };
      case 'history': return { title: "Recent Activity", component: <HistoryScreen theme={theme} user={user} onClose={() => setActiveModal(null)} /> };
      case 'personalization': return { title: "Personalization", component: <PersonalizationScreen theme={theme} selectedVoice={selectedVoice} setSelectedVoice={setSelectedVoice} /> };
      case 'feedback': return { title: "Submit Feedback", component: <FeedbackScreen theme={theme} /> };
      case 'support': return { title: "Contact Support", component: <SupportScreen theme={theme} /> };
      default: return { title: "", component: null };
    }
  };
  const modalData = renderModalContent();

  const handleAudioRef = useCallback((node) => {
    if (node) loopRef.current.audioPlayer = node;
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, width: "100vw", height: "100dvh", background: "#000",
      overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale",
    }}>
      <style>{`
        html, body { margin: 0; padding: 0; background: #000; overscroll-behavior-y: none; }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { display: none; }
        button:focus-visible, input:focus-visible, textarea:focus-visible, select:focus-visible { outline: 2px solid #7c3aed; outline-offset: 2px; }
        input:focus, textarea:focus { border-color: rgba(124,58,237,0.5) !important; }
        input::placeholder, textarea::placeholder { color: rgba(140,140,160,0.45); }
        @keyframes blinkCursor { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes dotBeat { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
        
        .query-slider-container {
          margin-top: 6px;
          height: 32px;
        }
        @media (max-aspect-ratio: 3/4), (max-width: 600px) { 
          .query-slider-container {
            margin-top: 12vh; 
            height: 48px; /* Gives enough height for wrapped text to not get cut in half */
          }
        }
      `}</style>

      <audio ref={handleAudioRef} style={{ display: "none" }} onEnded={handleAudioEnd} />

      <SpatialCameraWindow isActive={isCameraMode} onClose={() => setIsCameraMode(false)} videoRef={videoRef} />

      <AnimatePresence>
        {activeModal === 'history' && (
          <motion.div key="history-modal"
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
              overflowY: "auto", WebkitOverflowScrolling: "touch",
              boxShadow: "0 40px 100px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.2)"
            }}
          >
            <h2 style={{ margin: "0 0 24px 0", fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", color: theme.text }}>{modalData.title}</h2>
            {modalData.component}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(activeModal && activeModal !== 'history') && (
          <motion.div key="general-modal"
            initial={{ opacity: 0, y: 60, scale: 0.9, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 40, scale: 0.95, filter: "blur(8px)", transition: { duration: 0.25 } }}
            transition={{ type: "spring", stiffness: 250, damping: 28 }}
            style={{
              position: "absolute", zIndex: 100, width: "min(90vw, 540px)", maxHeight: "85dvh",
              background: isDark ? "rgba(15,15,20,0.65)" : "rgba(250,250,252,0.65)",
              backdropFilter: "blur(48px)", WebkitBackdropFilter: "blur(48px)",
              border: `1px solid rgba(255,255,255,0.15)`,
              borderRadius: 40, padding: "clamp(24px, 4vw, 40px)", display: "flex", flexDirection: "column",
              color: theme.text, overflowY: "auto", WebkitOverflowScrolling: "touch",
              boxShadow: "0 40px 100px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.2)"
            }}
          >
            <h2 style={{ margin: "0 0 28px 0", fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em", color: theme.text }}>{modalData?.title}</h2>
            {modalData?.component}
          </motion.div>
        )}
      </AnimatePresence>

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

        <Navbar theme={theme} isDark={isDark} onToggleTheme={handleToggleTheme} ribbonSplit={effectiveSplit} isAppMuted={isAppMuted} isCameraMode={isCameraMode} onOpenModal={setActiveModal} activeModal={activeModal} onLogout={onLogout} />

        <div style={{
          position: "relative", zIndex: 10, display: "flex", flexDirection: "column",
          alignItems: effectiveSplit ? "flex-start" : "center",
          justifyContent: "center",
          width: "100%",
          textAlign: effectiveSplit ? "left" : "center",
          paddingLeft: effectiveSplit ? "clamp(90px, 12vw, 200px)" : "clamp(28px,8vw,130px)",
          paddingRight: "clamp(28px,8vw,130px)",
          paddingBottom: "18dvh", paddingTop: 100,
          transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)"
        }}>

          <AnimatePresence mode="wait">
            {showGreeting && !isCameraMode && (
              <motion.div key="greeting" initial={{ opacity: 0, y: 20, filter: "blur(10px)" }} animate={{ opacity: greetingVisible ? 1 : 0, y: greetingVisible ? 0 : -30, filter: greetingVisible ? "blur(0px)" : "blur(12px)", scale: greetingVisible ? 1 : 0.9 }} exit={{ opacity: 0, y: -30, filter: "blur(12px)", scale: 0.9 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                <p style={{ margin: 0, fontSize: "clamp(15px, 2vw, 18px)", color: theme.textMuted, fontWeight: 400, letterSpacing: "0.01em" }}>{greetingText}, {userName?.split(' ')[0] || "Guest"}</p>
                <p style={{ margin: 0, fontSize: "clamp(32px, 4.5vw, 46px)", color: theme.text, fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1.2 }}>How can I help you?</p>

                <QuerySlider theme={theme} onSelect={handleRandomQuerySelect} />

              </motion.div>
            )}

            {showQuery && (
              <motion.div
                key="query"
                initial={{ opacity: 0, y: 30, filter: "blur(12px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -20, filter: "blur(8px)" }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                style={{ display: "flex", flexDirection: "column", gap: "16px", alignItems: effectiveSplit ? "flex-start" : "center", width: "100%" }}
              >

                <div style={{ minHeight: "clamp(36px, 6vw, 70px)", display: "flex", alignItems: "flex-end" }}>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={currentPrompt}
                      initial={{ opacity: 0, y: 15, filter: "blur(8px)", scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
                      exit={{ opacity: 0, y: -10, filter: "blur(4px)", scale: 0.98, transition: { duration: 0.15 } }}
                      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      style={{ margin: 0, fontSize: "clamp(28px, 4.5vw, 48px)", color: theme.text, fontWeight: 400, letterSpacing: "-0.04em", lineHeight: 1.1, maxWidth: "min(900px, 85vw)", transformOrigin: effectiveSplit ? "left center" : "center" }}
                    >
                      {currentPrompt}
                    </motion.p>
                  </AnimatePresence>
                </div>

                <AnimatePresence mode="wait">
                  {currentResponse && (
                    <motion.div
                      key={phase === PHASES.PROCESSING ? "thinking" : "responding"}
                      initial={{ opacity: 0, y: 15, filter: "blur(8px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: -10, filter: "blur(4px)", transition: { duration: 0.15 } }}
                      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <p style={{ margin: 0, fontSize: "clamp(16px, 2.2vw, 22px)", color: theme.textMuted, fontWeight: 400, lineHeight: 1.4, letterSpacing: "-0.01em", maxWidth: "min(720px, 75vw)" }}>
                        {typing && phase === PHASES.RESPONDING ? <TypingText text={currentResponse} speed={36} onDone={handleTypingDone} /> : currentResponse}
                      </p>

                      <AnimatePresence>
                        {currentCard && currentCard.type === 'weather' && phase === PHASES.RESPONDING && (
                          <WeatherCard key="weather-card" data={currentCard} theme={theme} />
                        )}
                      </AnimatePresence>

                    </motion.div>
                  )}
                </AnimatePresence>

              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 20, display: "flex", flexDirection: "column", alignItems: "center", paddingBottom: "calc(env(safe-area-inset-bottom, 12px) + clamp(24px, 5vh, 56px))", gap: 16 }}>
          <AnimatePresence>
            {showInput && !isCameraMode && (
              <motion.div key="textinput" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 14 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} style={{ display: "flex", gap: 10, width: "min(520px,86vw)", marginBottom: 8 }}>
                <input autoFocus value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={e => e.key === "Enter" && handleTextSubmit()} placeholder="Type your question…" style={{ flex: 1, height: 50, borderRadius: 999, border: `1px solid ${theme.inputBorder}`, background: theme.inputBg, backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)", color: theme.text, fontSize: "16px", fontWeight: 400, padding: "0 22px", outline: "none", fontFamily: "inherit", letterSpacing: "-0.01em", transition: "border-color 0.28s cubic-bezier(0.16,1,0.3,1), background 0.4s", WebkitAppearance: "none" }} />
                <motion.button onClick={handleTextSubmit} whileTap={{ scale: 0.94 }} whileHover={{ scale: 1.04 }} style={{ height: 50, borderRadius: 999, border: "1px solid rgba(124,58,237,0.4)", background: "rgba(124,58,237,0.32)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", color: "rgba(255,255,255,0.9)", fontSize: "clamp(13px,1.4vw,15px)", fontWeight: 500, letterSpacing: "0.01em", padding: "0 26px", cursor: "pointer", fontFamily: "inherit", outline: "none" }}>Ask</motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div onMouseEnter={() => setIsDockHovered(true)} onMouseLeave={() => setIsDockHovered(false)} style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative", height: "clamp(60px, 8vw, 80px)", width: "clamp(200px, 25vw, 240px)" }}>
            <motion.button onClick={() => { if (phase !== PHASES.PROCESSING && phase !== PHASES.RESPONDING) setShowInput(p => !p); }} animate={{ x: isDockExpanded ? -80 : 0, opacity: isDockExpanded ? 1 : 0, scale: isDockExpanded ? 1 : 0.5 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} whileHover={{ scale: isDockExpanded ? 1.05 : 1, backgroundColor: theme.buttonBg }} whileTap={{ scale: 0.92 }} style={{ position: "absolute", zIndex: 5, width: "clamp(46px,5vw,56px)", height: "clamp(46px,5vw,56px)", borderRadius: "50%", border: `1px solid ${theme.buttonBorder}`, background: showInput ? theme.bgSecondary : theme.navBg, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", cursor: (phase === PHASES.PROCESSING || phase === PHASES.RESPONDING) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", outline: "none", pointerEvents: isDockExpanded ? "auto" : "none" }}>
              <svg width="clamp(18px,2.2vw,22px)" height="clamp(18px,2.2vw,22px)" viewBox="0 0 24 24" fill="none" stroke={theme.text} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="3" /><path d="M7 8h.01M11 8h.01M15 8h.01M7 12h.01M11 12h.01M15 12h.01M7 16h10" /></svg>
            </motion.button>
            <div style={{ position: "relative", zIndex: 10 }}>
              <LiquidOrb onTap={handleOrbTap} onCameraMode={() => setIsCameraMode(true)} phase={phase} theme={theme} isCameraMode={isCameraMode} isAppMuted={isAppMuted} />
            </div>
            <motion.button onClick={handleOrbTap} animate={{ x: isDockExpanded ? 80 : 0, opacity: isDockExpanded ? 1 : 0, scale: isDockExpanded ? 1 : 0.5 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} whileHover={{ scale: isDockExpanded ? 1.05 : 1, backgroundColor: theme.buttonBg }} whileTap={{ scale: 0.92 }} style={{ position: "absolute", zIndex: 5, width: "clamp(46px,5vw,56px)", height: "clamp(46px,5vw,56px)", borderRadius: "50%", border: `1px solid ${theme.buttonBorder}`, background: theme.navBg, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", cursor: (phase === PHASES.PROCESSING || phase === PHASES.RESPONDING) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", outline: "none", pointerEvents: isDockExpanded ? "auto" : "none" }}>
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