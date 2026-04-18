import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { Wind, CloudRain, Droplets, RefreshCw } from 'lucide-react';

// ─── Weather Emoji Mapper ──────────────────────────────────────────
const getWeatherEmoji = (condition) => {
  if (!condition) return '🌡️';
  if (condition === 'Light Rain' || condition === 'Rain') return '🌦️';
  if (condition === 'Sunny' || condition === 'Clear') return '☀️';
  if (condition === 'Cloudy') return '☁️';
  if (condition === 'Snow') return '❄️';
  if (condition === 'Thunderstorm') return '⛈️';
  if (condition === 'Windy') return '🌬️';
  if (condition === 'Fog' || condition === 'Mist') return '🌫️';
  if (condition === 'Partly Cloudy') return '⛅';
  return '🌡️';
};

// ─── Condition-Based Background Gradient ───────────────────────────
// Every return value is a complete, hardcoded Tailwind class string (Rule A)
const getConditionBackground = (condition) => {
  if (condition === 'Light Rain' || condition === 'Rain')
    return 'bg-gradient-to-b from-slate-700/80 to-slate-900/95';
  if (condition === 'Sunny' || condition === 'Clear')
    return 'bg-gradient-to-b from-amber-800/50 to-zinc-900/95';
  if (condition === 'Cloudy')
    return 'bg-gradient-to-b from-zinc-600/60 to-zinc-900/95';
  if (condition === 'Snow')
    return 'bg-gradient-to-b from-blue-800/40 to-slate-900/95';
  if (condition === 'Thunderstorm')
    return 'bg-gradient-to-b from-purple-900/60 to-zinc-950/95';
  if (condition === 'Windy')
    return 'bg-gradient-to-b from-teal-800/40 to-zinc-900/95';
  if (condition === 'Fog' || condition === 'Mist')
    return 'bg-gradient-to-b from-gray-600/50 to-gray-900/95';
  if (condition === 'Partly Cloudy')
    return 'bg-gradient-to-b from-blue-800/30 to-zinc-900/95';
  return 'bg-gradient-to-b from-zinc-700/80 to-zinc-900/95';
};

// ─── WeatherCard Component ─────────────────────────────────────────
// Accepts both individual props (new API) and data/theme (backward compat)
export default function WeatherCard({
  location, temp, condition, date, windSpeed, rainChance, humidity,
  data, theme,
}) {
  // Support both individual props and data-object fallback
  const _location = location ?? data?.location ?? '';
  const _temp = temp ?? data?.temp;
  const _condition = condition ?? data?.condition ?? '';
  const _date = date ?? data?.date ?? '';
  const _windSpeed = windSpeed ?? data?.windSpeed ?? '--';
  const _rainChance = rainChance ?? data?.rainChance ?? '--';
  const _humidity = humidity ?? data?.humidity ?? '--';

  // ─── 3D Tilt — Rule B: getBoundingClientRect on card ref ─────────
  const ref = useRef(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springConfig = { stiffness: 300, damping: 30 };
  const springRotateX = useSpring(rotateX, springConfig);
  const springRotateY = useSpring(rotateY, springConfig);

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // Map to ±15 degrees
    rotateX.set(((y / rect.height) - 0.5) * -30);
    rotateY.set(((x / rect.width) - 0.5) * 30);
  };

  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  const bgClass = getConditionBackground(_condition);
  const emoji = getWeatherEmoji(_condition);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        rotateX: springRotateX,
        rotateY: springRotateY,
        transformPerspective: 1000,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      // bgClass is a complete Tailwind string from getConditionBackground — safe for JIT
      className={[
        bgClass,
        'backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative overflow-hidden',
        'w-full max-w-md cursor-grab select-none',
      ].join(' ')}
      role="region"
      aria-label="Weather card"
    >
      {/* ─── Top Bar ─── */}
      <div className="relative text-center mb-1">
        <h3 className="text-white font-semibold text-lg">{_location}</h3>
        <RefreshCw className="absolute top-0 right-0 w-4 h-4 text-white/30" />
      </div>

      {/* ─── Temperature ─── */}
      <div className="text-center my-2">
        <span className="text-8xl font-thin text-white tracking-tight leading-none">
          {_temp ?? '--'}°
        </span>
      </div>

      {/* ─── Weather Emoji Icon ─── */}
      <div className="text-center my-3">
        <span
          className="text-8xl leading-none inline-block"
          style={{ filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.4))' }}
        >
          {emoji}
        </span>
      </div>

      {/* ─── Condition + Date ─── */}
      <div className="text-center mb-2">
        <p className="text-white font-medium text-xl">{_condition}</p>
        {_date && <p className="text-white/50 text-sm mt-0.5">{_date}</p>}
      </div>

      {/* ─── Bottom Stats Row (3 columns) ─── */}
      <div className="border-t border-white/10 mt-4 pt-4 grid grid-cols-3">
        {/* Wind speed */}
        <div className="flex flex-col items-center">
          <Wind className="w-5 h-5 text-white/60" />
          <span className="text-white/40 text-xs mt-1">Wind speed</span>
          <span className="text-white font-medium text-sm">{_windSpeed}</span>
        </div>

        {/* Chance of rain */}
        <div className="flex flex-col items-center border-l border-white/10">
          <CloudRain className="w-5 h-5 text-white/60" />
          <span className="text-white/40 text-xs mt-1">Chance of rain</span>
          <span className="text-white font-medium text-sm">{_rainChance}</span>
        </div>

        {/* Humidity */}
        <div className="flex flex-col items-center border-l border-white/10">
          <Droplets className="w-5 h-5 text-white/60" />
          <span className="text-white/40 text-xs mt-1">Humidity</span>
          <span className="text-white font-medium text-sm">{_humidity}</span>
        </div>
      </div>
    </motion.div>
  );
}