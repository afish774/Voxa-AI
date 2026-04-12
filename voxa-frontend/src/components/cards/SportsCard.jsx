import React from "react";
import { Canvas } from "@react-three/fiber";
import { Float, MeshTransmissionMaterial, RoundedBox, Html } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";

/* =========================
   🔧 UTILITIES & HELPERS
========================= */

// Generates dynamic fallback logos
const getLogo = (name, color) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${color}&color=fff&size=120&bold=true`;

// Detects the sport from the league string
const getSport = (league = "") => {
    const l = league.toLowerCase();
    if (l.includes("cricket") || l.includes("ipl") || l.includes("t20") || l.includes("odi")) return "cricket";
    if (l.includes("nba") || l.includes("basketball") || l.includes("nfl")) return "basketball";
    if (l.includes("tennis") || l.includes("atp") || l.includes("wimbledon")) return "tennis";
    if (l.includes("badminton") || l.includes("bwf")) return "badminton";
    return "football"; // Default
};

/* =========================
   ⚽ FOOTBALL (Symmetrical Tension)
========================= */
const Football = ({ teamA, teamB, scoreA, scoreB, status }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flex: 1 }}>
                <img src={getLogo(teamA, "10b981")} alt={teamA} style={{ width: 48, height: 48, borderRadius: "50%", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#f8fafc", textAlign: "center" }}>{teamA?.substring(0, 12)}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1.2, justifyContent: "center" }}>
                <span style={{ fontSize: 38, fontWeight: 800, color: "#fff", textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>{scoreA === '-' ? '0' : scoreA}</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: "rgba(255,255,255,0.3)" }}>-</span>
                <span style={{ fontSize: 38, fontWeight: 800, color: "#fff", textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>{scoreB === '-' ? '0' : scoreB}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flex: 1 }}>
                <img src={getLogo(teamB, "475569")} alt={teamB} style={{ width: 48, height: 48, borderRadius: "50%", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#f8fafc", textAlign: "center" }}>{teamB?.substring(0, 12)}</span>
            </div>
        </div>
        <div style={{ textAlign: "center", fontSize: 13, color: "#10b981", fontWeight: 800, letterSpacing: "0.5px" }}>{status}</div>
    </div>
);

/* =========================
   🏏 CRICKET (Asymmetrical Hierarchy)
========================= */
const Cricket = ({ teamA, teamB, scoreA, scoreB, status }) => {
    const parse = (s) => {
        const parts = (s || '-').split('(');
        return { runs: parts[0].trim(), overs: parts[1] ? `(${parts[1]}` : '' };
    };
    const primary = parse(scoreA);
    const secondary = parse(scoreB);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <img src={getLogo(teamA, "0ea5e9")} alt={teamA} style={{ width: 28, height: 28, borderRadius: 6, boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }} />
                        <span style={{ fontSize: 16, fontWeight: 700, color: "#f8fafc" }}>{teamA?.substring(0, 16)}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                        <span style={{ fontSize: 44, fontWeight: 800, color: "#fff", lineHeight: 1, textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>{primary.runs}</span>
                        <span style={{ fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>{primary.overs}</span>
                    </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>{teamB?.substring(0, 12)}</span>
                    <span style={{ fontSize: 18, fontWeight: 700, color: "#e2e8f0" }}>{secondary.runs} {secondary.overs}</span>
                </div>
            </div>
            <div style={{ fontSize: 13, color: "#38bdf8", fontWeight: 700, padding: "8px 12px", background: "rgba(0,0,0,0.2)", borderRadius: 8, borderLeft: "2px solid #0ea5e9" }}>
                {status}
            </div>
        </div>
    );
};

/* =========================
   🎾 TENNIS & 🏸 BADMINTON (Table Layout)
========================= */
const TableSport = ({ teamA, teamB, scoreA, scoreB, status, icon }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 10, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <img src={getLogo(teamA, "8b5cf6")} alt={teamA} style={{ width: 32, height: 32, borderRadius: "50%", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }} />
                <span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{teamA?.substring(0, 18)}</span>
            </div>
            <span style={{ fontSize: 24, fontWeight: 800, color: "#fff", textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>{scoreA}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <img src={getLogo(teamB, "475569")} alt={teamB} style={{ width: 32, height: 32, borderRadius: "50%", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }} />
                <span style={{ fontSize: 16, fontWeight: 700, color: "#cbd5e1" }}>{teamB?.substring(0, 18)}</span>
            </div>
            <span style={{ fontSize: 24, fontWeight: 800, color: "#94a3b8" }}>{scoreB}</span>
        </div>
        <div style={{ fontSize: 13, color: "#c084fc", fontWeight: 700, marginTop: 4 }}>{icon} {status}</div>
    </div>
);

/* =========================
   🏀 BASKETBALL (Stacked Rows)
========================= */
const Basketball = ({ teamA, teamB, scoreA, scoreB, status }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.08)", padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <img src={getLogo(teamA, "f97316")} alt={teamA} style={{ width: 30, height: 30, borderRadius: 8 }} />
                <span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{teamA?.substring(0, 16)}</span>
            </div>
            <span style={{ fontSize: 24, fontWeight: 800, color: "#fff", textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>{scoreA}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0,0,0,0.2)", padding: "12px 16px", borderRadius: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <img src={getLogo(teamB, "475569")} alt={teamB} style={{ width: 30, height: 30, borderRadius: 8 }} />
                <span style={{ fontSize: 16, fontWeight: 600, color: "#cbd5e1" }}>{teamB?.substring(0, 16)}</span>
            </div>
            <span style={{ fontSize: 24, fontWeight: 800, color: "#94a3b8" }}>{scoreB}</span>
        </div>
        <div style={{ textAlign: "center", fontSize: 13, color: "#fdba74", fontWeight: 800, marginTop: 8 }}>{status}</div>
    </div>
);

/* =========================
   🌐 DOM HTML PORTAL CONTENT
========================= */
function DOMScoreContent({ data }) {
    const sport = getSport(data.league);
    const isLive = data.status?.toLowerCase().includes('live') || data.status?.toLowerCase().includes('need') || (!data.status?.toLowerCase().includes('won') && data.scoreA !== '-');

    return (
        <div style={{
            width: "360px",
            padding: "24px",
            color: "white",
            fontFamily: "'Inter', -apple-system, sans-serif",
            // Keep background transparent so the true 3D WebGL glass shines through!
            background: "transparent"
        }}>
            {/* HEADER */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: "1.5px", color: "rgba(255,255,255,0.6)", textTransform: "uppercase" }}>
                    {data.league || "SPORTS"}
                </span>
                {isLive && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(239, 68, 68, 0.2)", padding: "4px 10px", borderRadius: "12px", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
                        <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", boxShadow: "0 0 8px #ef4444" }} />
                        <span style={{ fontSize: 11, fontWeight: 800, color: "#ef4444", letterSpacing: "0.5px" }}>LIVE</span>
                    </div>
                )}
            </div>

            {/* SPORT LAYOUT INJECTION */}
            <AnimatePresence mode="wait">
                <motion.div key={sport} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    {sport === "football" && <Football {...data} />}
                    {sport === "cricket" && <Cricket {...data} />}
                    {sport === "tennis" && <TableSport {...data} icon="🎾" />}
                    {sport === "badminton" && <TableSport {...data} icon="🏸" />}
                    {sport === "basketball" && <Basketball {...data} />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

/* =========================
   🧊 PHYSICAL 3D GLASS SLAB
========================= */
function GlassPanel({ children }) {
    return (
        <Float speed={2} rotationIntensity={0.15} floatIntensity={1.5}>
            <mesh>
                {/* The solid 3D acrylic slab */}
                <RoundedBox args={[4.2, 2.6, 0.1]} radius={0.15} smoothness={4}>
                    <MeshTransmissionMaterial
                        thickness={0.5}
                        roughness={0.15}
                        transmission={1}
                        ior={1.25}
                        chromaticAberration={0.05}
                        distortion={0.2}
                        distortionScale={0.3}
                        temporalDistortion={0.1}
                        color="#ffffff"
                    />
                </RoundedBox>
            </mesh>

            {/* The HTML Portal: Projects our DOM UI perfectly onto the surface of the 3D slab */}
            <Html
                transform
                distanceFactor={2.5}
                position={[0, 0, 0.06]} // Floats exactly 0.01 units above the glass surface
                zIndexRange={[100, 0]}
            >
                {children}
            </Html>
        </Float>
    );
}

/* =========================
   🌈 LIGHTING SYSTEM
========================= */
function Lights({ sport }) {
    // Dynamic Rim Lighting based on the sport!
    const getLightColor = () => {
        if (sport === "cricket") return "#0ea5e9";
        if (sport === "basketball") return "#f97316";
        if (sport === "tennis") return "#8b5cf6";
        return "#10b981"; // Football default
    };

    return (
        <>
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 5, 5]} intensity={1.5} />
            {/* Dynamic Cyber-rim light catching the bevel of the glass */}
            <pointLight position={[2, 2, 2]} intensity={3} color={getLightColor()} />
            <pointLight position={[-2, -2, 1]} intensity={2} color="#ffffff" />
        </>
    );
}

/* =========================
   🎬 MAIN SCENE WRAPPER
========================= */
export default function SpatialSportsCard({ data }) {
    if (!data || data.type !== 'sports') return null;

    return (
        <div style={{ width: "100%", height: "350px", marginTop: "24px", borderRadius: "32px", overflow: "hidden", position: "relative" }}>

            {/* Ambient glowing orb behind the canvas */}
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "80%", height: "80%", background: "radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 60%)", zIndex: 0, pointerEvents: "none" }} />

            <Canvas camera={{ position: [0, 0, 4], fov: 45 }} style={{ zIndex: 1 }}>

                {/* Deep space background to provide optical depth for the refraction */}
                <color attach="background" args={["#020617"]} />

                <Lights sport={getSport(data.league)} />

                <GlassPanel>
                    <DOMScoreContent data={data} />
                </GlassPanel>

            </Canvas>
        </div>
    );
}