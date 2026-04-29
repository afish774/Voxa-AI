import React from 'react';
import { motion } from 'framer-motion';
import { Timer, CalendarDays, Clock, History, AlertTriangle, Calendar } from 'lucide-react';

// ============================================================================
// ⏳ CountdownWidget — Apple Premium Time Tracker
// ============================================================================
// Design DNA: iOS 17 Clock/Calendar Widgets / Cupertino Glassmorphism
// Features: 32px backdrop blur, adaptive semantic glows (Orange for Future, 
// Blue for Past), tabular numerals, and nested frosted glass metrics.
// ============================================================================

const CountdownWidget = ({ data }) => {
  const {
    label = 'Event', formattedDate = '', dayOfWeek = '',
    isPast = false, totalDays = 0, weeks = 0, remainingDays = 0,
    totalHours = 0, months = 0, years = 0, yearProgress = 0, error,
  } = data || {};

  // ─── Error State ───
  if (error) {
    return (
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[420px] rounded-[24px] sm:rounded-[28px] p-5 mt-5"
        style={{ background: 'rgba(28, 28, 30, 0.8)', border: '1px solid rgba(255,69,58,0.2)' }}>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#FF453A] shrink-0" />
          <span className="text-[13px] text-[#FF453A] font-medium tracking-tight break-words">{error}</span>
        </div>
      </motion.div>
    );
  }

  // ─── Adaptive Theme ───
  // System Orange for Countdowns (Future), System Blue for Countups (Past)
  const themeColor = isPast ? '#0A84FF' : '#FF9F0A';
  const ThemeIcon = isPast ? History : Timer;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full max-w-[440px] rounded-[32px] overflow-hidden mt-5 shadow-2xl"
      style={{
        background: 'rgba(20, 20, 22, 0.65)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 24px 48px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
      }}
    >
      {/* ─── Ambient Temporal Glow ─── */}
      <div className="absolute top-0 right-0 w-3/4 h-48 pointer-events-none opacity-20" style={{
        background: `radial-gradient(ellipse at 80% -20%, ${themeColor} 0%, transparent 70%)`,
        filter: 'blur(40px)',
      }} />

      <div className="relative z-10 p-5 sm:p-6">

        {/* ─── Header: Mode & Label ─── */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: `rgba(${isPast ? '10, 132, 255' : '255, 159, 10'}, 0.15)` }}>
              <ThemeIcon className="w-4 h-4" style={{ color: themeColor }} />
            </div>
            <span className="text-[14px] font-semibold text-white/80 tracking-tight uppercase">
              {isPast ? 'Time Elapsed' : 'Countdown'}
            </span>
          </div>
          <span className="text-[11px] font-bold text-white/40 uppercase tracking-wider px-2 py-1 rounded-md"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)' }}>
            {dayOfWeek}
          </span>
        </div>

        {/* ─── Target Event Details ─── */}
        <div className="mb-6 pb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="text-[24px] sm:text-[28px] font-bold text-white tracking-tight leading-none mb-2 truncate pr-2">
            {label}
          </h2>
          <div className="flex items-center gap-1.5 text-[13px] text-white/50 font-medium">
            <CalendarDays className="w-4 h-4" />
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* ─── Primary Metric: Total Days ─── */}
        <div className="flex items-baseline gap-2 mb-6">
          <span className="text-[52px] sm:text-[64px] font-bold text-white tracking-tighter leading-none tabular-nums drop-shadow-md">
            {totalDays.toLocaleString()}
          </span>
          <span className="text-[16px] sm:text-[18px] font-semibold" style={{ color: themeColor }}>
            Days {isPast ? 'Ago' : 'Left'}
          </span>
        </div>

        {/* ─── Secondary Metrics Grid ─── */}
        <div className="grid grid-cols-3 gap-2.5 mb-6">
          <div className="flex flex-col p-3 rounded-[16px]" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wider mb-1">Hours</span>
            <span className="text-[15px] font-semibold text-white/90 tabular-nums leading-tight">
              {totalHours.toLocaleString()}
            </span>
          </div>
          <div className="flex flex-col p-3 rounded-[16px]" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wider mb-1">Weeks</span>
            <span className="text-[15px] font-semibold text-white/90 tabular-nums leading-tight truncate">
              {weeks}w {remainingDays}d
            </span>
          </div>
          <div className="flex flex-col p-3 rounded-[16px]" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wider mb-1">
              {years > 0 ? 'Years' : 'Months'}
            </span>
            <span className="text-[15px] font-semibold text-white/90 tabular-nums leading-tight">
              {years > 0 ? years : months}
            </span>
          </div>
        </div>

        {/* ─── Year Progress Bar ─── */}
        {yearProgress > 0 && (
          <div className="pt-2">
            <div className="flex items-center justify-between text-[11px] mb-2">
              <span className="font-semibold text-white/50 uppercase tracking-wider">Current Year Progress</span>
              <span className="font-bold text-white/90 tabular-nums">{yearProgress}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${yearProgress}%` }}
                transition={{ delay: 0.4, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="h-full rounded-full"
                style={{ background: themeColor }}
              />
            </div>
          </div>
        )}

      </div>
    </motion.div>
  );
};

export default CountdownWidget;