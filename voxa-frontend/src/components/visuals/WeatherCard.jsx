import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Wind, CloudRain, Droplets } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════
// 🌨️  SCENE 1: SNOWFALL — 18 white circles drifting down with wind sway
// ═══════════════════════════════════════════════════════════════════
const SnowEffect = () => {
  const flakes = useMemo(() =>
    Array.from({ length: 18 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: 3 + Math.random() * 5,
      dur: 5 + Math.random() * 7,
      delay: Math.random() * 6,
      drift: 20 + Math.random() * 30,
      peak: 0.3 + Math.random() * 0.5,
    })), []);

  return flakes.map(f => (
    <motion.div
      key={f.id}
      className="absolute rounded-full bg-white"
      style={{ width: f.size, height: f.size, left: f.left, top: -10 }}
      animate={{
        y: [0, 360],
        x: [-f.drift, f.drift, -f.drift],
        opacity: [0, f.peak, f.peak, 0],
      }}
      transition={{ duration: f.dur, delay: f.delay, repeat: Infinity, ease: 'linear' }}
    />
  ));
};

// ═══════════════════════════════════════════════════════════════════
// 🍂  SCENE 2: AUTUMN LEAVES — 12 leaf SVGs swaying and tumbling down
// ═══════════════════════════════════════════════════════════════════
const AutumnEffect = () => {
  const PALETTE = ['#D97706', '#B45309', '#92400E', '#DC2626', '#F59E0B'];
  const leaves = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      color: PALETTE[i % PALETTE.length],
      size: 8 + Math.random() * 6,
      dur: 6 + Math.random() * 6,
      delay: Math.random() * 5,
      spin: 180 + Math.random() * 360,
    })), []);

  return leaves.map(l => (
    <motion.div
      key={l.id}
      className="absolute"
      style={{ left: l.left, top: -16 }}
      animate={{
        y: [0, 380],
        x: [-14, 16, -10, 14, -14],
        rotate: [0, l.spin],
        opacity: [0, 0.75, 0.75, 0],
      }}
      transition={{ duration: l.dur, delay: l.delay, repeat: Infinity, ease: 'easeIn' }}
    >
      <svg width={l.size} height={l.size * 1.4} viewBox="0 0 10 14" aria-hidden="true">
        <path d="M5 0 C8 3 10 7 5 14 C0 7 2 3 5 0Z" fill={l.color} opacity={0.85} />
        <line x1="5" y1="2" x2="5" y2="12" stroke={l.color} strokeWidth={0.5} opacity={0.5} />
      </svg>
    </motion.div>
  ));
};

// ═══════════════════════════════════════════════════════════════════
// 🌧️  SCENE 3: RAINSTORM — 22 fast vertical streaks + optional thunder flash
// ═══════════════════════════════════════════════════════════════════
const RainEffect = ({ isThunder }) => {
  const drops = useMemo(() =>
    Array.from({ length: 22 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      h: 14 + Math.random() * 20,
      dur: 0.35 + Math.random() * 0.45,
      delay: Math.random() * 2,
      peak: 0.25 + Math.random() * 0.4,
    })), []);

  return (
    <>
      {drops.map(d => (
        <motion.div
          key={d.id}
          className="absolute rounded-full"
          style={{
            width: 1.5,
            height: d.h,
            left: d.left,
            top: -24,
            background: 'linear-gradient(to bottom, rgba(147,197,253,0.7), transparent)',
          }}
          animate={{ y: [0, 380], opacity: [0, d.peak, d.peak, 0] }}
          transition={{ duration: d.dur, delay: d.delay, repeat: Infinity, ease: 'linear' }}
        />
      ))}
      {isThunder && (
        <motion.div
          className="absolute inset-0 rounded-3xl bg-white pointer-events-none"
          animate={{ opacity: [0, 0, 0, 0.7, 0, 0, 0, 0, 0, 0.5, 0, 0, 0, 0, 0, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeOut' }}
        />
      )}
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════
// ☀️  SCENE 4: SUNNY — Rotating golden sun disc with expanding glow + ray spokes
// ═══════════════════════════════════════════════════════════════════
const SunnyEffect = () => {
  const rays = useMemo(() =>
    Array.from({ length: 10 }, (_, i) => ({
      id: i,
      angle: i * 36,
      h: 28 + Math.random() * 24,
      durFlicker: 2.5 + Math.random() * 2,
    })), []);

  return (
    <>
      {/* Outer radial glow — breathes */}
      <motion.div
        className="absolute -top-12 -right-12 w-52 h-52 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(251,191,36,0.30) 0%, rgba(251,191,36,0.06) 55%, transparent 72%)',
        }}
        animate={{ scale: [1, 1.18, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Core sun disc — rotates */}
      <motion.div
        className="absolute -top-4 -right-4 w-28 h-28 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(251,191,36,0.55) 0%, rgba(245,158,11,0.15) 55%, transparent 78%)',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
      />
      {/* Ray spokes */}
      {rays.map(r => (
        <motion.div
          key={r.id}
          className="absolute bg-amber-400/10 rounded-full"
          style={{
            width: 2,
            height: r.h,
            top: 8,
            right: 48,
            transformOrigin: '1px 64px',
            rotate: `${r.angle}deg`,
          }}
          animate={{ opacity: [0.08, 0.35, 0.08] }}
          transition={{ duration: r.durFlicker, delay: r.id * 0.25, repeat: Infinity }}
        />
      ))}
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════
// ☁️  SCENE 5: CLOUDY / FOG — 4 large soft blurred ovals drifting
// ═══════════════════════════════════════════════════════════════════
const CloudyEffect = () => {
  const clouds = useMemo(() => [
    { id: 0, w: 130, h: 44, top: '8%',  from: -40,  to: 300,  dur: 26, op: 0.09 },
    { id: 1, w: 110, h: 38, top: '30%', from: 320,  to: -50,  dur: 32, op: 0.07 },
    { id: 2, w: 150, h: 50, top: '52%', from: -60,  to: 310,  dur: 38, op: 0.11 },
    { id: 3, w: 95,  h: 32, top: '74%', from: 300,  to: -30,  dur: 29, op: 0.06 },
  ], []);

  return clouds.map(c => (
    <motion.div
      key={c.id}
      className="absolute rounded-full bg-white pointer-events-none"
      style={{ width: c.w, height: c.h, top: c.top, opacity: c.op, filter: 'blur(22px)' }}
      animate={{ x: [c.from, c.to] }}
      transition={{ duration: c.dur, repeat: Infinity, repeatType: 'reverse', ease: 'linear' }}
    />
  ));
};

// ═══════════════════════════════════════════════════════════════════
// 💨  SCENE 6: WINDY — Fast horizontal streak-lines rushing L → R
// ═══════════════════════════════════════════════════════════════════
const WindyEffect = () => {
  const streaks = useMemo(() =>
    Array.from({ length: 14 }, (_, i) => ({
      id: i,
      top: `${6 + Math.random() * 88}%`,
      w: 50 + Math.random() * 90,
      dur: 0.9 + Math.random() * 1.4,
      delay: Math.random() * 3,
      peak: 0.06 + Math.random() * 0.14,
    })), []);

  return streaks.map(s => (
    <motion.div
      key={s.id}
      className="absolute bg-white rounded-full pointer-events-none"
      style={{ width: s.w, height: 1.5, top: s.top, left: -120 }}
      animate={{ x: [0, 440], opacity: [0, s.peak, s.peak, 0] }}
      transition={{ duration: s.dur, delay: s.delay, repeat: Infinity, ease: 'linear' }}
    />
  ));
};

// ═══════════════════════════════════════════════════════════════════
// 🎬  SCENE RESOLVER — maps condition string → animation component
// ═══════════════════════════════════════════════════════════════════
const resolveScene = (condition) => {
  if (!condition) return 'clear';
  const c = condition.toLowerCase();
  if (c.includes('snow') || c.includes('winter') || c.includes('ice') || c.includes('blizzard') || c.includes('sleet')) return 'snow';
  if (c.includes('autumn') || c.includes('fall')) return 'autumn';
  if (c.includes('rain') || c.includes('drizzle') || c.includes('shower') || c.includes('storm') || c.includes('thunder')) return 'rain';
  if (c.includes('cloud') || c.includes('overcast') || c.includes('fog') || c.includes('mist') || c.includes('haze') || c.includes('partly')) return 'cloudy';
  if (c.includes('wind') || c.includes('gust') || c.includes('breeze')) return 'windy';
  return 'clear';
};

const WeatherScene = ({ condition }) => {
  const scene = resolveScene(condition);
  const hasThunder = condition?.toLowerCase()?.includes('thunder') || condition?.toLowerCase()?.includes('storm');

  switch (scene) {
    case 'snow':   return <SnowEffect />;
    case 'autumn': return <AutumnEffect />;
    case 'rain':   return <RainEffect isThunder={hasThunder} />;
    case 'cloudy': return <CloudyEffect />;
    case 'windy':  return <WindyEffect />;
    case 'clear':
    default:       return <SunnyEffect />;
  }
};

// ═══════════════════════════════════════════════════════════════════
// ☀️  WeatherCard — Glassmorphic widget with Live Nature Background
// ═══════════════════════════════════════════════════════════════════
// Accepts both individual props (new API) and data/theme (backward compat)
export default function WeatherCard({
  location, temp, condition, date, windSpeed, rainChance, humidity,
  data, theme,
}) {
  // Support both individual props and data-object fallback
  const _location  = location  ?? data?.location  ?? '';
  const _temp      = temp      ?? data?.temp;
  const _condition = condition ?? data?.condition ?? '';
  const _date      = date      ?? data?.date      ?? '';
  const _windSpeed = windSpeed ?? data?.windSpeed  ?? '--';
  const _rainChance = rainChance ?? data?.rainChance ?? '--';
  const _humidity  = humidity  ?? data?.humidity   ?? '--';

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
      className="w-80 bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-5 relative overflow-hidden select-none"
      style={{ boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.55)' }}
      role="region"
      aria-label="Weather card"
    >
      {/* ─── Z-0: Live Nature Background ─── */}
      <div className="absolute inset-0 z-0 overflow-hidden rounded-3xl pointer-events-none">
        <WeatherScene condition={_condition} />
      </div>

      {/* ─── Z-10: Content Layer ─── */}
      <div className="relative z-10">

        {/* ── Top Row: Location + Date ── */}
        <div className="mb-5">
          <h3 className="text-white font-semibold text-base tracking-tight leading-tight">
            {_location}
          </h3>
          {_date && (
            <p className="text-white/35 text-xs mt-0.5 tracking-wide">{_date}</p>
          )}
        </div>

        {/* ── Middle: Massive Temperature + Condition ── */}
        <div className="mb-5">
          <div className="leading-none">
            <span className="text-7xl font-extralight text-white tracking-tighter">
              {_temp ?? '--'}
            </span>
            <span className="text-4xl font-extralight text-white/50">°</span>
          </div>
          <p className="text-white/60 font-medium text-sm mt-2 tracking-wide">
            {_condition}
          </p>
        </div>

        {/* ── Bottom: 3-Column Stats Grid ── */}
        <div className="border-t border-white/10 pt-3.5 grid grid-cols-3">
          {/* Wind */}
          <div className="flex flex-col items-center gap-1">
            <Wind className="w-4 h-4 text-white/35" strokeWidth={1.5} />
            <span className="text-white/35 text-[10px] leading-none">Wind</span>
            <span className="text-white font-medium text-xs leading-none">{_windSpeed}</span>
          </div>

          {/* Rain */}
          <div className="flex flex-col items-center gap-1 border-l border-white/10">
            <CloudRain className="w-4 h-4 text-white/35" strokeWidth={1.5} />
            <span className="text-white/35 text-[10px] leading-none">Rain</span>
            <span className="text-white font-medium text-xs leading-none">{_rainChance}</span>
          </div>

          {/* Humidity */}
          <div className="flex flex-col items-center gap-1 border-l border-white/10">
            <Droplets className="w-4 h-4 text-white/35" strokeWidth={1.5} />
            <span className="text-white/35 text-[10px] leading-none">Humidity</span>
            <span className="text-white font-medium text-xs leading-none">{_humidity}</span>
          </div>
        </div>

      </div>
    </motion.div>
  );
}