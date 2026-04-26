import React from 'react';
import { motion } from 'framer-motion';
import { Plane, Clock, MapPin, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';

// ============================================================================
// ✈️ FlightWidget — Futuristic Digital Boarding Pass
// ============================================================================
// Payload shape (from getFlightTool):
//   flightNumber   — "AI131"
//   airline        — "Air India"
//   status         — "Airborne" | "Landed" | "Scheduled" | "Cancelled" | "Delayed" | "Diverted"
//   origin         — "DEL" (IATA code)
//   originCity     — "Indira Gandhi International"
//   destination    — "BOM"
//   destinationCity — "Chhatrapati Shivaji Maharaj"
//   scheduled      — "02:30 PM"
//   eta            — "04:55 PM"
//   delay          — "On Time" | "15 min"
//   terminal       — "3" | "--"
//   gate           — "B12" | "--"
// ============================================================================

const STATUS_CONFIG = {
  Airborne:  { color: '#3B82F6', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.15)',  glow: 'rgba(59,130,246,0.06)',  icon: Plane,           label: 'In Flight' },
  Landed:    { color: '#22C55E', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.15)',   glow: 'rgba(34,197,94,0.06)',   icon: CheckCircle2,    label: 'Landed' },
  Scheduled: { color: '#A1A1AA', bg: 'rgba(161,161,170,0.08)',border: 'rgba(161,161,170,0.12)', glow: 'rgba(161,161,170,0.04)', icon: Clock,           label: 'Scheduled' },
  Cancelled: { color: '#EF4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.15)',   glow: 'rgba(239,68,68,0.06)',   icon: AlertTriangle,   label: 'Cancelled' },
  Delayed:   { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.15)',  glow: 'rgba(245,158,11,0.06)', icon: AlertTriangle,   label: 'Delayed' },
  Diverted:  { color: '#F97316', bg: 'rgba(249,115,22,0.1)',  border: 'rgba(249,115,22,0.15)',  glow: 'rgba(249,115,22,0.06)', icon: AlertTriangle,   label: 'Diverted' },
  Error:     { color: '#EF4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.15)',   glow: 'rgba(239,68,68,0.06)',   icon: AlertTriangle,   label: 'Error' },
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
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[440px] rounded-[28px] p-6 mt-5"
        style={{ background: '#0B0B0C', border: '1px solid rgba(239,68,68,0.12)' }}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span className="text-[13px] text-red-400 font-medium">{error}</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className="relative w-full max-w-[440px] rounded-[32px] overflow-hidden mt-5"
      style={{
        background: '#0B0B0C',
        border: `1px solid ${cfg.border}`,
        boxShadow: `0 32px 64px -16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)`,
      }}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse at 50% 0%, ${cfg.glow} 0%, transparent 60%)`,
      }} />

      {/* ─── Header ─── */}
      <div className="relative z-10 flex items-center justify-between px-7 pt-6 pb-3">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: cfg.color + 'BB' }}>
            {airline}
          </span>
          <h2 className="text-[22px] font-bold text-white/95 tracking-[-0.02em] mt-0.5">{flightNumber}</h2>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
          <StatusIcon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: cfg.color }}>{cfg.label}</span>
        </div>
      </div>

      {/* ─── Route Visualization ─── */}
      <div className="relative z-10 px-7 py-5">
        <div className="flex items-center justify-between">
          {/* Origin */}
          <div className="text-left">
            <p className="text-[32px] font-bold text-white/95 tracking-[-0.02em] leading-none">{origin}</p>
            <p className="text-[12px] text-[#71717A] mt-1.5 font-medium max-w-[120px] leading-tight truncate">{originCity}</p>
            <p className="text-[13px] text-[#A1A1AA] mt-2 font-semibold">{scheduled}</p>
          </div>

          {/* Flight Path */}
          <div className="flex-1 flex items-center justify-center mx-4 relative">
            <div className="w-full h-[1px] relative" style={{ background: 'rgba(255,255,255,0.08)' }}>
              {/* Dashed line */}
              <div className="absolute inset-0" style={{
                backgroundImage: `repeating-linear-gradient(90deg, ${cfg.color}40 0px, ${cfg.color}40 6px, transparent 6px, transparent 12px)`,
                height: '1px',
              }} />
            </div>
            {/* Airplane icon */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="absolute w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
            >
              <Plane className="w-4 h-4 rotate-45" style={{ color: cfg.color }} />
            </motion.div>
          </div>

          {/* Destination */}
          <div className="text-right">
            <p className="text-[32px] font-bold text-white/95 tracking-[-0.02em] leading-none">{destination}</p>
            <p className="text-[12px] text-[#71717A] mt-1.5 font-medium max-w-[120px] leading-tight truncate ml-auto">{destinationCity}</p>
            <p className="text-[13px] text-[#A1A1AA] mt-2 font-semibold">{eta}</p>
          </div>
        </div>
      </div>

      {/* ─── Footer Details ─── */}
      <div className="relative z-10 px-7 pb-6">
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <p className="text-[10px] text-[#52525B] uppercase tracking-wider font-semibold mb-1">Terminal</p>
            <p className="text-[16px] font-bold text-white/90">{terminal}</p>
          </div>
          <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <p className="text-[10px] text-[#52525B] uppercase tracking-wider font-semibold mb-1">Gate</p>
            <p className="text-[16px] font-bold text-white/90">{gate}</p>
          </div>
          <div className="p-3 rounded-xl text-center" style={{
            background: delay !== 'On Time' ? 'rgba(245,158,11,0.04)' : 'rgba(34,197,94,0.04)',
            border: `1px solid ${delay !== 'On Time' ? 'rgba(245,158,11,0.08)' : 'rgba(34,197,94,0.08)'}`,
          }}>
            <p className="text-[10px] text-[#52525B] uppercase tracking-wider font-semibold mb-1">Delay</p>
            <p className="text-[16px] font-bold" style={{ color: delay !== 'On Time' ? '#F59E0B' : '#22C55E' }}>{delay}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default FlightWidget;
