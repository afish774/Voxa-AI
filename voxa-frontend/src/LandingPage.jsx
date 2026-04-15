import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useMotionTemplate, useMotionValue, useSpring, useMotionValueEvent } from "framer-motion";

// ─────────────────────────────────────────────
// PREMIUM EASING & PHYSICS (Apple-like)
// ─────────────────────────────────────────────
const customEase = [0.16, 1, 0.3, 1]; // Smoother, deeper ease-out
const springConfig = { type: "spring", stiffness: 200, damping: 24, mass: 0.8 };

// ─────────────────────────────────────────────
// THEME COLORS
// ─────────────────────────────────────────────
const themeColors = {
    primary: "#7c3aed",
    secondary: "#db2777",
    gradient: "linear-gradient(135deg, #7c3aed, #db2777)",
    surface: "#ffffff",
    surfaceHover: "#fafafa",
    border: "rgba(0, 0, 0, 0.06)",
    textMain: "#09090b",
    textMuted: "#52525b",
    textFaint: "#a1a1aa"
};

// ─────────────────────────────────────────────
// ICONS
// ─────────────────────────────────────────────
const VoxaLogo = ({ size = 28, color = themeColors.primary }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="8" width="3" height="8" rx="1.5" fill={color} />
        <rect x="10.5" y="4" width="3" height="16" rx="1.5" fill={color} />
        <rect x="18" y="9" width="3" height="6" rx="1.5" fill={color} />
    </svg>
);

const IconMic = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" /></svg>;
const IconBrain = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" /><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" /></svg>;
const IconHistory = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l4 2" /></svg>;
const IconArrowRight = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>;

// ─────────────────────────────────────────────
// AMBIENT MESH BACKGROUND
// ─────────────────────────────────────────────
function AmbientMeshBackground() {
    return (
        <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0, backgroundColor: "#fdfdfd" }}>
            <motion.div animate={{ x: ["0%", "5%", "0%"], y: ["0%", "8%", "0%"], scale: [1, 1.05, 1] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }} style={{ position: "absolute", top: "-10%", left: "5%", width: "50vw", height: "50vw", background: "radial-gradient(circle, rgba(124, 58, 237, 0.08) 0%, rgba(255,255,255,0) 70%)", filter: "blur(90px)", borderRadius: "50%", willChange: "transform" }} />
            <motion.div animate={{ x: ["0%", "-5%", "0%"], y: ["0%", "-10%", "0%"], scale: [1, 1.1, 1] }} transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 2 }} style={{ position: "absolute", bottom: "10%", right: "-5%", width: "60vw", height: "60vw", background: "radial-gradient(circle, rgba(219, 39, 119, 0.06) 0%, rgba(255,255,255,0) 70%)", filter: "blur(100px)", borderRadius: "50%", willChange: "transform" }} />
            <div style={{ position: "absolute", inset: 0, opacity: 0.25, mixBlendMode: "overlay", backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />
        </div>
    );
}

// ─────────────────────────────────────────────
// CINEMATIC TEXT REVEAL COMPONENT
// ─────────────────────────────────────────────
const RevealText = ({ text, delay = 0, style }) => {
    const words = text.split(" ");
    return (
        <span style={{ display: "inline-flex", flexWrap: "wrap", justifyContent: "center", ...style }}>
            {words.map((word, i) => (
                <span key={i} style={{ display: "inline-block", overflow: "hidden", marginRight: "0.2em", paddingBottom: "0.1em" }}>
                    <motion.span
                        initial={{ y: "120%", rotateZ: 3, opacity: 0 }}
                        animate={{ y: "0%", rotateZ: 0, opacity: 1 }}
                        transition={{ duration: 0.8, ease: customEase, delay: delay + i * 0.06 }}
                        style={{ display: "inline-block", transformOrigin: "bottom left", willChange: "transform, opacity" }}
                    >
                        {word}
                    </motion.span>
                </span>
            ))}
        </span>
    );
};

// ─────────────────────────────────────────────
// PREMIUM SPOTLIGHT BENTO CARD
// ─────────────────────────────────────────────
function SpotlightCard({ children, className, style }) {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }) {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    return (
        <motion.div
            onMouseMove={handleMouseMove}
            whileHover={{ y: -4, boxShadow: "0 40px 80px -20px rgba(0,0,0,0.08), 0 10px 20px -5px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,1)" }}
            transition={springConfig}
            style={{
                position: "relative", overflow: "hidden", background: "linear-gradient(180deg, #ffffff 0%, #fafafa 100%)",
                borderRadius: 36, border: `1px solid ${themeColors.border}`,
                boxShadow: "0 10px 30px -10px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,1)",
                willChange: "transform, box-shadow", ...style
            }}
            className={className}
        >
            <motion.div
                className="pointer-events-none absolute -inset-px opacity-0 transition duration-500"
                whileHover={{ opacity: 1 }}
                style={{
                    background: useMotionTemplate`radial-gradient(800px circle at ${mouseX}px ${mouseY}px, rgba(124, 58, 237, 0.04), transparent 60%)`,
                    zIndex: 1,
                    position: "absolute", inset: 0
                }}
            />
            <div style={{ position: "relative", zIndex: 2, padding: "clamp(32px, 5vw, 48px)", height: "100%", display: "flex", flexDirection: "column" }}>
                {children}
            </div>
        </motion.div>
    );
}

// ─────────────────────────────────────────────
// SCROLL-LINKED STICKY HOW-IT-WORKS
// ─────────────────────────────────────────────
function StickyTimeline() {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });

    const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
    const lineHeight = useTransform(smoothProgress, [0, 1], ["0%", "100%"]);

    const [activeStep, setActiveStep] = useState(0);

    useMotionValueEvent(scrollYProgress, "change", (latest) => {
        let step = 0;
        if (latest < 0.3) step = 0;
        else if (latest >= 0.3 && latest < 0.7) step = 1;
        else step = 2;

        setActiveStep(prev => (prev !== step ? step : prev));
    });

    const renderTabletUI = () => {
        if (activeStep === 0) return <motion.video key="s0" initial={{ opacity: 0, filter: "blur(10px)", scale: 0.95 }} animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }} exit={{ opacity: 0, filter: "blur(10px)", scale: 1.05 }} transition={{ duration: 0.5, ease: customEase }} src="/Login.mp4" autoPlay loop muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 20, position: "absolute", inset: 0 }} />;
        if (activeStep === 1) return <motion.video key="s1" initial={{ opacity: 0, filter: "blur(10px)", scale: 0.95 }} animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }} exit={{ opacity: 0, filter: "blur(10px)", scale: 1.05 }} transition={{ duration: 0.5, ease: customEase }} src="/listening.mp4" autoPlay loop muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 20, position: "absolute", inset: 0 }} />;
        if (activeStep === 2) return <motion.video key="s2" initial={{ opacity: 0, filter: "blur(10px)", scale: 0.95 }} animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }} exit={{ opacity: 0, filter: "blur(10px)", scale: 1.05 }} transition={{ duration: 0.5, ease: customEase }} src="/chatbubbles.mp4" autoPlay loop muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 20, position: "absolute", inset: 0 }} />;
    };

    return (
        <section ref={containerRef} id="how-it-works" style={{ position: "relative", height: "250dvh", backgroundColor: "transparent" }}>
            <div style={{ position: "sticky", top: 0, height: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 max(5%, 20px)" }}>

                <div className="timeline-wrapper">

                    {/* Left Text / Timeline */}
                    <div className="timeline-text" style={{ position: "relative" }}>
                        <div className="timeline-header">
                            <h2 style={{ fontSize: "clamp(36px, 8vw, 56px)", fontWeight: 700, color: themeColors.textMain, letterSpacing: "-0.05em", margin: "0 0 12px 0" }}>How it works.</h2>
                            <p style={{ fontSize: "clamp(18px, 4vw, 22px)", color: themeColors.textMuted, margin: 0, letterSpacing: "-0.01em" }}>Three simple steps to absolute productivity.</p>
                        </div>

                        <div style={{ position: "relative", paddingLeft: "clamp(32px, 6vw, 48px)", display: "flex", flexDirection: "column", gap: "clamp(24px, 4vw, 40px)" }}>
                            {/* Progress Line */}
                            <div style={{ position: "absolute", left: 14, top: 0, bottom: 0, width: 2, background: themeColors.border, borderRadius: 4 }}>
                                <motion.div style={{ width: "100%", height: lineHeight, background: themeColors.gradient, borderRadius: 4, boxShadow: "0 0 10px rgba(124, 58, 237, 0.4)" }} />
                            </div>

                            {["Sign In", "Start a Call", "Get Actionable Intel"].map((title, i) => (
                                <motion.div layout key={i} style={{ position: "relative", opacity: activeStep >= i ? 1 : 0.3, transition: "opacity 0.4s ease", willChange: "transform, opacity" }}>

                                    {/* Animated Node */}
                                    <motion.div animate={{ scale: activeStep === i ? 1.15 : 1, borderColor: activeStep >= i ? themeColors.primary : "#e5e5e5", background: activeStep >= i ? themeColors.primary : "#fff", color: activeStep >= i ? "#fff" : themeColors.textFaint }} style={{ position: "absolute", left: "calc(clamp(32px, 6vw, 48px) * -1)", top: -4, width: 30, height: 30, borderRadius: "50%", border: "2px solid #e5e5e5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, zIndex: 2, transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)", willChange: "transform, background-color, border-color", boxShadow: activeStep === i ? "0 0 0 4px rgba(124, 58, 237, 0.1)" : "none" }}>
                                        {i + 1}
                                    </motion.div>

                                    <h3 style={{ fontSize: "clamp(22px, 5vw, 28px)", fontWeight: 700, color: themeColors.textMain, margin: "0 0 8px 0", letterSpacing: "-0.03em" }}>{title}</h3>

                                    {/* 🚀 Perfect Spring Accordion */}
                                    <AnimatePresence initial={false}>
                                        {activeStep === i && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0, filter: "blur(4px)" }}
                                                animate={{ height: "auto", opacity: 1, filter: "blur(0px)" }}
                                                exit={{ height: 0, opacity: 0, filter: "blur(4px)" }}
                                                transition={springConfig}
                                                style={{ overflow: "hidden" }}
                                            >
                                                <p style={{ fontSize: "clamp(16px, 3.5vw, 18px)", color: themeColors.textMuted, lineHeight: 1.6, margin: 0, paddingBottom: 16 }}>
                                                    {i === 0 && "Create an account or log in to your Voxa dashboard. Your conversations are securely synced across all devices."}
                                                    {i === 1 && "No typing required. Just speak naturally, and Voxa will listen, parse, and respond in real time with stunning speed."}
                                                    {i === 2 && "Voxa generates dynamic widgets, beautiful data visualizations, and clear answers instantly on your screen."}
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Right Hardware Mockup */}
                    <div className="timeline-visual" style={{ display: "flex", justifyContent: "center" }}>
                        <motion.div style={{ width: "100%", aspectRatio: "3/4", background: "linear-gradient(180deg, #ffffff 0%, #f4f4f5 100%)", borderRadius: 36, padding: "clamp(10px, 2vw, 16px)", boxShadow: "0 40px 80px -20px rgba(0,0,0,0.1), inset 0 1px 1px rgba(255,255,255,1), 0 0 0 1px rgba(0,0,0,0.05)", position: "relative" }}>
                            <div style={{ position: "absolute", top: 6, left: "50%", transform: "translateX(-50%)", width: "25%", height: 4, background: "rgba(0,0,0,0.05)", borderRadius: 4 }} />
                            <div style={{ width: "100%", height: "100%", background: "#000", borderRadius: 24, overflow: "hidden", position: "relative", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)" }}>
                                <AnimatePresence mode="wait">
                                    {renderTabletUI()}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </div>

                </div>
            </div>
        </section>
    );
}

// ─────────────────────────────────────────────
// ANIMATED UNIFIED MODELS VISUALIZER
// ─────────────────────────────────────────────
const UnifiedModelsVisualizer = () => (
    <div style={{ position: "relative", flex: "1 1 300px", minHeight: 280, background: "linear-gradient(180deg, #fafafa 0%, #f4f4f5 100%)", borderRadius: 28, border: "1px solid rgba(0,0,0,0.04)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", boxShadow: "inset 0 4px 20px rgba(0,0,0,0.02), inset 0 1px 0 rgba(255,255,255,1)" }}>

        <motion.div animate={{ opacity: [0.2, 0.4, 0.2], scale: [0.9, 1.1, 0.9] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} style={{ position: "absolute", width: "100%", height: "100%", background: "radial-gradient(circle at center, rgba(124,58,237,0.08) 0%, transparent 60%)" }} />

        <motion.div animate={{ scale: [1, 1.6, 1], opacity: [0.1, 0, 0.1] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} style={{ position: "absolute", width: "clamp(80px, 20vw, 120px)", height: "clamp(80px, 20vw, 120px)", border: "1px solid #7c3aed", borderRadius: "50%" }} />
        <motion.div animate={{ scale: [1, 2.2, 1], opacity: [0.08, 0, 0.08] }} transition={{ duration: 4, delay: 0.5, repeat: Infinity, ease: "easeInOut" }} style={{ position: "absolute", width: "clamp(80px, 20vw, 120px)", height: "clamp(80px, 20vw, 120px)", border: "1px dashed #db2777", borderRadius: "50%" }} />

        {/* Floating Icons with Glassmorphism */}
        <motion.div animate={{ y: [-10, 10, -10], rotate: [-4, 4, -4] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} style={{ position: "absolute", top: "15%", left: "12%", width: "clamp(44px, 10vw, 56px)", height: "clamp(44px, 10vw, 56px)", background: "rgba(255,255,255,0.8)", backdropFilter: "blur(12px)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 20px -5px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.02), inset 0 1px 0 rgba(255,255,255,1)", zIndex: 5 }}>
            <img src="https://img.icons8.com/ios/100/chatgpt.png" alt="OpenAI GPT" style={{ width: "45%", height: "45%" }} />
        </motion.div>

        <motion.div animate={{ y: [10, -10, 10], rotate: [4, -4, 4] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} style={{ position: "absolute", top: "20%", right: "12%", width: "clamp(44px, 10vw, 56px)", height: "clamp(44px, 10vw, 56px)", background: "rgba(255,255,255,0.8)", backdropFilter: "blur(12px)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 20px -5px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.02), inset 0 1px 0 rgba(255,255,255,1)", zIndex: 5 }}>
            <img src="https://cdn.simpleicons.org/anthropic/d97757" alt="Anthropic Claude" style={{ width: "45%", height: "45%" }} />
        </motion.div>

        <motion.div animate={{ x: [-10, 10, -10], y: [-5, 5, -5] }} transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }} style={{ position: "absolute", bottom: "15%", right: "25%", width: "clamp(44px, 10vw, 56px)", height: "clamp(44px, 10vw, 56px)", background: "rgba(255,255,255,0.8)", backdropFilter: "blur(12px)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 20px -5px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.02), inset 0 1px 0 rgba(255,255,255,1)", zIndex: 5 }}>
            <img src="https://cdn.simpleicons.org/googlegemini/8E75B2" alt="Google Gemini" style={{ width: "45%", height: "45%" }} />
        </motion.div>

        <motion.div whileHover={{ scale: 1.05 }} transition={springConfig} style={{ position: "relative", zIndex: 10, width: "clamp(64px, 15vw, 88px)", height: "clamp(64px, 15vw, 88px)", background: "linear-gradient(135deg, #7c3aed, #db2777)", borderRadius: "24px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 20px 40px -10px rgba(124, 58, 237, 0.4), inset 0 2px 4px rgba(255,255,255,0.3)", transform: "rotate(45deg)", willChange: "transform" }}>
            <div style={{ transform: "rotate(-45deg)" }}>
                <VoxaLogo size={36} color="#ffffff" />
            </div>
        </motion.div>
    </div>
);

// ─────────────────────────────────────────────
// FEATURES BENTO GRID
// ─────────────────────────────────────────────
function FeaturesSection() {
    return (
        <section id="features" style={{ padding: "clamp(80px, 10vh, 160px) max(5%, 20px)", background: "transparent", position: "relative", zIndex: 10 }}>
            <div style={{ maxWidth: 1200, margin: "0 auto" }}>
                <div style={{ textAlign: "center", marginBottom: "clamp(40px, 6vw, 80px)" }}>
                    <h2 style={{ fontSize: "clamp(36px, 8vw, 56px)", fontWeight: 700, color: themeColors.textMain, letterSpacing: "-0.05em", margin: "0 0 12px 0" }}>Beyond a text box.</h2>
                    <p style={{ fontSize: "clamp(18px, 4vw, 22px)", color: themeColors.textMuted, lineHeight: 1.5, letterSpacing: "-0.01em" }}>Designed with frontend precision and AI power.</p>
                </div>

                <div className="bento-grid">
                    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.7, ease: customEase }} className="col-span-2" style={{ willChange: "transform, opacity" }}>
                        <SpotlightCard style={{ minHeight: "auto" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "clamp(32px, 5vw, 48px)" }}>

                                <div style={{ flex: "1 1 300px" }}>
                                    <div style={{ color: "#fff", marginBottom: 32, background: themeColors.primary, width: "clamp(48px, 10vw, 64px)", height: "clamp(48px, 10vw, 64px)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "18px", boxShadow: "0 10px 20px -5px rgba(124, 58, 237, 0.3), inset 0 2px 4px rgba(255,255,255,0.2)" }}><IconBrain /></div>
                                    <h3 style={{ fontSize: "clamp(26px, 6vw, 40px)", fontWeight: 700, color: themeColors.textMain, marginBottom: 16, letterSpacing: "-0.04em" }}>AI Models, Unified</h3>
                                    <p style={{ color: themeColors.textMuted, fontSize: "clamp(16px, 4vw, 18px)", lineHeight: 1.6 }}>Voxa acts as an orchestration layer. It seamlessly connects to Gemini, Claude, and GPT models, dynamically routing your query to the engine best suited to answer it.</p>
                                </div>

                                <UnifiedModelsVisualizer />

                            </div>
                        </SpotlightCard>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.7, delay: 0.1, ease: customEase }} style={{ willChange: "transform, opacity" }}>
                        <SpotlightCard style={{ minHeight: "auto" }}>
                            <div style={{ color: themeColors.primary, marginBottom: 24, background: "rgba(124, 58, 237, 0.08)", border: "1px solid rgba(124, 58, 237, 0.15)", width: "clamp(48px, 10vw, 56px)", height: "clamp(48px, 10vw, 56px)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "16px" }}><IconMic /></div>
                            <h3 style={{ fontSize: "clamp(22px, 5vw, 26px)", fontWeight: 700, color: themeColors.textMain, marginBottom: 12, letterSpacing: "-0.03em" }}>Never Miss a Word</h3>
                            <p style={{ color: themeColors.textMuted, fontSize: "clamp(16px, 3.5vw, 17px)", lineHeight: 1.6 }}>Voxa captures every word as you speak—instantly transcribing notes and conversations with near-perfect accuracy.</p>
                        </SpotlightCard>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.7, delay: 0.2, ease: customEase }} style={{ willChange: "transform, opacity" }}>
                        <SpotlightCard style={{ minHeight: "auto" }}>
                            <div style={{ color: themeColors.primary, marginBottom: 24, background: "rgba(124, 58, 237, 0.08)", border: "1px solid rgba(124, 58, 237, 0.15)", width: "clamp(48px, 10vw, 56px)", height: "clamp(48px, 10vw, 56px)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "16px" }}><IconHistory /></div>
                            <h3 style={{ fontSize: "clamp(22px, 5vw, 26px)", fontWeight: 700, color: themeColors.textMain, marginBottom: 12, letterSpacing: "-0.03em" }}>Context Stays With You</h3>
                            <p style={{ color: themeColors.textMuted, fontSize: "clamp(16px, 3.5vw, 17px)", lineHeight: 1.6 }}>Conversations are memory-aware. Pick up exactly where you left off without having to repeat past instructions.</p>
                        </SpotlightCard>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

// ─────────────────────────────────────────────
// SPLIT PANE FAQ (Premium Light Glassmorphic)
// ─────────────────────────────────────────────
const faqs = [
    { q: "What is Voxa AI?", a: "Voxa AI is your voice-first productivity partner. It allows you to have natural, spoken conversations to get answers, plan, delegate, and gain insights—hands-free, in real time." },
    { q: "How do I start using Voxa AI?", a: "Create an account, securely log in, and grant microphone access. There is no typing required—just speak naturally, and Voxa will listen and respond." },
    { q: "Do I need to install anything?", a: "No installation is required. Voxa AI runs beautifully in any modern web browser across your desktop, tablet, or mobile devices." },
];

function SplitPaneFAQ() {
    const [activeIndex, setActiveIndex] = useState(0);

    return (
        <section id="faqs" style={{ padding: "clamp(80px, 10vh, 160px) max(5%, 20px)", background: "#fafafa", position: "relative", overflow: "hidden", borderTop: "1px solid rgba(0,0,0,0.04)" }}>

            <motion.div animate={{ opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} style={{ position: "absolute", top: "20%", left: "-10%", width: "50vw", height: "50vw", background: "radial-gradient(circle, rgba(124, 58, 237, 0.04) 0%, transparent 70%)", filter: "blur(80px)", pointerEvents: "none" }} />

            <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 10 }}>
                <div style={{ marginBottom: "clamp(40px, 6vw, 80px)" }}>
                    <h2 style={{ fontSize: "clamp(36px, 8vw, 56px)", fontWeight: 700, color: themeColors.textMain, letterSpacing: "-0.05em", margin: "0 0 12px 0" }}>Frequently Asked.</h2>
                    <p style={{ fontSize: "clamp(18px, 4vw, 22px)", color: themeColors.textMuted, lineHeight: 1.5, letterSpacing: "-0.01em" }}>Explore common questions about how Voxa AI works.</p>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "clamp(32px, 5vw, 60px)" }}>
                    <div style={{ flex: "1 1 400px", display: "flex", flexDirection: "column", gap: 8, position: "relative" }}>
                        {faqs.map((faq, idx) => {
                            const isActive = activeIndex === idx;
                            return (
                                <button
                                    key={idx} onClick={() => setActiveIndex(idx)}
                                    style={{ textAlign: "left", padding: "clamp(18px, 4vw, 28px)", borderRadius: 20, border: "none", background: "transparent", color: isActive ? themeColors.textMain : themeColors.textFaint, fontSize: "clamp(16px, 2vw, 18px)", fontWeight: isActive ? 600 : 500, cursor: "pointer", transition: "color 0.3s ease", position: "relative", zIndex: 2, outline: "none", WebkitTapHighlightColor: "transparent" }}
                                >
                                    {isActive && <motion.div layoutId="faq-bg" style={{ position: "absolute", inset: 0, background: "#ffffff", borderRadius: 20, zIndex: -1, border: "1px solid rgba(0,0,0,0.04)", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,1)" }} transition={springConfig} />}
                                    <span style={{ position: "relative", zIndex: 2, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                                        {faq.q}
                                        {isActive && <motion.div layoutId="faq-dot" style={{ minWidth: 8, minHeight: 8, borderRadius: "50%", background: themeColors.primary, boxShadow: "0 0 10px rgba(124, 58, 237, 0.4)" }} transition={springConfig} />}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div style={{ flex: "1.5 1 400px", position: "relative", minHeight: "auto", background: "linear-gradient(180deg, #ffffff 0%, #fafafa 100%)", borderRadius: 36, padding: "clamp(32px, 6vw, 56px)", border: "1px solid rgba(0,0,0,0.04)", boxShadow: "0 20px 40px -20px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,1)" }}>
                        <AnimatePresence mode="wait">
                            <motion.div key={activeIndex} initial={{ opacity: 0, y: 15, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -15, filter: "blur(4px)" }} transition={{ duration: 0.3, ease: customEase }} style={{ willChange: "transform, opacity" }}>
                                <div style={{ color: themeColors.primary, marginBottom: 28, background: "rgba(124, 58, 237, 0.08)", border: "1px solid rgba(124, 58, 237, 0.15)", width: "clamp(48px, 10vw, 56px)", height: "clamp(48px, 10vw, 56px)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center" }}><IconBrain /></div>
                                <h3 style={{ fontSize: "clamp(24px, 3vw, 32px)", fontWeight: 700, color: themeColors.textMain, marginBottom: 20, letterSpacing: "-0.03em" }}>{faqs[activeIndex].q}</h3>
                                <p style={{ fontSize: "clamp(16px, 2vw, 18px)", color: themeColors.textMuted, lineHeight: 1.6 }}>{faqs[activeIndex].a}</p>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </section>
    );
}

// ─────────────────────────────────────────────
// FINAL CTA (Premium Light)
// ─────────────────────────────────────────────
function FinalCTA({ onLaunch }) {
    return (
        <section style={{ padding: "clamp(80px, 10vh, 160px) max(5%, 20px)", textAlign: "center", background: "linear-gradient(180deg, #fafafa 0%, #ffffff 100%)", position: "relative", zIndex: 10, overflow: "hidden" }}>

            <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "80vw", height: "40vw", background: "radial-gradient(ellipse, rgba(219, 39, 119, 0.04) 0%, transparent 60%)", filter: "blur(100px)", pointerEvents: "none", zIndex: 0 }} />

            <div style={{ position: "relative", zIndex: 2 }}>
                <p style={{ color: themeColors.primary, fontWeight: 700, fontSize: "clamp(12px, 3vw, 14px)", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.15em" }}>Ready to get started?</p>
                <h2 style={{ fontSize: "clamp(40px, 10vw, 80px)", fontWeight: 800, color: themeColors.textMain, letterSpacing: "-0.05em", margin: "0 0 40px 0" }}>Start for free today.</h2>

                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16, flexWrap: "wrap", flexDirection: "row" }}>
                    <motion.button onClick={onLaunch} whileHover={{ scale: 1.03, boxShadow: "0 20px 40px -10px rgba(124, 58, 237, 0.25)" }} whileTap={{ scale: 0.97 }} style={{ background: themeColors.gradient, color: "#fff", border: "none", padding: "0 clamp(24px, 6vw, 40px)", height: "clamp(52px, 12vw, 60px)", borderRadius: 999, fontSize: "clamp(16px, 4vw, 17px)", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 12, transition: "box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1)", willChange: "transform", boxShadow: "inset 0 1px 1px rgba(255,255,255,0.3)" }}>
                        Get started now <IconArrowRight />
                    </motion.button>

                    <motion.a href="#features" whileHover={{ scale: 1.03, backgroundColor: themeColors.surfaceHover }} whileTap={{ scale: 0.97 }} style={{ background: "#ffffff", color: themeColors.textMain, border: "1px solid rgba(0,0,0,0.06)", padding: "0 clamp(24px, 6vw, 40px)", height: "clamp(52px, 12vw, 60px)", borderRadius: 999, fontSize: "clamp(16px, 4vw, 17px)", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", textDecoration: "none", transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)", boxShadow: "0 10px 20px -10px rgba(0,0,0,0.02)", willChange: "transform" }}>
                        Learn more
                    </motion.a>
                </div>
            </div>
        </section>
    );
}

// ─────────────────────────────────────────────
// MAIN LANDING PAGE COMPONENT
// ─────────────────────────────────────────────
export default function LandingPage({ onLaunch }) {
    const heroRef = useRef(null);

    // 🚀 THE OAUTH URL CATCHER IS NOW HERE
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const userDataString = urlParams.get('user');

        if (token && userDataString) {
            try {
                const parsedUser = JSON.parse(decodeURIComponent(userDataString));

                // Save auth data to local storage
                localStorage.setItem('voxa_token', token);
                localStorage.setItem('voxa_user', JSON.stringify(parsedUser));

                // 🚀 INSTANTLY ESCORT TO DASHBOARD
                window.location.href = "/app";
            } catch (error) {
                console.error("Failed to parse OAuth data:", error);
            }
        }
    }, []);

    // Scroll tracking tied specifically to the hero section's viewport presence
    const { scrollYProgress: heroScroll } = useScroll({ target: heroRef, offset: ["start start", "end start"] });

    // 🚀 FLAWLESS CINEMATIC CROSSFADE MATH
    // Phase 1: 0% to 8% scroll -> Text aggressively fades to 0 opacity and blurs out.
    const heroTextY = useTransform(heroScroll, [0, 0.08], ["0dvh", "-10dvh"]);
    const heroTextOpacity = useTransform(heroScroll, [0, 0.08], [1, 0]);
    const heroTextBlur = useTransform(heroScroll, [0, 0.08], ["blur(0px)", "blur(12px)"]);
    const heroTextPointerEvents = useTransform(heroScroll, v => v > 0.02 ? "none" : "auto");

    // Phase 2: 10% to 25% scroll -> Video fades in from nothing and moves up, AFTER text is gone.
    const videoContainerY = useTransform(heroScroll, [0, 0.1, 0.25], ["20dvh", "20dvh", "0dvh"]);
    const videoContainerOpacity = useTransform(heroScroll, [0, 0.1, 0.2], [0, 0, 1]);
    const videoContainerScale = useTransform(heroScroll, [0.1, 0.25], [0.9, 1]);

    // Phase 3: The standard scale up effect while pinned.
    const innerVideoScale = useTransform(heroScroll, [0.25, 0.85], [1, 1.15]);

    return (
        <div style={{ minHeight: "100dvh", backgroundColor: "#fdfdfd", color: themeColors.textMain, fontFamily: "'SF Pro Display', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif", WebkitFontSmoothing: "antialiased" }}>
            <AmbientMeshBackground />

            {/* 🚀 Mobile-First Apple UI CSS Architecture */}
            <style>{`
                html, body {
                    margin: 0;
                    padding: 0;
                    overflow-x: clip; 
                    overscroll-behavior: none;
                }
                
                .bento-grid { display: grid; grid-template-columns: repeat(1, 1fr); gap: clamp(24px, 4vw, 32px); }
                @media (min-width: 768px) { .bento-grid { grid-template-columns: repeat(2, 1fr); } }
                @media (min-width: 1024px) { .bento-grid { grid-template-columns: repeat(2, 1fr); } }
                
                .col-span-2 { grid-column: span 1; }
                @media (min-width: 1024px) { .col-span-2 { grid-column: span 2; } }
                
                .nav-links { display: none; gap: 36px; font-size: 15px; color: ${themeColors.textMuted}; font-weight: 500; }
                @media (min-width: 768px) { .nav-links { display: flex; } }

                /* 🚀 Responsive Sticky Timeline Fix for iPhones */
                .timeline-wrapper {
                    display: flex;
                    width: 100%;
                    max-width: 1200px;
                    margin: 0 auto;
                    align-items: center;
                    justify-content: center;
                    flex-direction: column;
                    gap: 40px;
                }
                .timeline-text { width: 100%; order: 2; }
                .timeline-header { text-align: center; margin-bottom: 32px; }
                
                .timeline-visual { 
                    width: 100%; 
                    max-width: 300px; 
                    order: 1; 
                }

                @media (min-width: 900px) {
                    .timeline-wrapper {
                        flex-direction: row;
                        justify-content: space-between;
                        gap: 8%;
                    }
                    .timeline-text { width: 45%; order: 1; }
                    .timeline-visual { width: 45%; max-width: 440px; order: 2; }
                    .timeline-header { text-align: left; margin-bottom: 60px; }
                }
            `}</style>

            {/* ───────────────────────────────────────────── */}
            {/* NAVBAR */}
            {/* ───────────────────────────────────────────── */}
            <motion.nav initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: customEase }} style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: "clamp(12px, 2vh, 20px) max(5%, 24px)", paddingTop: "calc(env(safe-area-inset-top, 0px) + clamp(12px, 2vh, 20px))", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(253, 253, 253, 0.7)", backdropFilter: "blur(40px) saturate(150%)", WebkitBackdropFilter: "blur(40px) saturate(150%)", borderBottom: "1px solid rgba(0,0,0,0.04)", willChange: "transform, opacity" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <VoxaLogo size={24} />
                    <span style={{ fontSize: "clamp(17px, 4vw, 19px)", fontWeight: 700, letterSpacing: "-0.03em", color: themeColors.textMain }}>Voxa AI</span>
                </div>

                <div className="nav-links">
                    <a href="#how-it-works" style={{ color: "inherit", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={e => e.target.style.color = themeColors.textMain} onMouseLeave={e => e.target.style.color = themeColors.textMuted}>How it Works</a>
                    <a href="#features" style={{ color: "inherit", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={e => e.target.style.color = themeColors.textMain} onMouseLeave={e => e.target.style.color = themeColors.textMuted}>Features</a>
                    <a href="#faqs" style={{ color: "inherit", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={e => e.target.style.color = themeColors.textMain} onMouseLeave={e => e.target.style.color = themeColors.textMuted}>FAQs</a>
                </div>

                <motion.button onClick={onLaunch} whileHover={{ scale: 1.04, boxShadow: "0 10px 25px -5px rgba(124, 58, 237, 0.3)" }} whileTap={{ scale: 0.96 }} style={{ background: themeColors.textMain, border: "none", color: "#fff", padding: "0 clamp(16px, 4vw, 24px)", minHeight: 40, borderRadius: 999, fontSize: "clamp(13px, 3.5vw, 14px)", fontWeight: 600, cursor: "pointer", transition: "box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1)", willChange: "transform" }}>
                    Log in
                </motion.button>
            </motion.nav>

            {/* ───────────────────────────────────────────── */}
            {/* HERO SECTION */}
            {/* ───────────────────────────────────────────── */}
            <section ref={heroRef} style={{ position: "relative", height: "250dvh", zIndex: 10 }}>
                <div style={{ position: "sticky", top: 0, height: "100dvh", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", paddingTop: "env(safe-area-inset-top, 0px)" }}>

                    {/* 🚀 TEXT BLOCK: Snaps to hidden instantly on scroll */}
                    <motion.div style={{ position: "absolute", top: "max(120px, 16dvh)", y: heroTextY, opacity: heroTextOpacity, filter: heroTextBlur, pointerEvents: heroTextPointerEvents, textAlign: "center", width: "100%", maxWidth: 1000, zIndex: 20, padding: "0 max(5%, 24px)", willChange: "transform, opacity, filter" }}>
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: customEase }} style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: "clamp(20px, 4vw, 32px)", padding: "6px 16px", borderRadius: 999, background: "rgba(255,255,255,0.6)", border: "1px solid rgba(0,0,0,0.06)", backdropFilter: "blur(12px)", boxShadow: "0 4px 12px -4px rgba(0,0,0,0.04)", willChange: "transform, opacity" }}>
                            <span style={{ color: themeColors.primary, fontSize: 13 }}>✦</span>
                            <span style={{ color: themeColors.textMuted, fontSize: "clamp(12px, 3vw, 13px)", fontWeight: 600, letterSpacing: "0.02em" }}>Your Voice-Enabled Web Assistant</span>
                        </motion.div>

                        <h1 style={{ fontSize: "clamp(46px, 12vw, 96px)", fontWeight: 800, letterSpacing: "-0.05em", lineHeight: 1.05, margin: "0 auto 20px auto", color: themeColors.textMain, maxWidth: 900 }}>
                            <RevealText text="Speak. Assist. Engage." />
                            <span style={{ display: "block" }}>
                                <motion.span initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.8, ease: customEase }} style={{ background: themeColors.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", willChange: "transform, opacity", display: "inline-block" }}>
                                    Powered by Voxa AI.
                                </motion.span>
                            </span>
                        </h1>

                        <motion.p initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 1, ease: customEase }} style={{ fontSize: "clamp(17px, 4vw, 22px)", color: themeColors.textMuted, fontWeight: 400, maxWidth: 650, margin: "0 auto 36px auto", lineHeight: 1.5, letterSpacing: "-0.01em", willChange: "transform, opacity" }}>
                            Your voice-first experience for smarter, humanlike web interactions. Stop typing and start achieving.
                        </motion.p>

                        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 1.2, ease: customEase }} style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap", flexDirection: "row", willChange: "transform, opacity" }}>
                            <motion.button onClick={onLaunch} whileHover={{ scale: 1.03, boxShadow: "0 20px 40px -10px rgba(0,0,0,0.15)" }} whileTap={{ scale: 0.97 }} style={{ background: themeColors.textMain, color: "#fff", border: "none", padding: "0 clamp(24px, 6vw, 40px)", minHeight: "clamp(52px, 12vw, 56px)", borderRadius: 999, fontSize: "clamp(15px, 4vw, 16px)", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 12, transition: "box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1)", willChange: "transform" }}>
                                <span style={{ width: 8, height: 8, borderRadius: "50%", background: themeColors.primary, display: "block" }} /> Start Talking
                            </motion.button>
                            <motion.a href="#how-it-works" whileHover={{ scale: 1.03, backgroundColor: themeColors.surfaceHover }} whileTap={{ scale: 0.97 }} style={{ background: "#fff", color: themeColors.textMain, border: "1px solid rgba(0,0,0,0.06)", padding: "0 clamp(24px, 6vw, 40px)", minHeight: "clamp(52px, 12vw, 56px)", borderRadius: 999, fontSize: "clamp(15px, 4vw, 16px)", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none", transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)", boxShadow: "0 4px 12px -4px rgba(0,0,0,0.02)", willChange: "transform" }}>
                                See how it works
                            </motion.a>
                        </motion.div>
                    </motion.div>

                    {/* 🚀 PREMIUM GLASS VIDEO BLOCK */}
                    <motion.div style={{ position: "relative", y: videoContainerY, opacity: videoContainerOpacity, scale: videoContainerScale, width: "100%", maxWidth: 1100, padding: "0 max(5%, 20px)", zIndex: 10, willChange: "transform, opacity" }}>
                        <div style={{ width: "100%", background: "rgba(255, 255, 255, 0.5)", borderRadius: "clamp(24px, 5vw, 40px)", padding: "clamp(10px, 2vw, 16px)", border: "1px solid rgba(255,255,255,0.8)", boxShadow: "0 40px 80px -20px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,1), 0 0 0 1px rgba(0,0,0,0.02)", backdropFilter: "blur(40px) saturate(150%)", WebkitBackdropFilter: "blur(40px) saturate(150%)" }}>
                            <div style={{ width: "100%", aspectRatio: "16/9", background: "#05050a", borderRadius: "clamp(14px, 4vw, 24px)", boxShadow: "inset 0 2px 10px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,0,0,0.05)", position: "relative", overflow: "hidden" }}>
                                <motion.video
                                    src="/Recording 2026-04-05 220447.mp4"
                                    autoPlay loop muted playsInline
                                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, scale: innerVideoScale, transformOrigin: "center center", willChange: "transform" }}
                                />
                            </div>
                        </div>
                    </motion.div>

                </div>
            </section>

            {/* ───────────────────────────────────────────── */}
            {/* HOW IT WORKS */}
            {/* ───────────────────────────────────────────── */}
            <StickyTimeline />

            {/* ───────────────────────────────────────────── */}
            {/* FEATURES BENTO GRID */}
            {/* ───────────────────────────────────────────── */}
            <FeaturesSection />

            {/* ───────────────────────────────────────────── */}
            {/* SPLIT-PANE FAQ */}
            {/* ───────────────────────────────────────────── */}
            <SplitPaneFAQ />

            {/* ───────────────────────────────────────────── */}
            {/* FINAL CTA */}
            {/* ───────────────────────────────────────────── */}
            <FinalCTA onLaunch={onLaunch} />

            {/* ───────────────────────────────────────────── */}
            {/* FOOTER */}
            {/* ───────────────────────────────────────────── */}
            <footer style={{ padding: "clamp(60px, 8vw, 80px) max(5%, 24px) calc(env(safe-area-inset-bottom, 0px) + clamp(40px, 5vw, 60px)) max(5%, 24px)", background: "#ffffff", borderTop: "1px solid rgba(0,0,0,0.04)", position: "relative", zIndex: 10 }}>
                <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 40 }}>

                    <div style={{ maxWidth: 350 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
                            <VoxaLogo size={24} /> <span style={{ color: themeColors.textMain, fontSize: 20, fontWeight: 700, letterSpacing: "-0.03em" }}>Voxa AI</span>
                        </div>
                        <p style={{ color: themeColors.textMuted, fontSize: 15, lineHeight: 1.6, letterSpacing: "-0.01em" }}>Voxa AI is a voice-first AI assistant that allows you to have natural, spoken conversations to get answers, insights, or support—hands-free and in real time.</p>
                    </div>

                    <div style={{ display: "flex", gap: "clamp(40px, 8vw, 80px)", flexWrap: "wrap" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <h4 style={{ color: themeColors.textMain, fontWeight: 700, marginBottom: 8, fontSize: 15, letterSpacing: "-0.01em" }}>Product</h4>
                            <a href="#" style={{ color: themeColors.textMuted, textDecoration: "none", fontSize: 15, transition: "color 0.2s", fontWeight: 500 }} onMouseEnter={e => e.target.style.color = themeColors.textMain} onMouseLeave={e => e.target.style.color = themeColors.textMuted}>Home</a>
                            <a href="#features" style={{ color: themeColors.textMuted, textDecoration: "none", fontSize: 15, transition: "color 0.2s", fontWeight: 500 }} onMouseEnter={e => e.target.style.color = themeColors.textMain} onMouseLeave={e => e.target.style.color = themeColors.textMuted}>Features</a>
                            <a href="#how-it-works" style={{ color: themeColors.textMuted, textDecoration: "none", fontSize: 15, transition: "color 0.2s", fontWeight: 500 }} onMouseEnter={e => e.target.style.color = themeColors.textMain} onMouseLeave={e => e.target.style.color = themeColors.textMuted}>How it works</a>
                            <a href="#faqs" style={{ color: themeColors.textMuted, textDecoration: "none", fontSize: 15, transition: "color 0.2s", fontWeight: 500 }} onMouseEnter={e => e.target.style.color = themeColors.textMain} onMouseLeave={e => e.target.style.color = themeColors.textMuted}>FAQs</a>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <h4 style={{ color: themeColors.textMain, fontWeight: 700, marginBottom: 8, fontSize: 15, letterSpacing: "-0.01em" }}>Legal</h4>
                            <a href="#" style={{ color: themeColors.textMuted, textDecoration: "none", fontSize: 15, transition: "color 0.2s", fontWeight: 500 }} onMouseEnter={e => e.target.style.color = themeColors.textMain} onMouseLeave={e => e.target.style.color = themeColors.textMuted}>Privacy Policy</a>
                            <a href="#" style={{ color: themeColors.textMuted, textDecoration: "none", fontSize: 15, transition: "color 0.2s", fontWeight: 500 }} onMouseEnter={e => e.target.style.color = themeColors.textMain} onMouseLeave={e => e.target.style.color = themeColors.textMuted}>Terms of Service</a>
                        </div>
                    </div>
                </div>

                <div style={{ maxWidth: 1400, margin: "80px auto 0 auto", paddingTop: 32, borderTop: "1px solid rgba(0,0,0,0.04)", textAlign: "center", color: themeColors.textFaint, fontSize: 14, fontWeight: 500 }}>
                    Copyright © 2026 Voxa AI - Developed by Afish Abdulkader
                </div>
            </footer>
        </div>
    );
}