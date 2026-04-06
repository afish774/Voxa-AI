import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─────────────────────────────────────────────
// THEME
// ─────────────────────────────────────────────
const themeColors = {
    primary: "#7c3aed",
    secondary: "#db2777",
    gradient: "linear-gradient(135deg, #7c3aed, #db2777)",
    bgDark: "#05050a"
};
const customEase = [0.16, 1, 0.3, 1];

// ─────────────────────────────────────────────
// EDUCATIONAL PROPOSITIONS (Slides)
// ─────────────────────────────────────────────
const SLIDES = [
    {
        title: "Your voice, amplified.",
        desc: "Experience the next generation of web interaction. Log in to access your personal AI assistant."
    },
    {
        title: "Summarize effortlessly.",
        desc: "Condense complex documents instantly with AI. Let Voxa read the fine print for you."
    },
    {
        title: "Absolute privacy.",
        desc: "Enjoy secure, end-to-end encrypted conversations. Your data remains entirely yours."
    }
];

// ─────────────────────────────────────────────
// ICONS
// ─────────────────────────────────────────────
const VoxaLogo = ({ size = 32, isDark = false }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="8" width="3" height="8" rx="1.5" fill={isDark ? "url(#logo_grad_auth)" : "#09090b"} />
        <rect x="10.5" y="4" width="3" height="16" rx="1.5" fill={isDark ? "url(#logo_grad_auth)" : "#09090b"} />
        <rect x="18" y="9" width="3" height="6" rx="1.5" fill={isDark ? "url(#logo_grad_auth)" : "#09090b"} />
        {isDark && (
            <defs>
                <linearGradient id="logo_grad_auth" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                    <stop stopColor={themeColors.primary} />
                    <stop offset="1" stopColor={themeColors.secondary} />
                </linearGradient>
            </defs>
        )}
    </svg>
);

const IconMail = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>;
const IconLock = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>;
const IconUser = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
const IconArrowLeft = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>;

// ─────────────────────────────────────────────
// AMBIENT ORBS BACKGROUND
// ─────────────────────────────────────────────
function AmbientOrbs() {
    return (
        <div style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
            <div style={{ position: "absolute", inset: 0, opacity: 0.15, mixBlendMode: "overlay", backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />
            <motion.div animate={{ rotate: 360, scale: [1, 1.1, 1], x: [0, 30, 0] }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }} style={{ position: "absolute", top: "-10%", left: "-10%", width: "60%", height: "60%", background: themeColors.primary, borderRadius: "50%", filter: "blur(120px)", opacity: 0.3 }} />
            <motion.div animate={{ rotate: -360, scale: [1, 1.2, 1], y: [0, -40, 0] }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }} style={{ position: "absolute", bottom: "-10%", right: "-10%", width: "70%", height: "70%", background: themeColors.secondary, borderRadius: "50%", filter: "blur(140px)", opacity: 0.25 }} />
            <motion.div animate={{ scale: [0.8, 1.2, 0.8], x: [0, -50, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }} style={{ position: "absolute", top: "30%", right: "10%", width: "40%", height: "40%", background: themeColors.primary, borderRadius: "50%", filter: "blur(100px)", opacity: 0.2 }} />
            <motion.div animate={{ rotate: 180, scale: [1, 1.15, 1], y: [0, 50, 0] }} transition={{ duration: 35, repeat: Infinity, ease: "linear" }} style={{ position: "absolute", bottom: "10%", left: "-5%", width: "50%", height: "50%", background: themeColors.secondary, borderRadius: "50%", filter: "blur(130px)", opacity: 0.2 }} />
            <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.25, 0.1] }} transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }} style={{ position: "absolute", top: "40%", left: "40%", width: "30%", height: "30%", background: themeColors.primary, borderRadius: "50%", filter: "blur(90px)" }} />
        </div>
    );
}

// ─────────────────────────────────────────────
// ENTERPRISE INPUT COMPONENT
// ─────────────────────────────────────────────
const InputField = ({ icon, type, placeholder, value, onChange }) => {
    const [isFocused, setIsFocused] = useState(false);
    return (
        <div style={{ position: "relative", width: "100%", marginBottom: 16 }}>
            <div style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: isFocused ? themeColors.primary : "#a1a1aa", transition: "color 0.2s ease", display: "flex" }}>
                {icon}
            </div>
            <input
                type={type}
                required
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                style={{
                    width: "100%", padding: "14px 16px 14px 46px", borderRadius: 12,
                    border: `1px solid ${isFocused ? themeColors.primary : "#e5e5e5"}`,
                    background: isFocused ? "#ffffff" : "#fafafa", color: "#09090b", fontSize: 15, outline: "none", boxSizing: "border-box",
                    fontFamily: "'Inter', sans-serif", transition: "all 0.2s ease",
                    boxShadow: isFocused ? "0 0 0 3px rgba(124, 58, 237, 0.12)" : "none"
                }}
            />
        </div>
    );
};

// ─────────────────────────────────────────────
// MAIN AUTH COMPONENT
// ─────────────────────────────────────────────
export default function AuthPage({ onBack, onAuthSuccess }) {
    const [isLogin, setIsLogin] = useState(true);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    // Form States
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // Auto-advance slideshow
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
        }, 3000);
        return () => clearInterval(timer);
    }, []);

    // ─────────────────────────────────────────────
    // REAL BACKEND CONNECTION
    // ─────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // 🚀 FIXED: Added /auth to the login URL!
            const endpoint = isLogin
                ? "https://voxa-backend.onrender.com/api/auth/login"
                : "https://voxa-backend.onrender.com/api/auth/register";

            const payload = isLogin
                ? { email, password }
                : { name, email, password };

            // Send request to your real Node.js backend
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                // Success! Pass the real user data (and JWT token) back to main.jsx
                if (onAuthSuccess) onAuthSuccess(data);
            } else {
                // Handle backend errors (e.g., "Invalid password", "User already exists")
                alert(data.message || "Authentication failed.");
            }
        } catch (error) {
            console.error("Auth error:", error);
            alert("Could not connect to the backend server. It may be waking up, please try again in 30 seconds.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Inter', sans-serif", backgroundColor: "#ffffff" }}>
            <style>{`
                html, body { margin: 0; padding: 0; }
                * { box-sizing: border-box; }
                @media (max-width: 900px) {
                    .split-left { display: none !important; }
                    .split-right { width: 100% !important; flex: none !important; }
                }
            `}</style>

            {/* LEFT PANEL */}
            <div className="split-left" style={{ flex: 1, position: "relative", backgroundColor: themeColors.bgDark, overflow: "hidden", display: "flex", flexDirection: "column", padding: "60px", color: "#ffffff" }}>
                <AmbientOrbs />
                <div style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", gap: 12 }}>
                    <VoxaLogo size={32} isDark={true} />
                    <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", color: "#fff" }}>Voxa AI</span>
                </div>
                <div style={{ flex: 1, position: "relative", zIndex: 10, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-start", paddingRight: "40px" }}>
                    <AnimatePresence mode="wait">
                        <motion.div key={currentSlide} initial={{ opacity: 0, y: 20, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -20, filter: "blur(4px)" }} transition={{ duration: 0.5, ease: customEase }} style={{ minHeight: "160px" }}>
                            <h1 style={{ fontSize: "clamp(40px, 4.5vw, 56px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, margin: "0 0 20px 0", maxWidth: 500 }}>
                                {SLIDES[currentSlide].title.split(',')[0]}
                                {SLIDES[currentSlide].title.includes(',') && ","}
                                <br />
                                <span style={{ background: themeColors.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                                    {SLIDES[currentSlide].title.split(',')[1]}
                                </span>
                            </h1>
                            <p style={{ fontSize: 18, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, maxWidth: 450, margin: 0 }}>
                                {SLIDES[currentSlide].desc}
                            </p>
                        </motion.div>
                    </AnimatePresence>
                    <div style={{ display: "flex", gap: 12, marginTop: 40 }}>
                        {SLIDES.map((_, idx) => (
                            <button key={idx} onClick={() => setCurrentSlide(idx)} style={{ width: currentSlide === idx ? 32 : 8, height: 8, borderRadius: 4, background: currentSlide === idx ? themeColors.primary : "rgba(255,255,255,0.2)", border: "none", cursor: "pointer", padding: 0, transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)", outline: "none" }} />
                        ))}
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL */}
            <div className="split-right" style={{ flex: 1, position: "relative", backgroundColor: "#ffffff", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "40px" }}>
                <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} onClick={onBack} style={{ position: "absolute", top: 40, right: 40, background: "#ffffff", border: "1px solid #e5e5e5", display: "flex", alignItems: "center", gap: 8, color: "#52525b", cursor: "pointer", zIndex: 10, fontSize: 14, fontWeight: 500, outline: "none", padding: "10px 16px", borderRadius: 999, boxShadow: "0 2px 8px rgba(0,0,0,0.02)", transition: "all 0.2s" }} whileHover={{ color: "#09090b", borderColor: "#d4d4d8", boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }} whileTap={{ scale: 0.96 }}>
                    <IconArrowLeft /> Back to home
                </motion.button>

                <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: customEase }} style={{ width: "100%", maxWidth: 400 }}>
                    <motion.div layout style={{ marginBottom: 40 }}>
                        <h2 style={{ fontSize: 32, fontWeight: 700, color: "#09090b", margin: "0 0 8px 0", letterSpacing: "-0.03em" }}>
                            {isLogin ? "Welcome back" : "Create an account"}
                        </h2>
                        <p style={{ fontSize: 15, color: "#71717a", margin: 0 }}>
                            {isLogin ? "Please enter your details to sign in." : "Start building with Voxa today."}
                        </p>
                    </motion.div>

                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column" }}>
                        <AnimatePresence mode="popLayout">
                            {!isLogin && (
                                <motion.div key="name-input" initial={{ opacity: 0, height: 0, filter: "blur(4px)" }} animate={{ opacity: 1, height: "auto", filter: "blur(0px)" }} exit={{ opacity: 0, height: 0, filter: "blur(4px)" }} transition={{ duration: 0.3, ease: customEase }} style={{ overflow: "hidden" }}>
                                    <InputField icon={<IconUser />} type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <motion.div layout>
                            <InputField icon={<IconMail />} type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} />
                        </motion.div>

                        <motion.div layout>
                            <InputField icon={<IconLock />} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                        </motion.div>

                        {isLogin && (
                            <motion.div layout style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4, marginBottom: 8 }}>
                                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#71717a", cursor: "pointer" }}>
                                    <input type="checkbox" style={{ accentColor: themeColors.primary, width: 16, height: 16, cursor: "pointer" }} />
                                    Remember me
                                </label>
                                <span style={{ fontSize: 14, color: themeColors.primary, fontWeight: 600, cursor: "pointer" }}>Forgot password?</span>
                            </motion.div>
                        )}

                        <motion.button layout type="submit" disabled={isLoading} whileHover={{ scale: isLoading ? 1 : 1.01, boxShadow: isLoading ? "none" : "0 10px 25px -5px rgba(124, 58, 237, 0.4)" }} whileTap={{ scale: isLoading ? 1 : 0.98 }} style={{ background: themeColors.gradient, color: "#fff", border: "none", padding: "16px", borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: isLoading ? "not-allowed" : "pointer", marginTop: 24, transition: "all 0.3s ease", opacity: isLoading ? 0.7 : 1, outline: "none", boxShadow: "0 4px 14px rgba(124, 58, 237, 0.2)" }}>
                            {isLoading ? "Authenticating..." : (isLogin ? "Sign In" : "Create Account")}
                        </motion.button>
                    </form>

                    <motion.div layout style={{ marginTop: 32, textAlign: "center", fontSize: 14, color: "#71717a" }}>
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button type="button" onClick={() => setIsLogin(!isLogin)} style={{ background: "none", border: "none", color: "#09090b", fontWeight: 700, cursor: "pointer", padding: 0, fontFamily: "inherit", fontSize: 14, textDecoration: "underline", textDecorationColor: "transparent", transition: "text-decoration-color 0.2s" }} onMouseEnter={e => e.target.style.textDecorationColor = "#09090b"} onMouseLeave={e => e.target.style.textDecorationColor = "transparent"}>
                            {isLogin ? "Sign up" : "Log in"}
                        </button>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}