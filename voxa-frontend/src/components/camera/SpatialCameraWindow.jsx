import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Human } from "@vladmandic/human";

// 🎨 Subtle Ambient Glows for each emotion
const EMOTION_AURA = {
    neutral: "rgba(255, 255, 255, 0.15)",
    happy: "rgba(252, 211, 77, 0.4)",     // Warm Amber
    sad: "rgba(96, 165, 250, 0.4)",       // Cool Blue
    angry: "rgba(248, 113, 113, 0.4)",    // Soft Red
    fear: "rgba(167, 139, 250, 0.4)",     // Muted Purple
    disgust: "rgba(52, 211, 153, 0.4)",   // Sickly Green
    surprise: "rgba(251, 146, 60, 0.4)"   // Energetic Orange
};

export default function SpatialCameraWindow({ isActive, onClose, videoRef, onEmotionDetected }) {
    const humanRef = useRef(null);
    const requestRef = useRef(null);

    // Engine & Hardware State
    const [isAiReady, setIsAiReady] = useState(false);
    const [currentMood, setCurrentMood] = useState("neutral");
    const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
    const [facingMode, setFacingMode] = useState("user");

    // Smoothing Variables
    const moodBufferRef = useRef({ emotion: "neutral", count: 0 });
    const lastEmittedMoodRef = useRef("neutral");

    // Hardware Check: How many cameras does this device have?
    useEffect(() => {
        const checkDevices = async () => {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoInputs = devices.filter(d => d.kind === 'videoinput');
                setHasMultipleCameras(videoInputs.length > 1);
            } catch (err) {
                console.error("Device enumeration error:", err);
            }
        };
        checkDevices();
    }, []);

    // 🧠 1. Load the AI
    useEffect(() => {
        const initHuman = async () => {
            try {
                humanRef.current = new Human({
                    modelBasePath: 'https://cdn.jsdelivr.net/npm/@vladmandic/human/models/',
                    face: { enabled: true, emotion: { enabled: true } },
                    body: { enabled: false }, hand: { enabled: false }, object: { enabled: false }, gesture: { enabled: false }
                });
                await humanRef.current.load();
                setIsAiReady(true);
            } catch (err) {
                console.error("AI Load Error:", err);
            }
        };
        initHuman();
    }, []);

    // 📹 2. Boot up the Camera (Now respects facingMode)
    useEffect(() => {
        let stream;
        if (isActive) {
            navigator.mediaDevices.getUserMedia({ video: { facingMode: facingMode } })
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
    }, [isActive, facingMode, videoRef]);

    // 👁️ 3. The Smoothed Scanning Loop
    const detectFrame = async () => {
        if (!videoRef.current || !humanRef.current || !isAiReady) return;

        if (videoRef.current.readyState >= 2) {
            try {
                const result = await humanRef.current.detect(videoRef.current);

                if (result.face && result.face.length > 0) {
                    const emotions = result.face[0].emotion;

                    if (emotions && emotions.length > 0) {
                        const topEmotion = emotions[0];

                        // ALGORITHM 1: Confidence Threshold (Must be > 40% sure)
                        let detectedEmotion = "neutral";
                        if (topEmotion.score > 0.4) {
                            detectedEmotion = topEmotion.emotion;
                        }

                        // ALGORITHM 2: The Debouncer (Must hold face for ~10 frames to register)
                        if (moodBufferRef.current.emotion === detectedEmotion) {
                            moodBufferRef.current.count += 1;
                        } else {
                            moodBufferRef.current = { emotion: detectedEmotion, count: 1 };
                        }

                        // If emotion is stable, update the UI and notify the Backend
                        if (moodBufferRef.current.count >= 10 && lastEmittedMoodRef.current !== detectedEmotion) {
                            lastEmittedMoodRef.current = detectedEmotion;
                            setCurrentMood(detectedEmotion);

                            if (onEmotionDetected) onEmotionDetected(detectedEmotion);
                        }
                    }
                }
            } catch (err) { }
        }

        requestRef.current = requestAnimationFrame(detectFrame);
    };

    const handleVideoPlay = () => { if (isAiReady) detectFrame(); };

    useEffect(() => {
        if (isAiReady && videoRef.current && !videoRef.current.paused) {
            detectFrame();
        }
    }, [isAiReady]);

    const toggleCamera = () => {
        setFacingMode(prev => prev === "user" ? "environment" : "user");
    };

    return (
        <AnimatePresence>
            {isActive && (
                <motion.div
                    style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)", pointerEvents: "none" }}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{
                            opacity: 1, y: 0, scale: 1,
                            boxShadow: `0 40px 100px rgba(0,0,0,0.8), 0 0 60px ${EMOTION_AURA[currentMood] || EMOTION_AURA.neutral}, inset 0 1px 1px rgba(255,255,255,0.2)`
                        }}
                        exit={{ opacity: 0, y: 30, scale: 0.95, transition: { duration: 0.2 } }}
                        transition={{ type: "spring", stiffness: 350, damping: 30, boxShadow: { duration: 1.5 } }}
                        style={{
                            pointerEvents: "auto", width: "min(92vw, 420px)", height: "min(80dvh, 600px)",
                            borderRadius: "clamp(24px, 5vw, 40px)", border: `1px solid ${EMOTION_AURA[currentMood] || "rgba(255,255,255,0.15)"}`,
                            position: "relative", overflow: "hidden", display: "flex",
                            flexDirection: "column", justifyContent: "space-between", padding: "clamp(12px, 4vw, 24px)",
                            background: "#000"
                        }}
                    >
                        <video
                            id="voxa-camera-feed" ref={videoRef} onPlay={handleVideoPlay} autoPlay playsInline muted
                            // Disable mirroring when using the back camera so text doesn't look backwards
                            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, transform: facingMode === "user" ? "scaleX(-1)" : "none", transition: "transform 0.3s" }}
                        />

                        {/* Top Bar */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10 }}>

                            {/* Conditional Flip Camera Button */}
                            {hasMultipleCameras ? (
                                <button onClick={toggleCamera} style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(20px) saturate(150%)", border: "1px solid rgba(255,255,255,0.2)", width: 44, height: 44, borderRadius: "50%", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", outline: "none", transition: "background 0.2s" }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 10c0-4.4-3.6-8-8-8s-8 3.6-8 8" />
                                        <path d="M2 6v4h4" />
                                        <path d="M4 14c0 4.4 3.6 8 8 8s8-3.6 8-8" />
                                        <path d="M22 18v-4h-4" />
                                    </svg>
                                </button>
                            ) : (
                                <div style={{ width: 44, height: 44 }} /> /* Empty placeholder to keep the close button on the right */
                            )}

                            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(20px) saturate(150%)", border: "1px solid rgba(255,255,255,0.2)", width: 44, height: 44, borderRadius: "50%", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", outline: "none", transition: "background 0.2s" }}>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>

                        {/* Laser Animation */}
                        <motion.div animate={{ y: ["-10%", "600%", "-10%"] }} transition={{ duration: 4, ease: "linear", repeat: Infinity }} style={{ position: "absolute", top: "10%", left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)", boxShadow: "0 0 20px 2px rgba(255,255,255,0.6)" }} />

                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}