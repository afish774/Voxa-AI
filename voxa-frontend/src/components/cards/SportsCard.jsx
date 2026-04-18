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
            className="glass-container"
        >
            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 blur-[100px] rounded-full opacity-40 pointer-events-none transition-colors duration-1000 ${isLive ? 'bg-red-500/40' : 'bg-blue-500/20'}`}></div>

            {/* HEADER */}
            <div className="flex justify-between items-center mb-6 relative z-10">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/90">{data.league}</span>
                </div>

                {isLive ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30">
                        <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-red-500">Live</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                        <Clock className="w-3.5 h-3.5 text-white/40" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Final</span>
                    </div>
                )}
            </div>

            {/* BODY */}
            <div className="relative z-10">
                {isCricket ? <CricketScoreboard data={data} /> : <FootballScoreboard data={data} />}
            </div>

            {/* FOOTER */}
            <div className="mt-6 pt-4 border-t border-white/10 relative z-10">
                <p className="text-center text-xs font-medium text-white/40 tracking-wide uppercase">
                    {data.status}
                </p>
            </div>
        </motion.div>
    );
};

const FootballScoreboard = ({ data }) => (
    <div className="flex items-center justify-between px-2">
        <div className="flex flex-col items-center flex-1">
            <ScoreDisplay score={data.teamA?.score} />
            <span className="text-[11px] font-bold text-center text-white/70 mt-2 uppercase tracking-tighter">{data.teamA?.name}</span>
        </div>
        <div className="flex flex-col items-center justify-center px-6">
            <div className="text-[10px] font-black text-white/20 tracking-widest">VS</div>
            {data.matchSeconds > 0 && (
                <div className="mt-2 text-[10px] font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                    {Math.floor(data.matchSeconds / 60)}'
                </div>
            )}
        </div>
        <div className="flex flex-col items-center flex-1">
            <ScoreDisplay score={data.teamB?.score} />
            <span className="text-[11px] font-bold text-center text-white/70 mt-2 uppercase tracking-tighter">{data.teamB?.name}</span>
        </div>
    </div>
);

const CricketScoreboard = ({ data }) => (
    <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10 shadow-inner">
            <div className="flex flex-col">
                <span className="text-xs font-bold text-white/90 mb-1">{data.battingTeam}</span>
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">{data.battingOvers || "0.0"} Overs</span>
            </div>
            <ScoreDisplay score={data.battingScore} />
        </div>
        <div className="flex items-center justify-between px-4 opacity-60">
            <span className="text-xs font-bold text-white/80">{data.bowlingTeam}</span>
            <span className="text-lg font-bold tabular-nums text-white/90">{data.bowlingScore || "-"}</span>
        </div>
        {data.crr && (
            <div className="flex items-center justify-center gap-2 mt-1">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] font-black text-emerald-400 tracking-widest uppercase">CRR: {data.crr}</span>
            </div>
        )}
    </div>
);

const ScoreDisplay = ({ score, muted = false }) => {
    const displayScore = score !== null && score !== undefined ? score : "-";
    return (
        <div className="relative overflow-hidden h-12 flex items-center justify-center">
            <AnimatePresence mode="popLayout">
                <motion.span
                    key={displayScore}
                    initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -15, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className={`text-4xl font-black tabular-nums tracking-tighter drop-shadow-2xl ${muted ? 'text-white/40' : 'bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent'}`}
                >
                    {displayScore}
                </motion.span>
            </AnimatePresence>
        </div>
    );
};

export default SportsCard;