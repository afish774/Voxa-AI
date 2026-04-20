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
      peak: 0.4 + Math.random() * 0.5,
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
        background: 'rgba(255,255,255,0.9)',
        boxShadow: '0 0 8px rgba(255,255,255,0.6)',
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
      size: 8 + Math.random() * 8,
      dur: 5 + Math.random() * 7,
      delay: Math.random() * 6,
      spin: 120 + Math.random() * 400,
      swayAmp: 15 + Math.random() * 20,
    })), []);

  return leaves.map(l => (
    <motion.div
      key={l.id}
      className="absolute drop-shadow-md"
      style={{ left: l.left, top: -20 }}
      animate={{
        y: [0, 400],
        x: [-l.swayAmp, l.swayAmp, -l.swayAmp * 0.6, l.swayAmp * 0.8, -l.swayAmp],
        rotate: [0, l.spin],
        opacity: [0, 0.9, 0.9, 0],
      }}
      transition={{ duration: l.dur, delay: l.delay, repeat: Infinity, ease: 'easeIn' }}
    >
      <svg width={l.size} height={l.size * 1.4} viewBox="0 0 10 14" aria-hidden="true">
        <path d="M5 0 C8 3 10 7 5 14 C0 7 2 3 5 0Z" fill={l.color} />
        <line x1="5" y1="2" x2="5" y2="12" stroke="rgba(0,0,0,0.2)" strokeWidth={0.5} />
      </svg>
    </motion.div>
  ));
};

// ═══════════════════════════════════════════════════════════════════
// 🌧️  SCENE 3: RAINSTORM — Fast vertical streaks + lightning flash
// ═══════════════════════════════════════════════════════════════════
const RainEffect = ({ isThunder }) => {
  const drops = useMemo(() =>
    Array.from({ length: 35 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      h: 20 + Math.random() * 30,
      dur: 0.25 + Math.random() * 0.3,
      delay: Math.random() * 2,
      peak: 0.3 + Math.random() * 0.4,
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
            top: -40,
            borderRadius: 2,
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.8), rgba(255,255,255,0.1), transparent)',
          }}
          animate={{ y: [0, 450], opacity: [0, d.peak, d.peak, 0] }}
          transition={{ duration: d.dur, delay: d.delay, repeat: Infinity, ease: 'linear' }}
        />
      ))}
      {isThunder && (
        <motion.div
          className="absolute inset-0 bg-[#E2E8F0] pointer-events-none mix-blend-overlay"
          animate={{ opacity: [0, 0, 0, 0.8, 0, 0, 0, 0, 0, 0.5, 0, 0, 0, 0, 0, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeOut' }}
        />
      )}
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 💨  SCENE 4: WINDY — Fast horizontal streak-lines
// ═══════════════════════════════════════════════════════════════════
const WindyEffect = () => {
  const streaks = useMemo(() =>
    Array.from({ length: 16 }, (_, i) => ({
      id: i,
      top: `${10 + Math.random() * 80}%`,
      w: 60 + Math.random() * 120,
      dur: 0.7 + Math.random() * 1.2,
      delay: Math.random() * 3,
      peak: 0.1 + Math.random() * 0.2,
    })), []);

  return streaks.map(s => (
    <motion.div
      key={s.id}
      className="absolute bg-white rounded-full pointer-events-none"
      style={{ width: s.w, height: 2, top: s.top, left: -150, filter: 'blur(1px)' }}
      animate={{ x: [0, 500], opacity: [0, s.peak, s.peak, 0] }}
      transition={{ duration: s.dur, delay: s.delay, repeat: Infinity, ease: 'linear' }}
    />
  ));
};

// ═══════════════════════════════════════════════════════════════════
// 🎬  SCENE RESOLVER — Maps condition to HD Image & Particle Effect
// ═══════════════════════════════════════════════════════════════════
const resolveWeatherState = (condition) => {
  if (!condition) return { scene: 'clear', bg: 'https://images.unsplash.com/photo-1622278647429-71bc97e904e8?q=80&w=800&auto=format&fit=crop' };
  const c = condition.toLowerCase();

  if (c.includes('snow') || c.includes('ice') || c.includes('blizzard'))
    return { scene: 'snow', bg: 'https://images.unsplash.com/photo-1483664852095-d6cc6870702d?q=80&w=800&auto=format&fit=crop' };
  if (c.includes('autumn') || c.includes('fall'))
    return { scene: 'autumn', bg: 'https://images.unsplash.com/photo-1477414348463-c0eb7f1359b6?q=80&w=800&auto=format&fit=crop' };
  if (c.includes('thunder') || c.includes('storm'))
    return { scene: 'rain', isThunder: true, bg: 'https://images.unsplash.com/photo-1605727216801-e27ce1d0ce49?q=80&w=800&auto=format&fit=crop' };
  if (c.includes('rain') || c.includes('drizzle') || c.includes('shower'))
    return { scene: 'rain', isThunder: false, bg: 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?q=80&w=800&auto=format&fit=crop' };
  if (c.includes('cloud') || c.includes('overcast') || c.includes('fog'))
    return { scene: 'cloudy', bg: 'https://images.unsplash.com/photo-1534088568595-a066f410cbda?q=80&w=800&auto=format&fit=crop' };
  if (c.includes('wind') || c.includes('gust'))
    return { scene: 'windy', bg: 'https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?q=80&w=800&auto=format&fit=crop' };

  return { scene: 'clear', bg: 'https://images.unsplash.com/photo-1590274853856-f22d5ee3d228?q=80&w=800&auto=format&fit=crop' };
};

const ParticleLayer = ({ state }) => {
  switch (state.scene) {
    case 'snow': return <SnowEffect />;
    case 'autumn': return <AutumnEffect />;
    case 'rain': return <RainEffect isThunder={state.isThunder} />;
    case 'windy': return <WindyEffect />;
    default: return null; // Clear/Cloudy just rely on the HD image
  }
};

// ═══════════════════════════════════════════════════════════════════
// 🎨  PREMIUM VECTOR ICONS (Replaces flat native emojis)
// ═══════════════════════════════════════════════════════════════════

const PremiumSun = () => (
  <motion.svg width="72" height="72" viewBox="0 0 100 100" className="drop-shadow-2xl">
    <defs>
      <linearGradient id="sunGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FDE047" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
    </defs>
    <motion.circle cx="50" cy="50" r="22" fill="url(#sunGrad)" />
    <motion.g animate={{ rotate: 360 }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }} style={{ originX: '50px', originY: '50px' }}>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
        <line key={i} x1="50" y1="12" x2="50" y2="4" stroke="url(#sunGrad)" strokeWidth="5" strokeLinecap="round" transform={`rotate(${angle} 50 50)`} />
      ))}
    </motion.g>
  </motion.svg>
);

const PremiumCloud = () => (
  <motion.svg width="80" height="80" viewBox="0 0 100 100" className="drop-shadow-2xl">
    <defs>
      <linearGradient id="cloudGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#E2E8F0" />
      </linearGradient>
    </defs>
    <motion.path
      d="M 25 65 A 15 15 0 0 1 25 35 A 22 22 0 0 1 65 30 A 18 18 0 0 1 75 65 Z"
      fill="url(#cloudGrad)"
      animate={{ y: [-2, 2, -2] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    />
  </motion.svg>
);

const PremiumRain = () => (
  <motion.svg width="80" height="80" viewBox="0 0 100 100" className="drop-shadow-2xl">
    <defs>
      <linearGradient id="cloudDark" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#F1F5F9" />
        <stop offset="100%" stopColor="#94A3B8" />
      </linearGradient>
    </defs>
    <motion.path
      d="M 25 55 A 15 15 0 0 1 25 25 A 22 22 0 0 1 65 20 A 18 18 0 0 1 75 55 Z"
      fill="url(#cloudDark)"
      animate={{ y: [-2, 2, -2] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    />
    {[35, 45, 55, 65].map((x, i) => (
      <motion.line
        key={i} x1={x} y1="60" x2={x - 5} y2="75"
        stroke="#60A5FA" strokeWidth="3" strokeLinecap="round"
        animate={{ y: [0, 10, 0], opacity: [0, 1, 0] }}
        transition={{ duration: 0.8, delay: i * 0.2, repeat: Infinity, ease: "linear" }}
      />
    ))}
  </motion.svg>
);

const PremiumSnow = () => (
  <motion.svg width="80" height="80" viewBox="0 0 100 100" className="drop-shadow-2xl">
    <defs>
      <linearGradient id="cloudCold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#CBD5E1" />
      </linearGradient>
    </defs>
    <motion.path
      d="M 25 55 A 15 15 0 0 1 25 25 A 22 22 0 0 1 65 20 A 18 18 0 0 1 75 55 Z"
      fill="url(#cloudCold)"
    />
    {[35, 50, 65].map((x, i) => (
      <motion.g key={i} animate={{ rotate: 360, y: [0, 15, 0], opacity: [0, 1, 0] }} transition={{ duration: 3, delay: i * 0.5, repeat: Infinity, ease: "linear" }} style={{ originX: `${x}px`, originY: '65px' }}>
        <line x1={x} y1="60" x2={x} y2="70" stroke="#BAE6FD" strokeWidth="2" strokeLinecap="round" />
        <line x1={x - 4} y1="65" x2={x + 4} y2="65" stroke="#BAE6FD" strokeWidth="2" strokeLinecap="round" />
        <line x1={x - 3} y1="62" x2={x + 3} y2="68" stroke="#BAE6FD" strokeWidth="2" strokeLinecap="round" />
        <line x1={x - 3} y1="68" x2={x + 3} y2="62" stroke="#BAE6FD" strokeWidth="2" strokeLinecap="round" />
      </motion.g>
    ))}
  </motion.svg>
);

const VectorIconResolver = ({ condition }) => {
  if (!condition) return <PremiumSun />;
  const c = condition.toLowerCase();
  if (c.includes('snow') || c.includes('ice')) return <PremiumSnow />;
  if (c.includes('rain') || c.includes('storm') || c.includes('drizzle')) return <PremiumRain />;
  if (c.includes('cloud') || c.includes('overcast') || c.includes('fog')) return <PremiumCloud />;
  return <PremiumSun />;
};

// ═══════════════════════════════════════════════════════════════════
// ☀️  WeatherCard — Premium HD Nature OS Widget
// ═══════════════════════════════════════════════════════════════════
export default function WeatherCard({
  location, temp, condition, date, windSpeed, rainChance, humidity,
  data, theme,
}) {
  const _location = location ?? data?.location ?? '';
  const _temp = temp ?? data?.temp;
  const _condition = condition ?? data?.condition ?? '';
  const _date = date ?? data?.date ?? '';
  const _windSpeed = windSpeed ?? data?.windSpeed ?? '--';
  const _rainChance = rainChance ?? data?.rainChance ?? '--';
  const _humidity = humidity ?? data?.humidity ?? '--';

  const weatherState = useMemo(() => resolveWeatherState(_condition), [_condition]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 28, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      className="w-full max-w-[380px] rounded-[36px] p-6 relative overflow-hidden select-none"
      style={{
        boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
      role="region"
      aria-label="Weather card"
    >
      {/* ─── Z-0: 4K HD Ken Burns Background ─── */}
      <motion.div
        className="absolute inset-0 z-0 pointer-events-none origin-center"
        style={{
          backgroundImage: `url(${weatherState.bg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* ─── Z-1: Dark Vignette Overlay (Guarantees text readability) ─── */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.85) 100%)',
        }}
      />

      {/* ─── Z-2: 3D Depth Particle Layer (Rains *over* the photo) ─── */}
      <div className="absolute inset-0 z-[2] overflow-hidden rounded-3xl pointer-events-none">
        <ParticleLayer state={weatherState} />
      </div>

      {/* ─── Z-10: Content Layer ─── */}
      <div className="relative z-10 flex flex-col h-[260px] justify-between">

        {/* ── Top Row: Location + Date ── */}
        <div>
          <h3 className="text-[#FFFFFF] font-semibold text-[20px] tracking-tight leading-tight drop-shadow-md">
            {_location}
          </h3>
          {_date && (
            <p className="text-[#E2E8F0] text-[12px] mt-1 tracking-wide font-medium uppercase drop-shadow-sm">
              {_date}
            </p>
          )}
        </div>

        {/* ── Center: Vector SVG + Temperature + Condition ── */}
        <div className="flex items-center gap-4 mt-auto mb-6">
          <motion.div
            className="flex-shrink-0 drop-shadow-2xl"
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.15 }}
          >
            <VectorIconResolver condition={_condition} />
          </motion.div>

          <div className="flex flex-col drop-shadow-lg">
            <div className="leading-none flex items-start">
              <span className="text-[72px] font-light text-[#FFFFFF] tracking-tighter drop-shadow-lg">
                {_temp ?? '--'}
              </span>
              <span className="text-[32px] font-light text-[#E2E8F0] mt-3">°</span>
            </div>
            <p className="text-[#F8FAFC] font-medium text-[16px] mt-1 tracking-wide capitalize">
              {_condition}
            </p>
          </div>
        </div>

        {/* ── Bottom: Glassmorphic 3-Column Stats Grid ── */}
        <div
          className="pt-4 grid grid-cols-3 rounded-2xl backdrop-blur-md bg-white/5 border border-white/10"
          style={{ paddingBottom: '16px' }}
        >
          {/* Wind */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 shadow-inner">
              <Wind className="w-4 h-4 text-[#F1F5F9]" strokeWidth={2} />
            </div>
            <span className="text-[#CBD5E1] text-[10px] leading-none font-bold uppercase tracking-widest">Wind</span>
            <span className="text-[#FFFFFF] font-semibold text-[13px] leading-none drop-shadow-sm">{_windSpeed}</span>
          </div>

          {/* Rain */}
          <div className="flex flex-col items-center gap-2 border-x border-white/10">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 shadow-inner">
              <CloudRain className="w-4 h-4 text-[#F1F5F9]" strokeWidth={2} />
            </div>
            <span className="text-[#CBD5E1] text-[10px] leading-none font-bold uppercase tracking-widest">Rain</span>
            <span className="text-[#FFFFFF] font-semibold text-[13px] leading-none drop-shadow-sm">{_rainChance}</span>
          </div>

          {/* Humidity */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 shadow-inner">
              <Droplets className="w-4 h-4 text-[#F1F5F9]" strokeWidth={2} />
            </div>
            <span className="text-[#CBD5E1] text-[10px] leading-none font-bold uppercase tracking-widest">Humid</span>
            <span className="text-[#FFFFFF] font-semibold text-[13px] leading-none drop-shadow-sm">{_humidity}</span>
          </div>
        </div>

      </div>
    </motion.div>
  );
}