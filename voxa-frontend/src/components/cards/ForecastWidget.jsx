import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Cloud, CloudRain, CloudSnow, Sun, CloudLightning, Wind, Droplets, ThermometerSun, MapPin, AlertTriangle, CalendarDays } from 'lucide-react';

// ============================================================================
// 🌤️ ForecastWidget — Apple Premium Weather Card
// ============================================================================
// Design DNA: iOS 17 Weather App / Cupertino Glassmorphism
// Features: 32px backdrop blur, adaptive atmospheric glows, tabular numerals,
// and dynamically scaled temperature range bars for the 7-day forecast.
// ============================================================================

const getConditionIcon = (condition, className = "w-5 h-5") => {
  const c = (condition || '').toLowerCase();
  if (c.includes('thunder') || c.includes('storm')) return <CloudLightning className={`${className} text-[#FF9F0A]`} />;
  if (c.includes('snow') || c.includes('sleet')) return <CloudSnow className={`${className} text-white`} />;
  if (c.includes('rain') || c.includes('drizzle') || c.includes('shower')) return <CloudRain className={`${className} text-[#32ADE6]`} />;
  if (c.includes('cloud') || c.includes('overcast') || c.includes('fog')) return <Cloud className={`${className} text-[#8E8E93]`} />;
  return <Sun className={`${className} text-[#FFD60A]`} />;
};

const ForecastWidget = ({ data }) => {
  const { location = 'Unknown Location', currentTemp, currentCondition, days = [], error } = data || {};
  const safeDays = days || [];

  // ─── Error State ───
  if (error || safeDays.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[440px] rounded-[24px] sm:rounded-[28px] p-5 mt-5"
        style={{ background: 'rgba(28, 28, 30, 0.8)', border: '1px solid rgba(255,69,58,0.2)' }}>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#FF453A] shrink-0" />
          <span className="text-[13px] text-[#FF453A] font-medium tracking-tight break-words">
            {error || 'Forecast data is unavailable right now.'}
          </span>
        </div>
      </motion.div>
    );
  }

  // ─── Adaptive Atmospheric Theme ───
  const cLower = (currentCondition || '').toLowerCase();
  let themeColor = '#0A84FF'; // Default Clear Blue
  if (cLower.includes('rain') || cLower.includes('storm')) themeColor = '#5E5CE6'; // Deep Indigo
  else if (cLower.includes('cloud')) themeColor = '#8E8E93'; // Overcast Gray
  else if (cLower.includes('snow')) themeColor = '#78C5F9'; // Icy Blue
  else if (cLower.includes('clear') || cLower.includes('sun')) themeColor = '#32ADE6'; // Sky Cyan

  // ─── Temperature Bar Scaling Logic ───
  const { minTemp, maxTemp } = useMemo(() => {
    let min = Infinity, max = -Infinity;
    safeDays.forEach(d => {
      if (d.low < min) min = d.low;
      if (d.high > max) max = d.high;
    });
    // Add a slight buffer
    return { minTemp: min - 2, maxTemp: max + 2 };
  }, [safeDays]);

  const tempRange = maxTemp - minTemp || 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full max-w-[460px] rounded-[32px] overflow-hidden mt-5 shadow-2xl"
      style={{
        background: 'rgba(20, 20, 22, 0.65)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 24px 48px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
      }}
    >
      {/* ─── Ambient Sky Glow ─── */}
      <div className="absolute top-0 left-0 w-full h-56 pointer-events-none opacity-30" style={{
        background: `radial-gradient(ellipse at 50% -20%, ${themeColor} 0%, transparent 70%)`,
        filter: 'blur(40px)',
      }} />

      <div className="relative z-10 p-5 sm:p-6 pb-6">

        {/* ─── Header: Location & Current Temp ─── */}
        <div className="flex flex-col items-center justify-center text-center mb-6">
          <h2 className="text-[26px] sm:text-[28px] font-semibold text-white tracking-tight leading-none mb-1 drop-shadow-sm">
            {location}
          </h2>
          <span className="text-[14px] text-white/80 font-medium capitalize tracking-wide">
            {currentCondition}
          </span>
          <div className="mt-2 mb-1 text-[72px] sm:text-[84px] font-thin text-white tracking-tighter leading-none tabular-nums drop-shadow-md">
            {currentTemp}°
          </div>
          <div className="flex items-center gap-3 text-[14px] font-semibold text-white/90">
            <span>H:{safeDays[0]?.high}°</span>
            <span>L:{safeDays[0]?.low}°</span>
          </div>
        </div>

        {/* ─── Current Day Metrics Grid ─── */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="flex flex-col items-center justify-center p-3 rounded-[18px]" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <ThermometerSun className="w-4 h-4 text-[#FF9F0A] mb-1.5" />
            <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wider mb-0.5">UV Index</span>
            <span className="text-[14px] font-bold text-white tabular-nums">{safeDays[0]?.uv || '0'}</span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 rounded-[18px]" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <Droplets className="w-4 h-4 text-[#32ADE6] mb-1.5" />
            <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wider mb-0.5">Rain</span>
            <span className="text-[14px] font-bold text-white tabular-nums">{safeDays[0]?.rain || '0%'}</span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 rounded-[18px]" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <Wind className="w-4 h-4 text-[#EBEBF5] opacity-80 mb-1.5" />
            <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wider mb-0.5">Wind</span>
            <span className="text-[14px] font-bold text-white tabular-nums">{safeDays[0]?.windMax || '0'}</span>
          </div>
        </div>

        {/* ─── 7-Day Forecast Container ─── */}
        <div className="rounded-[24px] p-4 sm:p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-1.5 mb-3 text-white/50">
            <CalendarDays className="w-3.5 h-3.5" />
            <span className="text-[11px] font-bold uppercase tracking-wider">7-Day Forecast</span>
          </div>

          <div className="flex flex-col">
            {safeDays.map((dayObj, i) => {
              // Calculate width and position for the temperature gradient bar
              const leftPct = Math.max(0, ((dayObj.low - minTemp) / tempRange) * 100);
              const widthPct = Math.max(5, ((dayObj.high - dayObj.low) / tempRange) * 100);

              return (
                <div key={i} className="flex items-center justify-between py-2.5"
                  style={{ borderBottom: i < safeDays.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>

                  {/* Day Name */}
                  <span className="w-10 sm:w-12 text-[14px] sm:text-[15px] font-semibold text-white/90">
                    {i === 0 ? 'Today' : dayObj.day}
                  </span>

                  {/* Icon & Rain Chance */}
                  <div className="flex items-center gap-2 w-16 sm:w-20 justify-start">
                    {getConditionIcon(dayObj.condition, "w-5 h-5 drop-shadow-sm")}
                    {dayObj.rain && parseInt(dayObj.rain) > 20 && (
                      <span className="text-[11px] font-bold text-[#32ADE6] tabular-nums tracking-tighter">
                        {dayObj.rain}
                      </span>
                    )}
                  </div>

                  {/* Temperature Bar */}
                  <div className="flex-1 flex items-center gap-3 ml-2">
                    <span className="w-6 sm:w-7 text-[14px] sm:text-[15px] font-semibold text-white/50 text-right tabular-nums">
                      {dayObj.low}°
                    </span>

                    <div className="flex-1 h-1.5 rounded-full overflow-hidden relative" style={{ background: 'rgba(0,0,0,0.2)' }}>
                      <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: `${widthPct}%`, opacity: 1 }}
                        transition={{ delay: 0.1 * i, duration: 0.8, ease: "easeOut" }}
                        className="absolute h-full rounded-full"
                        style={{
                          left: `${leftPct}%`,
                          background: `linear-gradient(90deg, #32ADE6, #FFD60A)`,
                        }}
                      />
                    </div>

                    <span className="w-6 sm:w-7 text-[14px] sm:text-[15px] font-bold text-white text-right tabular-nums">
                      {dayObj.high}°
                    </span>
                  </div>

                </div>
              );
            })}
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default ForecastWidget;