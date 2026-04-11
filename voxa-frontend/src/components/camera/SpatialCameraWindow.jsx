import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Human } from "@vladmandic/human";

export default function SpatialCameraWindow({ isActive, onClose, videoRef, onEmotionDetected }) {
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [currentEmotion, setCurrentEmotion] = useState("Scanning...");
    const canvasRef = useRef(null);
    const humanRef = useRef(null);
    const requestRef = useRef(null);

    // 🧠 1. Initialize the Modern 'Human' AI Engine
    useEffect(() => {
        const initHuman = async () => {
            humanRef.current = new Human({
                // Pulls the latest AI weights directly from the CDN
                modelBasePath: 'https://cdn.jsdelivr.net/npm/@vladmandic/human/models',
                face: { emotion: { enabled: true } }, // We only need the emotion engine
                body: { enabled: false },
                hand: { enabled: false },
                object: { enabled: false },
                gesture: { enabled: false }
            });

            // Warm up the neural net
            await humanRef.current.load();
            setModelsLoaded(true);
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
                .catch((err) => console.error("Camera access denied:", err));
        }

        return () => {
            if (stream) stream.getTracks().forEach(track => track.stop());
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isActive, videoRef]);

    // 👁️ 3. The 60FPS Live Emotion Scanner
    const detectFrame = async () => {
        if (!videoRef.current || !canvasRef.current || !humanRef.current) return;

        // Run the AI over the current video frame
        const result = await humanRef.current.detect(videoRef.current);

        // Clear previous drawings
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        // Draw the sleek modern tracking mesh
        humanRef.current.draw.all(canvasRef.current, result);

        if (result.face && result.face.length > 0) {
            const emotions = result.face[0].emotion;
            if (emotions && emotions.length > 0) {
                // Human automatically sorts emotions by confidence score
                const topEmotion = emotions[0].emotion;
                const formatEmotion = topEmotion.charAt(0).toUpperCase() + topEmotion.slice(1);

                setCurrentEmotion(formatEmotion);
                if (onEmotionDetected) onEmotionDetected(formatEmotion);
            }
        } else {
            setCurrentEmotion("No face detected");
        }

        // Loop at the speed of the monitor's refresh rate
        requestRef.current = requestAnimationFrame(detectFrame);
    };

    const handleVideoPlay = () => {
        if (!modelsLoaded || !videoRef.current || !canvasRef.current) return;

        // Sync canvas size to video size
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;

        // Start the AI loop
        detectFrame();
    };

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
                        {/* The Live Video Feed */}
                        <video
                            id="voxa-camera-feed"
                            ref={videoRef}
                            onPlay={handleVideoPlay}
                            autoPlay playsInline muted
                            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, transform: "scaleX(-1)" }}
                        />

                        {/* The AI Drawing Canvas Overlay */}
                        <canvas
                            ref={canvasRef}
                            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 1, transform: "scaleX(-1)" }}
                        />

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10 }}>
                            <div style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(20px)", padding: "8px 16px", borderRadius: 999, color: "#fff", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", border: "1px solid rgba(255,255,255,0.15)" }}>
                                <span style={{ display: "inline-block", width: 8, height: 8, background: modelsLoaded ? "#22c55e" : "#f59e0b", borderRadius: "50%", marginRight: 8, animation: "dotBeat 1.5s infinite" }} />
                                {modelsLoaded ? "AI PERCEPTION LIVE" : "LOADING NEURAL NET..."}
                            </div>
                            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.2)", width: 44, height: 44, borderRadius: "50%", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>

                        <div style={{ display: "flex", justifyContent: "center", zIndex: 10, paddingBottom: 10 }}>
                            <p style={{ color: "rgba(255,255,255,0.9)", fontSize: 14, fontWeight: 500, letterSpacing: "0.02em", background: "rgba(0,0,0,0.6)", padding: "12px 28px", borderRadius: 999, backdropFilter: "blur(16px)", border: `1px solid ${currentEmotion === 'Happy' ? '#22c55e' : 'rgba(255,255,255,0.15)'}`, textAlign: "center", transition: "border 0.3s" }}>
                                Mood: {currentEmotion}
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}