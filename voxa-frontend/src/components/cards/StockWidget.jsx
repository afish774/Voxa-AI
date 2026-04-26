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
        className="w-full max-w-[440px] rounded-[28px] p-6 mt-5"
        style={{ background: '#0B0B0C', border: '1px solid rgba(239,68,68,0.12)' }}>
        <span className="text-[13px] text-red-400 font-medium">{error}</span>
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
      className="relative w-full max-w-[440px] rounded-[32px] overflow-hidden mt-5"
      style={{
        background: '#0B0B0C',
        border: `1px solid ${accent}15`,
        boxShadow: '0 32px 64px -16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse at 50% 0%, ${accent}0A 0%, transparent 60%)`,
      }} />

      <div className="relative z-10 p-7">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[22px] font-bold text-white/95 tracking-[-0.02em]">{symbol}</h2>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{
                background: isMarketOpen ? 'rgba(34,197,94,0.08)' : 'rgba(113,113,122,0.08)',
                border: `1px solid ${isMarketOpen ? 'rgba(34,197,94,0.15)' : 'rgba(113,113,122,0.15)'}`,
              }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: isMarketOpen ? '#22C55E' : '#71717A' }} />
                <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: isMarketOpen ? '#22C55E' : '#71717A' }}>
                  {isMarketOpen ? 'Live' : marketState}
                </span>
              </div>
            </div>
            <p className="text-[13px] text-[#71717A] mt-0.5 font-medium truncate max-w-[200px]">
              {name} · {exchange}
            </p>
          </div>
          <BarChart3 className="w-5 h-5 text-[#3F3F46]" />
        </div>

        {/* Price Hero */}
        <div className="mb-5">
          <div className="flex items-baseline gap-2">
            <span className="text-[40px] font-bold text-white/95 tracking-[-0.03em] leading-none">
              {currencySymbol}{price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: `${accent}12` }}>
              {isPositive ? <TrendingUp className="w-3.5 h-3.5" style={{ color: accent }} /> : <TrendingDown className="w-3.5 h-3.5" style={{ color: accent }} />}
              <span className="text-[14px] font-bold" style={{ color: accent }}>
                {isPositive ? '+' : ''}{changePercent}%
              </span>
            </div>
            <span className="text-[13px] font-semibold" style={{ color: accent }}>
              {isPositive ? '+' : ''}{currencySymbol}{Math.abs(change).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {high !== null && high !== undefined && (
            <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <p className="text-[10px] text-[#52525B] uppercase tracking-wider font-semibold mb-1">Day High</p>
              <p className="text-[16px] font-semibold text-white/90">{currencySymbol}{high?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
          )}
          {low !== null && low !== undefined && (
            <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <p className="text-[10px] text-[#52525B] uppercase tracking-wider font-semibold mb-1">Day Low</p>
              <p className="text-[16px] font-semibold text-white/90">{currencySymbol}{low?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
          )}
          {high52 !== null && high52 !== undefined && (
            <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <p className="text-[10px] text-[#52525B] uppercase tracking-wider font-semibold mb-1">52W High</p>
              <p className="text-[16px] font-semibold text-emerald-400/80">{currencySymbol}{high52?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
          )}
          {low52 !== null && low52 !== undefined && (
            <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <p className="text-[10px] text-[#52525B] uppercase tracking-wider font-semibold mb-1">52W Low</p>
              <p className="text-[16px] font-semibold text-red-400/80">{currencySymbol}{low52?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
          )}
        </div>

        {/* Market Cap Footer */}
        {marketCap && (
          <div className="flex items-center justify-between mt-3 pt-3 text-[11px] text-[#52525B]" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="flex items-center gap-1">
              <Activity className="w-3 h-3" />
              <span className="font-medium">Market Cap</span>
            </div>
            <span className="font-bold text-[#A1A1AA]">{marketCap}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StockWidget;
