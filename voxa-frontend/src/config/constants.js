// src/config/constants.js

export const PHASES = {
    IDLE: "idle",
    LISTENING: "listening",
    PROCESSING: "processing",
    RESPONDING: "responding",
};

export const SAMPLE_QUERIES = [
    "Build a chatbot using Gemini API",
    "How to integrate Arduino with React?",
    "What is the weather in Chavakkad?",
    "Summarize today's top financial news.",
    "What is a long ball counter formation?",
    "Write a MERN stack authentication guide.",
];

export const PHASE_CONFIG = {
    [PHASES.IDLE]: { colors: ["#7c3aed", "#9333ea", "#c026d3", "#db2777"], label: "", speed: 0.8, amplitude: 0.13 },
    [PHASES.LISTENING]: { colors: ["#f59e0b", "#f97316", "#84cc16", "#22c55e"], label: "Listening", speed: 4.5, amplitude: 0.26 },
    [PHASES.PROCESSING]: { colors: ["#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6"], label: "Thinking", speed: 2.5, amplitude: 0.19 },
    [PHASES.RESPONDING]: { colors: ["#7c3aed", "#a855f7", "#ec4899", "#f43f5e"], label: "Speaking", speed: 3.5, amplitude: 0.16 },
};

export const THEMES = {
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

export function lerp(a, b, t) { return a + (b - a) * t; }
export function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }
export function hexToRgb(hex) { return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]; }
export function rgbToHex(r, g, b) { return "#" + [r, g, b].map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join(""); }
export function lerpColor(hexA, hexB, t) {
    const [r1, g1, b1] = hexToRgb(hexA); const [r2, g2, b2] = hexToRgb(hexB);
    return rgbToHex(lerp(r1, r2, t), lerp(g1, g2, t), lerp(b1, b2, t));
}