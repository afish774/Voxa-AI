import React, { useState, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useMotionTemplate, useMotionValue, useSpring, useMotionValueEvent } from "framer-motion";

// ─────────────────────────────────────────────
// CUSTOM EASING & PHYSICS
// ─────────────────────────────────────────────
const customEase = [0.22, 1, 0.36, 1];
const springConfig = { type: "spring", stiffness: 100, damping: 20, mass: 1 };

// ─────────────────────────────────────────────
// THEME COLORS
// ─────────────────────────────────────────────
const themeColors = {
    primary: "#7c3aed", // Deep Purple
    secondary: "#db2777", // Pink
    gradient: "linear-gradient(135deg, #7c3aed, #db2777)"
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
const IconArrowRight = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>;
const IconUser = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;

// ─────────────────────────────────────────────
// ANIMATED MESH BACKGROUND
// ─────────────────────────────────────────────
function AmbientMeshBackground() {
    return (
        <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0, backgroundColor: "#fafafa" }}>
            <motion.div animate={{ x: ["0%", "8%", "0%"], y: ["0%", "12%", "0%"], scale: [1, 1.1, 1] }} transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }} style={{ position: "absolute", top: "-10%", left: "10%", width: "50vw", height: "50vw", background: "radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, rgba(255,255,255,0) 70%)", filter: "blur(90px)", borderRadius: "50%", willChange: "transform" }} />
            <motion.div animate={{ x: ["0%", "-8%", "0%"], y: ["0%", "-15%", "0%"], scale: [1, 1.2, 1] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }} style={{ position: "absolute", bottom: "10%", right: "-5%", width: "60vw", height: "60vw", background: "radial-gradient(circle, rgba(219, 39, 119, 0.1) 0%, rgba(255,255,255,0) 70%)", filter: "blur(100px)", borderRadius: "50%", willChange: "transform" }} />
            <div style={{ position: "absolute", inset: 0, opacity: 0.3, mixBlendMode: "overlay", backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />
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
                        initial={{ y: "120%", rotateZ: 5 }}
                        animate={{ y: "0%", rotateZ: 0 }}
                        transition={{ duration: 0.8, ease: customEase, delay: delay + i * 0.08 }}
                        style={{ display: "inline-block", transformOrigin: "bottom left", willChange: "transform" }}
                    >
                        {word}
                    </motion.span>
                </span>
            ))}
        </span>
    );
};

// ─────────────────────────────────────────────
// ADVANCED SPOTLIGHT BENTO CARD
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
            whileHover={{ y: -8, boxShadow: "0 30px 60px -15px rgba(124, 58, 237, 0.15)" }}
            transition={{ duration: 0.5, ease: customEase }}
            style={{
                position: "relative", overflow: "hidden", background: "#ffffff",
                borderRadius: 32, border: "1px solid #f4f4f5", willChange: "transform", ...style
            }}
            className={className}
        >
            <motion.div
                className="pointer-events-none absolute -inset-px opacity-0 transition duration-500"
                whileHover={{ opacity: 1 }}
                style={{
                    background: useMotionTemplate`radial-gradient(800px circle at ${mouseX}px ${mouseY}px, rgba(124, 58, 237, 0.06), transparent 60%)`,
                    zIndex: 1,
                    position: "absolute", inset: 0
                }}
            />
            <div style={{ position: "relative", zIndex: 2, padding: "48px", height: "100%", display: "flex", flexDirection: "column" }}>
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
        if (activeStep === 0) {
            return (
                <motion.div key="s0" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4, ease: customEase }} style={{ width: "100%", height: "100%", background: "#05050a", willChange: "transform, opacity" }}>
                    <video src="/Login.mp4" autoPlay loop muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 20 }} />
                </motion.div>
            );
        }
        if (activeStep === 1) {
            return (
                <motion.div key="s1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} style={{ width: "100%", height: "100%", background: "#05050a", willChange: "transform, opacity" }}>
                    <video src="/listening.mp4" autoPlay loop muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 20 }} />
                </motion.div>
            );
        }
        if (activeStep === 2) {
            return (
                <motion.div key="s2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} style={{ width: "100%", height: "100%", background: "#05050a", willChange: "transform, opacity" }}>
                    <video src="/chatbubbles.mp4" autoPlay loop muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 20 }} />
                </motion.div>
            );
        }
    };

    return (
        <section ref={containerRef} id="how-it-works" style={{ position: "relative", height: "250vh", backgroundColor: "transparent" }}>
            <div style={{ position: "sticky", top: 0, height: "100vh", display: "flex", alignItems: "center", padding: "0 5%" }}>
                <div style={{ display: "flex", width: "100%", maxWidth: 1200, margin: "0 auto", alignItems: "center", justifyContent: "space-between", gap: "8%", flexWrap: "wrap" }}>

                    {/* Left Text / Timeline */}
                    <div style={{ flex: "1 1 400px", position: "relative" }}>
                        <div style={{ marginBottom: 60 }}>
                            <h2 style={{ fontSize: "clamp(40px, 5vw, 56px)", fontWeight: 700, color: "#09090b", letterSpacing: "-0.04em", margin: "0 0 16px 0" }}>How it works.</h2>
                            <p style={{ fontSize: 20, color: "#52525b" }}>Three simple steps to absolute productivity.</p>
                        </div>

                        <div style={{ position: "relative", paddingLeft: 40, display: "flex", flexDirection: "column", gap: 60 }}>
                            {/* Progress Line */}
                            <div style={{ position: "absolute", left: 14, top: 0, bottom: 0, width: 4, background: "#f4f4f5", borderRadius: 4 }}>
                                <motion.div style={{ width: "100%", height: lineHeight, background: themeColors.gradient, borderRadius: 4 }} />
                            </div>

                            {["Sign In", "Start a Call", "Get Actionable Intel"].map((title, i) => (
                                <div key={i} style={{ position: "relative", opacity: activeStep >= i ? 1 : 0.4, transition: "opacity 0.4s ease" }}>
                                    <motion.div animate={{ scale: activeStep === i ? 1.2 : 1, borderColor: activeStep >= i ? themeColors.primary : "#e5e5e5" }} style={{ position: "absolute", left: -56, top: -4, width: 32, height: 32, borderRadius: "50%", background: "#fff", border: "4px solid #e5e5e5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: activeStep >= i ? themeColors.primary : "#a1a1aa", zIndex: 2, transition: "border-color 0.4s ease", willChange: "transform" }}>
                                        {i + 1}
                                    </motion.div>
                                    <h3 style={{ fontSize: 28, fontWeight: 700, color: "#09090b", marginBottom: 12, letterSpacing: "-0.02em" }}>{title}</h3>
                                    <p style={{ fontSize: 18, color: "#52525b", lineHeight: 1.6 }}>
                                        {i === 0 && "Create an account or log in to your Voxa dashboard. Your conversations are securely synced."}
                                        {i === 1 && "No typing required. Just speak naturally, and Voxa will listen, parse, and respond in real time."}
                                        {i === 2 && "Voxa doesn't just talk. It generates dynamic widgets, data visualizations, and clear answers instantly."}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Hardware Mockup */}
                    <div style={{ flex: "1 1 400px", display: "flex", justifyContent: "center" }}>
                        <motion.div style={{ width: "100%", maxWidth: 440, aspectRatio: "3/4", background: "#ffffff", borderRadius: 32, padding: 16, boxShadow: "0 40px 80px -20px rgba(0,0,0,0.15), inset 0 2px 4px rgba(255,255,255,0.8)", border: "1px solid #e5e5e5" }}>
                            <div style={{ width: "100%", height: "100%", background: "#05050a", borderRadius: 20, overflow: "hidden", position: "relative", boxShadow: "inset 0 4px 10px rgba(0,0,0,0.8)" }}>
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
    <div style={{ position: "relative", flex: "1 1 300px", minHeight: 280, background: "#fafafa", borderRadius: 24, border: "1px solid #e5e5e5", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", boxShadow: "inset 0 4px 20px rgba(0,0,0,0.02)" }}>

        <motion.div animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} style={{ position: "absolute", width: "100%", height: "100%", background: "radial-gradient(circle at center, rgba(124,58,237,0.1) 0%, transparent 60%)" }} />

        <motion.div animate={{ scale: [1, 1.8, 1], opacity: [0.15, 0, 0.15] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} style={{ position: "absolute", width: 120, height: 120, border: "2px solid #7c3aed", borderRadius: "50%" }} />
        <motion.div animate={{ scale: [1, 2.5, 1], opacity: [0.1, 0, 0.1] }} transition={{ duration: 4, delay: 0.5, repeat: Infinity, ease: "easeInOut" }} style={{ position: "absolute", width: 120, height: 120, border: "2px dashed #db2777", borderRadius: "50%" }} />

        <motion.div animate={{ y: [-15, 15, -15], rotate: [-5, 5, -5] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} style={{ position: "absolute", top: "15%", left: "12%", width: 56, height: 56, background: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 20px -5px rgba(0,0,0,0.1)", border: "1px solid #f4f4f5", zIndex: 5 }}>
            <img src="https://img.icons8.com/ios/100/chatgpt.png" alt="OpenAI GPT" style={{ width: 28, height: 28 }} />
        </motion.div>

        <motion.div animate={{ y: [15, -15, 15], rotate: [5, -5, 5] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} style={{ position: "absolute", top: "20%", right: "12%", width: 56, height: 56, background: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 20px -5px rgba(0,0,0,0.1)", border: "1px solid #f4f4f5", zIndex: 5 }}>
            <img src="https://cdn.simpleicons.org/anthropic/d97757" alt="Anthropic Claude" style={{ width: 28, height: 28 }} />
        </motion.div>

        <motion.div animate={{ x: [-15, 15, -15], y: [-5, 5, -5] }} transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }} style={{ position: "absolute", bottom: "15%", right: "25%", width: 56, height: 56, background: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 20px -5px rgba(0,0,0,0.1)", border: "1px solid #f4f4f5", zIndex: 5 }}>
            <img src="https://cdn.simpleicons.org/googlegemini/8E75B2" alt="Google Gemini" style={{ width: 28, height: 28 }} />
        </motion.div>

        <motion.div whileHover={{ scale: 1.05 }} style={{ position: "relative", zIndex: 10, width: 88, height: 88, background: "linear-gradient(135deg, #7c3aed, #db2777)", borderRadius: "24px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 20px 40px -10px rgba(124, 58, 237, 0.5)", transform: "rotate(45deg)" }}>
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
        <section id="features" style={{ padding: "160px 5%", background: "transparent", position: "relative", zIndex: 10 }}>
            <div style={{ maxWidth: 1200, margin: "0 auto" }}>
                <div style={{ textAlign: "center", marginBottom: 80 }}>
                    <h2 style={{ fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 700, color: "#09090b", letterSpacing: "-0.04em", margin: "0 0 16px 0" }}>Beyond a text box.</h2>
                    <p style={{ fontSize: 20, color: "#52525b", lineHeight: 1.5 }}>Designed with frontend precision and AI power.</p>
                </div>

                <div className="bento-grid">
                    <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6, ease: customEase }} className="col-span-2" style={{ willChange: "transform, opacity" }}>
                        <SpotlightCard style={{ minHeight: 400 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 40 }}>

                                <div style={{ flex: "1 1 300px" }}>
                                    <div style={{ color: "#fff", marginBottom: 32, background: themeColors.primary, width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 16, boxShadow: "0 10px 20px -5px rgba(124, 58, 237, 0.4)" }}><IconBrain /></div>
                                    <h3 style={{ fontSize: "clamp(28px, 3vw, 40px)", fontWeight: 700, color: "#09090b", marginBottom: 16, letterSpacing: "-0.03em" }}>AI Models, Unified</h3>
                                    <p style={{ color: "#52525b", fontSize: 18, lineHeight: 1.6 }}>Voxa acts as an orchestration layer. It seamlessly connects to Gemini, Claude, and GPT models, dynamically routing your query to the engine best suited to answer it.</p>
                                </div>

                                <UnifiedModelsVisualizer />

                            </div>
                        </SpotlightCard>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6, delay: 0.1, ease: customEase }} style={{ willChange: "transform, opacity" }}>
                        <SpotlightCard style={{ minHeight: 380 }}>
                            <div style={{ color: themeColors.primary, marginBottom: 24, background: "rgba(124, 58, 237, 0.1)", width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 16 }}><IconMic /></div>
                            <h3 style={{ fontSize: 24, fontWeight: 700, color: "#09090b", marginBottom: 16, letterSpacing: "-0.02em" }}>Never Miss a Word</h3>
                            <p style={{ color: "#52525b", fontSize: 16, lineHeight: 1.6 }}>Voxa captures every word as you speak—instantly transcribing notes and conversations with near-perfect accuracy.</p>
                        </SpotlightCard>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6, delay: 0.2, ease: customEase }} style={{ willChange: "transform, opacity" }}>
                        <SpotlightCard style={{ minHeight: 380 }}>
                            <div style={{ color: themeColors.primary, marginBottom: 24, background: "rgba(124, 58, 237, 0.1)", width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 16 }}><IconHistory /></div>
                            <h3 style={{ fontSize: 24, fontWeight: 700, color: "#09090b", marginBottom: 16, letterSpacing: "-0.02em" }}>Context Stays With You</h3>
                            <p style={{ color: "#52525b", fontSize: 16, lineHeight: 1.6 }}>Conversations are memory-aware. Pick up exactly where you left off without having to repeat past instructions.</p>
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
        <section id="faqs" style={{ padding: "160px 5%", background: "#fafafa", position: "relative", overflow: "hidden", borderTop: "1px solid #f4f4f5" }}>

            {/* Soft background glow for Light Theme */}
            <motion.div animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} style={{ position: "absolute", top: "20%", left: "-10%", width: "50vw", height: "50vw", background: "radial-gradient(circle, rgba(124, 58, 237, 0.05) 0%, transparent 70%)", filter: "blur(80px)", pointerEvents: "none" }} />

            <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 10 }}>
                <div style={{ marginBottom: 80 }}>
                    <h2 style={{ fontSize: "clamp(40px, 5vw, 56px)", fontWeight: 700, color: "#09090b", letterSpacing: "-0.04em", margin: "0 0 16px 0" }}>Frequently Asked.</h2>
                    <p style={{ fontSize: 20, color: "#52525b", lineHeight: 1.5 }}>Explore common questions about how Voxa AI works.</p>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 60 }}>
                    <div style={{ flex: "1 1 400px", display: "flex", flexDirection: "column", gap: 8, position: "relative" }}>
                        {faqs.map((faq, idx) => {
                            const isActive = activeIndex === idx;
                            return (
                                <button
                                    key={idx} onClick={() => setActiveIndex(idx)}
                                    style={{ textAlign: "left", padding: "24px", borderRadius: 16, border: "none", background: "transparent", color: isActive ? "#09090b" : "#71717a", fontSize: 18, fontWeight: isActive ? 600 : 500, cursor: "pointer", transition: "color 0.2s", position: "relative", zIndex: 2, outline: "none" }}
                                >
                                    {isActive && <motion.div layoutId="faq-bg" style={{ position: "absolute", inset: 0, background: "#ffffff", borderRadius: 16, zIndex: -1, border: "1px solid #f4f4f5", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.05)" }} transition={springConfig} />}
                                    <span style={{ position: "relative", zIndex: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        {faq.q}
                                        {isActive && <motion.div layoutId="faq-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: themeColors.primary, boxShadow: "0 0 10px rgba(124, 58, 237, 0.4)" }} transition={springConfig} />}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div style={{ flex: "1.5 1 400px", position: "relative", minHeight: 300, background: "#ffffff", borderRadius: 32, padding: 48, border: "1px solid #f4f4f5", boxShadow: "0 20px 40px -20px rgba(0,0,0,0.05)" }}>
                        <AnimatePresence mode="wait">
                            <motion.div key={activeIndex} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: customEase }} style={{ willChange: "transform, opacity" }}>
                                <div style={{ color: themeColors.primary, marginBottom: 24, background: "rgba(124, 58, 237, 0.1)", width: 48, height: 48, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}><IconBrain /></div>
                                <h3 style={{ fontSize: 28, fontWeight: 700, color: "#09090b", marginBottom: 24, letterSpacing: "-0.02em" }}>{faqs[activeIndex].q}</h3>
                                <p style={{ fontSize: 20, color: "#52525b", lineHeight: 1.6 }}>{faqs[activeIndex].a}</p>
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
        <section style={{ padding: "160px 5%", textAlign: "center", background: "linear-gradient(180deg, #fafafa 0%, #ffffff 100%)", position: "relative", zIndex: 10, overflow: "hidden" }}>

            {/* Soft Light Mode Glow */}
            <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "80vw", height: "40vw", background: "radial-gradient(ellipse, rgba(219, 39, 119, 0.05) 0%, transparent 60%)", filter: "blur(100px)", pointerEvents: "none", zIndex: 0 }} />

            <div style={{ position: "relative", zIndex: 2 }}>
                <p style={{ color: themeColors.primary, fontWeight: 700, fontSize: 16, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.1em" }}>Ready to get started?</p>
                <h2 style={{ fontSize: "clamp(48px, 8vw, 80px)", fontWeight: 700, color: "#09090b", letterSpacing: "-0.04em", margin: "0 0 48px 0" }}>Start for free today.</h2>

                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                    <motion.button onClick={onLaunch} whileHover={{ scale: 1.05, boxShadow: "0 20px 40px -10px rgba(124, 58, 237, 0.3)" }} whileTap={{ scale: 0.95 }} style={{ background: themeColors.gradient, color: "#fff", border: "none", padding: "0 48px", height: 64, borderRadius: 999, fontSize: 18, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 12, transition: "box-shadow 0.3s", willChange: "transform" }}>
                        Get started now <IconArrowRight />
                    </motion.button>

                    {/* NEW: Premium Light "Learn More" Button */}
                    <motion.a href="#features" whileHover={{ scale: 1.05, backgroundColor: "#fafafa" }} whileTap={{ scale: 0.95 }} style={{ background: "#ffffff", color: "#09090b", border: "1px solid #e5e5e5", padding: "0 48px", height: 64, borderRadius: 999, fontSize: 18, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", textDecoration: "none", transition: "background-color 0.3s, box-shadow 0.3s", boxShadow: "0 10px 20px -10px rgba(0,0,0,0.05)", willChange: "transform" }}>
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

    // Scroll tracking tied specifically to the hero section's viewport presence
    const { scrollYProgress: heroScroll } = useScroll({ target: heroRef, offset: ["start start", "end start"] });

    // CINEMATIC MATH: 
    // 0 to 0.2: Text fades out and drifts UP (-10vh) slightly.
    const heroTextY = useTransform(heroScroll, [0, 0.2], ["0vh", "-10vh"]);
    const heroTextOpacity = useTransform(heroScroll, [0, 0.2], [1, 0]);

    // 0 to 0.25: Video shoots up from 45vh to 0vh (perfectly centered).
    const videoContainerY = useTransform(heroScroll, [0, 0.25], ["45vh", "0vh"]);
    const videoContainerScale = useTransform(heroScroll, [0, 0.25], [0.8, 1]);

    // 0.25 to 0.85: The "Attention Period". The container is pinned dead-center 
    // while the video inside scales up from 1 to 1.25.
    const innerVideoScale = useTransform(heroScroll, [0.25, 0.85], [1, 1.25]);

    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#ffffff", color: "#09090b", fontFamily: "'Inter', sans-serif", WebkitFontSmoothing: "antialiased" }}>
            <AmbientMeshBackground />

            <style>{`
                html, body {
                    margin: 0;
                    padding: 0;
                    overflow-x: clip; 
                }
                .bento-grid { display: grid; grid-template-columns: repeat(1, 1fr); gap: 32px; }
                @media (min-width: 768px) { .bento-grid { grid-template-columns: repeat(2, 1fr); } }
                @media (min-width: 1024px) { .bento-grid { grid-template-columns: repeat(2, 1fr); } }
                .col-span-2 { grid-column: span 1; }
                @media (min-width: 1024px) { .col-span-2 { grid-column: span 2; } }
                
                .nav-links { display: none; gap: 36px; font-size: 15px; color: #52525b; font-weight: 500; }
                @media (min-width: 768px) { .nav-links { display: flex; } }
            `}</style>

            {/* ───────────────────────────────────────────── */}
            {/* NAVBAR */}
            {/* ───────────────────────────────────────────── */}
            <motion.nav initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: customEase }} style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: "20px 5%", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.7)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderBottom: "1px solid rgba(0,0,0,0.05)", willChange: "transform, opacity" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <VoxaLogo size={24} />
                    <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", color: "#09090b" }}>Voxa AI</span>
                </div>

                <div className="nav-links">
                    <a href="#how-it-works" style={{ color: "inherit", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={e => e.target.style.color = "#09090b"} onMouseLeave={e => e.target.style.color = "#52525b"}>How it Works</a>
                    <a href="#features" style={{ color: "inherit", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={e => e.target.style.color = "#09090b"} onMouseLeave={e => e.target.style.color = "#52525b"}>Features</a>
                    <a href="#faqs" style={{ color: "inherit", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={e => e.target.style.color = "#09090b"} onMouseLeave={e => e.target.style.color = "#52525b"}>FAQs</a>
                </div>

                <motion.button onClick={onLaunch} whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(124, 58, 237, 0.4)" }} whileTap={{ scale: 0.95 }} style={{ background: themeColors.primary, border: "none", color: "#fff", padding: "12px 28px", borderRadius: 999, fontSize: 15, fontWeight: 600, cursor: "pointer", transition: "box-shadow 0.2s", willChange: "transform" }}>
                    Get Started
                </motion.button>
            </motion.nav>

            {/* ───────────────────────────────────────────── */}
            {/* HERO SECTION (Sticky Attention Scroll) */}
            {/* ───────────────────────────────────────────── */}
            <section ref={heroRef} style={{ position: "relative", height: "250vh", zIndex: 10 }}>
                <div style={{ position: "sticky", top: 0, height: "100vh", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>

                    {/* TEXT BLOCK */}
                    <motion.div style={{ position: "absolute", top: "max(120px, 16vh)", y: heroTextY, opacity: heroTextOpacity, textAlign: "center", width: "100%", maxWidth: 1000, zIndex: 2, padding: "0 5%", willChange: "transform, opacity" }}>
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: customEase }} style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 32, padding: "8px 24px", borderRadius: 999, background: "#fff", border: "1px solid #e5e5e5", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.05)", willChange: "transform, opacity" }}>
                            <span style={{ color: themeColors.primary, fontSize: 14 }}>✦</span>
                            <span style={{ color: "#52525b", fontSize: 14, fontWeight: 600 }}>Your Voice-Enabled Web Assistant</span>
                        </motion.div>

                        <h1 style={{ fontSize: "clamp(48px, 8vw, 96px)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.05, margin: "0 auto 24px auto", color: "#09090b", maxWidth: 900 }}>
                            <RevealText text="Speak. Assist. Engage." />
                            <span style={{ display: "block" }}>
                                <motion.span initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.8, ease: customEase }} style={{ background: themeColors.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", willChange: "transform, opacity", display: "inline-block" }}>
                                    Powered by Voxa AI.
                                </motion.span>
                            </span>
                        </h1>

                        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 1, ease: customEase }} style={{ fontSize: "clamp(18px, 2.5vw, 22px)", color: "#52525b", fontWeight: 400, maxWidth: 650, margin: "0 auto 40px auto", lineHeight: 1.6, willChange: "transform, opacity" }}>
                            Your voice-first experience for smarter, humanlike web interactions. Stop typing and start achieving.
                        </motion.p>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 1.2, ease: customEase }} style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap", willChange: "transform, opacity" }}>
                            <motion.button onClick={onLaunch} whileHover={{ scale: 1.05, boxShadow: "0 20px 40px -10px rgba(0,0,0,0.15)" }} whileTap={{ scale: 0.95 }} style={{ background: "#09090b", color: "#fff", border: "none", padding: "0 40px", height: 60, borderRadius: 999, fontSize: 16, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 12, transition: "box-shadow 0.2s", willChange: "transform" }}>
                                <span style={{ width: 8, height: 8, borderRadius: "50%", background: themeColors.primary, display: "block" }} /> Start Talking
                            </motion.button>
                            <motion.a href="#how-it-works" whileHover={{ scale: 1.05, backgroundColor: "#f4f4f5" }} whileTap={{ scale: 0.95 }} style={{ background: "#fff", color: "#09090b", border: "1px solid #e5e5e5", padding: "0 40px", height: 60, borderRadius: 999, fontSize: 16, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none", transition: "background-color 0.2s", willChange: "transform" }}>
                                See how it works
                            </motion.a>
                        </motion.div>
                    </motion.div>

                    {/* VIDEO BLOCK */}
                    <motion.div style={{ position: "relative", y: videoContainerY, scale: videoContainerScale, width: "100%", maxWidth: 1100, padding: "0 5%", zIndex: 10, willChange: "transform" }}>
                        <div style={{ width: "100%", background: "rgba(255,255,255,0.9)", borderRadius: 32, padding: 12, border: "1px solid rgba(255,255,255,1)", boxShadow: "0 40px 80px -20px rgba(124, 58, 237, 0.25), 0 0 40px 10px rgba(255,255,255,0.8)", backdropFilter: "blur(30px)" }}>
                            <div style={{ width: "100%", aspectRatio: "16/9", background: "#05050a", borderRadius: 20, boxShadow: "inset 0 4px 10px rgba(0,0,0,0.2)", position: "relative", overflow: "hidden" }}>
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
            {/* HOW IT WORKS (Sticky Scroll) */}
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
            <footer style={{ padding: "80px 5% 40px 5%", background: "#ffffff", borderTop: "1px solid #f4f4f5", position: "relative", zIndex: 10 }}>
                <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 40 }}>

                    <div style={{ maxWidth: 350 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
                            <VoxaLogo size={24} /> <span style={{ color: "#09090b", fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }}>Voxa AI</span>
                        </div>
                        <p style={{ color: "#71717a", fontSize: 15, lineHeight: 1.6 }}>Voxa AI is a voice-first AI assistant that allows you to have natural, spoken conversations to get answers, insights, or support—hands-free and in real time.</p>
                    </div>

                    <div style={{ display: "flex", gap: 80, flexWrap: "wrap" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <h4 style={{ color: "#09090b", fontWeight: 700, marginBottom: 8, fontSize: 16 }}>Product</h4>
                            <a href="#" style={{ color: "#52525b", textDecoration: "none", fontSize: 15, transition: "color 0.2s" }} onMouseEnter={e => e.target.style.color = "#09090b"} onMouseLeave={e => e.target.style.color = "#52525b"}>Home</a>
                            <a href="#features" style={{ color: "#52525b", textDecoration: "none", fontSize: 15, transition: "color 0.2s" }} onMouseEnter={e => e.target.style.color = "#09090b"} onMouseLeave={e => e.target.style.color = "#52525b"}>Features</a>
                            <a href="#how-it-works" style={{ color: "#52525b", textDecoration: "none", fontSize: 15, transition: "color 0.2s" }} onMouseEnter={e => e.target.style.color = "#09090b"} onMouseLeave={e => e.target.style.color = "#52525b"}>How it works</a>
                            <a href="#faqs" style={{ color: "#52525b", textDecoration: "none", fontSize: 15, transition: "color 0.2s" }} onMouseEnter={e => e.target.style.color = "#09090b"} onMouseLeave={e => e.target.style.color = "#52525b"}>FAQs</a>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <h4 style={{ color: "#09090b", fontWeight: 700, marginBottom: 8, fontSize: 16 }}>Legal</h4>
                            <a href="#" style={{ color: "#52525b", textDecoration: "none", fontSize: 15, transition: "color 0.2s" }} onMouseEnter={e => e.target.style.color = "#09090b"} onMouseLeave={e => e.target.style.color = "#52525b"}>Privacy Policy</a>
                            <a href="#" style={{ color: "#52525b", textDecoration: "none", fontSize: 15, transition: "color 0.2s" }} onMouseEnter={e => e.target.style.color = "#09090b"} onMouseLeave={e => e.target.style.color = "#52525b"}>Terms of Service</a>
                        </div>
                    </div>
                </div>

                <div style={{ maxWidth: 1400, margin: "80px auto 0 auto", paddingTop: 32, borderTop: "1px solid #f4f4f5", textAlign: "center", color: "#a1a1aa", fontSize: 14 }}>
                    Copyright © 2026 Voxa AI - Developed by Afish Abdulkader
                </div>
            </footer>
        </div>
    );
}