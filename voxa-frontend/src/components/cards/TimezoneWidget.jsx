import React from 'react';
import { motion } from 'framer-motion';
import { Globe, Sun, Moon, Sunrise, Clock } from 'lucide-react';

// ============================================================================
// 🕐 TimezoneWidget — World Clock Grid
// ============================================================================
// Payload shape (from getTimezoneTool):
//   cities: [{
//     city           — "London"
//     time           — "17:30:45"
//     date           — "Sat, Apr 26"
//     timezone       — "Europe/London"
//     status         — "business" | "awake" | "sleeping"
//     offsetFromIST  — "+4.5h from IST" | "-9.5h from IST"
//   }]
//   generatedAt — ISO timestamp
// ============================================================================

const STATUS_CONFIG = {
  business: {
    icon: Sun,
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.06)',
    border: 'rgba(245,158,11,0.1)',
    label: 'Business Hours',
  },
  awake: {
    icon: Sunrise,
    color: '#FB923C',
    bg: 'rgba(251,146,60,0.06)',
    border: 'rgba(251,146,60,0.1)',
    label: 'Awake',
  },
  sleeping: {
    icon: Moon,
    color: '#6366F1',
    bg: 'rgba(99,102,241,0.06)',
    border: 'rgba(99,102,241,0.1)',
    label: 'Sleeping',
  },
};

const TimezoneWidget = ({ data }) => {
  const { cities = [], error } = data || {};

  if (error || cities.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[440px] rounded-[28px] p-6 mt-5"
        style={{ background: '#0B0B0C', border: '1px solid rgba(239,68,68,0.12)' }}
      >
        <span className="text-[13px] text-red-400 font-medium">{error || 'No timezone data available'}</span>
      </motion.div>
    );
  }

  // Format time to show just HH:MM
  const formatTime = (timeStr) => {
    if (!timeStr) return '--:--';
    const parts = timeStr.split(':');
    return `${parts[0]}:${parts[1]}`;
  };

  // Determine AM/PM from 24h time
  const getAmPm = (timeStr) => {
    if (!timeStr) return '';
    const hour = parseInt(timeStr.split(':')[0]);
    return hour >= 12 ? 'PM' : 'AM';
  };

  // Convert 24h to 12h format
  const to12h = (timeStr) => {
    if (!timeStr) return '--:--';
    const parts = timeStr.split(':');
    let hour = parseInt(parts[0]);
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${parts[1]}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className="relative w-full max-w-[460px] rounded-[32px] overflow-hidden mt-5"
      style={{
        background: '#0B0B0C',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 32px 64px -16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 50% 0%, rgba(56, 189, 248, 0.05) 0%, transparent 60%)',
      }} />

      <div className="relative z-10 p-7">
        {/* Header */}
        <div className="flex items-center gap-2 mb-5">
          <Globe className="w-4 h-4 text-sky-400/70" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-sky-400/70">World Clock</span>
          <span className="text-[11px] text-[#52525B] ml-auto font-medium">{cities.length} cities</span>
        </div>

        {/* City Grid */}
        <div className={`grid gap-3 ${cities.length <= 2 ? 'grid-cols-2' : cities.length <= 4 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
          {cities.map((city, i) => {
            const cfg = STATUS_CONFIG[city.status] || STATUS_CONFIG.awake;
            const StatusIcon = cfg.icon;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.07, duration: 0.4 }}
                className="p-4 rounded-2xl flex flex-col"
                style={{
                  background: cfg.bg,
                  border: `1px solid ${cfg.border}`,
                }}
              >
                {/* City Name + Status Icon */}
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-[13px] font-semibold text-white/90 tracking-tight truncate pr-2">{city.city}</p>
                  <StatusIcon className="w-4 h-4 shrink-0" style={{ color: cfg.color }} />
                </div>

                {/* Time */}
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[24px] font-bold text-white/95 tracking-[-0.02em] leading-none tabular-nums">
                    {to12h(city.time)}
                  </span>
                  <span className="text-[11px] font-semibold text-[#71717A] uppercase">{getAmPm(city.time)}</span>
                </div>

                {/* Date */}
                <p className="text-[11px] text-[#52525B] mt-1.5 font-medium">{city.date}</p>

                {/* Offset */}
                <div className="flex items-center gap-1 mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <Clock className="w-2.5 h-2.5 text-[#3F3F46]" />
                  <span className="text-[10px] text-[#3F3F46] font-medium">{city.offsetFromIST}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default TimezoneWidget;
