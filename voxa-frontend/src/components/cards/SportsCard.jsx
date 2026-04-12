import React, { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Float, MeshTransmissionMaterial, RoundedBox, Html } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";

/* =========================================================
   1. BROADCAST DESIGN TOKENS
========================================================= */
const SPORT_THEMES = {
    cricket: { name: "CRICKET", accent: "#0ea5e9", bg: "#0f172a" },
    football: { name: "FOOTBALL", accent: "#10b981", bg: "#022c22" },
    basketball: { name: "BASKETBALL", accent: "#f97316", bg: "#18181b" },
    tennis: { name: "TENNIS", accent: "#8b5cf6", bg: "#2e1065" },
    badminton: { name: "BADMINTON", accent: "#ec4899", bg: "#4c1d95" },
    default: { name: "SPORTS", accent: "#64748b", bg: "#1e293b" }
};

const getTheme = (league = "") => {
    const l = league.toLowerCase();
    if (l.includes("cricket") || l.includes("ipl") || l.includes("odi")) return SPORT_THEMES.cricket;
    if (l.includes("nba") || l.includes("basketball") || l.includes("nfl")) return SPORT_THEMES.basketball;
    if (l.includes("tennis") || l.includes("wimbledon") || l.includes("atp")) return SPORT_THEMES.tennis;
    if (l.includes("badminton") || l.includes("bwf")) return SPORT_THEMES.badminton;
    if (l.includes("premier") || l.includes("la liga") || l.includes("football")) return SPORT_THEMES.football;
    return SPORT_THEMES.default;
};

const getAvatar = (name, hex) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${hex.replace('#', '')}&color=fff&size=150&bold=true`;

/* =========================================================
   2. STRICT WIREFRAME LAYOUTS
========================================================= */

// 🏏 CRICKET
const WireframeCricket = ({ teamA, teamB, scoreA, scoreB, status }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 12 }}>

        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 16, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>{teamA}</span>
            <span style={{ fontSize: 36, fontWeight: 800, fontVariantNumeric: "tabular-nums", letterSpacing: "-1px" }}>{scoreA === '-' ? 'Yet to bat' : scoreA}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 16, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>{teamB}</span>
            <span style={{ fontSize: 24, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "rgba(255,255,255,0.6)" }}>{scoreB === '-' ? 'Yet to bat' : scoreB}</span>
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: 16, borderTop: "1px solid rgba(255,255,255,0.1)", borderBottom: "1px solid rgba(255,255,255,0.1)", padding: "10px 0", marginTop: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>CRR: <span style={{ color: "#fff" }}>5.73</span></span>
            <span style={{ fontSize: 14, color: "rgba(255,255,255,0.3)" }}>•</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>RRR: <span style={{ color: "#fff" }}>7.94</span></span>
        </div>

        <div style={{ fontSize: 15, fontWeight: 700, color: "#0ea5e9" }}>{status}</div>
    </div>
);

// ⚽ FOOTBALL
const WireframeFootball = ({ teamA, teamB, scoreA, scoreB, status, isScheduled }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 12 }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 10px" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flex: 1 }}>
                <img src={getAvatar(teamA, "#10b981")} alt="A" style={{ width: 48, height: 48, borderRadius: "50%" }} />
                <span style={{ fontSize: 14, fontWeight: 600, textAlign: "center" }}>{teamA?.substring(0, 12)}</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 16, justifyContent: "center" }}>
                <span style={{ fontSize: 40, fontWeight: 800 }}>{isScheduled ? "-" : scoreA}</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: "rgba(255,255,255,0.3)" }}>–</span>
                <span style={{ fontSize: 40, fontWeight: 800 }}>{isScheduled ? "-" : scoreB}</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flex: 1 }}>
                <img src={getAvatar(teamB, "#475569")} alt="B" style={{ width: 48, height: 48, borderRadius: "50%" }} />
                <span style={{ fontSize: 14, fontWeight: 600, textAlign: "center" }}>{teamB?.substring(0, 12)}</span>
            </div>
        </div>

        <div style={{ textAlign: "center", fontSize: 14, fontWeight: 800, color: "#10b981" }}>67'</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4, background: "rgba(0,0,0,0.2)", padding: "12px", borderRadius: 8 }}>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>⚽ Lewandowski 23', 58'</span>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>⚽ Bellingham 41'</span>
        </div>

        <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{status}</div>
    </div>
);

// 🎾 TENNIS & 🏸 BADMINTON
const WireframeRacket = ({ teamA, teamB, scoreA, scoreB, status, isTennis }) => {
    // Mock parser to spread scores into a table like the wireframe
    const aScores = scoreA?.split(' ') || ['0', '0', '0'];
    const bScores = scoreB?.split(' ') || ['0', '0', '0'];

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 12 }}>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                    <span style={{ fontSize: 16, fontWeight: 600, flex: 1 }}>{teamA}</span>
                    <div style={{ display: "flex", gap: 24, paddingRight: 10 }}>
                        {aScores.map((s, i) => <span key={i} style={{ fontSize: 18, fontWeight: 700, width: 20, textAlign: "center" }}>{s}</span>)}
                    </div>
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                    <span style={{ fontSize: 16, fontWeight: 600, flex: 1 }}>{teamB}</span>
                    <div style={{ display: "flex", gap: 24, paddingRight: 10 }}>
                        {bScores.map((s, i) => <span key={i} style={{ fontSize: 18, fontWeight: 700, width: 20, textAlign: "center", color: "rgba(255,255,255,0.6)" }}>{s}</span>)}
                    </div>
                </div>
            </div>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 16 }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>Current: <span style={{ color: isTennis ? "#8b5cf6" : "#ec4899" }}>{isTennis ? "40–30" : "12–10"}</span></span>
            </div>

            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>{status}</div>
        </div>
    );
};

// 🏀 BASKETBALL
const WireframeBasketball = ({ teamA, teamB, scoreA, scoreB, status }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 12 }}>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <img src={getAvatar(teamA, "#f97316")} alt="A" style={{ width: 28, height: 28, borderRadius: "50%" }} />
                    <span style={{ fontSize: 18, fontWeight: 600 }}>{teamA}</span>
                </div>
                <span style={{ fontSize: 28, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{scoreA}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <img src={getAvatar(teamB, "#475569")} alt="B" style={{ width: 28, height: 28, borderRadius: "50%" }} />
                    <span style={{ fontSize: 18, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>{teamB}</span>
                </div>
                <span style={{ fontSize: 28, fontWeight: 800, fontVariantNumeric: "tabular-nums", color: "rgba(255,255,255,0.7)" }}>{scoreB}</span>
            </div>
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 16 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#f97316" }}>Q3 – 5:32</span>
        </div>

        <div style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>{status}</div>
    </div>
);

/* =========================================================
   3. DOM HTML PORTAL (The Structural Wrapper)
========================================================= */
function DOMScoreContent({ data }) {
    const theme = getTheme(data.league);
    const isLive = data.status?.toLowerCase().includes('live') || data.status?.toLowerCase().includes('need') || (!data.status?.toLowerCase().includes('won') && data.scoreA !== '-');
    const isScheduled = data.scoreA === '-' || !data.scoreA;

    return (
        <div style={{
            width: "360px", padding: "24px 28px", color: "white",
            fontFamily: "'SF Pro Display', 'Inter', -apple-system, sans-serif",
            background: "transparent"
        }}>
            {/* GLOBAL HEADER EXACTLY AS REQUESTED */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 16, fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>
                    {data.league || "SPORTS"}
                </span>

                {isLive && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#ef4444", letterSpacing: "0.5px" }}>LIVE</span>
                    </div>
                )}
            </div>

            {/* STRATEGY INJECTION */}
            <AnimatePresence mode="wait">
                <motion.div key={theme.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                    {theme.name === "CRICKET" && <WireframeCricket {...data} />}
                    {theme.name === "FOOTBALL" && <WireframeFootball {...data} isScheduled={isScheduled} />}
                    {theme.name === "BASKETBALL" && <WireframeBasketball {...data} />}
                    {theme.name === "TENNIS" && <WireframeRacket {...data} isTennis={true} />}
                    {theme.name === "BADMINTON" && <WireframeRacket {...data} isTennis={false} />}
                    {theme.name === "SPORTS" && <WireframeFootball {...data} isScheduled={isScheduled} />}
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
        <Float speed={2} rotationIntensity={0.05} floatIntensity={0.5}>
            <mesh>
                <RoundedBox args={[4.2, 5.0, 0.1]} radius={0.12} smoothness={4}>
                    <MeshTransmissionMaterial
                        thickness={0.8} roughness={0.1} transmission={1} ior={1.3}
                        chromaticAberration={0.06} distortion={0.2} distortionScale={0.3} temporalDistortion={0.05}
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
            <ambientLight intensity={0.8} />
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
    if (!data || data.type !== 'sports') return null;
    const theme = getTheme(data.league);

    return (
        <div style={{ width: "100%", height: "460px", marginTop: "24px", borderRadius: "32px", overflow: "hidden", position: "relative" }}>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom right, #0f172a, #020617)", zIndex: 0 }} />
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "100%", height: "100%", background: `radial-gradient(circle, ${theme.accent}20 0%, transparent 60%)`, zIndex: 0, pointerEvents: "none" }} />

            <Canvas camera={{ position: [0, 0, 5], fov: 45 }} style={{ zIndex: 1 }}>
                <Lights accent={theme.accent} />
                <GlassPanel>
                    <DOMScoreContent data={data} />
                </GlassPanel>
            </Canvas>
        </div>
    );
}