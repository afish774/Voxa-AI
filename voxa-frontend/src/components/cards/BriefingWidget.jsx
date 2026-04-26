import React from 'react';
import { motion } from 'framer-motion';
import { Sun, CloudRain, Cloud, Newspaper, TrendingUp, TrendingDown, Quote, Sparkles } from 'lucide-react';

// ============================================================================
// ☀️ BriefingWidget — AI-Powered Daily Briefing Orchestrator Card
// ============================================================================
// Payload shape (from get_daily_briefing tool):
//   greeting    — "Good Morning" / "Good Afternoon" / "Good Evening"
//   date        — "Saturday, 26 April 2026"
//   weather     — { location, temp, condition, humidity, wind } | null
//   headlines   — [{ title, source }] | null
//   crypto      — { coin, symbol, price, change24h, trend } | null
//   quote       — { text, author }
//   sections    — ['date', 'quote', 'weather', 'news', 'crypto']
// ============================================================================

const conditionIcon = (c) => {
  const lower = (c || '').toLowerCase();
  if (lower.includes('rain') || lower.includes('drizzle')) return <CloudRain className="w-4 h-4" />;
  if (lower.includes('cloud') || lower.includes('overcast')) return <Cloud className="w-4 h-4" />;
  return <Sun className="w-4 h-4" />;
};

const BriefingWidget = ({ data }) => {
  const {
    greeting = 'Good Day',
    date = '',
    weather,
    headlines,
    crypto,
    quote,
  } = data || {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className="relative w-full max-w-[460px] rounded-[32px] overflow-hidden mt-5"
      style={{
        background: '#0B0B0C',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 32px 64px -16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 30% 0%, rgba(251, 191, 36, 0.06) 0%, transparent 60%)',
      }} />

      {/* ─── Header ─── */}
      <div className="relative z-10 px-7 pt-6 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-amber-400/70" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-400/70">Daily Briefing</span>
        </div>
        <h2 className="text-[22px] font-semibold text-white/95 tracking-[-0.02em] leading-tight">{greeting}</h2>
        <p className="text-[13px] text-[#71717A] mt-0.5 font-medium">{date}</p>
      </div>

      {/* ─── Content Sections ─── */}
      <div className="relative z-10 px-7 pb-6 flex flex-col gap-3">

        {/* Weather Section */}
        {weather && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="flex items-center justify-between p-3.5 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(14, 165, 233, 0.1))',
              }}>
                {conditionIcon(weather.condition)}
              </div>
              <div>
                <p className="text-[14px] font-medium text-white/90">{weather.location || 'Weather'}</p>
                <p className="text-[12px] text-[#71717A]">{weather.condition}</p>
              </div>
            </div>
            <span className="text-[22px] font-semibold text-white/90 tracking-tight">{weather.temp}°</span>
          </motion.div>
        )}

        {/* Headlines Section */}
        {headlines && headlines.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="p-3.5 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}
          >
            <div className="flex items-center gap-2 mb-2.5">
              <Newspaper className="w-3.5 h-3.5 text-blue-400/70" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-blue-400/60">Top Headlines</span>
            </div>
            <div className="flex flex-col gap-2">
              {headlines.slice(0, 3).map((h, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[10px] text-[#52525B] font-bold mt-0.5 shrink-0">{i + 1}.</span>
                  <div>
                    <p className="text-[13px] text-[#D4D4D8] leading-snug font-medium">{h.title}</p>
                    {h.source && <p className="text-[11px] text-[#52525B] mt-0.5">{h.source}</p>}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Crypto Section */}
        {crypto && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 }}
            className="flex items-center justify-between p-3.5 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{
                background: crypto.trend === 'up'
                  ? 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(22,163,74,0.1))'
                  : 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(220,38,38,0.1))',
              }}>
                {crypto.trend === 'up'
                  ? <TrendingUp className="w-4 h-4 text-emerald-400" />
                  : <TrendingDown className="w-4 h-4 text-red-400" />
                }
              </div>
              <div>
                <p className="text-[14px] font-medium text-white/90">{crypto.coin || crypto.symbol}</p>
                <p className="text-[12px] font-semibold" style={{ color: crypto.trend === 'up' ? '#34D399' : '#F87171' }}>
                  {crypto.trend === 'up' ? '▲' : '▼'} {Math.abs(parseFloat(crypto.change24h || 0)).toFixed(2)}%
                </p>
              </div>
            </div>
            <span className="text-[18px] font-semibold text-white/90 tracking-tight">
              ${parseFloat(crypto.price || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </span>
          </motion.div>
        )}

        {/* Quote Section */}
        {quote && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="p-4 rounded-2xl mt-1"
            style={{
              background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.04), rgba(245, 158, 11, 0.02))',
              border: '1px solid rgba(251, 191, 36, 0.08)',
            }}
          >
            <Quote className="w-4 h-4 text-amber-500/40 mb-2" />
            <p className="text-[13.5px] text-[#D4D4D8] leading-relaxed italic font-light">
              "{quote.text}"
            </p>
            {quote.author && (
              <p className="text-[11px] text-[#71717A] mt-2 font-semibold tracking-wide">— {quote.author}</p>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default BriefingWidget;
