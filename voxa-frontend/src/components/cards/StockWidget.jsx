import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertTriangle, Activity, Clock } from 'lucide-react';

// ============================================================================
// 📈 StockWidget — Apple Premium Financial Dashboard
// ============================================================================
// Design DNA: iOS 17 Stocks App / Cupertino Glassmorphism
// Features: 32px backdrop blur, adaptive performance glow (Green/Red), 
// hairline borders, and tabular numerals for precise financial data.
// ============================================================================

const StockWidget = ({ data }) => {
  const {
    symbol = '---',
    name = 'Unknown',
    price = 0,
    change = 0,
    changePercent = 0,
    currency = 'USD',
    exchange = '',
    high,
    low,
    high52,
    low52,
    marketCap,
    isMarketOpen = false,
    marketState = 'CLOSED',
    error,
  } = data || {};

  const isPositive = change >= 0;
  const themeColor = isPositive ? '#30D158' : '#FF453A';
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  const currencySymbols = { USD: '$', INR: '₹', EUR: '€', GBP: '£', JPY: '¥' };
  const curSym = currencySymbols[currency?.toUpperCase()] || `${currency} `;

  // ─── Error State ───
  if (error) {
    return (
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[420px] rounded-[24px] sm:rounded-[28px] p-5 mt-5"
        style={{ background: 'rgba(28, 28, 30, 0.8)', border: '1px solid rgba(255,69,58,0.2)' }}>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#FF453A] shrink-0" />
          <span className="text-[13px] text-[#FF453A] font-medium tracking-tight break-words">{error}</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full max-w-[440px] rounded-[32px] overflow-hidden mt-5 shadow-2xl"
      style={{
        background: 'rgba(20, 20, 22, 0.65)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 24px 48px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
      }}
    >
      {/* ─── Ambient Adaptive Glow ─── */}
      <div className="absolute top-0 right-0 w-3/4 h-48 pointer-events-none" style={{
        background: `radial-gradient(ellipse at 80% -20%, ${themeColor} 0%, transparent 70%)`,
        opacity: 0.15,
        filter: 'blur(40px)',
      }} />

      {/* ─── Header: Symbol & Name ─── */}
      <div className="relative z-10 flex items-start justify-between px-5 sm:px-6 pt-6 pb-2">
        <div className="min-w-0 pr-4">
          <div className="flex items-center gap-2">
            <h2 className="text-[24px] sm:text-[26px] font-bold text-white tracking-tight leading-none">
              {symbol}
            </h2>
            {exchange && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
                {exchange}
              </span>
            )}
          </div>
          <p className="text-[13px] text-white/50 font-medium mt-1 truncate">
            {name}
          </p>
        </div>

        <div className="flex items-center justify-center w-10 h-10 rounded-full shrink-0"
          style={{ background: `rgba(${isPositive ? '48, 209, 88' : '255, 69, 58'}, 0.15)` }}>
          <Activity className="w-5 h-5" style={{ color: themeColor }} />
        </div>
      </div>

      {/* ─── Primary Price Display ─── */}
      <div className="relative z-10 px-5 sm:px-6 py-2">
        <div className="flex items-baseline gap-1">
          <span className="text-[28px] sm:text-[32px] font-semibold text-white/60">{curSym}</span>
          <span className="text-[44px] sm:text-[52px] font-bold text-white tracking-tighter leading-none tabular-nums">
            {price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg"
            style={{ background: `rgba(${isPositive ? '48, 209, 88' : '255, 69, 58'}, 0.12)` }}>
            <TrendIcon className="w-4 h-4" style={{ color: themeColor }} />
            <span className="text-[15px] font-semibold tracking-tight" style={{ color: themeColor }}>
              {isPositive ? '+' : ''}{change.toLocaleString('en-US', { minimumFractionDigits: 2 })} ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>

      {/* ─── Secondary Data Grid ─── */}
      <div className="relative z-10 px-5 sm:px-6 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {high !== null && high !== undefined && (
            <div className="flex flex-col p-3 rounded-[16px]" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wider mb-1">Day High</span>
              <span className="text-[14px] font-medium text-white/90 tabular-nums">{curSym}{high.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          {low !== null && low !== undefined && (
            <div className="flex flex-col p-3 rounded-[16px]" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wider mb-1">Day Low</span>
              <span className="text-[14px] font-medium text-white/90 tabular-nums">{curSym}{low.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          {high52 !== null && high52 !== undefined && (
            <div className="flex flex-col p-3 rounded-[16px]" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wider mb-1">52W High</span>
              <span className="text-[14px] font-medium text-white/90 tabular-nums">{curSym}{high52.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          {low52 !== null && low52 !== undefined && (
            <div className="flex flex-col p-3 rounded-[16px]" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wider mb-1">52W Low</span>
              <span className="text-[14px] font-medium text-white/90 tabular-nums">{curSym}{low52.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          )}
        </div>
      </div>

      {/* ─── Footer: Market Status & Cap ─── */}
      <div className="relative z-10 px-5 sm:px-6 pt-3 pb-5 mt-2 flex items-center justify-between"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>

        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" style={{ color: isMarketOpen ? '#30D158' : '#8E8E93' }} />
          <span className="text-[12px] font-medium" style={{ color: isMarketOpen ? '#30D158' : '#8E8E93' }}>
            {marketState.replace(/_/g, ' ')}
          </span>
        </div>

        {marketCap && (
          <div className="text-right">
            <span className="text-[11px] text-white/40 font-semibold uppercase tracking-wider mr-1.5">Mkt Cap</span>
            <span className="text-[13px] font-medium text-white/80">{marketCap}</span>
          </div>
        )}
      </div>

    </motion.div>
  );
};

export default StockWidget;