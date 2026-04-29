import React from 'react';
import { motion } from 'framer-motion';
import { Globe, Sun, Moon, Sunrise, Clock, AlertTriangle } from 'lucide-react';

// ============================================================================
// 🕐 TimezoneWidget — Apple Premium World Clock
// ============================================================================
// Design DNA: iOS 17 World Clock & Weather App
// Features: 32px backdrop blur, midnight ambient glow, tabular numerals,
// and adaptive status indicators (Awake/Business/Sleeping).
// ============================================================================

const STATUS_CONFIG = {
  business: { icon: Sun, color: '#FF9F0A', bg: 'rgba(255, 159, 10, 0.15)', label: 'Business Hours' },
  awake: { icon: Sunrise, color: '#32ADE6', bg: 'rgba(50, 173, 230, 0.15)', label: 'Awake' },
  sleeping: { icon: Moon, color: '#5E5CE6', bg: 'rgba(94, 92, 230, 0.15)', label: 'Sleeping' },
};

const TimezoneWidget = ({ data }) => {
  const { cities = [], generatedAt, error } = data || {};

  // ─── Error State ───
  if (error || !cities.length) {
    return (
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[440px] rounded-[24px] sm:rounded-[28px] p-5 mt-5"
        style={{ background: 'rgba(28, 28, 30, 0.8)', border: '1px solid rgba(255,69,58,0.2)' }}>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#FF453A] shrink-0" />
          <span className="text-[13px] text-[#FF453A] font-medium tracking-tight break-words">
            {error || 'No timezone data available.'}
          </span>
        </div>
      </motion.div>
    );
  }

  // ─── Time Parser Helpers ───
  const parseTime = (timeStr) => {
    if (!timeStr) return { time: '--:--', ampm: '' };
    const parts = timeStr.split(':');
    let h = parseInt(parts[0], 10);
    const m = parts[1] || '00';
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return { time: `${h}:${m}`, ampm };
  };

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
      {/* ─── Ambient Midnight Glow ─── */}
      <div className="absolute top-0 right-0 w-3/4 h-48 pointer-events-none opacity-20" style={{
        background: 'radial-gradient(ellipse at 80% -20%, #5E5CE6 0%, transparent 70%)',
        filter: 'blur(40px)',
      }} />

      <div className="relative z-10 p-5 sm:p-6 pb-4">

        {/* ─── Header ─── */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <Globe className="w-4 h-4 text-white/90" />
            </div>
            <span className="text-[14px] font-semibold text-white/80 tracking-tight uppercase">World Clock</span>
          </div>
          <div className="flex items-center gap-1.5 text-white/40">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">Live</span>
          </div>
        </div>

        {/* ─── Cities List ─── */}
        <div className="flex flex-col gap-3">
          {cities.map((cityObj, idx) => {
            const { time, ampm } = parseTime(cityObj.time);
            const statusCfg = STATUS_CONFIG[cityObj.status] || STATUS_CONFIG.awake;
            const StatusIcon = statusCfg.icon;

            return (
              <div
                key={idx}
                className="flex items-center justify-between p-4 rounded-[22px] transition-colors hover:bg-white/5"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}
              >
                {/* Left: City & Meta */}
                <div className="flex flex-col min-w-0 pr-4">
                  <span className="text-[11px] text-white/50 font-medium tracking-wide truncate mb-0.5">
                    {cityObj.date} • {cityObj.offsetFromIST}
                  </span>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[20px] sm:text-[22px] font-bold text-white tracking-tight leading-none truncate">
                      {cityObj.city}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <StatusIcon className="w-3 h-3" style={{ color: statusCfg.color }} />
                    <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: statusCfg.color }}>
                      {statusCfg.label}
                    </span>
                  </div>
                </div>

                {/* Right: Time Display */}
                <div className="flex items-baseline gap-1 shrink-0">
                  <span className="text-[36px] sm:text-[40px] font-light text-white tracking-tighter leading-none tabular-nums">
                    {time}
                  </span>
                  <span className="text-[15px] sm:text-[17px] font-semibold text-white/60">
                    {ampm}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default TimezoneWidget;