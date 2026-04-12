import React, { useRef } from "react";
import { motion, useMotionValue } from "framer-motion";

/* =========================
   🧠 SPORT DETECTION (ROBUST)
========================= */
const detectSport = (league = "") => {
    const l = league.toLowerCase();

    if (l.match(/cricket|ipl|t20|odi/)) return "cricket";
    if (l.match(/nba|basketball/)) return "basketball";
    if (l.match(/tennis|atp|wimbledon/)) return "tennis";
    if (l.match(/badminton|bwf/)) return "badminton";

    return "football";
};

/* =========================
   🖼️ LOGO GENERATOR
========================= */
const getLogo = (name, color) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
        name
    )}&background=${color}&color=fff&size=128&bold=true`;

/* =========================
   🧊 GLASS STYLE
========================= */
const glass = {
    background: "rgba(255,255,255,0.06)",
    backdropFilter: "blur(35px)",
    border: "1px solid rgba(255,255,255,0.18)",
    boxShadow: `
    0 40px 100px rgba(0,0,0,0.7),
    inset 0 1px 1px rgba(255,255,255,0.25),
    inset 0 -20px 40px rgba(0,0,0,0.6)
  `,
};

/* =========================
   🌈 LIGHT SYSTEM
========================= */
const Light = () => (
    <>
        <motion.div
            animate={{ x: [0, 60, -40, 0], y: [0, -40, 30, 0] }}
            transition={{ duration: 12, repeat: Infinity }}
            style={{
                position: "absolute",
                width: 400,
                height: 400,
                borderRadius: "50%",
                background:
                    "radial-gradient(circle, rgba(0,255,255,0.25), transparent 60%)",
                filter: "blur(80px)",
            }}
        />

        <motion.div
            animate={{ x: ["-100%", "150%"] }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            style={{
                position: "absolute",
                width: "40%",
                height: "200%",
                background:
                    "linear-gradient(120deg, transparent, rgba(255,255,255,0.12), transparent)",
                transform: "skewX(-20deg)",
            }}
        />
    </>
);

/* =========================
   🏆 WINNER HIGHLIGHT LOGIC
========================= */
const getWinner = (a, b) => {
    const A = parseFloat(a);
    const B = parseFloat(b);

    if (isNaN(A) || isNaN(B)) return null;
    if (A > B) return "A";
    if (B > A) return "B";
    return null;
};

/* =========================
   ⚽ FOOTBALL
========================= */
const Football = ({ teamA, teamB, scoreA, scoreB, status }) => {
    const winner = getWinner(scoreA, scoreB);

    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>

            <TeamBlock team={teamA} active={winner === "A"} color="10b981" />

            <ScoreBlock scoreA={scoreA} scoreB={scoreB} status={status} />

            <TeamBlock team={teamB} active={winner === "B"} color="475569" />
        </div>
    );
};

/* =========================
   🏀 BASKETBALL
========================= */
const Basketball = ({ teamA, teamB, scoreA, scoreB, status }) => {
    const winner = getWinner(scoreA, scoreB);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Row team={teamA} score={scoreA} active={winner === "A"} color="f97316" />
            <Row team={teamB} score={scoreB} active={winner === "B"} color="475569" />

            <div style={{ textAlign: "center", opacity: 0.6 }}>{status}</div>
        </div>
    );
};

/* =========================
   🎾 TENNIS & 🏸 BADMINTON
========================= */
const TableLayout = ({ teamA, teamB, scoreA, scoreB, status }) => (
    <div>
        <RowSimple team={teamA} score={scoreA} />
        <RowSimple team={teamB} score={scoreB} />
        <div style={{ opacity: 0.6 }}>{status}</div>
    </div>
);

/* =========================
   🏏 CRICKET
========================= */
const Cricket = ({ teamA, teamB, scoreA, scoreB, status }) => (
    <div>
        <div style={{ fontSize: 38, fontWeight: 800 }}>{scoreA}</div>
        <div style={{ opacity: 0.7 }}>{teamB} {scoreB}</div>
        <div style={{ color: "#38bdf8" }}>{status}</div>
    </div>
);

/* =========================
   🔹 SMALL COMPONENTS
========================= */

const TeamBlock = ({ team, active, color }) => (
    <motion.div
        animate={active ? { scale: 1.1 } : { scale: 1 }}
        style={{
            textAlign: "center",
            opacity: active ? 1 : 0.6,
        }}
    >
        <img
            src={getLogo(team, color)}
            style={{
                width: 50,
                borderRadius: "50%",
                boxShadow: active ? "0 0 20px rgba(255,255,255,0.5)" : "none",
            }}
        />
        <div>{team}</div>
    </motion.div>
);

const ScoreBlock = ({ scoreA, scoreB, status }) => (
    <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 44, fontWeight: 900 }}>
            {scoreA} – {scoreB}
        </div>
        <div style={{ fontSize: 12, opacity: 0.6 }}>{status}</div>
    </div>
);

const Row = ({ team, score, active, color }) => (
    <motion.div
        animate={active ? { scale: 1.05 } : {}}
        style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            opacity: active ? 1 : 0.6,
        }}
    >
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <img src={getLogo(team, color)} style={{ width: 32, borderRadius: "50%" }} />
            {team}
        </div>
        <div style={{ fontSize: 26, fontWeight: 800 }}>{score}</div>
    </motion.div>
);

const RowSimple = ({ team, score }) => (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span>{team}</span>
        <span>{score}</span>
    </div>
);

/* =========================
   🌌 MAIN COMPONENT
========================= */
export default function UltraSportsCard({ data }) {
    const ref = useRef();
    const rotateX = useMotionValue(0);
    const rotateY = useMotionValue(0);

    const handleMove = (e) => {
        const rect = ref.current.getBoundingClientRect();
        rotateX.set(-(e.clientY - rect.height / 2) / 20);
        rotateY.set((e.clientX - rect.width / 2) / 20);
    };

    const sport = detectSport(data?.league);

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMove}
            style={{
                ...glass,
                width: 380,
                padding: 24,
                borderRadius: 28,
                position: "relative",
                overflow: "hidden",
                transformStyle: "preserve-3d",
                rotateX,
                rotateY,
            }}
        >
            <Light />

            <div style={{ position: "relative", zIndex: 10 }}>
                <div style={{ opacity: 0.6, marginBottom: 10 }}>
                    {data?.league}
                </div>

                {sport === "football" && <Football {...data} />}
                {sport === "basketball" && <Basketball {...data} />}
                {sport === "cricket" && <Cricket {...data} />}
                {sport === "tennis" && <TableLayout {...data} />}
                {sport === "badminton" && <TableLayout {...data} />}
            </div>
        </motion.div>
    );
}