import React from 'react';
import { motion } from 'framer-motion';
import { Cloud, CloudRain, CloudSnow, Sun, CloudLightning, Wind, Droplets, Eye, ThermometerSun, MapPin } from 'lucide-react';

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
    days = [],
  } = data || {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className="relative w-full max-w-[480px] rounded-[32px] overflow-hidden mt-5"
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
      <div className="relative z-10 px-7 pt-6 pb-4">
        <div className="flex items-center gap-1.5 mb-3">
          <MapPin className="w-3 h-3 text-sky-400/70" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-sky-400/70">
            {location}{countryCode ? `, ${countryCode.toUpperCase()}` : ''}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-end gap-2">
              <span className="text-[48px] font-semibold text-white/95 tracking-[-0.03em] leading-none">{currentTemp}°</span>
            </div>
            <p className="text-[14px] text-[#A1A1AA] mt-1 font-medium">{currentCondition}</p>
          </div>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)',
          }}>
            {getConditionIcon(currentCondition, 'w-8 h-8')}
          </div>
        </div>
      </div>

      {/* ─── 7-Day Forecast List ─── */}
      <div className="relative z-10 px-5 pb-5">
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)' }}>
          {days.map((day, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.05, duration: 0.4 }}
              className="flex items-center px-4 py-3"
              style={{
                borderBottom: i < days.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
              }}
            >
              {/* Day & Date */}
              <div className="w-20 shrink-0">
                <p className="text-[13px] text-white/90 font-semibold">{i === 0 ? 'Today' : day.day}</p>
                <p className="text-[11px] text-[#52525B] font-medium">{day.date}</p>
              </div>

              {/* Condition Icon */}
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br ${getConditionGradient(day.condition)}`}>
                {getConditionIcon(day.condition, 'w-4 h-4')}
              </div>

              {/* Rain */}
              <div className="flex items-center gap-1 w-14 shrink-0 ml-3 justify-center">
                <Droplets className="w-3 h-3 text-blue-400/50" />
                <span className="text-[11px] text-blue-400/70 font-semibold">{day.rain ?? 0}%</span>
              </div>

              {/* Temperature Range */}
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-[14px] text-[#52525B] font-medium w-8 text-right">{day.low}°</span>

                {/* Temperature bar */}
                <div className="w-16 h-1.5 rounded-full overflow-hidden relative" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.2 + i * 0.06, duration: 0.5 }}
                    className="absolute inset-y-0 rounded-full"
                    style={{
                      left: `${Math.max(0, ((day.low - 10) / 40) * 100)}%`,
                      right: `${Math.max(0, 100 - ((day.high - 10) / 40) * 100)}%`,
                      background: `linear-gradient(90deg, #3B82F6, #F59E0B, #EF4444)`,
                      transformOrigin: 'left',
                    }}
                  />
                </div>

                <span className="text-[14px] text-white/90 font-semibold w-8 text-right">{day.high}°</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* UV & Wind footer for today */}
        {days[0] && (
          <div className="flex items-center justify-center gap-6 mt-3 text-[11px] text-[#52525B]">
            {days[0].uv !== null && days[0].uv !== undefined && (
              <div className="flex items-center gap-1">
                <ThermometerSun className="w-3 h-3" />
                <span>UV {days[0].uv}</span>
              </div>
            )}
            {days[0].windMax && days[0].windMax !== '--' && (
              <div className="flex items-center gap-1">
                <Wind className="w-3 h-3" />
                <span>{days[0].windMax}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ForecastWidget;
