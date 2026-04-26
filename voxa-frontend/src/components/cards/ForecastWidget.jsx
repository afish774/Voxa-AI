import React from 'react';
import { motion } from 'framer-motion';
import { Cloud, CloudRain, CloudSnow, Sun, CloudLightning, Wind, Droplets, ThermometerSun, MapPin } from 'lucide-react';

// ============================================================================
// 🌤️ ForecastWidget — 7-Day Weather Forecast Card
// ============================================================================
// Payload shape (from get_weather_forecast tool):
//   location        — "Mumbai"
//   countryCode     — "IN"
//   timezone        — "Asia/Kolkata"
//   currentTemp     — 32
//   currentCondition — "Partly Cloudy"
//   days: [{ day, date, high, low, condition, rain, uv, windMax }]
// ============================================================================

const getConditionIcon = (condition, size = 'w-5 h-5') => {
  const c = (condition || '').toLowerCase();
  if (c.includes('thunder') || c.includes('storm')) return <CloudLightning className={`${size} text-yellow-400`} />;
  if (c.includes('snow') || c.includes('sleet')) return <CloudSnow className={`${size} text-blue-200`} />;
  if (c.includes('rain') || c.includes('drizzle') || c.includes('shower')) return <CloudRain className={`${size} text-blue-400`} />;
  if (c.includes('cloud') || c.includes('overcast') || c.includes('fog')) return <Cloud className={`${size} text-gray-400`} />;
  return <Sun className={`${size} text-amber-400`} />;
};

const getConditionGradient = (condition) => {
  const c = (condition || '').toLowerCase();
  if (c.includes('thunder')) return 'from-yellow-500/10 to-purple-500/5';
  if (c.includes('rain') || c.includes('drizzle')) return 'from-blue-500/10 to-cyan-500/5';
  if (c.includes('snow')) return 'from-blue-200/10 to-white/5';
  if (c.includes('cloud') || c.includes('overcast')) return 'from-gray-400/10 to-slate-500/5';
  return 'from-amber-400/10 to-orange-400/5';
};

const ForecastWidget = ({ data }) => {
  const {
    location = 'Unknown',
    countryCode = '',
    currentTemp,
    currentCondition = 'Unknown',
    days,
  } = data || {};
  // 🧹 QA FIX: Null-safe array — destructuring default [] is bypassed when value is explicit null
  const safeDays = days || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      // 📱 RESPONSIVE: Fluid width, responsive corners
      className="relative w-full max-w-[480px] rounded-[24px] sm:rounded-[28px] md:rounded-[32px] overflow-hidden mt-5"
      style={{
        background: '#0B0B0C',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 32px 64px -16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      {/* Ambient glow based on current condition */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse at 50% 0%, rgba(56, 189, 248, 0.06) 0%, transparent 60%)`,
      }} />

      {/* ─── Header: Current Conditions ─── */}
      {/* 📱 RESPONSIVE: Mobile-first padding */}
      <div className="relative z-10 px-4 sm:px-5 md:px-7 pt-5 md:pt-6 pb-3 md:pb-4">
        <div className="flex items-center gap-1.5 mb-2 sm:mb-3">
          <MapPin className="w-3 h-3 text-sky-400/70" />
          {/* 📱 RESPONSIVE: Truncate long location names */}
          <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.12em] text-sky-400/70 truncate">
            {location}{countryCode ? `, ${countryCode.toUpperCase()}` : ''}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-end gap-2">
              {/* 🧹 QA FIX: Null-safe currentTemp fallback */}
              {/* 📱 RESPONSIVE: Fluid temperature text */}
              <span className="text-[38px] sm:text-[44px] md:text-[48px] font-semibold text-white/95 tracking-[-0.03em] leading-none">{currentTemp ?? '--'}°</span>
            </div>
            <p className="text-[13px] sm:text-[14px] text-[#A1A1AA] mt-1 font-medium truncate">{currentCondition}</p>
          </div>
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0" style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)',
          }}>
            {getConditionIcon(currentCondition, 'w-7 h-7 sm:w-8 sm:h-8')}
          </div>
        </div>
      </div>

      {/* ─── 7-Day Forecast List ─── */}
      {/* 📱 RESPONSIVE: Tighter padding on mobile */}
      <div className="relative z-10 px-3 sm:px-4 md:px-5 pb-4 md:pb-5">
        <div className="rounded-xl sm:rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)' }}>
          {/* 🧹 QA FIX: Map over safeDays with null-safe field access */}
          {safeDays.map((day, i) => (
            <motion.div
              key={`day-${i}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.05, duration: 0.4 }}
              // 📱 RESPONSIVE: Tighter padding, fluid layout
              className="flex items-center px-3 sm:px-4 py-2.5 sm:py-3"
              style={{
                borderBottom: i < safeDays.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
              }}
            >
              {/* Day & Date */}
              {/* 📱 RESPONSIVE: Narrower day column on mobile */}
              <div className="w-16 sm:w-20 shrink-0">
                <p className="text-[12px] sm:text-[13px] text-white/90 font-semibold">{i === 0 ? 'Today' : (day.day || '--')}</p>
                <p className="text-[10px] sm:text-[11px] text-[#52525B] font-medium">{day.date || ''}</p>
              </div>

              {/* Condition Icon */}
              <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br ${getConditionGradient(day.condition)}`}>
                {getConditionIcon(day.condition, 'w-3.5 h-3.5 sm:w-4 sm:h-4')}
              </div>

              {/* Rain */}
              {/* 📱 RESPONSIVE: Hide rain on very small screens to save space */}
              <div className="hidden xs:flex items-center gap-1 w-12 sm:w-14 shrink-0 ml-2 sm:ml-3 justify-center">
                <Droplets className="w-3 h-3 text-blue-400/50" />
                <span className="text-[10px] sm:text-[11px] text-blue-400/70 font-semibold">{day.rain ?? 0}%</span>
              </div>

              {/* Temperature Range */}
              <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
                <span className="text-[12px] sm:text-[14px] text-[#52525B] font-medium w-7 sm:w-8 text-right">{day.low ?? '--'}°</span>

                {/* Temperature bar */}
                {/* 📱 RESPONSIVE: Shorter bar on mobile */}
                <div className="w-10 sm:w-14 md:w-16 h-1.5 rounded-full overflow-hidden relative" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.2 + i * 0.06, duration: 0.5 }}
                    className="absolute inset-y-0 rounded-full"
                    style={{
                      left: `${Math.max(0, (((day.low || 10) - 10) / 40) * 100)}%`,
                      right: `${Math.max(0, 100 - (((day.high || 30) - 10) / 40) * 100)}%`,
                      background: `linear-gradient(90deg, #3B82F6, #F59E0B, #EF4444)`,
                      transformOrigin: 'left',
                    }}
                  />
                </div>

                <span className="text-[12px] sm:text-[14px] text-white/90 font-semibold w-7 sm:w-8 text-right">{day.high ?? '--'}°</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* UV & Wind footer for today */}
        {safeDays[0] && (
          <div className="flex items-center justify-center gap-4 sm:gap-6 mt-2.5 sm:mt-3 text-[10px] sm:text-[11px] text-[#52525B]">
            {safeDays[0].uv !== null && safeDays[0].uv !== undefined && (
              <div className="flex items-center gap-1">
                <ThermometerSun className="w-3 h-3" />
                <span>UV {safeDays[0].uv}</span>
              </div>
            )}
            {safeDays[0].windMax && safeDays[0].windMax !== '--' && (
              <div className="flex items-center gap-1">
                <Wind className="w-3 h-3" />
                <span>{safeDays[0].windMax}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ForecastWidget;
