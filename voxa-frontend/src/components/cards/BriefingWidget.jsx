import React from 'react';
import { motion } from 'framer-motion';
import { Sun, CloudRain, Cloud, Newspaper, TrendingUp, TrendingDown, Quote, Sparkles, CloudLightning, CloudSnow, ChevronRight } from 'lucide-react';

// ============================================================================
// ☀️ BriefingWidget — Apple Premium Daily Orchestrator
// ============================================================================
// Design DNA: iOS 17 Siri / Today View Glassmorphism
// Features: 32px backdrop blur, ambient Siri-esque gradient glow, and
// elegantly nested frosted glass panels for distinct data domains.
// ============================================================================

const getConditionIcon = (c) => {
  const lower = (c || '').toLowerCase();
  if (lower.includes('thunder') || lower.includes('storm')) return <CloudLightning className="w-8 h-8 sm:w-10 sm:h-10 text-[#FF9F0A]" />;
  if (lower.includes('snow') || lower.includes('sleet')) return <CloudSnow className="w-8 h-8 sm:w-10 sm:h-10 text-white" />;
  if (lower.includes('rain') || lower.includes('drizzle') || lower.includes('shower')) return <CloudRain className="w-8 h-8 sm:w-10 sm:h-10 text-[#0A84FF]" />;
  if (lower.includes('cloud') || lower.includes('overcast')) return <Cloud className="w-8 h-8 sm:w-10 sm:h-10 text-[#8E8E93]" />;
  return <Sun className="w-8 h-8 sm:w-10 sm:h-10 text-[#FFD60A]" />;
};

const BriefingWidget = ({ data }) => {
  const {
    greeting = 'Good Day',
    date = '',
    weather,
    headlines,
    crypto,
    quote,
    error
  } = data || {};

  // ─── Error State ───
  if (error) {
    return (
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[440px] rounded-[24px] sm:rounded-[28px] p-5 mt-5"
        style={{ background: 'rgba(28, 28, 30, 0.8)', border: '1px solid rgba(255,69,58,0.2)' }}>
        <span className="text-[13px] text-[#FF453A] font-medium tracking-tight break-words">{error}</span>
      </motion.div>
    );
  }

  const safeHeadlines = headlines || [];

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
      {/* ─── Ambient Siri/Morning Glow ─── */}
      <div className="absolute top-0 left-0 w-full h-48 pointer-events-none opacity-20" style={{
        background: 'radial-gradient(circle at 20% -20%, #0A84FF 0%, transparent 60%), radial-gradient(circle at 80% -20%, #BF5AF2 0%, transparent 60%)',
        filter: 'blur(40px)',
      }} />

      <div className="relative z-10 p-5 sm:p-6">

        {/* ─── Header: Greeting & Date ─── */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-[#0A84FF]" />
            <h2 className="text-[24px] sm:text-[26px] font-bold text-white tracking-tight leading-none">
              {greeting}
            </h2>
          </div>
          <p className="text-[13px] sm:text-[14px] text-white/50 font-medium ml-7">{date}</p>
        </div>

        {/* ─── 1. Weather Panel ─── */}
        {weather && (
          <div className="flex items-center justify-between p-4 sm:p-5 rounded-[24px] mb-3"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-3 sm:gap-4">
              {getConditionIcon(weather.condition)}
              <div className="flex flex-col">
                <span className="text-[15px] sm:text-[17px] font-semibold text-white/90 tracking-tight capitalize">
                  {weather.condition}
                </span>
                <span className="text-[12px] sm:text-[13px] text-white/50 font-medium">
                  {weather.location || 'Current Location'}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[26px] sm:text-[30px] font-bold text-white tracking-tighter leading-none tabular-nums">
                {weather.currentTemp}°
              </span>
              <span className="text-[11px] sm:text-[12px] font-medium text-white/40 mt-1">
                H:{weather.high}° L:{weather.low}°
              </span>
            </div>
          </div>
        )}

        {/* ─── 2. News Headlines Panel ─── */}
        {safeHeadlines.length > 0 && (
          <div className="p-4 sm:p-5 rounded-[24px] mb-3"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Newspaper className="w-4 h-4 text-[#FF453A]" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/50">Top Stories</span>
            </div>
            <div className="flex flex-col gap-3.5">
              {safeHeadlines.map((hl, i) => (
                <div key={i} className="flex flex-col group cursor-pointer">
                  <span className="text-[14px] sm:text-[15px] font-semibold text-white/90 leading-snug line-clamp-2 group-hover:text-[#0A84FF] transition-colors">
                    {hl.title}
                  </span>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[11px] text-white/40 font-medium">{hl.source || 'News'}</span>
                    {i === 0 && <ChevronRight className="w-3 h-3 text-white/20 group-hover:text-[#0A84FF] transition-colors" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── 3. Crypto/Market Panel ─── */}
        {crypto && crypto.coin && (
          <div className="flex items-center justify-between p-4 sm:p-5 rounded-[24px] mb-3"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className="text-[14px] sm:text-[15px] font-semibold text-white/90 capitalize">{crypto.coin}</span>
                <div className="flex items-center gap-1 mt-0.5"
                  style={{ color: parseFloat(crypto.change || 0) >= 0 ? '#30D158' : '#FF453A' }}>
                  {parseFloat(crypto.change || 0) >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  <span className="text-[12px] font-bold">{Math.abs(parseFloat(crypto.change || 0)).toFixed(2)}%</span>
                </div>
              </div>
            </div>
            <span className="text-[18px] sm:text-[20px] font-bold text-white tabular-nums tracking-tight">
              ${parseFloat(crypto.price || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </span>
          </div>
        )}

        {/* ─── 4. Inspiration Quote Panel ─── */}
        {quote && quote.content && (
          <div className="p-4 sm:p-5 rounded-[24px]"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)' }}>
            <Quote className="w-4 h-4 text-[#BF5AF2] opacity-80 mb-2.5" />
            <p className="text-[13px] sm:text-[14px] text-white/80 font-medium leading-relaxed italic">
              "{quote.content}"
            </p>
            <p className="text-[11px] text-white/40 font-semibold uppercase tracking-wider mt-3">
              — {quote.author || 'Unknown'}
            </p>
          </div>
        )}

      </div>
    </motion.div>
  );
};

export default BriefingWidget;