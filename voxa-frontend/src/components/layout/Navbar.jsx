import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VoxaLogo } from "../icons/Icons";

function NavPill({ theme }) {
    return <motion.div layoutId="nav-pill" style={{ position: "absolute", inset: 0, borderRadius: 999, background: theme.bgSecondary, zIndex: 1, pointerEvents: "none" }} transition={{ type: "spring", stiffness: 400, damping: 30 }} />;
}

function SettingsDropdown({ theme, isDark, onToggleTheme, onClose, onOpenModal, onLogout }) {
    const items = [
        { label: isDark ? "Light Mode" : "Dark Mode", action: onToggleTheme },
        { label: "Profile Setup", action: () => onOpenModal("profile") },
        { label: "Chat History", action: () => onOpenModal("history") },
        { label: "Core Memories (Brain)", action: () => onOpenModal("brain") },
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
                    <button onClick={() => { item.action?.(); if (item.label !== "Light Mode" && item.label !== "Dark Mode" && item.label !== "Logout") onClose(); }} style={{ display: "flex", alignItems: "center", width: "100%", padding: "10px 20px", background: "transparent", border: "none", color: item.danger ? theme.danger : theme.text, fontSize: 14, fontWeight: 500, letterSpacing: "-0.01em", cursor: "pointer", fontFamily: "inherit", textAlign: "left", transition: "background 0.15s ease", outline: "none" }} onMouseEnter={e => e.currentTarget.style.background = theme.dropdownHover} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>{item.label}</button>
                </div>
            ))}
        </motion.div>
    );
}

export default function Navbar({ theme, isDark, onToggleTheme, ribbonSplit, isAppMuted, isCameraMode, onOpenModal, activeModal, onLogout }) {
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [hoveredTab, setHoveredTab] = useState(null);
    const settingsRef = useRef(null);
    const isExpanded = !ribbonSplit && !isCameraMode;

    useEffect(() => {
        const handler = (e) => { if (settingsRef.current && !settingsRef.current.contains(e.target)) setSettingsOpen(false); };
        document.addEventListener("mousedown", handler); return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => { if (isAppMuted) { setSettingsOpen(false); setHoveredTab(null); } }, [isAppMuted]);

    const navBtnStyle = (isActive) => ({ position: "relative", background: "none", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: 500, letterSpacing: "0.01em", color: isActive ? theme.text : theme.textMuted, fontFamily: "inherit", padding: "6px 14px", borderRadius: 999, outline: "none", whiteSpace: "nowrap", zIndex: 10, transition: "color 0.2s" });

    return (
        <div style={{ position: "fixed", top: "clamp(16px, 3vh, 24px)", left: 0, right: 0, zIndex: 100, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
            <motion.nav initial={false} animate={{ width: isExpanded ? "auto" : 44, background: isAppMuted ? "rgba(0,0,0,0.6)" : theme.navBg, borderColor: isAppMuted ? "rgba(255,255,255,0.15)" : theme.navBorder }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} style={{ height: 44, borderRadius: 22, display: "flex", alignItems: "center", pointerEvents: isAppMuted ? "none" : "auto", backdropFilter: "blur(44px)", WebkitBackdropFilter: "blur(44px)", boxShadow: "0 12px 32px rgba(0,0,0,0.15)", borderStyle: "solid", borderWidth: 1, overflow: settingsOpen ? "visible" : "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", width: "max-content", padding: "0 8px" }}>
                    <div style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><VoxaLogo /></div>
                    <motion.div animate={{ opacity: isExpanded ? 1 : 0 }} transition={{ duration: 0.3 }} style={{ display: "flex", alignItems: "center", pointerEvents: isExpanded ? "auto" : "none" }}>
                        <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em", color: theme.text, whiteSpace: "nowrap", paddingLeft: 10, paddingRight: 10 }}>Voxa</span>
                        <div style={{ width: 1, height: 16, background: theme.navBorder, margin: "0 12px" }} />
                        <div style={{ display: "flex", gap: "2px", position: "relative" }} onMouseLeave={() => setHoveredTab(null)}>
                            <div style={{ position: "relative" }}>{hoveredTab === "history" && <NavPill theme={theme} />}<button style={navBtnStyle(activeModal === "history" || hoveredTab === "history")} onClick={() => onOpenModal("history")} onMouseEnter={() => setHoveredTab("history")}>History</button></div>
                            <div style={{ position: "relative" }}>{hoveredTab === "profile" && <NavPill theme={theme} />}<button style={navBtnStyle(activeModal === "profile" || hoveredTab === "profile")} onClick={() => onOpenModal("profile")} onMouseEnter={() => setHoveredTab("profile")}>Profile</button></div>
                            <div ref={settingsRef} style={{ position: "relative" }}>
                                {hoveredTab === "settings" && <NavPill theme={theme} />}
                                <button style={navBtnStyle(settingsOpen || hoveredTab === "settings")} onClick={() => setSettingsOpen(!settingsOpen)} onMouseEnter={() => setHoveredTab("settings")}>Settings ▾</button>
                                <AnimatePresence>{settingsOpen && <SettingsDropdown theme={theme} isDark={isDark} onToggleTheme={onToggleTheme} onClose={() => setSettingsOpen(false)} onOpenModal={onOpenModal} onLogout={onLogout} />}</AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </motion.nav>
        </div>
    );
}