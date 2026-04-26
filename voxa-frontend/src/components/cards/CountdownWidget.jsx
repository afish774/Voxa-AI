import React from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Clock, ArrowRight, ArrowLeft, Timer } from 'lucide-react';

// ============================================================================
// ⏳ CountdownWidget — Time-Focused Countdown/Countup Card
// ============================================================================
// Payload shape (from getCountdownTool):
//   label, targetDate, formattedDate, dayOfWeek, isPast,
//   totalDays, weeks, remainingDays, totalHours, months, years, yearProgress
// ============================================================================

const CountdownWidget = ({ data }) => {
  const {
    label = 'Event', formattedDate = '', dayOfWeek = '',
    isPast = false, totalDays = 0, weeks = 0, remainingDays = 0,
    totalHours = 0, months = 0, years = 0, yearProgress = 0, error,
  } = data || {};

  if (error) {
    return (
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
        // 📱 RESPONSIVE: Fluid error card
        className="w-full max-w-[420px] rounded-[24px] sm:rounded-[28px] p-4 sm:p-6 mt-5"
        style={{ background: '#0B0B0C', border: '1px solid rgba(239,68,68,0.12)' }}>
        <span className="text-[12px] sm:text-[13px] text-red-400 font-medium break-words">{error}</span>
      </motion.div>
    );
  }

  const accent = isPast ? '#A855F7' : '#3B82F6';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      // 📱 RESPONSIVE: Fluid width, responsive corners
      className="relative w-full max-w-[420px] rounded-[24px] sm:rounded-[28px] md:rounded-[32px] overflow-hidden mt-5"
      style={{
        background: '#0B0B0C',
        border: `1px solid ${accent}15`,
        boxShadow: '0 32px 64px -16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse at 50% 0%, ${accent}0A 0%, transparent 60%)`,
      }} />

      {/* 📱 RESPONSIVE: Mobile-first padding */}
      <div className="relative z-10 p-4 sm:p-5 md:p-7">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4 sm:mb-5">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0" style={{
            background: `${accent}15`, border: `1px solid ${accent}22`,
          }}>
            {isPast ? <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: accent }} /> : <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: accent }} />}
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: `${accent}BB` }}>
              {isPast ? 'Time Since' : 'Countdown To'}
            </span>
            {/* 📱 RESPONSIVE: Truncate long event labels */}
            <p className="text-[13px] sm:text-[14px] text-white/90 font-medium mt-0.5 truncate">{label}</p>
          </div>
        </div>

        {/* Hero — Total Days */}
        {/* 📱 RESPONSIVE: Fluid padding and day count text */}
        <div className="text-center mb-4 sm:mb-5 p-4 sm:p-5 rounded-xl sm:rounded-2xl" style={{
          background: `${accent}08`, border: `1px solid ${accent}12`,
        }}>
          <motion.p
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            // 📱 RESPONSIVE: Fluid hero day count — scales from 36px to 56px
            className="text-[36px] sm:text-[46px] md:text-[56px] font-bold tracking-[-0.04em] leading-none"
            style={{ color: accent }}
          >
            {totalDays}
          </motion.p>
          <p className="text-[12px] sm:text-[13px] text-[#71717A] mt-1.5 sm:mt-2 font-semibold uppercase tracking-wider">
            {totalDays === 1 ? 'Day' : 'Days'} {isPast ? 'Ago' : 'Left'}
          </p>
        </div>

        {/* Breakdown Grid */}
        {/* 📱 RESPONSIVE: 3-col grid with tighter padding/gap on mobile */}
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5 mb-4 sm:mb-5">
          <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <p className="text-[15px] sm:text-[18px] font-bold text-white/90">{weeks}</p>
            <p className="text-[9px] sm:text-[10px] text-[#52525B] uppercase tracking-wider font-semibold">Weeks</p>
          </div>
          <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <p className="text-[15px] sm:text-[18px] font-bold text-white/90">{remainingDays}</p>
            <p className="text-[9px] sm:text-[10px] text-[#52525B] uppercase tracking-wider font-semibold">+Days</p>
          </div>
          <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <p className="text-[15px] sm:text-[18px] font-bold text-white/90">{months}</p>
            <p className="text-[9px] sm:text-[10px] text-[#52525B] uppercase tracking-wider font-semibold">Months</p>
          </div>
        </div>

        {/* Date Info */}
        {/* 📱 RESPONSIVE: Stack on very narrow, row on sm+ */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-0 mb-3 sm:mb-4 text-[11px] sm:text-[12px]">
          <div className="flex items-center gap-1.5 text-[#A1A1AA]">
            <CalendarDays className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#52525B] shrink-0" />
            {/* 📱 RESPONSIVE: Truncate long formatted dates */}
            <span className="font-medium truncate">{dayOfWeek}, {formattedDate}</span>
          </div>
          <div className="flex items-center gap-1 text-[#52525B]">
            <Timer className="w-3 h-3 shrink-0" />
            <span>{totalHours.toLocaleString()} hrs</span>
          </div>
        </div>

        {/* Year Progress */}
        {yearProgress > 0 && (
          <div>
            <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-[#52525B] mb-1 sm:mb-1.5">
              <span className="font-semibold uppercase tracking-wider">Year Progress</span>
              <span className="font-bold">{yearProgress}%</span>
            </div>
            <div className="w-full h-1 sm:h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${yearProgress}%` }}
                transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${accent}60, ${accent})` }}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CountdownWidget;
