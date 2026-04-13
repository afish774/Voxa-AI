import React from 'react';
import { Trophy, Clock, Activity, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SportsCard = ({ data }) => {
    if (!data) return null;

    const isCricket = data.league === 'Cricket' || data.league === 'IPL' || data.battingTeam;
    const isLive = data.isLive;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="relative w-full max-w-md mx-auto overflow-hidden rounded-[2rem] bg-black/40 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] text-white p-6 transition-colors duration-300 hover:bg-black/50 hover:border-white/20 group"
        >
            {/* AMBIENT GLOW EFFECT */}
            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 blur-[100px] rounded-full opacity-40 pointer-events-none transition-colors duration-1000 ${isLive ? 'bg-red-500/40' : 'bg-blue-500/20'}`}></div>

            {/* HEADER: League & Live Indicator */}
            <div className="flex justify-between items-center mb-8 relative z-10">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 shadow-sm backdrop-blur-md">
                    <Trophy className="w-4 h-4 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-white/90">{data.league}</span>
                </div>

                {isLive ? (
                    <motion.div
                        initial={{ opacity: 0.8 }}
                        animate={{ opacity: [0.8, 1, 0.8] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                    >
                        <Radio className="w-4 h-4 text-red-500" />
                        <span className="text-xs font-bold uppercase tracking-wider text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]">Live</span>
                    </motion.div>
                ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Final</span>
                    </div>
                )}
            </div>

            {/* BODY: Dynamic Scoreboard */}
            <div className="relative z-10">
                {isCricket ? (
                    <CricketScoreboard data={data} />
                ) : (
                    <FootballScoreboard data={data} />
                )}
            </div>

            {/* FOOTER: Match Status */}
            <div className="mt-8 pt-4 border-t border-white/10 relative z-10">
                <p className="text-center text-sm font-medium text-white/60 tracking-wide">
                    {data.status}
                </p>
            </div>
        </motion.div>
    );
};

// ==========================================
// ⚽ FOOTBALL / BASKETBALL LAYOUT
// ==========================================
const FootballScoreboard = ({ data }) => {
    return (
        <div className="flex items-center justify-between">
            {/* Team A */}
            <div className="flex flex-col items-center flex-1">
                <ScoreDisplay score={data.teamA?.score} />
                <span className="text-sm font-semibold text-center text-white/80 leading-tight mt-2">
                    {data.teamA?.name || "Team A"}
                </span>
            </div>

            {/* Divider */}
            <div className="flex flex-col items-center justify-center px-4">
                <div className="text-xs font-bold text-white/30 uppercase tracking-widest mb-1">VS</div>
                <div className="h-10 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>
                {data.matchSeconds > 0 && (
                    <div className="mt-2 text-xs font-mono font-bold text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded shadow-[0_0_10px_rgba(251,191,36,0.2)] border border-amber-400/20">
                        {Math.floor(data.matchSeconds / 60)}'
                    </div>
                )}
            </div>

            {/* Team B */}
            <div className="flex flex-col items-center flex-1">
                <ScoreDisplay score={data.teamB?.score} />
                <span className="text-sm font-semibold text-center text-white/80 leading-tight mt-2">
                    {data.teamB?.name || "Team B"}
                </span>
            </div>
        </div>
    );
};

// ==========================================
// 🏏 CRICKET LAYOUT
// ==========================================
const CricketScoreboard = ({ data }) => {
    return (
        <div className="flex flex-col gap-6">
            {/* Batting Team */}
            <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10 shadow-inner backdrop-blur-sm">
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-white/90 mb-1">{data.battingTeam}</span>
                    <span className="text-xs text-amber-400 font-medium">Batting • {data.battingOvers || "0.0"} Overs</span>
                </div>
                <ScoreDisplay score={data.battingScore} size="lg" />
            </div>

            {/* Bowling Team */}
            <div className="flex items-center justify-between px-4">
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-white/60">{data.bowlingTeam}</span>
                    <span className="text-xs text-white/40 font-medium">Bowling</span>
                </div>
                <ScoreDisplay score={data.bowlingScore} size="md" muted />
            </div>

            {/* Run Rate Bar */}
            {data.crr && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                    className="flex items-center justify-center gap-2 mt-2"
                >
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-400 tracking-wide drop-shadow-[0_0_5px_rgba(52,211,153,0.4)]">
                        CRR: {data.crr}
                    </span>
                </motion.div>
            )}
        </div>
    );
};

// ==========================================
// ✨ ANIMATED SCORE COMPONENT
// ==========================================
const ScoreDisplay = ({ score, size = "lg", muted = false }) => {
    const displayScore = score !== null && score !== undefined ? score : "-";

    // Dynamic sizing
    let textClass = "text-4xl sm:text-5xl font-black tabular-nums tracking-tighter drop-shadow-lg";
    if (size === "md") textClass = "text-2xl font-bold tabular-nums tracking-tight";

    // Dynamic coloring
    let colorClass = "bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent";
    if (muted) colorClass = "text-white/50";

    return (
        <div className="relative overflow-hidden h-14 flex items-center justify-center">
            <AnimatePresence mode="popLayout">
                <motion.span
                    key={displayScore}
                    initial={{ y: 20, opacity: 0, filter: "blur(4px)" }}
                    animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                    exit={{ y: -20, opacity: 0, filter: "blur(4px)" }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className={`${textClass} ${colorClass} inline-block`}
                >
                    {displayScore}
                </motion.span>
            </AnimatePresence>
        </div>
    );
};

export default SportsCard;