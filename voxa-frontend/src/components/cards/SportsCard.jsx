import React, { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Float, MeshTransmissionMaterial, RoundedBox, Html } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";

/* =========================================================
   1. BROADCAST DESIGN TOKENS
========================================================= */
const SPORT_THEMES = {
    cricket: { name: "CRICKET", accent: "#0ea5e9", bg: "#0f172a", icon: "🏏" },
    football: { name: "FOOTBALL", accent: "#10b981", bg: "#022c22", icon: "⚽" },
    basketball: { name: "BASKETBALL", accent: "#f97316", bg: "#18181b", icon: "🏀" },
    tennis: { name: "TENNIS", accent: "#8b5cf6", bg: "#2e1065", icon: "🎾" },
    badminton: { name: "BADMINTON", accent: "#ec4899", bg: "#4c1d95", icon: "🏸" },
    default: { name: "SPORTS", accent: "#64748b", bg: "#1e293b", icon: "🏟️" }
};

const getTheme = (league = "") => {
    const l = league.toLowerCase();
    if (l.includes("cricket") || l.includes("ipl") || l.includes("odi")) return SPORT_THEMES.cricket;
    if (l.includes("nba") || l.includes("basketball") || l.includes("nfl")) return SPORT_THEMES.basketball;
    if (l.includes("tennis") || l.includes("atp")) return SPORT_THEMES.tennis;
    if (l.includes("badminton") || l.includes("bwf")) return SPORT_THEMES.badminton;
    if (l.includes("premier") || l.includes("la liga") || l.includes("football") || l.includes("soccer")) return SPORT_THEMES.football;
    return SPORT_THEMES.default;
};

// High-res broadcast fallback logos
const getAvatar = (name, hex) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${hex.replace('#', '')}&color=fff&size=256&font-size=0.4&bold=true`;

/* =========================================================
   2. DATA NORMALIZATION (The Strict Contract)
========================================================= */
const useNormalizedMatchData = (raw) => {
    return useMemo(() => {
        if (!raw) return null;

        const theme = getTheme(raw.league);
        const isLive = raw.status?.toLowerCase().includes('live') || raw.status?.toLowerCase().includes('need') || (!raw.status?.toLowerCase().includes('won') && raw.scoreA !== '-');
        const isScheduled = raw.scoreA === '-' || !raw.scoreA;

        // Smart Cricket Parser: strictly isolates runs from wickets and overs
        const parseCricket = (s) => {
            if (!s || s === '-') return { runs: '-', wickets: '', overs: '' };
            const parts = s.split('(');
            const scorePart = parts[0].trim().split('/');
            return {
                runs: scorePart[0] || '-',
                wickets: scorePart[1] ? `/${scorePart[1]}` : '',
                overs: parts[1] ? `(${parts[1].replace(')', '')})` : ''
            };
        };

        return {
            league: raw.league || theme.name,
            statusStr: raw.status || (isScheduled ? "Scheduled" : "Final"),
            isLive,
            isScheduled,
            theme,
            teamA: {
                full: raw.teamA || "Team A",
                abbr: (raw.teamA || "TMA").substring(0, 3).toUpperCase(),
                logo: getAvatar(raw.teamA, theme.accent),
                score: raw.scoreA,
                cricScore: parseCricket(raw.scoreA)
            },
            teamB: {
                full: raw.teamB || "Team B",
                abbr: (raw.teamB || "TMB").substring(0, 3).toUpperCase(),
                logo: getAvatar(raw.teamB, "#334155"),
                score: raw.scoreB,
                cricScore: parseCricket(raw.scoreB)
            }
        };
    }, [raw]);
};

/* =========================================================
   3. PROFESSIONAL BROADCAST LAYOUTS (Segmented & Tabular)
========================================================= */

// 🏏 CRICKET: Star Sports / Sky Cricket Style (Asymmetrical Focus)
const BroadcastCricket = ({ match }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {/* Batting Team Primary Block */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "stretch", background: "rgba(0,0,0,0.6)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: `linear-gradient(90deg, ${match.theme.accent}20 0%, transparent 100%)` }}>
                <img src={match.teamA.logo} alt="A" style={{ width: 36, height: 36, borderRadius: 8 }} />
                <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "1px" }}>{match.teamA.abbr}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>BATTING</span>
                </div>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", padding: "12px 20px", background: "rgba(0,0,0,0.3)" }}>
                <span style={{ fontSize: 42, fontWeight: 900, fontVariantNumeric: "tabular-nums", letterSpacing: "-1px" }}>{match.teamA.cricScore.runs}</span>
                <span style={{ fontSize: 24, fontWeight: 700, color: "rgba(255,255,255,0.7)", fontVariantNumeric: "tabular-nums" }}>{match.teamA.cricScore.wickets}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: match.theme.accent, marginLeft: 12, fontVariantNumeric: "tabular-nums" }}>{match.teamA.cricScore.overs}</span>
            </div>
        </div>

        {/* Context & Bowling Team Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.05)", padding: "8px 16px", borderRadius: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.8)", letterSpacing: "0.5px" }}>{match.statusStr}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>{match.teamB.abbr}</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: "rgba(255,255,255,0.9)", fontVariantNumeric: "tabular-nums" }}>
                    {match.teamB.cricScore.runs}{match.teamB.cricScore.wickets}
                </span>
            </div>
        </div>
    </div>
);

// ⚽ FOOTBALL: Premier League / Champions League Style (Center Axis Pill)
const BroadcastFootball = ({ match }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "stretch", background: "rgba(0,0,0,0.5)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>

            {/* Home Team Segment */}
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12, padding: "16px", background: `linear-gradient(90deg, transparent 0%, ${match.theme.accent}15 100%)` }}>
                <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "1px" }}>{match.teamA.abbr}</span>
                <img src={match.teamA.logo} alt="A" style={{ width: 42, height: 42, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.1)" }} />
            </div>

            {/* Center Score Pill */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "0 24px", background: "rgba(0,0,0,0.8)", borderLeft: "1px solid rgba(255,255,255,0.05)", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ fontSize: 36, fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>{match.isScheduled ? "-" : match.teamA.score}</span>
                <div style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(255,255,255,0.3)" }} />
                <span style={{ fontSize: 36, fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>{match.isScheduled ? "-" : match.teamB.score}</span>
            </div>

            {/* Away Team Segment */}
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-start", gap: 12, padding: "16px", background: `linear-gradient(90deg, rgba(255,255,255,0.02) 0%, transparent 100%)` }}>
                <img src={match.teamB.logo} alt="B" style={{ width: 42, height: 42, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.1)" }} />
                <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "1px" }}>{match.teamB.abbr}</span>
            </div>
        </div>

        <div style={{ textAlign: "center", fontSize: 13, color: match.theme.accent, fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase" }}>
            {match.statusStr}
        </div>
    </div>
);

// 🏀 BASKETBALL: NBA TNT/ESPN Style (Strict Tabular Alignment)
const BroadcastStacked = ({ match }) => {
    const aNum = parseInt(match.teamA.score); const bNum = parseInt(match.teamB.score);
    const aWins = !match.isScheduled && !isNaN(aNum) && !isNaN(bNum) && aNum > bNum;
    const bWins = !match.isScheduled && !isNaN(aNum) && !isNaN(bNum) && bNum > aNum;

    const Row = ({ team, isWinning, isTop }) => (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", background: isWinning ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.4)", borderBottom: isTop ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <img src={team.logo} alt="T" style={{ width: 32, height: 32, borderRadius: "50%" }} />
                <span style={{ fontSize: 18, fontWeight: isWinning ? 900 : 600, color: isWinning ? "#fff" : "rgba(255,255,255,0.6)", letterSpacing: "1px" }}>{team.abbr}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.4)", display: "none" /* Unhide for full name if space permits */ }}>{team.full}</span>
            </div>
            {/* Strict Tabular Numeral constraint for vertical alignment */}
            <span style={{ fontSize: 28, fontWeight: 900, fontVariantNumeric: "tabular-nums", color: isWinning ? "#fff" : "rgba(255,255,255,0.5)", width: "60px", textAlign: "right" }}>
                {match.isScheduled ? "-" : team.score}
            </span>
        </div>
    );

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
                <Row team={match.teamA} isWinning={aWins || (!aWins && !bWins)} isTop={true} />
                <Row team={match.teamB} isWinning={bWins} isTop={false} />
            </div>
            <div style={{ textAlign: "center", fontSize: 13, color: match.theme.accent, fontWeight: 800, letterSpacing: "1px", textTransform: "uppercase" }}>
                {match.statusStr}
            </div>
        </div>
    );
};

/* =========================================================
   4. DOM HTML PORTAL (The Structural Wrapper)
========================================================= */
function DOMScoreContent({ match }) {
    return (
        <div style={{
            width: "380px", padding: "24px", color: "white",
            fontFamily: "'SF Pro Display', 'Inter', -apple-system, sans-serif",
            background: "transparent" // Let WebGL glass handle the backdrop
        }}>
            {/* GLOBAL BROADCAST HEADER */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(0,0,0,0.4)", padding: "4px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }}>
                    <span style={{ fontSize: 14 }}>{match.theme.icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "1.5px", color: "rgba(255,255,255,0.7)", textTransform: "uppercase" }}>
                        {match.league}
                    </span>
                </div>

                {match.isLive && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(239, 68, 68, 0.15)", padding: "4px 10px", borderRadius: 8, border: "1px solid rgba(239, 68, 68, 0.3)" }}>
                        <motion.div animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.2, repeat: Infinity }} style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", boxShadow: "0 0 10px #ef4444" }} />
                        <span style={{ fontSize: 11, fontWeight: 800, color: "#ef4444", letterSpacing: "1px" }}>LIVE</span>
                    </div>
                )}
            </div>

            {/* STRATEGY INJECTION */}
            <AnimatePresence mode="wait">
                <motion.div key={match.theme.name} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
                    {match.theme.name === "CRICKET" && <BroadcastCricket match={match} />}
                    {match.theme.name === "FOOTBALL" && <BroadcastFootball match={match} />}
                    {match.theme.name === "BASKETBALL" && <BroadcastStacked match={match} />}
                    {(match.theme.name === "TENNIS" || match.theme.name === "BADMINTON" || match.theme.name === "SPORTS") && <BroadcastStacked match={match} />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

/* =========================================================
   5. WEBGL SPATIAL GLASS ENGINE
========================================================= */
function GlassPanel({ children }) {
    return (
        <Float speed={2} rotationIntensity={0.1} floatIntensity={1}>
            <mesh>
                <RoundedBox args={[4.4, 2.6, 0.1]} radius={0.12} smoothness={4}>
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
   6. MAIN EXPORT WRAPPER
========================================================= */
export default function SpatialSportsCard({ data }) {
    const match = useNormalizedMatchData(data);
    if (!match) return null;

    return (
        <div style={{ width: "100%", height: "360px", marginTop: "24px", borderRadius: "32px", overflow: "hidden", position: "relative" }}>
            {/* Deep Space Background gradient */}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom right, #020617, #0f172a)", zIndex: 0 }} />
            {/* Ambient glowing orb driven by the sport's accent color */}
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