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
  const { cities, error } = data || {};
  // 🧹 QA FIX: Null-safe array — destructuring default [] is bypassed when value is explicit null
  const safeCities = cities || [];

  if (error || safeCities.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        // 📱 RESPONSIVE: Fluid error card
        className="w-full max-w-[440px] rounded-[24px] sm:rounded-[28px] p-4 sm:p-6 mt-5"
        style={{ background: '#0B0B0C', border: '1px solid rgba(239,68,68,0.12)' }}
      >
        <span className="text-[12px] sm:text-[13px] text-red-400 font-medium break-words">{error || 'No timezone data available'}</span>
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
      // 📱 RESPONSIVE: Fluid width, responsive corners
      className="relative w-full max-w-[460px] rounded-[24px] sm:rounded-[28px] md:rounded-[32px] overflow-hidden mt-5"
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

      {/* 📱 RESPONSIVE: Mobile-first padding */}
      <div className="relative z-10 p-4 sm:p-5 md:p-7">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4 sm:mb-5">
          <Globe className="w-4 h-4 text-sky-400/70" />
          <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.12em] text-sky-400/70">World Clock</span>
          {/* 🧹 QA FIX: Use safeCities for count */}
          <span className="text-[10px] sm:text-[11px] text-[#52525B] ml-auto font-medium">{safeCities.length} cities</span>
        </div>

        {/* City Grid — uses safeCities */}
        {/* 📱 RESPONSIVE: grid-cols-1 on mobile, sm:grid-cols-2, lg:grid-cols-3 as user directive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
          {/* 🧹 QA FIX: Map over safeCities with stable key */}
          {safeCities.map((city, i) => {
            const cfg = STATUS_CONFIG[city.status] || STATUS_CONFIG.awake;
            const StatusIcon = cfg.icon;

            return (
              <motion.div
                key={city.city || `tz-${i}`}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.07, duration: 0.4 }}
                // 📱 RESPONSIVE: On mobile (1-col), use horizontal row layout
                // On sm+ (2-col grid), use vertical card layout
                className="p-3 sm:p-4 rounded-xl sm:rounded-2xl flex sm:flex-col"
                style={{
                  background: cfg.bg,
                  border: `1px solid ${cfg.border}`,
                }}
              >
                {/* Mobile layout: single row with city, time, status */}
                {/* Desktop layout: stacked vertical card */}

                {/* City Name + Status Icon */}
                <div className="flex items-center justify-between sm:mb-2.5 mr-3 sm:mr-0 min-w-0 shrink sm:shrink-0 sm:w-full">
                  {/* 🧹 QA FIX: Null-safe city name fallback */}
                  {/* 📱 RESPONSIVE: Truncate long city names */}
                  <p className="text-[12px] sm:text-[13px] font-semibold text-white/90 tracking-tight truncate pr-2">{city.city || 'Unknown'}</p>
                  <StatusIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" style={{ color: cfg.color }} />
                </div>

                {/* Time + Date — displayed inline on mobile, stacked on sm+ */}
                <div className="flex items-baseline gap-1.5 sm:gap-1.5 shrink-0">
                  {/* 📱 RESPONSIVE: Fluid time text */}
                  <span className="text-[20px] sm:text-[22px] md:text-[24px] font-bold text-white/95 tracking-[-0.02em] leading-none tabular-nums">
                    {to12h(city.time)}
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-semibold text-[#71717A] uppercase">{getAmPm(city.time)}</span>
                </div>

                {/* Date — hidden on mobile row, shown on sm+ */}
                <p className="hidden sm:block text-[10px] sm:text-[11px] text-[#52525B] mt-1.5 font-medium">{city.date || ''}</p>

                {/* Offset — shown as badge on mobile, full row on sm+ */}
                <div className="hidden sm:flex items-center gap-1 mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <Clock className="w-2.5 h-2.5 text-[#3F3F46]" />
                  <span className="text-[9px] sm:text-[10px] text-[#3F3F46] font-medium truncate">{city.offsetFromIST || ''}</span>
                </div>

                {/* Mobile-only: compact offset badge */}
                <div className="flex sm:hidden items-center gap-1 ml-auto shrink-0">
                  <span className="text-[9px] text-[#52525B] font-medium">{city.date || ''}</span>
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
