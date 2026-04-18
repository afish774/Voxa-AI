import React, { useRef } from "react";
import { motion, useSpring, useTransform, useMotionTemplate, useMotionValue } from "framer-motion";

export default function WeatherCard({ data, theme }) {
    const cardRef = useRef(null);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const smoothX = useSpring(mouseX, { damping: 20, stiffness: 150 });
    const smoothY = useSpring(mouseY, { damping: 20, stiffness: 150 });

    const rotateX = useTransform(smoothY, [-0.5, 0.5], [12, -12]);
    const rotateY = useTransform(smoothX, [-0.5, 0.5], [-12, 12]);
    const shineX = useTransform(smoothX, [-0.5, 0.5], ["100%", "0%"]);
    const shineY = useTransform(smoothY, [-0.5, 0.5], ["100%", "0%"]);
    const shineStyle = useMotionTemplate`radial-gradient(circle at ${shineX} ${shineY}, rgba(255,255,255,0.1) 0%, transparent 60%)`;

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
        mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
    };
    const handleMouseLeave = () => { mouseX.set(0); mouseY.set(0); };

    const cond = data?.condition?.toLowerCase() || "";
    const isRainy = cond.includes("rain") || cond.includes("storm") || cond.includes("drizzle") || cond.includes("shower");
    const isSunny = cond.includes("sun") || cond.includes("clear") || cond.includes("fair");
    const isCloudy = cond.includes("cloud") || cond.includes("overcast") || cond.includes("fog");

    let emoji = "☀️";
    if (isCloudy) emoji = "☁️";
    if (isRainy) emoji = "🌧️";

    return (
        <div style={{ position: "relative", perspective: 1200, willChange: "transform" }}>
            <motion.div
                ref={cardRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1, rotateX, rotateY }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="relative overflow-hidden rounded-[32px] bg-black/40 backdrop-blur-2xl border border-white/10 w-[300px] h-[340px] p-6 text-white shadow-2xl cursor-grab"
                style={{ transformStyle: "preserve-3d" }}
            >
                {/* Dynamic Lighting */}
                <motion.div style={{ position: "absolute", inset: -50, background: shineStyle, pointerEvents: "none", zIndex: 10 }} />

                {/* Background ambient glow */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/20 blur-[80px] rounded-full pointer-events-none"></div>

                {/* Header matching reference */}
                <div className="flex justify-between items-start z-20 relative transform-[translateZ(20px)]">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">{data?.location || "Unknown"}</h2>
                        <p className="text-xs font-medium text-white/50 uppercase tracking-widest mt-1">Local Weather</p>
                    </div>
                    <div className="text-4xl drop-shadow-lg filter">{emoji}</div>
                </div>

                {/* Huge Centered Temp matching reference */}
                <div className="absolute inset-0 flex items-center justify-center z-10 transform-[translateZ(30px)] pointer-events-none mt-4">
                    <h1 className="text-[5rem] font-light tracking-tighter leading-none">
                        {data?.temp || "--"}°
                    </h1>
                </div>

                {/* Footer Condition matching reference */}
                <div className="absolute bottom-6 left-6 z-20 transform-[translateZ(20px)]">
                    <div className="px-4 py-2 rounded-full bg-white/10 border border-white/5 backdrop-blur-md">
                        <span className="text-sm font-semibold tracking-wide capitalize">{data?.condition || "N/A"}</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}