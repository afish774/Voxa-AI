import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const themeColors = { primary: "#7c3aed", secondary: "#db2777", gradient: "linear-gradient(135deg, #7c3aed, #db2777)", bgDark: "#05050a" };
const customEase = [0.16, 1, 0.3, 1];

const SLIDES = [
    { title: "Your voice, amplified.", desc: "Experience the next generation of web interaction. Log in to access your personal AI assistant." },
    { title: "Summarize effortlessly.", desc: "Condense complex documents instantly with AI. Let Voxa read the fine print for you." },
    { title: "Absolute privacy.", desc: "Enjoy secure, end-to-end encrypted conversations. Your data remains entirely yours." }
];

const VoxaLogo = ({ size = 32, isDark = false }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="8" width="3" height="8" rx="1.5" fill={isDark ? "url(#logo_grad_auth)" : "#09090b"} />
        <rect x="10.5" y="4" width="3" height="16" rx="1.5" fill={isDark ? "url(#logo_grad_auth)" : "#09090b"} />
        <rect x="18" y="9" width="3" height="6" rx="1.5" fill={isDark ? "url(#logo_grad_auth)" : "#09090b"} />
        {isDark && (
            <defs>
                <linearGradient id="logo_grad_auth" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                    <stop stopColor={themeColors.primary} /><stop offset="1" stopColor={themeColors.secondary} />
                </linearGradient>
            </defs>
        )}
    </svg>
);

const IconMail = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>;
const IconLock = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>;
const IconUser = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
const IconArrowLeft = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>;
const IconGoogle = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>;
const IconGitHub = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.6.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02 0.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" /></svg>;
const IconFacebook = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2" xmlns="http://www.w3.org/2000/svg"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>;

function AmbientOrbs() {
    return (
        <div style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
            <div style={{ position: "absolute", inset: 0, opacity: 0.15, mixBlendMode: "overlay", backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />
            <motion.div animate={{ rotate: 360, scale: [1, 1.1, 1], x: [0, 30, 0] }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }} style={{ position: "absolute", top: "-10%", left: "-10%", width: "60%", height: "60%", background: themeColors.primary, borderRadius: "50%", filter: "blur(120px)", opacity: 0.3 }} />
            <motion.div animate={{ rotate: -360, scale: [1, 1.2, 1], y: [0, -40, 0] }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }} style={{ position: "absolute", bottom: "-10%", right: "-10%", width: "70%", height: "70%", background: themeColors.secondary, borderRadius: "50%", filter: "blur(140px)", opacity: 0.25 }} />
            <motion.div animate={{ scale: [0.8, 1.2, 0.8], x: [0, -50, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }} style={{ position: "absolute", top: "30%", right: "10%", width: "40%", height: "40%", background: themeColors.primary, borderRadius: "50%", filter: "blur(100px)", opacity: 0.2 }} />
        </div>
    );
}

const InputField = ({ icon, type, placeholder, value, onChange }) => {
    const [isFocused, setIsFocused] = useState(false);
    return (
        <div style={{ position: "relative", width: "100%", marginBottom: 16 }}>
            <div style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: isFocused ? themeColors.primary : "#a1a1aa", transition: "color 0.2s ease", display: "flex" }}>{icon}</div>
            <input type={type} required placeholder={placeholder} value={value} onChange={onChange} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} style={{ width: "100%", padding: "16px 16px 16px 46px", borderRadius: 14, border: `1px solid ${isFocused ? themeColors.primary : "#e5e5e5"}`, background: isFocused ? "#ffffff" : "#fafafa", color: "#09090b", fontSize: "16px", outline: "none", boxSizing: "border-box", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)", boxShadow: isFocused ? "0 0 0 4px rgba(124, 58, 237, 0.12)" : "none", WebkitAppearance: "none" }} />
        </div>
    );
};

const SocialButton = ({ icon, text, onClick }) => (
    <motion.button type="button" whileHover={{ scale: 1.02, backgroundColor: "#f4f4f5" }} whileTap={{ scale: 0.98 }} onClick={onClick} style={{ width: "100%", padding: "14px", borderRadius: 14, border: "1px solid #e5e5e5", background: "#ffffff", color: "#09090b", fontSize: "15px", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", cursor: "pointer", transition: "border-color 0.2s", marginBottom: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
        {icon} {text}
    </motion.button>
);

export default function AuthPage({ onBack, onAuthSuccess }) {
    const [isLogin, setIsLogin] = useState(true);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    useEffect(() => {
        const timer = setInterval(() => { setCurrentSlide((prev) => (prev + 1) % SLIDES.length); }, 4000);
        return () => clearInterval(timer);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const endpoint = isLogin ? "https://voxa-ai-zh5o.onrender.com/api/auth/login" : "https://voxa-ai-zh5o.onrender.com/api/auth/register";
            const payload = isLogin ? { email, password } : { name, email, password };

            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                // Instantly update state in App.jsx. No URL refresh needed!
                const userObj = { _id: data._id, name: data.name, email: data.email };
                try {
                    localStorage.setItem('voxa_token', data.token);
                    localStorage.setItem('voxa_user', JSON.stringify(userObj));
                } catch (e) { }
                onAuthSuccess(userObj);
            } else {
                alert(data.message || "Authentication failed.");
            }
        } catch (error) {
            console.error("Auth error:", error);
            alert("Could not connect to the backend server. Please try again in 30 seconds.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = () => { window.location.href = "https://voxa-ai-zh5o.onrender.com/api/auth/google"; };
    const handleGitHubLogin = () => { window.location.href = "https://voxa-ai-zh5o.onrender.com/api/auth/github"; };
    const handleFacebookLogin = () => { window.location.href = "https://voxa-ai-zh5o.onrender.com/api/auth/facebook"; };

    return (
        <div style={{ display: "flex", minHeight: "100dvh", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", backgroundColor: "#ffffff" }}>
            <style>{`
                html, body { margin: 0; padding: 0; background: #ffffff; overscroll-behavior-y: none; }
                * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
                .mobile-logo { display: none; }
                .split-right { overflow-y: auto; }
                @media (max-width: 900px) {
                    .split-left { display: none !important; }
                    .split-right { width: 100% !important; flex: none !important; padding: 24px !important; justify-content: flex-start !important; padding-top: max(10vh, 40px) !important; }
                    .mobile-logo { display: flex !important; align-items: center; gap: 10px; margin-bottom: 40px; justify-content: center; }
                    .back-btn { top: 16px !important; right: 16px !important; padding: 8px 14px !important; }
                }
            `}</style>

            <div className="split-left" style={{ flex: 1, position: "relative", backgroundColor: themeColors.bgDark, overflow: "hidden", display: "flex", flexDirection: "column", padding: "60px", color: "#ffffff" }}>
                <AmbientOrbs />
                <div style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", gap: 12 }}>
                    <VoxaLogo size={32} isDark={true} /> <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", color: "#fff" }}>Voxa AI</span>
                </div>
                <div style={{ flex: 1, position: "relative", zIndex: 10, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-start", paddingRight: "40px" }}>
                    <AnimatePresence mode="wait">
                        <motion.div key={currentSlide} initial={{ opacity: 0, y: 20, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -20, filter: "blur(4px)" }} transition={{ duration: 0.5, ease: customEase }} style={{ minHeight: "160px" }}>
                            <h1 style={{ fontSize: "clamp(40px, 4.5vw, 56px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, margin: "0 0 20px 0", maxWidth: 500, color: "#fff" }}>
                                {SLIDES[currentSlide].title.split(',')[0]}
                                {SLIDES[currentSlide].title.includes(',') && ","}
                                <br />
                                <span style={{ background: themeColors.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{SLIDES[currentSlide].title.split(',')[1]}</span>
                            </h1>
                            <p style={{ fontSize: 18, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, maxWidth: 450, margin: 0 }}>{SLIDES[currentSlide].desc}</p>
                        </motion.div>
                    </AnimatePresence>
                    <div style={{ display: "flex", gap: 12, marginTop: 40 }}>
                        {SLIDES.map((_, idx) => (<button key={idx} onClick={() => setCurrentSlide(idx)} style={{ width: currentSlide === idx ? 32 : 8, height: 8, borderRadius: 4, background: currentSlide === idx ? themeColors.primary : "rgba(255,255,255,0.2)", border: "none", cursor: "pointer", padding: 0, transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)", outline: "none" }} />))}
                    </div>
                </div>
            </div>

            <div className="split-right" style={{ flex: 1, position: "relative", backgroundColor: "#ffffff", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "40px" }}>
                <motion.button className="back-btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} onClick={onBack} style={{ position: "absolute", top: 40, right: 40, background: "#ffffff", border: "1px solid #e5e5e5", display: "flex", alignItems: "center", gap: 8, color: "#52525b", cursor: "pointer", zIndex: 10, fontSize: 14, fontWeight: 500, outline: "none", padding: "10px 16px", borderRadius: 999, boxShadow: "0 2px 8px rgba(0,0,0,0.02)", transition: "all 0.2s" }} whileHover={{ color: "#09090b", borderColor: "#d4d4d8", boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }} whileTap={{ scale: 0.96 }}>
                    <IconArrowLeft /> Back to home
                </motion.button>

                <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: customEase }} style={{ width: "100%", maxWidth: 400, paddingTop: "40px", paddingBottom: "40px" }}>
                    <div className="mobile-logo">
                        <VoxaLogo size={28} isDark={false} /> <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: "#09090b" }}>Voxa AI</span>
                    </div>

                    <motion.div layout style={{ marginBottom: 32 }}>
                        <h2 style={{ fontSize: "clamp(28px, 4vw, 32px)", fontWeight: 700, color: "#09090b", margin: "0 0 8px 0", letterSpacing: "-0.03em" }}>{isLogin ? "Welcome back" : "Create an account"}</h2>
                        <p style={{ fontSize: 15, color: "#71717a", margin: 0 }}>{isLogin ? "Please enter your details to sign in." : "Start building with Voxa today."}</p>
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
                                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#71717a", cursor: "pointer", userSelect: "none" }}>
                                    <input type="checkbox" style={{ accentColor: themeColors.primary, width: 16, height: 16, cursor: "pointer" }} /> Remember me
                                </label>
                                <span style={{ fontSize: 14, color: themeColors.primary, fontWeight: 600, cursor: "pointer" }}>Forgot password?</span>
                            </motion.div>
                        )}

                        <motion.button layout type="submit" disabled={isLoading} whileHover={{ scale: isLoading ? 1 : 1.01, boxShadow: isLoading ? "none" : "0 10px 25px -5px rgba(124, 58, 237, 0.4)" }} whileTap={{ scale: isLoading ? 1 : 0.96 }} style={{ background: themeColors.gradient, color: "#fff", border: "none", padding: "16px", borderRadius: 14, fontSize: 16, fontWeight: 600, cursor: isLoading ? "not-allowed" : "pointer", marginTop: 16, transition: "all 0.3s ease", opacity: isLoading ? 0.7 : 1, outline: "none", boxShadow: "0 4px 14px rgba(124, 58, 237, 0.2)" }}>
                            {isLoading ? "Authenticating..." : (isLogin ? "Sign In" : "Create Account")}
                        </motion.button>
                    </form>

                    <div style={{ display: "flex", alignItems: "center", margin: "24px 0" }}>
                        <div style={{ flex: 1, height: 1, backgroundColor: "#f4f4f5" }} />
                        <span style={{ padding: "0 12px", fontSize: 13, color: "#a1a1aa", fontWeight: 500 }}>Or continue with</span>
                        <div style={{ flex: 1, height: 1, backgroundColor: "#f4f4f5" }} />
                    </div>

                    <motion.div layout style={{ display: "flex", flexDirection: "column" }}>
                        <SocialButton icon={<IconGoogle />} text="Google" onClick={handleGoogleLogin} />
                        <SocialButton icon={<IconGitHub />} text="GitHub" onClick={handleGitHubLogin} />
                        <SocialButton icon={<IconFacebook />} text="Facebook" onClick={handleFacebookLogin} />
                    </motion.div>

                    <motion.div layout style={{ marginTop: 24, textAlign: "center", fontSize: 14, color: "#71717a" }}>
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