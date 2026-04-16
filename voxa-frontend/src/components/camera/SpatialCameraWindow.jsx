import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const EMOTION_AURA = {
    neutral: "rgba(255, 255, 255, 0.15)",
    happy: "rgba(252, 211, 77, 0.4)",
    sad: "rgba(96, 165, 250, 0.4)",
    angry: "rgba(248, 113, 113, 0.4)",
    fear: "rgba(167, 139, 250, 0.4)",
    disgust: "rgba(52, 211, 153, 0.4)",
    surprise: "rgba(251, 146, 60, 0.4)"
};

export default function SpatialCameraWindow({ isActive, onClose, videoRef, onEmotionDetected }) {
    const [currentMood, setCurrentMood] = useState("neutral");
    const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
    const [facingMode, setFacingMode] = useState("user");
    const scanIntervalRef = useRef(null);

    // Helper function to check devices
    const checkHardwareDevices = async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoInputs = devices.filter(d => d.kind === 'videoinput');
            setHasMultipleCameras(videoInputs.length > 1);
        } catch (err) { }
    };

    useEffect(() => {
        checkHardwareDevices();
    }, []);

    useEffect(() => {
        let stream;
        if (isActive) {
            navigator.mediaDevices.getUserMedia({ video: { facingMode: facingMode } })
                .then((s) => {
                    stream = s;
                    if (videoRef.current) videoRef.current.srcObject = s;
                    checkHardwareDevices();
                })
                .catch((err) => console.error("Webcam error:", err));
        }
        return () => {
            if (stream) stream.getTracks().forEach(track => track.stop());
            if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
        };
    }, [isActive, facingMode, videoRef]);

    // 🚀 THE NEW PYTHON AI SCANNER
    useEffect(() => {
        if (isActive) {
            scanIntervalRef.current = setInterval(async () => {
                if (!videoRef.current || videoRef.current.readyState < 2) return;

                // Create a temporary canvas to snap the frame
                const canvas = document.createElement("canvas");
                canvas.width = 400; // Resize to save bandwidth
                canvas.height = 300;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

                const base64Frame = canvas.toDataURL("image/jpeg", 0.5);

                try {
                    // Send to our new Python Microservice!
                    const formData = new FormData();
                    formData.append("image_b64", base64Frame);

                    const response = await fetch("https://afishskibidisigma-voxa-emotion-engine.hf.space/analyze/vision", {
                        method: "POST",
                        body: formData
                    });

                    const data = await response.json();

                    if (data.success && data.dominant_emotion) {
                        setCurrentMood(data.dominant_emotion);
                        // Send the emotion up to App.jsx so Llama knows!
                        if (onEmotionDetected) onEmotionDetected(data.dominant_emotion);
                    }
                } catch (error) {
                    console.error("Failed to reach Python Emotion Engine:", error);
                }
            }, 3000); // Scans every 3 seconds
        }

        return () => {
            if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
        };
    }, [isActive, onEmotionDetected, videoRef]);

    const toggleCamera = () => setFacingMode(prev => prev === "user" ? "environment" : "user");

    return (
        <AnimatePresence>
            {isActive && (
                <motion.div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)", pointerEvents: "none" }}>
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1, boxShadow: `0 40px 100px rgba(0,0,0,0.8), 0 0 60px ${EMOTION_AURA[currentMood] || EMOTION_AURA.neutral}, inset 0 1px 1px rgba(255,255,255,0.2)` }}
                        exit={{ opacity: 0, y: 30, scale: 0.95, transition: { duration: 0.2 } }}
                        transition={{ type: "spring", stiffness: 350, damping: 30, boxShadow: { duration: 1.5 } }}
                        style={{ pointerEvents: "auto", width: "min(92vw, 420px)", height: "min(80dvh, 600px)", borderRadius: "clamp(24px, 5vw, 40px)", border: `1px solid ${EMOTION_AURA[currentMood] || "rgba(255,255,255,0.15)"}`, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "clamp(12px, 4vw, 24px)", background: "#000" }}
                    >
                        <video id="voxa-camera-feed" ref={videoRef} autoPlay playsInline muted style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, transform: facingMode === "user" ? "scaleX(-1)" : "none", transition: "transform 0.3s" }} />

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10 }}>
                            {hasMultipleCameras ? (
                                <button onClick={toggleCamera} style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(20px) saturate(150%)", border: "1px solid rgba(255,255,255,0.2)", width: 44, height: 44, borderRadius: "50%", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", outline: "none", transition: "background 0.2s" }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0-4.4-3.6-8-8-8s-8 3.6-8 8" /><path d="M2 6v4h4" /><path d="M4 14c0 4.4 3.6 8 8 8s8-3.6 8-8" /><path d="M22 18v-4h-4" /></svg>
                                </button>
                            ) : (<div style={{ width: 44, height: 44 }} />)}

                            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(20px) saturate(150%)", border: "1px solid rgba(255,255,255,0.2)", width: 44, height: 44, borderRadius: "50%", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", outline: "none", transition: "background 0.2s" }}>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>

                        <motion.div animate={{ y: ["-10%", "600%", "-10%"] }} transition={{ duration: 4, ease: "linear", repeat: Infinity }} style={{ position: "absolute", top: "10%", left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)", boxShadow: "0 0 20px 2px rgba(255,255,255,0.6)" }} />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}