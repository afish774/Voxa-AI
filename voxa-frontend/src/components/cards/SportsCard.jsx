import React from 'react';
import { Trophy, Clock, Activity, Radio, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SportsCard = ({ data }) => {
    if (!data) return null;

    const isCricket = data.league === 'Cricket' || data.league === 'IPL' || data.battingTeam;
    const isLive = data.isLive !== false; // Default to assuming live for visual effect unless explicitly false

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-[380px] rounded-3xl bg-[#0a0a0a] border border-white/10 shadow-2xl overflow-hidden relative"
        >
            {/* Ambient Background Glow */}
            <div className={`absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-48 blur-[80px] rounded-full opacity-30 pointer-events-none ${isLive ? 'bg-rose-600' : 'bg-blue-600'}`}></div>

            {/* HEADER */}
            <div className="bg-white/5 border-b border-white/5 px-5 py-3 flex justify-between items-center relative z-10">
                <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold uppercase tracking-widest text-white/80">{data.league || 'Live Match'}</span>
                </div>
                {isLive ? (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-rose-500 bg-rose-500/10">
                        <Radio className="w-3 h-3 animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Live</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 text-white/40">
                        <Clock className="w-3 h-3" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Finished</span>
                    </div>
                )}
            </div>

            {/* BODY */}
            <div className="p-5 relative z-10">
                {isCricket ? <CricketScoreboard data={data} /> : <FootballScoreboard data={data} />}
            </div>

            {/* FOOTER */}
            <div className="bg-white/5 px-5 py-3 flex items-center justify-between border-t border-white/5 relative z-10">
                <p className="text-[11px] font-medium text-white/50 tracking-wide uppercase truncate max-w-[80%]">
                    {data.status || 'Match Status Unavailable'}
                </p>
                <ChevronRight className="w-4 h-4 text-white/30" />
            </div>
        </motion.div>
    );
};

const FootballScoreboard = ({ data }) => (
    <div className="flex items-center justify-between">
        <div className="flex flex-col items-center flex-1">
            <ScoreDisplay score={data.teamA?.score} />
            <span className="text-xs font-bold text-white/90 mt-3 text-center line-clamp-1">{data.teamA?.name || 'Team 1'}</span>
        </div>

        <div className="flex flex-col items-center justify-center px-6">
            <div className="text-[10px] font-black text-white/30 tracking-widest mb-1">VS</div>
            {data.matchSeconds > 0 && (
                <div className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded border border-emerald-400/20">
                    {Math.floor(data.matchSeconds / 60)}'
                </div>
            )}
        </div>

        <div className="flex flex-col items-center flex-1">
            <ScoreDisplay score={data.teamB?.score} />
            <span className="text-xs font-bold text-white/90 mt-3 text-center line-clamp-1">{data.teamB?.name || 'Team 2'}</span>
        </div>
    </div>
);

const CricketScoreboard = ({ data }) => (
    <div className="flex flex-col gap-3">
        {/* Batting Team (Primary) matching reference high contrast */}
        <div className="flex items-center justify-between bg-white/10 p-4 rounded-xl border border-white/10 shadow-lg">
            <div className="flex flex-col">
                <span className="text-sm font-bold text-white mb-1 uppercase tracking-wide">{data.battingTeam || 'Batting Team'}</span>
                <span className="text-[11px] text-white/50 font-medium uppercase tracking-wider">({data.battingOvers || "0.0"} Overs)</span>
            </div>
            <div className="text-2xl font-black tabular-nums tracking-tighter text-white">
                {data.battingScore || "-"}
            </div>
        </div>

        {/* Bowling Team (Secondary) matching reference faded look */}
        <div className="flex items-center justify-between px-4 py-2 opacity-60">
            <span className="text-xs font-bold text-white uppercase tracking-wide">{data.bowlingTeam || 'Bowling Team'}</span>
            <span className="text-lg font-bold tabular-nums text-white">{data.bowlingScore || "Yet to bat"}</span>
        </div>

        {/* CRR Pill */}
        {data.crr && (
            <div className="flex items-center gap-1.5 mt-2 bg-blue-500/10 border border-blue-500/20 w-fit px-3 py-1.5 rounded-lg self-start">
                <Activity className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[11px] font-black text-blue-400 tracking-widest uppercase">CRR: {data.crr}</span>
            </div>
        )}
    </div>
);

const ScoreDisplay = ({ score }) => {
    const displayScore = score !== null && score !== undefined ? score : "0";
    return (
        <div className="w-14 h-16 bg-white/10 rounded-xl border border-white/10 flex items-center justify-center shadow-inner">
            <AnimatePresence mode="popLayout">
                <motion.span
                    key={displayScore}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="text-3xl font-black tabular-nums text-white"
                >
                    {displayScore}
                </motion.span>
            </AnimatePresence>
        </div>
    );
};

export default SportsCard;