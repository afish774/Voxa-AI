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
        className="w-full max-w-[420px] rounded-[28px] p-6 mt-5"
        style={{ background: '#0B0B0C', border: '1px solid rgba(239,68,68,0.12)' }}>
        <span className="text-[13px] text-red-400 font-medium">{error}</span>
      </motion.div>
    );
  }

  const accent = isPast ? '#A855F7' : '#3B82F6';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className="relative w-full max-w-[420px] rounded-[32px] overflow-hidden mt-5"
      style={{
        background: '#0B0B0C',
        border: `1px solid ${accent}15`,
        boxShadow: '0 32px 64px -16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse at 50% 0%, ${accent}0A 0%, transparent 60%)`,
      }} />

      <div className="relative z-10 p-7">
        {/* Header */}
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{
            background: `${accent}15`, border: `1px solid ${accent}22`,
          }}>
            {isPast ? <ArrowLeft className="w-4 h-4" style={{ color: accent }} /> : <ArrowRight className="w-4 h-4" style={{ color: accent }} />}
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: `${accent}BB` }}>
              {isPast ? 'Time Since' : 'Countdown To'}
            </span>
            <p className="text-[14px] text-white/90 font-medium mt-0.5">{label}</p>
          </div>
        </div>

        {/* Hero — Total Days */}
        <div className="text-center mb-5 p-5 rounded-2xl" style={{
          background: `${accent}08`, border: `1px solid ${accent}12`,
        }}>
          <motion.p
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="text-[56px] font-bold tracking-[-0.04em] leading-none"
            style={{ color: accent }}
          >
            {totalDays}
          </motion.p>
          <p className="text-[13px] text-[#71717A] mt-2 font-semibold uppercase tracking-wider">
            {totalDays === 1 ? 'Day' : 'Days'} {isPast ? 'Ago' : 'Left'}
          </p>
        </div>

        {/* Breakdown Grid */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <p className="text-[18px] font-bold text-white/90">{weeks}</p>
            <p className="text-[10px] text-[#52525B] uppercase tracking-wider font-semibold">Weeks</p>
          </div>
          <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <p className="text-[18px] font-bold text-white/90">{remainingDays}</p>
            <p className="text-[10px] text-[#52525B] uppercase tracking-wider font-semibold">+Days</p>
          </div>
          <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <p className="text-[18px] font-bold text-white/90">{months}</p>
            <p className="text-[10px] text-[#52525B] uppercase tracking-wider font-semibold">Months</p>
          </div>
        </div>

        {/* Date Info */}
        <div className="flex items-center justify-between mb-4 text-[12px]">
          <div className="flex items-center gap-1.5 text-[#A1A1AA]">
            <CalendarDays className="w-3.5 h-3.5 text-[#52525B]" />
            <span className="font-medium">{dayOfWeek}, {formattedDate}</span>
          </div>
          <div className="flex items-center gap-1 text-[#52525B]">
            <Timer className="w-3 h-3" />
            <span>{totalHours.toLocaleString()} hrs</span>
          </div>
        </div>

        {/* Year Progress */}
        {yearProgress > 0 && (
          <div>
            <div className="flex items-center justify-between text-[10px] text-[#52525B] mb-1.5">
              <span className="font-semibold uppercase tracking-wider">Year Progress</span>
              <span className="font-bold">{yearProgress}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
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
