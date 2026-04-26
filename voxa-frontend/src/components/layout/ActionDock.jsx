import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PHASES } from "../../config/constants";
import { IconImage } from "../icons/Icons";
import LiquidOrb from "../visuals/LiquidOrb";

export default function ActionDock({
    theme, showInput, isCameraMode, uploadedImage, setUploadedImage, fileInputRef, handleFileChange,
    inputValue, setInputValue, handleTextSubmit, setIsDockHovered, isDockExpanded, setShowInput,
    phase, handleOrbTap, setIsCameraMode, isAppMuted
}) {
    return (
        // 📱 RESPONSIVE FIX: Bottom dock — uses safe-area-inset-bottom for iOS notch/home bar
        // padding scales down on mobile to keep input bar from being too high
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 20, display: "flex", flexDirection: "column", alignItems: "center", paddingBottom: "calc(env(safe-area-inset-bottom, 8px) + clamp(12px, 3vh, 56px))", gap: "clamp(8px, 1.5vh, 16px)" }}>
            <AnimatePresence>
                {showInput && !isCameraMode && (
                    // 📱 RESPONSIVE FIX: Input container — wider on mobile (92vw), capped at 520px on desktop
                    <motion.div key="textinput" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 14 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "min(520px, 92vw)", marginBottom: 8 }}>

                        {/* 📸 Image Upload Preview */}
                        <AnimatePresence>
                            {uploadedImage && (
                                <motion.div initial={{ opacity: 0, y: 10, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ width: "100%", display: "flex", justifyContent: "flex-start", marginBottom: 12 }}>
                                    {/* 📱 RESPONSIVE FIX: Slightly smaller image preview on mobile */}
                                    <div style={{ position: "relative", width: "clamp(64px, 15vw, 80px)", height: "clamp(64px, 15vw, 80px)", borderRadius: 12, border: `1px solid ${theme.buttonBorder}`, overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
                                        <img src={uploadedImage} alt="Upload preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                        {/* 📱 RESPONSIVE FIX: 44px touch target for close button on mobile */}
                                        <button onClick={() => setUploadedImage(null)} style={{ position: "absolute", top: 2, right: 2, width: 28, height: 28, minWidth: 44, minHeight: 44, borderRadius: "50%", background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14, padding: 0 }}>✕</button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div style={{ display: "flex", gap: "clamp(6px, 1.5vw, 10px)", width: "100%" }}>
                            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: "none" }} />
                            {/* 📱 RESPONSIVE FIX: Image upload button meets 44px minimum touch target */}
                            <motion.button onClick={() => fileInputRef.current?.click()} whileTap={{ scale: 0.94 }} whileHover={{ scale: 1.04 }} style={{ height: "clamp(44px, 6vw, 50px)", width: "clamp(44px, 6vw, 50px)", borderRadius: "50%", border: `1px solid ${theme.inputBorder}`, background: theme.inputBg, backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)", color: theme.text, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, outline: "none" }}>
                                <IconImage />
                            </motion.button>
                            {/* 📱 RESPONSIVE FIX: Input field — min 44px height, 16px font prevents iOS zoom */}
                            <input autoFocus value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={e => e.key === "Enter" && handleTextSubmit()} placeholder="Type your question…" style={{ flex: 1, height: "clamp(44px, 6vw, 50px)", borderRadius: 999, border: `1px solid ${theme.inputBorder}`, background: theme.inputBg, backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)", color: theme.text, fontSize: "16px", fontWeight: 400, padding: "0 clamp(14px, 3vw, 22px)", outline: "none", fontFamily: "inherit", letterSpacing: "-0.01em", transition: "border-color 0.28s cubic-bezier(0.16,1,0.3,1), background 0.4s", WebkitAppearance: "none", minWidth: 0 }} />
                            {/* 📱 RESPONSIVE FIX: Ask button — min 44px height, fluid padding */}
                            <motion.button onClick={handleTextSubmit} whileTap={{ scale: 0.94 }} whileHover={{ scale: 1.04 }} style={{ height: "clamp(44px, 6vw, 50px)", borderRadius: 999, border: "1px solid rgba(124,58,237,0.4)", background: "rgba(124,58,237,0.32)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", color: "rgba(255,255,255,0.9)", fontSize: "clamp(13px, 1.4vw, 15px)", fontWeight: 500, letterSpacing: "0.01em", padding: "0 clamp(16px, 3vw, 26px)", cursor: "pointer", fontFamily: "inherit", outline: "none", whiteSpace: "nowrap" }}>Ask</motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 📱 RESPONSIVE FIX: Orb dock — fluid width/height, meets minimum touch targets */}
            <motion.div onMouseEnter={() => setIsDockHovered(true)} onMouseLeave={() => setIsDockHovered(false)} style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative", height: "clamp(56px, 8vw, 80px)", width: "clamp(180px, 25vw, 240px)" }}>
                {/* 📱 RESPONSIVE FIX: Keyboard toggle button — enforced 44px min touch target */}
                <motion.button onClick={() => { if (phase !== PHASES.PROCESSING && phase !== PHASES.RESPONDING) setShowInput(p => !p); }} animate={{ x: isDockExpanded ? -80 : 0, opacity: isDockExpanded ? 1 : 0, scale: isDockExpanded ? 1 : 0.5 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} whileHover={{ scale: isDockExpanded ? 1.05 : 1, backgroundColor: theme.buttonBg }} whileTap={{ scale: 0.92 }} style={{ position: "absolute", zIndex: 5, width: "clamp(44px, 5vw, 56px)", height: "clamp(44px, 5vw, 56px)", borderRadius: "50%", border: `1px solid ${theme.buttonBorder}`, background: showInput ? theme.bgSecondary : theme.navBg, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", cursor: (phase === PHASES.PROCESSING || phase === PHASES.RESPONDING) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", outline: "none", pointerEvents: isDockExpanded ? "auto" : "none" }}>
                    <svg width="clamp(18px, 2.2vw, 22px)" height="clamp(18px, 2.2vw, 22px)" viewBox="0 0 24 24" fill="none" stroke={theme.text} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="3" /><path d="M7 8h.01M11 8h.01M15 8h.01M7 12h.01M11 12h.01M15 12h.01M7 16h10" /></svg>
                </motion.button>

                <div style={{ position: "relative", zIndex: 10 }}>
                    <LiquidOrb onTap={handleOrbTap} onCameraMode={() => setIsCameraMode(true)} phase={phase} theme={theme} isCameraMode={isCameraMode} isAppMuted={isAppMuted} />
                </div>

                {/* 📱 RESPONSIVE FIX: Voice/action button — enforced 44px min touch target */}
                <motion.button onClick={handleOrbTap} animate={{ x: isDockExpanded ? 80 : 0, opacity: isDockExpanded ? 1 : 0, scale: isDockExpanded ? 1 : 0.5 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} whileHover={{ scale: isDockExpanded ? 1.05 : 1, backgroundColor: theme.buttonBg }} whileTap={{ scale: 0.92 }} style={{ position: "absolute", zIndex: 5, width: "clamp(44px, 5vw, 56px)", height: "clamp(44px, 5vw, 56px)", borderRadius: "50%", border: `1px solid ${theme.buttonBorder}`, background: theme.navBg, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", cursor: (phase === PHASES.PROCESSING || phase === PHASES.RESPONDING) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", outline: "none", pointerEvents: isDockExpanded ? "auto" : "none" }}>
                    <svg width="clamp(18px, 2.2vw, 22px)" height="clamp(18px, 2.2vw, 22px)" viewBox="0 0 24 24" fill="none" stroke={theme.text} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" /><polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" /></svg>
                </motion.button>
            </motion.div>

            {!isCameraMode && <motion.p onClick={() => { if (!isAppMuted) setIsCameraMode(true) }} animate={{ backgroundPosition: ["200% center", "-200% center"] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} style={{ marginTop: "clamp(2px, 0.5vh, 8px)", fontSize: "clamp(8px, 1vw, 11px)", letterSpacing: "0.18em", fontWeight: 600, textTransform: "uppercase", userSelect: "none", cursor: "pointer", pointerEvents: "auto", textAlign: "center", backgroundImage: `linear-gradient(90deg, ${theme.textFaint} 0%, ${theme.text} 50%, ${theme.textFaint} 100%)`, backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>SWIPE UP ↑ FOR CAMERA</motion.p>}
        </div>
    );
}