import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Human } from "@vladmandic/human";

export default function SpatialCameraWindow({ isActive, onClose, videoRef, onEmotionDetected }) {
    const humanRef = useRef(null);
    const requestRef = useRef(null);
    const lastMoodRef = useRef("neutral");

    const [isAiReady, setIsAiReady] = useState(false);
    const [localMood, setLocalMood] = useState("Scanning...");

    // 🧠 1. Load the AI safely and correctly
    useEffect(() => {
        const initHuman = async () => {
            try {
                humanRef.current = new Human({
                    // FIX: Added trailing slash to the CDN path!
                    modelBasePath: 'https://cdn.jsdelivr.net/npm/@vladmandic/human/models/',
                    // FIX: Explicitly enabled the main face detector!
                    face: { enabled: true, emotion: { enabled: true } },
                    body: { enabled: false }, hand: { enabled: false }, object: { enabled: false }, gesture: { enabled: false }
                });
                await humanRef.current.load();
                setIsAiReady(true);
                setLocalMood("Neutral"); // Ready to go
            } catch (err) {
                console.error("AI Load Error:", err);
                setLocalMood("Engine Error");
            }
        };
        initHuman();
    }, []);

    // 📹 2. Boot up the Camera
    useEffect(() => {
        let stream;
        if (isActive) {
            navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
                .then((s) => {
                    stream = s;
                    if (videoRef.current) videoRef.current.srcObject = s;
                })
                .catch((err) => console.error("Webcam error:", err));
        }
        return () => {
            if (stream) stream.getTracks().forEach(track => track.stop());
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isActive, videoRef]);

    // 👁️ 3. The Throttled Scanning Loop
    const detectFrame = async () => {
        if (!videoRef.current || !humanRef.current || !isAiReady) return;

        // Ensure the video actually has data before scanning
        if (videoRef.current.readyState >= 2) {
            try {
                const result = await humanRef.current.detect(videoRef.current);

                if (result.face && result.face.length > 0) {
                    const emotions = result.face[0].emotion;
                    if (emotions && emotions.length > 0) {
                        const topEmotion = emotions[0].emotion;

                        // FIX: Only update React if your mood actually changes!
                        if (topEmotion !== lastMoodRef.current) {
                            lastMoodRef.current = topEmotion;

                            // Capitalize the word for the UI (e.g., "happy" -> "Happy")
                            const displayMood = topEmotion.charAt(0).toUpperCase() + topEmotion.slice(1);
                            setLocalMood(displayMood);

                            // Send the data up to App.jsx -> Backend -> Llama 3
                            if (onEmotionDetected) onEmotionDetected(topEmotion);
                        }
                    }
                }
            } catch (err) {
                // Fails silently if frame is dropped, which is fine
            }
        }

        // Loop continuously
        requestRef.current = requestAnimationFrame(detectFrame);
    };

    const handleVideoPlay = () => {
        if (isAiReady) detectFrame();
    };

    // If AI finishes loading after video starts playing, kickstart the loop
    useEffect(() => {
        if (isAiReady && videoRef.current && !videoRef.current.paused) {
            detectFrame();
        }
    }, [isAiReady]);

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
                            pointerEvents: "auto", width: "min(92vw, 420px)", height: "min(80dvh, 600px)",
                            borderRadius: "clamp(24px, 5vw, 40px)", border: "1px solid rgba(255,255,255,0.15)",
                            boxShadow: "0 40px 100px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.15)",
                            position: "relative", overflow: "hidden", display: "flex",
                            flexDirection: "column", justifyContent: "space-between", padding: "clamp(12px, 4vw, 24px)",
                            background: "#000"
                        }}
                    >
                        <video
                            id="voxa-camera-feed"
                            ref={videoRef}
                            onPlay={handleVideoPlay}
                            autoPlay playsInline muted
                            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, transform: "scaleX(-1)" }}
                        />

                        {/* Top Bar */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10 }}>
                            <div style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(20px) saturate(150%)", padding: "8px 16px", borderRadius: 999, color: "#fff", fontSize: 13, fontWeight: 600, letterSpacing: "0.08em", display: "flex", alignItems: "center", border: "1px solid rgba(255,255,255,0.15)" }}>
                                <span style={{ display: "inline-block", width: 8, height: 8, background: isAiReady ? "#22c55e" : "#f59e0b", borderRadius: "50%", marginRight: 8, animation: "dotBeat 1.5s infinite" }} />
                                {isAiReady ? "VISION ACTIVE" : "LOADING AI..."}
                            </div>
                            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(20px) saturate(150%)", border: "1px solid rgba(255,255,255,0.2)", width: 44, height: 44, borderRadius: "50%", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", outline: "none" }}>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>

                        {/* Laser Animation */}
                        <motion.div animate={{ y: ["-10%", "600%", "-10%"] }} transition={{ duration: 4, ease: "linear", repeat: Infinity }} style={{ position: "absolute", top: "10%", left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)", boxShadow: "0 0 20px 2px rgba(255,255,255,0.6)" }} />

                        {/* 🚀 NEW: Dynamic Mood Badge */}
                        <div style={{ display: "flex", justifyContent: "center", zIndex: 10, paddingBottom: 10 }}>
                            <p style={{ color: "rgba(255,255,255,0.9)", fontSize: 14, fontWeight: 500, letterSpacing: "0.02em", background: "rgba(0,0,0,0.5)", padding: "12px 28px", borderRadius: 999, backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.15)", textAlign: "center", transition: "all 0.3s" }}>
                                Mood: {localMood}
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}