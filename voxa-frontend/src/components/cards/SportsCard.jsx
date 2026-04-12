import React, { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Float, MeshTransmissionMaterial, RoundedBox, Html } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";

/* =========================================================
   1. UTILS & DATA NORMALIZATION
========================================================= */
const getTheme = (league = "") => {
    const l = league.toLowerCase();
    if (l.includes("cricket") || l.includes("ipl") || l.includes("odi")) return { name: "CRICKET", accent: "#0ea5e9" };
    if (l.includes("nba") || l.includes("basketball") || l.includes("nfl")) return { name: "BASKETBALL", accent: "#f97316" };
    if (l.includes("tennis") || l.includes("atp")) return { name: "TENNIS", accent: "#8b5cf6" };
    if (l.includes("badminton") || l.includes("bwf")) return { name: "BADMINTON", accent: "#ec4899" };
    return { name: "FOOTBALL", accent: "#10b981" }; // Default
};

const getAvatar = (name, hex) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${hex.replace('#', '')}&color=fff&size=256&font-size=0.4&bold=true`;

const useNormalizedMatchData = (raw) => {
    return useMemo(() => {
        if (!raw) return null;
        const theme = getTheme(raw.league);
        const isLive = raw.status?.toLowerCase().includes('live') || raw.status?.toLowerCase().includes('need') || (!raw.status?.toLowerCase().includes('won') && raw.scoreA !== '-');

        return {
            league: raw.league || theme.name,
            status: raw.status || (raw.scoreA === '-' ? "Scheduled" : "Final"),
            isLive,
            theme,
            teamA: { name: raw.teamA || "Team A", logo: getAvatar(raw.teamA, theme.accent), score: raw.scoreA },
            teamB: { name: raw.teamB || "Team B", logo: getAvatar(raw.teamB, "334155"), score: raw.scoreB }
        };
    }, [raw]);
};

/* =========================================================
   2. EXACT LAYOUT IMPLEMENTATIONS (From User Blueprint)
========================================================= */

// 🏏 CRICKET (Exact Stacked Layout)
const Cricket = ({ match }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingTop: "8px" }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>{match.teamA.name}</div>
        <div style={{ fontSize: 32, fontWeight: 800, color: "#fff", letterSpacing: "-1px" }}>{match.teamA.score}</div>

        <div style={{ fontSize: 16, fontWeight: 600, color: "rgba(255,255,255,0.7)", marginTop: "12px" }}>{match.teamB.name}</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>{match.teamB.score}</div>

        <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.1)", fontSize: 14, fontWeight: 600, color: match.theme.accent }}>
            {match.status}
        </div>
    </div>
);

// ⚽ FOOTBALL (Exact Center-Axis Layout)
const Football = ({ match }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: "8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flex: 1 }}>
                <img src={match.teamA.logo} alt="A" style={{ width: 50, height: 50, borderRadius: "50%" }} />
                <span style={{ fontSize: 14, fontWeight: 700 }}>{match.teamA.name.substring(0, 12)}</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1.5 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <span style={{ fontSize: 38, fontWeight: 800 }}>{match.teamA.score === '-' ? '0' : match.teamA.score}</span>
                    <span style={{ fontSize: 18, color: "rgba(255,255,255,0.4)" }}>-</span>
                    <span style={{ fontSize: 38, fontWeight: 800 }}>{match.teamB.score === '-' ? '0' : match.teamB.score}</span>
                </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flex: 1 }}>
                <img src={match.teamB.logo} alt="B" style={{ width: 50, height: 50, borderRadius: "50%" }} />
                <span style={{ fontSize: 14, fontWeight: 700 }}>{match.teamB.name.substring(0, 12)}</span>
            </div>
        </div>

        <div style={{ textAlign: "center", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.1)", fontSize: 14, color: match.theme.accent, fontWeight: 700 }}>
            {match.status}
        </div>
    </div>
);

// 🏀 BASKETBALL (Exact Stacked Leaderboard Layout)
const Basketball = ({ match }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: "8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <img src={match.teamA.logo} alt="A" style={{ width: 32, height: 32, borderRadius: "50%" }} />
                <span style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>{match.teamA.name}</span>
            </div>
            <span style={{ fontSize: 28, fontWeight: 800, color: "#fff" }}>{match.teamA.score}</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <img src={match.teamB.logo} alt="B" style={{ width: 32, height: 32, borderRadius: "50%" }} />
                <span style={{ fontSize: 18, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>{match.teamB.name}</span>
            </div>
            <span style={{ fontSize: 28, fontWeight: 800, color: "rgba(255,255,255,0.8)" }}>{match.teamB.score}</span>
        </div>

        <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.1)", fontSize: 14, color: match.theme.accent, fontWeight: 700, textAlign: "center" }}>
            {match.status}
        </div>
    </div>
);

// 🎾 TENNIS & 🏸 BADMINTON (Exact Matrix Layout)
const RacketSports = ({ match, label }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: "8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>{match.teamA.name}</span>
            <span style={{ fontSize: 24, fontWeight: 800, color: "#fff", letterSpacing: "4px" }}>{match.teamA.score}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 18, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>{match.teamB.name}</span>
            <span style={{ fontSize: 24, fontWeight: 800, color: "rgba(255,255,255,0.8)", letterSpacing: "4px" }}>{match.teamB.score}</span>
        </div>

        <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.1)", fontSize: 14, color: match.theme.accent, fontWeight: 700 }}>
            {label}: {match.status}
        </div>
    </div>
);

/* =========================================================
   3. DOM HTML SHELL (Global Header & Router)
========================================================= */
function DOMScoreContent({ match }) {
    return (
        <div style={{
            width: "360px", padding: "24px", color: "white",
            fontFamily: "'Inter', -apple-system, sans-serif",
            background: "transparent"
        }}>
            {/* EXACT GLOBAL HEADER */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>
                    {match.league}
                </span>

                {match.isLive && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", boxShadow: "0 0 8px #ef4444" }} />
                        <span style={{ fontSize: 12, fontWeight: 800, color: "#ef4444", letterSpacing: "0.5px" }}>LIVE</span>
                    </div>
                )}
            </div>

            {/* STRATEGY INJECTION */}
            <AnimatePresence mode="wait">
                <motion.div key={match.theme.name} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    {match.theme.name === "CRICKET" && <Cricket match={match} />}
                    {match.theme.name === "FOOTBALL" && <Football match={match} />}
                    {match.theme.name === "BASKETBALL" && <Basketball match={match} />}
                    {match.theme.name === "TENNIS" && <RacketSports match={match} label="Current" />}
                    {match.theme.name === "BADMINTON" && <RacketSports match={match} label="Current" />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

/* =========================================================
   4. WEBGL SPATIAL GLASS ENGINE
========================================================= */
function GlassPanel({ children }) {
    return (
        <Float speed={2} rotationIntensity={0.1} floatIntensity={1}>
            <mesh>
                <RoundedBox args={[4.2, 2.6, 0.1]} radius={0.15} smoothness={4}>
                    <MeshTransmissionMaterial
                        thickness={0.6} roughness={0.15} transmission={1} ior={1.25}
                        chromaticAberration={0.05} distortion={0.15} distortionScale={0.3} temporalDistortion={0.05}
                        color="#ffffff"
                    />
                </RoundedBox>
            </mesh>
            <Html transform distanceFactor={2.5} position={[0, 0, 0.06]} zIndexRange={[100, 0]}>
                {children}
            </Html>
        </Float>
    );
}

function Lights({ accent }) {
    return (
        <>
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 5, 5]} intensity={1.5} />
            <pointLight position={[2, 2, 2]} intensity={3} color={accent} />
            <pointLight position={[-2, -2, 1]} intensity={2} color="#ffffff" />
        </>
    );
}

/* =========================================================
   5. MAIN EXPORT WRAPPER
========================================================= */
export default function SpatialSportsCard({ data }) {
    const match = useNormalizedMatchData(data);
    if (!match) return null;

    return (
        <div style={{ width: "100%", height: "350px", marginTop: "24px", borderRadius: "32px", overflow: "hidden", position: "relative" }}>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom right, #020617, #0f172a)", zIndex: 0 }} />
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "100%", height: "100%", background: `radial-gradient(circle, ${match.theme.accent}15 0%, transparent 60%)`, zIndex: 0, pointerEvents: "none" }} />

            <Canvas camera={{ position: [0, 0, 4.2], fov: 45 }} style={{ zIndex: 1 }}>
                <Lights accent={match.theme.accent} />
                <GlassPanel>
                    <DOMScoreContent match={match} />
                </GlassPanel>
            </Canvas>
        </div>
    );
}