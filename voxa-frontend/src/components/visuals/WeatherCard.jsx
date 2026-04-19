import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Wind, CloudRain, Droplets } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════
// 🌨️  SCENE 1: SNOWFALL — Soft, slow-falling white circles with drift
// ═══════════════════════════════════════════════════════════════════
const SnowEffect = () => {
  const flakes = useMemo(() =>
    Array.from({ length: 24 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: 2 + Math.random() * 4,
      dur: 6 + Math.random() * 8,
      delay: Math.random() * 8,
      drift: 15 + Math.random() * 25,
      peak: 0.25 + Math.random() * 0.45,
    })), []);

  return flakes.map(f => (
    <motion.div
      key={f.id}
      className="absolute rounded-full"
      style={{
        width: f.size,
        height: f.size,
        left: f.left,
        top: -10,
        background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(200,220,255,0.3) 100%)',
        boxShadow: '0 0 4px rgba(255,255,255,0.4)',
      }}
      animate={{
        y: [0, 380],
        x: [-f.drift, f.drift, -f.drift],
        opacity: [0, f.peak, f.peak, 0],
      }}
      transition={{ duration: f.dur, delay: f.delay, repeat: Infinity, ease: 'linear' }}
    />
  ));
};

// ═══════════════════════════════════════════════════════════════════
// 🍂  SCENE 2: AUTUMN LEAVES — Swaying orange/brown leaf SVGs tumbling
// ═══════════════════════════════════════════════════════════════════
const AutumnEffect = () => {
  const PALETTE = ['#D97706', '#B45309', '#92400E', '#DC2626', '#F59E0B', '#CA8A04'];
  const leaves = useMemo(() =>
    Array.from({ length: 14 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      color: PALETTE[i % PALETTE.length],
      size: 7 + Math.random() * 6,
      dur: 5 + Math.random() * 7,
      delay: Math.random() * 6,
      spin: 120 + Math.random() * 400,
      swayAmp: 12 + Math.random() * 18,
    })), []);

  return leaves.map(l => (
    <motion.div
      key={l.id}
      className="absolute"
      style={{ left: l.left, top: -16 }}
      animate={{
        y: [0, 400],
        x: [-l.swayAmp, l.swayAmp, -l.swayAmp * 0.6, l.swayAmp * 0.8, -l.swayAmp],
        rotate: [0, l.spin],
        opacity: [0, 0.7, 0.7, 0],
      }}
      transition={{ duration: l.dur, delay: l.delay, repeat: Infinity, ease: 'easeIn' }}
    >
      <svg width={l.size} height={l.size * 1.4} viewBox="0 0 10 14" aria-hidden="true">
        <path d="M5 0 C8 3 10 7 5 14 C0 7 2 3 5 0Z" fill={l.color} opacity={0.8} />
        <line x1="5" y1="2" x2="5" y2="12" stroke={l.color} strokeWidth={0.5} opacity={0.4} />
      </svg>
    </motion.div>
  ));
};

// ═══════════════════════════════════════════════════════════════════
// 🌧️  SCENE 3: RAINSTORM — Fast blue vertical streaks + lightning flash
// ═══════════════════════════════════════════════════════════════════
const RainEffect = ({ isThunder }) => {
  const drops = useMemo(() =>
    Array.from({ length: 28 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      h: 16 + Math.random() * 24,
      dur: 0.3 + Math.random() * 0.4,
      delay: Math.random() * 2.5,
      peak: 0.2 + Math.random() * 0.35,
    })), []);

  return (
    <>
      {drops.map(d => (
        <motion.div
          key={d.id}
          className="absolute"
          style={{
            width: 1.5,
            height: d.h,
            left: d.left,
            top: -24,
            borderRadius: 1,
            background: 'linear-gradient(to bottom, rgba(96,165,250,0.7), rgba(59,130,246,0.15), transparent)',
          }}
          animate={{ y: [0, 400], opacity: [0, d.peak, d.peak, 0] }}
          transition={{ duration: d.dur, delay: d.delay, repeat: Infinity, ease: 'linear' }}
        />
      ))}
      {isThunder && (
        <motion.div
          className="absolute inset-0 rounded-3xl bg-white/80 pointer-events-none"
          animate={{ opacity: [0, 0, 0, 0.6, 0, 0, 0, 0, 0, 0.4, 0, 0, 0, 0, 0, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeOut' }}
        />
      )}
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════
// ☀️  SCENE 4: SUNNY — Massive pulsing amber radial glow that breathes
// ═══════════════════════════════════════════════════════════════════
const SunnyEffect = () => (
  <>
    {/* Outer breathing glow */}
    <motion.div
      className="absolute pointer-events-none"
      style={{
        top: '-30%',
        right: '-20%',
        width: '80%',
        height: '80%',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(251,191,36,0.30) 0%, rgba(245,158,11,0.10) 45%, transparent 70%)',
      }}
      animate={{ scale: [1, 1.25, 1], opacity: [0.6, 1, 0.6] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    />
    {/* Inner warm core */}
    <motion.div
      className="absolute pointer-events-none"
      style={{
        top: '-10%',
        right: '-5%',
        width: '50%',
        height: '50%',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(251,191,36,0.45) 0%, rgba(253,224,71,0.12) 50%, transparent 75%)',
      }}
      animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
    />
    {/* Ambient warmth spread */}
    <motion.div
      className="absolute pointer-events-none"
      style={{
        bottom: '-20%',
        left: '-10%',
        width: '60%',
        height: '60%',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(251,146,60,0.12) 0%, transparent 65%)',
      }}
      animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.7, 0.4] }}
      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
    />
  </>
);

// ═══════════════════════════════════════════════════════════════════
// ☁️  SCENE 5: CLOUDY / FOG — Soft blurred ovals drifting across
// ═══════════════════════════════════════════════════════════════════
const CloudyEffect = () => {
  const clouds = useMemo(() => [
    { id: 0, w: 140, h: 48, top: '6%',  from: -50,  to: 320,  dur: 24, op: 0.10 },
    { id: 1, w: 120, h: 40, top: '28%', from: 340,  to: -60,  dur: 30, op: 0.08 },
    { id: 2, w: 160, h: 54, top: '50%', from: -70,  to: 330,  dur: 36, op: 0.12 },
    { id: 3, w: 100, h: 34, top: '72%', from: 310,  to: -40,  dur: 28, op: 0.07 },
  ], []);

  return clouds.map(c => (
    <motion.div
      key={c.id}
      className="absolute rounded-full bg-white pointer-events-none"
      style={{ width: c.w, height: c.h, top: c.top, opacity: c.op, filter: 'blur(24px)' }}
      animate={{ x: [c.from, c.to] }}
      transition={{ duration: c.dur, repeat: Infinity, repeatType: 'reverse', ease: 'linear' }}
    />
  ));
};

// ═══════════════════════════════════════════════════════════════════
// 💨  SCENE 6: WINDY — Horizontal streak-lines
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
// 🎬  SCENE RESOLVER — maps condition → animation
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
// 🎨  3D ANIMATED WEATHER ICON — Claymorphic emoji with Framer Motion
// ═══════════════════════════════════════════════════════════════════

const SunIcon3D = () => (
  <motion.div
    className="relative flex items-center justify-center"
    style={{ width: 80, height: 80 }}
  >
    {/* Ambient glow behind sun */}
    <motion.div
      className="absolute rounded-full"
      style={{
        width: 72,
        height: 72,
        background: 'radial-gradient(circle, rgba(251,191,36,0.40) 0%, rgba(253,224,71,0.10) 60%, transparent 80%)',
        filter: 'blur(8px)',
      }}
      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    />
    {/* Rotating 3D sun emoji */}
    <motion.span
      className="relative z-10"
      style={{
        fontSize: 56,
        display: 'inline-block',
        filter: 'drop-shadow(0 6px 16px rgba(251,191,36,0.50)) drop-shadow(0 2px 4px rgba(0,0,0,0.20))',
      }}
      animate={{ rotate: 360 }}
      transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
    >
      ☀️
    </motion.span>
  </motion.div>
);

const CloudIcon3D = () => (
  <motion.div
    className="relative flex items-center justify-center"
    style={{ width: 80, height: 80 }}
  >
    <motion.span
      className="relative z-10"
      style={{
        fontSize: 56,
        display: 'inline-block',
        filter: 'drop-shadow(0 8px 20px rgba(148,163,184,0.50)) drop-shadow(0 2px 6px rgba(0,0,0,0.15))',
      }}
      animate={{
        y: [-4, 4, -4],
        x: [-2, 2, -2],
      }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    >
      ☁️
    </motion.span>
  </motion.div>
);

const RainIcon3D = () => (
  <motion.div
    className="relative flex items-center justify-center"
    style={{ width: 80, height: 90 }}
  >
    {/* Floating cloud */}
    <motion.span
      className="relative z-10"
      style={{
        fontSize: 48,
        display: 'inline-block',
        filter: 'drop-shadow(0 6px 18px rgba(100,116,139,0.50)) drop-shadow(0 2px 4px rgba(0,0,0,0.20))',
      }}
      animate={{ y: [-3, 3, -3], x: [-1, 1, -1] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      🌧️
    </motion.span>
    {/* Tiny rain drops falling underneath */}
    {[0, 1, 2, 3, 4].map(i => (
      <motion.div
        key={i}
        className="absolute rounded-full"
        style={{
          width: 2,
          height: 8 + i * 2,
          bottom: 4,
          left: 18 + i * 10,
          background: 'linear-gradient(to bottom, rgba(96,165,250,0.7), rgba(59,130,246,0.2))',
          borderRadius: 2,
        }}
        animate={{
          y: [0, 18, 0],
          opacity: [0, 0.8, 0],
        }}
        transition={{
          duration: 0.8 + i * 0.15,
          delay: i * 0.18,
          repeat: Infinity,
          ease: 'easeIn',
        }}
      />
    ))}
  </motion.div>
);

const SnowIcon3D = () => (
  <motion.div
    className="relative flex items-center justify-center"
    style={{ width: 80, height: 80 }}
  >
    {/* Frost glow */}
    <motion.div
      className="absolute rounded-full"
      style={{
        width: 64,
        height: 64,
        background: 'radial-gradient(circle, rgba(186,230,253,0.30) 0%, transparent 70%)',
        filter: 'blur(6px)',
      }}
      animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
    />
    {/* Slowly spinning + bobbing snowflake */}
    <motion.span
      className="relative z-10"
      style={{
        fontSize: 56,
        display: 'inline-block',
        filter: 'drop-shadow(0 6px 16px rgba(186,230,253,0.55)) drop-shadow(0 2px 4px rgba(0,0,0,0.15))',
      }}
      animate={{
        rotate: 360,
        y: [-3, 3, -3],
      }}
      transition={{
        rotate: { duration: 16, repeat: Infinity, ease: 'linear' },
        y: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
      }}
    >
      ❄️
    </motion.span>
  </motion.div>
);

const FogIcon3D = () => (
  <motion.div
    className="relative flex items-center justify-center"
    style={{ width: 80, height: 80 }}
  >
    <motion.span
      className="relative z-10"
      style={{
        fontSize: 56,
        display: 'inline-block',
        filter: 'drop-shadow(0 6px 18px rgba(148,163,184,0.45)) drop-shadow(0 2px 4px rgba(0,0,0,0.12))',
      }}
      animate={{
        y: [-3, 3, -3],
        x: [-3, 3, -3],
        opacity: [0.7, 1, 0.7],
      }}
      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
    >
      🌫️
    </motion.span>
  </motion.div>
);

const WindIcon3D = () => (
  <motion.div
    className="relative flex items-center justify-center"
    style={{ width: 80, height: 80 }}
  >
    <motion.span
      className="relative z-10"
      style={{
        fontSize: 56,
        display: 'inline-block',
        filter: 'drop-shadow(0 6px 14px rgba(148,163,184,0.40)) drop-shadow(0 2px 4px rgba(0,0,0,0.15))',
      }}
      animate={{ x: [-5, 5, -5], rotate: [-5, 5, -5] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      💨
    </motion.span>
  </motion.div>
);

// ═══════════════════════════════════════════════════════════════════
// 🎯  3D ICON RESOLVER — maps condition → animated 3D icon
// ═══════════════════════════════════════════════════════════════════
const WeatherIcon3D = ({ condition }) => {
  const scene = resolveScene(condition);
  switch (scene) {
    case 'snow':   return <SnowIcon3D />;
    case 'rain':   return <RainIcon3D />;
    case 'cloudy':
      if (condition?.toLowerCase()?.includes('fog') || condition?.toLowerCase()?.includes('mist') || condition?.toLowerCase()?.includes('haze'))
        return <FogIcon3D />;
      return <CloudIcon3D />;
    case 'windy':  return <WindIcon3D />;
    case 'autumn': return <CloudIcon3D />;
    case 'clear':
    default:       return <SunIcon3D />;
  }
};

// ═══════════════════════════════════════════════════════════════════
// ☀️  WeatherCard — Premium Apple visionOS Glassmorphic Widget
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
      initial={{ opacity: 0, y: 28, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      className="w-80 rounded-3xl p-5 relative overflow-hidden select-none"
      style={{
        background: 'rgba(0, 0, 0, 0.40)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
      }}
      role="region"
      aria-label="Weather card"
    >
      {/* ─── Z-0: Live Nature Background ─── */}
      <div className="absolute inset-0 z-0 overflow-hidden rounded-3xl pointer-events-none">
        <WeatherScene condition={_condition} />
      </div>

      {/* ─── Glassmorphic inner highlight edge ─── */}
      <div
        className="absolute inset-0 rounded-3xl pointer-events-none z-[1]"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%, rgba(255,255,255,0.02) 100%)',
        }}
      />

      {/* ─── Z-10: Content Layer ─── */}
      <div className="relative z-10">

        {/* ── Top Row: Location + Date ── */}
        <div className="mb-4">
          <h3 className="text-white font-semibold text-base tracking-tight leading-tight">
            {_location}
          </h3>
          {_date && (
            <p className="text-white/30 text-[11px] mt-0.5 tracking-wide font-medium uppercase">
              {_date}
            </p>
          )}
        </div>

        {/* ── Center: 3D Icon + Temperature + Condition ── */}
        <div className="flex items-center gap-3 mb-5">
          {/* 3D Animated Weather Icon */}
          <motion.div
            className="flex-shrink-0"
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.15 }}
          >
            <WeatherIcon3D condition={_condition} />
          </motion.div>

          {/* Temperature & Condition text */}
          <div className="flex flex-col">
            <div className="leading-none">
              <span className="text-6xl font-extralight text-white tracking-tighter">
                {_temp ?? '--'}
              </span>
              <span className="text-3xl font-extralight text-white/40">°</span>
            </div>
            <p className="text-white/55 font-medium text-sm mt-1.5 tracking-wide">
              {_condition}
            </p>
          </div>
        </div>

        {/* ── Bottom: 3-Column Stats Grid ── */}
        <div
          className="pt-3.5 grid grid-cols-3"
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          {/* Wind */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <Wind className="w-3.5 h-3.5 text-white/40" strokeWidth={1.5} />
            </div>
            <span className="text-white/30 text-[10px] leading-none font-medium uppercase tracking-wider">Wind</span>
            <span className="text-white font-semibold text-xs leading-none">{_windSpeed}</span>
          </div>

          {/* Rain */}
          <div className="flex flex-col items-center gap-1.5" style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <CloudRain className="w-3.5 h-3.5 text-white/40" strokeWidth={1.5} />
            </div>
            <span className="text-white/30 text-[10px] leading-none font-medium uppercase tracking-wider">Rain</span>
            <span className="text-white font-semibold text-xs leading-none">{_rainChance}</span>
          </div>

          {/* Humidity */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <Droplets className="w-3.5 h-3.5 text-white/40" strokeWidth={1.5} />
            </div>
            <span className="text-white/30 text-[10px] leading-none font-medium uppercase tracking-wider">Humidity</span>
            <span className="text-white font-semibold text-xs leading-none">{_humidity}</span>
          </div>
        </div>

      </div>
    </motion.div>
  );
}