import React from 'react';
import { motion } from 'framer-motion';
import { Plane, Clock, AlertTriangle, CheckCircle2, ArrowDown } from 'lucide-react';

// ============================================================================
// ✈️ FlightWidget — Apple Premium Digital Boarding Pass
// ============================================================================
// Design DNA: iOS 17 Live Activities / Wallet Pass
// Features: 24px backdrop blur, adaptive status glow, hairline borders,
// and buttery-smooth spring animations.
// ============================================================================

// iOS System Colors
const STATUS_CONFIG = {
  Airborne: { color: '#0A84FF', bg: 'rgba(10, 132, 255, 0.15)', border: 'rgba(10, 132, 255, 0.2)', icon: Plane, label: 'In Flight' },
  Landed: { color: '#30D158', bg: 'rgba(48, 209, 88, 0.15)', border: 'rgba(48, 209, 88, 0.2)', icon: CheckCircle2, label: 'Landed' },
  Scheduled: { color: '#8E8E93', bg: 'rgba(142, 142, 147, 0.15)', border: 'rgba(142, 142, 147, 0.2)', icon: Clock, label: 'Scheduled' },
  Cancelled: { color: '#FF453A', bg: 'rgba(255, 69, 58, 0.15)', border: 'rgba(255, 69, 58, 0.2)', icon: AlertTriangle, label: 'Cancelled' },
  Delayed: { color: '#FF9F0A', bg: 'rgba(255, 159, 10, 0.15)', border: 'rgba(255, 159, 10, 0.2)', icon: AlertTriangle, label: 'Delayed' },
  Diverted: { color: '#FF9F0A', bg: 'rgba(255, 159, 10, 0.15)', border: 'rgba(255, 159, 10, 0.2)', icon: AlertTriangle, label: 'Diverted' },
  Error: { color: '#FF453A', bg: 'rgba(255, 69, 58, 0.15)', border: 'rgba(255, 69, 58, 0.2)', icon: AlertTriangle, label: 'Error' },
};

const FlightWidget = ({ data }) => {
  const {
    flightNumber = '---',
    airline = 'Unknown',
    status = 'Scheduled',
    origin = '---',
    originCity = 'Origin',
    destination = '---',
    destinationCity = 'Destination',
    scheduled = '--:--',
    eta = '--:--',
    delay = 'On Time',
    terminal = '--',
    gate = '--',
    error,
  } = data || {};

  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Scheduled;
  const StatusIcon = cfg.icon;

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
      {/* ─── Ambient Adaptive Glow ─── */}
      <div className="absolute top-0 left-0 w-full h-32 pointer-events-none opacity-30" style={{
        background: `radial-gradient(ellipse at 50% -20%, ${cfg.color} 0%, transparent 70%)`,
        filter: 'blur(40px)',
      }} />

      {/* ─── Header ─── */}
      <div className="relative z-10 flex items-center justify-between gap-2 px-5 sm:px-6 pt-6 pb-2">
        <div className="min-w-0 flex flex-col">
          <span className="text-[11px] sm:text-[12px] font-semibold text-white/50 tracking-wide uppercase truncate block">
            {airline}
          </span>
          <h2 className="text-[20px] sm:text-[22px] font-bold text-white tracking-tight mt-0.5 leading-none">
            {flightNumber}
          </h2>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full shrink-0" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
          <StatusIcon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: cfg.color }}>{cfg.label}</span>
        </div>
      </div>

      {/* ─── Route Visualization ─── */}
      <div className="relative z-10 px-5 sm:px-6 py-4 sm:py-5">

        {/* Mobile: vertical stack */}
        <div className="flex flex-col items-center gap-3 sm:hidden">
          {/* Origin */}
          <div className="w-full flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[32px] font-bold text-white tracking-tight leading-none">{origin}</p>
              <p className="text-[12px] text-white/50 mt-1 font-medium truncate max-w-[160px]">{originCity}</p>
            </div>
            <p className="text-[14px] text-white/90 font-semibold shrink-0">{scheduled}</p>
          </div>

          {/* Flight Path — vertical on mobile */}
          <div className="flex flex-col items-center gap-1 py-1">
            <div className="w-[1.5px] h-6" style={{ background: `repeating-linear-gradient(180deg, ${cfg.color}50 0px, ${cfg.color}50 4px, transparent 4px, transparent 8px)` }} />
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
            >
              <ArrowDown className="w-4 h-4" style={{ color: cfg.color }} />
            </motion.div>
            <div className="w-[1.5px] h-6" style={{ background: `repeating-linear-gradient(180deg, ${cfg.color}50 0px, ${cfg.color}50 4px, transparent 4px, transparent 8px)` }} />
          </div>

          {/* Destination */}
          <div className="w-full flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[32px] font-bold text-white tracking-tight leading-none">{destination}</p>
              <p className="text-[12px] text-white/50 mt-1 font-medium truncate max-w-[160px]">{destinationCity}</p>
            </div>
            <p className="text-[14px] text-white/90 font-semibold shrink-0">{eta}</p>
          </div>
        </div>

        {/* Desktop: horizontal layout (sm+) */}
        <div className="hidden sm:flex items-center justify-between">
          {/* Origin */}
          <div className="text-left min-w-0">
            <p className="text-[36px] font-bold text-white tracking-tight leading-none">{origin}</p>
            <p className="text-[12px] text-white/50 mt-1.5 font-medium max-w-[120px] truncate">{originCity}</p>
            <p className="text-[14px] text-white/90 mt-1.5 font-semibold">{scheduled}</p>
          </div>

          {/* Flight Path — horizontal */}
          <div className="flex-1 flex items-center justify-center mx-4 relative">
            <div className="w-full h-[1.5px] relative" style={{ background: 'rgba(255,255,255,0.05)' }}>
              {/* Dashed line */}
              <div className="absolute inset-0" style={{
                backgroundImage: `repeating-linear-gradient(90deg, ${cfg.color}50 0px, ${cfg.color}50 6px, transparent 6px, transparent 12px)`,
                height: '1.5px',
              }} />
            </div>
            {/* Airplane icon */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="absolute w-9 h-9 rounded-full flex items-center justify-center shadow-md"
              style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
            >
              <Plane className="w-4 h-4 rotate-45" style={{ color: cfg.color }} />
            </motion.div>
          </div>

          {/* Destination */}
          <div className="text-right min-w-0">
            <p className="text-[36px] font-bold text-white tracking-tight leading-none">{destination}</p>
            <p className="text-[12px] text-white/50 mt-1.5 font-medium max-w-[120px] truncate ml-auto">{destinationCity}</p>
            <p className="text-[14px] text-white/90 mt-1.5 font-semibold">{eta}</p>
          </div>
        </div>
      </div>

      {/* ─── Footer Details ─── */}
      <div className="relative z-10 px-5 sm:px-6 pb-6 pt-2">
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
          <div className="p-3 rounded-[16px] text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <p className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1">Terminal</p>
            <p className="text-[15px] sm:text-[17px] font-semibold text-white/90">{terminal}</p>
          </div>
          <div className="p-3 rounded-[16px] text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <p className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1">Gate</p>
            <p className="text-[15px] sm:text-[17px] font-semibold text-white/90">{gate}</p>
          </div>
          <div className="p-3 rounded-[16px] text-center" style={{
            background: delay !== 'On Time' ? 'rgba(255, 159, 10, 0.08)' : 'rgba(48, 209, 88, 0.08)',
          }}>
            <p className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1">Delay</p>
            <p className="text-[14px] sm:text-[15px] font-semibold truncate" style={{ color: delay !== 'On Time' ? '#FF9F0A' : '#30D158' }}>
              {delay}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default FlightWidget;