import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SAMPLE_QUERIES } from "../../config/constants";

export function QuerySlider({ theme, onSelect }) {
    const [idx, setIdx] = useState(Math.floor(Math.random() * SAMPLE_QUERIES.length));

    useEffect(() => {
        const t = setInterval(() => setIdx(Math.floor(Math.random() * SAMPLE_QUERIES.length)), 4500);
        return () => clearInterval(t);
    }, []);

    return (
        <div className="query-slider-container" style={{ position: "relative", overflow: "hidden", width: "100%", cursor: "pointer", padding: "0 10px" }} onClick={() => onSelect(SAMPLE_QUERIES[idx])}>
            <AnimatePresence mode="wait">
                <motion.p key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} style={{ position: "absolute", width: "100%", left: 0, textAlign: "center", fontSize: "clamp(13px, 1.5vw, 15px)", color: theme.textMuted, fontWeight: 400, letterSpacing: "-0.01em", lineHeight: 1.4, transition: "color 0.2s" }} onMouseEnter={(e) => e.target.style.color = theme.text} onMouseLeave={(e) => e.target.style.color = theme.textMuted}>
                    "{SAMPLE_QUERIES[idx]}"
                </motion.p>
            </AnimatePresence>
        </div>
    );
}

export function TypingText({ text, speed = 38, onDone }) {
    const [shown, setShown] = useState("");
    const [idx, setIdx] = useState(0);
    const timeoutsRef = useRef([]);

    useEffect(() => { setShown(""); setIdx(0); }, [text]);

    useEffect(() => {
        if (idx >= text?.length) { onDone?.(); return; }
        const ms = text[idx] === " " ? speed * 1.3 : speed;
        const t = setTimeout(() => { setShown(p => p + text[idx]); setIdx(p => p + 1); }, ms);
        timeoutsRef.current.push(t); return () => clearTimeout(t);
    }, [idx, text, speed, onDone]);

    useEffect(() => { return () => timeoutsRef.current.forEach(clearTimeout); }, []);

    return (
        <>{shown}{idx < text?.length && <span style={{ display: "inline-block", width: 2, height: "0.85em", background: "rgba(255,255,255,0.75)", marginLeft: 3, verticalAlign: "middle", animation: "blinkCursor 0.85s step-end infinite" }} />}</>
    );
}