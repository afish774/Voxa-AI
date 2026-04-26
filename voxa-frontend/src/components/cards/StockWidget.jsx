import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, BarChart3, Activity } from 'lucide-react';

// ============================================================================
// 📈 StockWidget — High-End Financial Dashboard Card
// ============================================================================
// Payload shape (from getStockTool):
//   symbol, name, price, change, changePercent, currency, exchange,
//   high, low, high52, low52, marketCap, isMarketOpen, marketState
// ============================================================================

const StockWidget = ({ data }) => {
  const {
    symbol = '---', name = 'Unknown', price = 0, change = 0,
    changePercent = 0, currency = 'USD', exchange = '',
    high, low, high52, low52, marketCap,
    isMarketOpen = false, marketState = 'CLOSED', error,
  } = data || {};

  if (error) {
    return (
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
        // 📱 RESPONSIVE: Fluid error card
        className="w-full max-w-[440px] rounded-[24px] sm:rounded-[28px] p-4 sm:p-6 mt-5"
        style={{ background: '#0B0B0C', border: '1px solid rgba(239,68,68,0.12)' }}>
        <span className="text-[12px] sm:text-[13px] text-red-400 font-medium break-words">{error}</span>
      </motion.div>
    );
  }

  const isPositive = change >= 0;
  const accent = isPositive ? '#22C55E' : '#EF4444';
  const currencySymbol = currency === 'INR' ? '₹' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'JPY' ? '¥' : '$';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      // 📱 RESPONSIVE: Fluid width, responsive corners
      className="relative w-full max-w-[440px] rounded-[24px] sm:rounded-[28px] md:rounded-[32px] overflow-hidden mt-5"
      style={{
        background: '#0B0B0C',
        border: `1px solid ${accent}15`,
        boxShadow: '0 32px 64px -16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse at 50% 0%, ${accent}0A 0%, transparent 60%)`,
      }} />

      {/* 📱 RESPONSIVE: Mobile-first padding */}
      <div className="relative z-10 p-4 sm:p-5 md:p-7">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {/* 📱 RESPONSIVE: Fluid symbol text */}
              <h2 className="text-[18px] sm:text-[20px] md:text-[22px] font-bold text-white/95 tracking-[-0.02em]">{symbol}</h2>
              <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full" style={{
                background: isMarketOpen ? 'rgba(34,197,94,0.08)' : 'rgba(113,113,122,0.08)',
                border: `1px solid ${isMarketOpen ? 'rgba(34,197,94,0.15)' : 'rgba(113,113,122,0.15)'}`,
              }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: isMarketOpen ? '#22C55E' : '#71717A' }} />
                <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider" style={{ color: isMarketOpen ? '#22C55E' : '#71717A' }}>
                  {isMarketOpen ? 'Live' : marketState}
                </span>
              </div>
            </div>
            {/* 🧹 QA FIX: Added truncate to prevent long company name overflow */}
            {/* 📱 RESPONSIVE: Fluid company name, wider truncation */}
            <p className="text-[12px] sm:text-[13px] text-[#71717A] mt-0.5 font-medium truncate">
              {name} · {exchange}
            </p>
          </div>
          <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-[#3F3F46] shrink-0" />
        </div>

        {/* Price Hero */}
        <div className="mb-4 sm:mb-5">
          <div className="flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
            {/* 📱 RESPONSIVE: Fluid price text — scales from 28px on iPhone SE to 40px on desktop */}
            <span className="text-[28px] sm:text-[34px] md:text-[40px] font-bold text-white/95 tracking-[-0.03em] leading-none break-all">
              {currencySymbol}{price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          {/* 📱 RESPONSIVE: Wrap change badges on narrow screens */}
          <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
            <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg" style={{ background: `${accent}12` }}>
              {isPositive ? <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color: accent }} /> : <TrendingDown className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color: accent }} />}
              <span className="text-[12px] sm:text-[14px] font-bold" style={{ color: accent }}>
                {isPositive ? '+' : ''}{changePercent}%
              </span>
            </div>
            <span className="text-[12px] sm:text-[13px] font-semibold" style={{ color: accent }}>
              {isPositive ? '+' : ''}{currencySymbol}{Math.abs(change).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        {/* 📱 RESPONSIVE: Grid stays at 2 cols — tighter padding/gaps on mobile */}
        <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
          {high !== null && high !== undefined && (
            <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <p className="text-[9px] sm:text-[10px] text-[#52525B] uppercase tracking-wider font-semibold mb-0.5 sm:mb-1">Day High</p>
              <p className="text-[14px] sm:text-[16px] font-semibold text-white/90 truncate">{currencySymbol}{high?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
          )}
          {low !== null && low !== undefined && (
            <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <p className="text-[9px] sm:text-[10px] text-[#52525B] uppercase tracking-wider font-semibold mb-0.5 sm:mb-1">Day Low</p>
              <p className="text-[14px] sm:text-[16px] font-semibold text-white/90 truncate">{currencySymbol}{low?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
          )}
          {high52 !== null && high52 !== undefined && (
            <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <p className="text-[9px] sm:text-[10px] text-[#52525B] uppercase tracking-wider font-semibold mb-0.5 sm:mb-1">52W High</p>
              <p className="text-[14px] sm:text-[16px] font-semibold text-emerald-400/80 truncate">{currencySymbol}{high52?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
          )}
          {low52 !== null && low52 !== undefined && (
            <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <p className="text-[9px] sm:text-[10px] text-[#52525B] uppercase tracking-wider font-semibold mb-0.5 sm:mb-1">52W Low</p>
              <p className="text-[14px] sm:text-[16px] font-semibold text-red-400/80 truncate">{currencySymbol}{low52?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
          )}
        </div>

        {/* Market Cap Footer */}
        {marketCap && (
          // 📱 RESPONSIVE: Stack on very narrow, flex-row on sm+
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 mt-2.5 sm:mt-3 pt-2.5 sm:pt-3 text-[10px] sm:text-[11px] text-[#52525B]" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="flex items-center gap-1">
              <Activity className="w-3 h-3 shrink-0" />
              <span className="font-medium">Market Cap</span>
            </div>
            <span className="font-bold text-[#A1A1AA] truncate">{marketCap}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StockWidget;
