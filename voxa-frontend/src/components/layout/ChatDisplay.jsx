import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PHASES } from "../../config/constants";
import { QuerySlider, TypingText } from "./QueryElements";
import WeatherCard from "../visuals/WeatherCard";
import SportsCard from "../cards/SportsCard";
import CryptoCard from "../cards/CryptoCard";
// 🎨 UI PIPELINE FIX: NASA APOD premium visual card
import NasaApodCard from "../cards/NasaApodCard";
// 🎨 BATCH 1: Master Widget Renderer for new card types
import WidgetRenderer from "../cards/WidgetRenderer";

export default function ChatDisplay({
    theme, showGreeting, isCameraMode, greetingText, userName, handleRandomQuerySelect,
    showQuery, effectiveSplit, currentPrompt, currentResponse, phase, typing, handleTypingDone, currentCard
}) {
    return (
        // 📱 RESPONSIVE FIX: Mobile-first layout container
        // - Uses percentage + clamp padding that collapses gracefully on small screens
        // - paddingLeft: mobile gets 20px, tablets get 6vw, desktop gets the full split offset
        // - paddingBottom: uses safe-area-inset + dvh for mobile keyboard safety
        // - Added overflow-y-auto to allow scrolling on long responses/widgets on mobile
        <div style={{
            position: "relative",
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: effectiveSplit ? "flex-start" : "center",
            justifyContent: "center",
            width: "100%",
            textAlign: effectiveSplit ? "left" : "center",
            // 📱 RESPONSIVE FIX: Mobile-first padding — collapses to 20px on small screens
            paddingLeft: effectiveSplit ? "clamp(20px, 8vw, 200px)" : "clamp(16px, 5vw, 130px)",
            paddingRight: "clamp(16px, 5vw, 130px)",
            // 📱 RESPONSIVE FIX: Reduced bottom padding on mobile to give widgets more room
            paddingBottom: "clamp(100px, 18dvh, 200px)",
            paddingTop: "clamp(72px, 10vh, 100px)",
            transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
            // 📱 RESPONSIVE FIX: Enable vertical scrolling for long widget content on mobile
            overflowY: "auto",
            overflowX: "hidden",
            maxHeight: "100%",
            WebkitOverflowScrolling: "touch",
        }}>
            <AnimatePresence mode="wait">
                {showGreeting && !isCameraMode && (
                    <motion.div key="greeting" initial={{ opacity: 0, y: 20, filter: "blur(10px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }} exit={{ opacity: 0, y: -30, filter: "blur(12px)", scale: 0.9 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                        {/* 📱 RESPONSIVE FIX: Fluid greeting text sizes */}
                        <p style={{ margin: 0, fontSize: "clamp(14px, 2vw, 18px)", color: theme.textMuted, fontWeight: 400, letterSpacing: "0.01em" }}>{greetingText}, {userName?.split(' ')[0] || "Guest"}</p>
                        <p style={{ margin: 0, fontSize: "clamp(26px, 4vw, 46px)", color: theme.text, fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1.2 }}>How can I help you?</p>
                        <QuerySlider theme={theme} onSelect={handleRandomQuerySelect} />
                    </motion.div>
                )}

                {showQuery && (
                    <motion.div key="query" initial={{ opacity: 0, y: 30, filter: "blur(12px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -20, filter: "blur(8px)" }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} style={{ display: "flex", flexDirection: "column", gap: "16px", alignItems: effectiveSplit ? "flex-start" : "center", width: "100%" }}>
                        {/* 📱 RESPONSIVE FIX: Fluid prompt container height */}
                        <div style={{ minHeight: "clamp(30px, 5vw, 70px)", display: "flex", alignItems: "flex-end" }}>
                            <AnimatePresence mode="wait">
                                {/* 📱 RESPONSIVE FIX: Prompt text scales from 22px on mobile to 48px on ultrawide */}
                                <motion.p key={currentPrompt} initial={{ opacity: 0, y: 15, filter: "blur(8px)", scale: 0.98 }} animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }} exit={{ opacity: 0, y: -10, filter: "blur(4px)", scale: 0.98, transition: { duration: 0.15 } }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} style={{ margin: 0, fontSize: "clamp(22px, 3.5vw, 48px)", color: theme.text, fontWeight: 400, letterSpacing: "-0.04em", lineHeight: 1.1, maxWidth: "min(900px, 92vw)", transformOrigin: effectiveSplit ? "left center" : "center", wordBreak: "break-word", overflowWrap: "break-word" }}>{currentPrompt}</motion.p>
                            </AnimatePresence>
                        </div>
                        <AnimatePresence mode="wait">
                            {currentResponse && (
                                <motion.div key={phase === PHASES.PROCESSING ? "thinking" : "responding"} initial={{ opacity: 0, y: 15, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -10, filter: "blur(4px)", transition: { duration: 0.15 } }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} style={{ width: "100%", maxWidth: "min(720px, 92vw)" }}>
                                    {/* 📱 RESPONSIVE FIX: Response text scales down on mobile, word-break prevents overflow */}
                                    <p style={{ margin: 0, fontSize: "clamp(15px, 2vw, 22px)", color: theme.textMuted, fontWeight: 400, lineHeight: 1.4, letterSpacing: "-0.01em", maxWidth: "100%", wordBreak: "break-word", overflowWrap: "break-word" }}>{typing && phase === PHASES.RESPONDING ? <TypingText text={currentResponse} speed={36} onDone={handleTypingDone} /> : currentResponse}</p>

                                    {/* 📱 RESPONSIVE FIX: Widget container — strictly fluid, prevents horizontal overflow */}
                                    <div style={{ width: "100%", maxWidth: "100%", overflowX: "hidden", overflowY: "visible" }}>
                                        <AnimatePresence>
                                            {/* 🚀 JSON CARD WIDGET ROUTER */}
                                            {currentCard && currentCard.type === 'weather' && phase === PHASES.RESPONDING && <WeatherCard key="weather-card" data={currentCard} theme={theme} />}
                                            {currentCard && currentCard.type === 'sports' && phase === PHASES.RESPONDING && <SportsCard key="sports-card" data={currentCard} theme={theme} />}
                                            {currentCard && currentCard.type === 'crypto' && phase === PHASES.RESPONDING && <CryptoCard key="crypto-card" coin={currentCard.coin} price={currentCard.price} change={currentCard.change} theme={theme} />}
                                            {/* 🎨 UI PIPELINE FIX: NASA APOD visual card */}
                                            {currentCard && currentCard.type === 'apod' && phase === PHASES.RESPONDING && <NasaApodCard key="apod-card" data={currentCard} />}

                                            {/* 🎨 ALL BATCHES: WidgetRenderer handles all 17 card types */}
                                            {currentCard && ['briefing', 'finance', 'fitness', 'forecast', 'receipt', 'flight', 'currency', 'translate', 'timezone', 'news', 'movie', 'recipe', 'stock', 'medicine', 'countdown', 'calculator', 'search'].includes(currentCard.type) && phase === PHASES.RESPONDING && (
                                                <WidgetRenderer key={`widget-${currentCard.type}`} card={currentCard} />
                                            )}
                                        </AnimatePresence>
                                    </div>

                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}