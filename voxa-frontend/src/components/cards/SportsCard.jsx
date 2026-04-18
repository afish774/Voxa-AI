import React from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';

// ─── Team Logo Helper ──────────────────────────────────────────────
// Returns a JSX SVG shield with the team's first letter.
// Shield fill color is deterministic based on the first char code.
const getTeamLogo = (teamName) => {
  const initial = teamName ? teamName[0].toUpperCase() : '?';
  const hue = teamName ? (teamName.charCodeAt(0) * 5) % 360 : 0;
  const fillColor = `hsl(${hue}, 60%, 25%)`;
  const strokeColor = `hsl(${hue}, 60%, 40%)`;

  return (
    <svg viewBox="0 0 48 48" width={48} height={48} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Shield shape */}
      <path
        d="M24 4 L6 12 L6 24 C6 34 14 42 24 46 C34 42 42 34 42 24 L42 12 Z"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      {/* Inner highlight */}
      <path
        d="M24 8 L10 14 L10 24 C10 32 16 38 24 42 C32 38 38 32 38 24 L38 14 Z"
        fill="white"
        fillOpacity={0.08}
      />
      {/* Team initial letter */}
      <text
        x="24"
        y="28"
        textAnchor="middle"
        dominantBaseline="central"
        fill="white"
        fontSize="18"
        fontWeight="bold"
        fontFamily="system-ui, sans-serif"
      >
        {initial}
      </text>
    </svg>
  );
};

// ─── Live Pulse Indicator ──────────────────────────────────────────
const LivePulse = () => (
  <div className="flex items-center gap-1.5">
    <motion.div
      animate={{ scale: [1, 1.4, 1] }}
      transition={{ repeat: Infinity, duration: 1, ease: 'easeInOut' }}
      className="w-2 h-2 rounded-full bg-red-500"
    />
    <span className="text-red-500 text-xs font-bold tracking-widest">LIVE</span>
  </div>
);

// ─── FootballCard ──────────────────────────────────────────────────
const FootballCard = ({ data }) => {
  const mins = Math.floor(data.matchSeconds / 60).toString().padStart(2, '0');
  const secs = (data.matchSeconds % 60).toString().padStart(2, '0');
  const timer = `${mins}:${secs}`;

  const scoreA = data.teamA?.score ?? 0;
  const scoreB = data.teamB?.score ?? 0;

  // Determine team opacity based on who's winning
  const teamAFaded = scoreA < scoreB;
  const teamBFaded = scoreB < scoreA;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="glass-container relative overflow-hidden"
    >
      {/* Glow accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 rounded-full bg-red-500 opacity-10 blur-3xl pointer-events-none" />

      {/* Header: League + Live */}
      <div className="flex justify-between items-center mb-5 relative z-10">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">
            {data.league}
          </span>
        </div>
        {data.isLive && <LivePulse />}
      </div>

      {/* Timer bar */}
      <div className="relative z-10 flex flex-col items-center mb-5">
        <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
          <span className="text-sm font-mono font-bold text-white/90 tabular-nums tracking-widest">
            {timer}
          </span>
        </div>
        <span className="text-[10px] font-medium text-white/40 mt-1.5 uppercase tracking-wider">
          {data.status}
        </span>
      </div>

      {/* Scoreboard: Team A — Score — Team B */}
      <div className="relative z-10 flex items-center justify-between px-2">
        {/* Team A */}
        <div className={
          teamAFaded
            ? 'flex flex-col items-center flex-1 gap-2 opacity-50'
            : 'flex flex-col items-center flex-1 gap-2 opacity-100'
        }>
          <div className="w-12 h-12 flex items-center justify-center">
            {getTeamLogo(data.teamA.name)}
          </div>
          <span className={
            teamAFaded
              ? 'text-xs font-bold text-white/50 text-center uppercase tracking-wide'
              : 'text-xs font-bold text-white/90 text-center uppercase tracking-wide'
          }>
            {data.teamA.name}
          </span>
        </div>

        {/* Scores */}
        <div className="flex items-center gap-3 px-4">
          <span className={
            teamAFaded
              ? 'text-4xl font-black tabular-nums text-white/50'
              : 'text-4xl font-black tabular-nums text-white'
          }>
            {scoreA}
          </span>
          <span className="text-2xl font-light text-white/30">:</span>
          <span className={
            teamBFaded
              ? 'text-4xl font-black tabular-nums text-white/50'
              : 'text-4xl font-black tabular-nums text-white'
          }>
            {scoreB}
          </span>
        </div>

        {/* Team B */}
        <div className={
          teamBFaded
            ? 'flex flex-col items-center flex-1 gap-2 opacity-50'
            : 'flex flex-col items-center flex-1 gap-2 opacity-100'
        }>
          <div className="w-12 h-12 flex items-center justify-center">
            {getTeamLogo(data.teamB.name)}
          </div>
          <span className={
            teamBFaded
              ? 'text-xs font-bold text-white/50 text-center uppercase tracking-wide'
              : 'text-xs font-bold text-white/90 text-center uppercase tracking-wide'
          }>
            {data.teamB.name}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

// ─── CricketCard ───────────────────────────────────────────────────
const CricketCard = ({ data }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="glass-container relative overflow-hidden"
    >
      {/* Glow accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 rounded-full bg-blue-500 opacity-10 blur-3xl pointer-events-none" />

      {/* Header: League + Live */}
      <div className="flex justify-between items-center mb-5 relative z-10">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">
            {data.league}
          </span>
        </div>
        {data.isLive && <LivePulse />}
      </div>

      {/* Batting Team — full brightness, prominent */}
      <div className="relative z-10 flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 mb-3">
        <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center">
          {getTeamLogo(data.battingTeam)}
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-sm font-bold text-white/90 truncate">
            {data.battingTeam}
          </span>
          <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider mt-0.5">
            Overs: {data.battingOvers || '0.0'}
          </span>
        </div>
        <div className="text-right">
          <span className="text-3xl font-black tabular-nums text-white leading-none tracking-tight">
            {data.battingScore}
          </span>
        </div>
      </div>

      {/* Bowling Team — faded/secondary */}
      <div className="relative z-10 flex items-center gap-4 px-4 py-2 opacity-50">
        <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center">
          {getTeamLogo(data.bowlingTeam)}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-bold text-white/80 truncate block">
            {data.bowlingTeam}
          </span>
        </div>
        <span className="text-xl font-bold tabular-nums text-white/80">
          {data.bowlingScore || '-'}
        </span>
      </div>

      {/* Footer: CRR + Status */}
      <div className="relative z-10 mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
        {data.crr !== undefined && data.crr !== null && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-[10px] font-black text-emerald-400 tracking-widest uppercase tabular-nums">
              CRR: {typeof data.crr === 'number' ? data.crr.toFixed(2) : data.crr}
            </span>
          </div>
        )}
        <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider">
          {data.status}
        </span>
      </div>
    </motion.div>
  );
};

// ─── SportsCard (Router) ───────────────────────────────────────────
const SportsCard = ({ data }) => {
  if (data.teamA) return <FootballCard data={data} />;
  if (data.battingTeam) return <CricketCard data={data} />;
  return null;
};

export default SportsCard;