import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PHASES } from "../../config/constants";
import { QuerySlider, TypingText } from "./QueryElements";
import WeatherCard from "../visuals/WeatherCard";

export default function ChatDisplay({
    theme, showGreeting, isCameraMode, greetingText, userName, handleRandomQuerySelect,
    showQuery, effectiveSplit, currentPrompt, currentResponse, phase, typing, handleTypingDone, currentCard
}) {
    return (
        <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: effectiveSplit ? "flex-start" : "center", justifyContent: "center", width: "100%", textAlign: effectiveSplit ? "left" : "center", paddingLeft: effectiveSplit ? "clamp(90px, 12vw, 200px)" : "clamp(28px,8vw,130px)", paddingRight: "clamp(28px,8vw,130px)", paddingBottom: "18dvh", paddingTop: 100, transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)" }}>
            <AnimatePresence mode="wait">
                {showGreeting && !isCameraMode && (
                    <motion.div key="greeting" initial={{ opacity: 0, y: 20, filter: "blur(10px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }} exit={{ opacity: 0, y: -30, filter: "blur(12px)", scale: 0.9 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                        <p style={{ margin: 0, fontSize: "clamp(15px, 2vw, 18px)", color: theme.textMuted, fontWeight: 400, letterSpacing: "0.01em" }}>{greetingText}, {userName?.split(' ')[0] || "Guest"}</p>
                        <p style={{ margin: 0, fontSize: "clamp(32px, 4.5vw, 46px)", color: theme.text, fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1.2 }}>How can I help you?</p>
                        <QuerySlider theme={theme} onSelect={handleRandomQuerySelect} />
                    </motion.div>
                )}

                {showQuery && (
                    <motion.div key="query" initial={{ opacity: 0, y: 30, filter: "blur(12px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -20, filter: "blur(8px)" }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} style={{ display: "flex", flexDirection: "column", gap: "16px", alignItems: effectiveSplit ? "flex-start" : "center", width: "100%" }}>
                        <div style={{ minHeight: "clamp(36px, 6vw, 70px)", display: "flex", alignItems: "flex-end" }}>
                            <AnimatePresence mode="wait">
                                <motion.p key={currentPrompt} initial={{ opacity: 0, y: 15, filter: "blur(8px)", scale: 0.98 }} animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }} exit={{ opacity: 0, y: -10, filter: "blur(4px)", scale: 0.98, transition: { duration: 0.15 } }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} style={{ margin: 0, fontSize: "clamp(28px, 4.5vw, 48px)", color: theme.text, fontWeight: 400, letterSpacing: "-0.04em", lineHeight: 1.1, maxWidth: "min(900px, 85vw)", transformOrigin: effectiveSplit ? "left center" : "center" }}>{currentPrompt}</motion.p>
                            </AnimatePresence>
                        </div>
                        <AnimatePresence mode="wait">
                            {currentResponse && (
                                <motion.div key={phase === PHASES.PROCESSING ? "thinking" : "responding"} initial={{ opacity: 0, y: 15, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -10, filter: "blur(4px)", transition: { duration: 0.15 } }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
                                    <p style={{ margin: 0, fontSize: "clamp(16px, 2.2vw, 22px)", color: theme.textMuted, fontWeight: 400, lineHeight: 1.4, letterSpacing: "-0.01em", maxWidth: "min(720px, 75vw)" }}>{typing && phase === PHASES.RESPONDING ? <TypingText text={currentResponse} speed={36} onDone={handleTypingDone} /> : currentResponse}</p>
                                    <AnimatePresence>{currentCard && currentCard.type === 'weather' && phase === PHASES.RESPONDING && <WeatherCard key="weather-card" data={currentCard} theme={theme} />}</AnimatePresence>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}