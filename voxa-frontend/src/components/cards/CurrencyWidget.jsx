import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRightLeft, TrendingUp } from 'lucide-react';

// ============================================================================
// 💱 CurrencyWidget — Sleek Currency Conversion Card
// ============================================================================
// Payload shape (from getCurrencyTool):
//   from            — "USD"
//   to              — "INR"
//   inputAmount     — 100
//   convertedAmount — 8345.12
//   rate            — 83.4512
//   fromFlag        — "🇺🇸"
//   toFlag          — "🇮🇳"
//   timestamp       — "2026-04-26"
//   source          — "European Central Bank"
// ============================================================================

const CurrencyWidget = ({ data }) => {
  const {
    from = '---',
    to = '---',
    inputAmount = 0,
    convertedAmount = 0,
    rate = 0,
    fromFlag = '💱',
    toFlag = '💱',
    timestamp = '',
    source = '',
    error,
  } = data || {};

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        // 📱 RESPONSIVE: Fluid error card
        className="w-full max-w-[420px] rounded-[24px] sm:rounded-[28px] p-4 sm:p-6 mt-5"
        style={{ background: '#0B0B0C', border: '1px solid rgba(239,68,68,0.12)' }}
      >
        <span className="text-[12px] sm:text-[13px] text-red-400 font-medium break-words">{error}</span>
      </motion.div>
    );
  }

  // Format the converted amount with proper decimal places
  const formatted = convertedAmount >= 1000
    ? convertedAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : convertedAmount.toLocaleString('en-US', { maximumFractionDigits: 4 });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      // 📱 RESPONSIVE: Fluid width, responsive corners
      className="relative w-full max-w-[420px] rounded-[24px] sm:rounded-[28px] md:rounded-[32px] overflow-hidden mt-5"
      style={{
        background: '#0B0B0C',
        border: '1px solid rgba(16, 185, 129, 0.08)',
        boxShadow: '0 32px 64px -16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 50% 0%, rgba(16, 185, 129, 0.05) 0%, transparent 60%)',
      }} />

      {/* 📱 RESPONSIVE: Mobile-first padding */}
      <div className="relative z-10 p-4 sm:p-5 md:p-7">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4 sm:mb-5">
          <ArrowRightLeft className="w-4 h-4 text-emerald-400/70" />
          <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-400/70">Currency Conversion</span>
        </div>

        {/* From → To Row */}
        {/* 📱 RESPONSIVE: Tighter gaps on mobile, fluid flag/text sizing */}
        <div className="flex items-center justify-between gap-2 sm:gap-3 mb-5 sm:mb-6">
          {/* From */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="text-[22px] sm:text-[28px] shrink-0">{fromFlag}</span>
            <div className="min-w-0">
              <p className="text-[17px] sm:text-[20px] font-bold text-white/90 tracking-tight">{from}</p>
              <p className="text-[12px] sm:text-[14px] text-[#A1A1AA] font-medium truncate">
                {parseFloat(inputAmount).toLocaleString('en-US', { maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Arrow */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            // 📱 RESPONSIVE: Slightly smaller swap icon on mobile
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.12)',
            }}
          >
            <ArrowRightLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
          </motion.div>

          {/* To */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="text-right min-w-0">
              <p className="text-[17px] sm:text-[20px] font-bold text-white/90 tracking-tight">{to}</p>
              <p className="text-[12px] sm:text-[14px] text-[#71717A] font-medium">Target</p>
            </div>
            <span className="text-[22px] sm:text-[28px] shrink-0">{toFlag}</span>
          </div>
        </div>

        {/* Converted Amount — Hero */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          // 📱 RESPONSIVE: Fluid padding on hero block
          className="text-center p-4 sm:p-5 rounded-xl sm:rounded-2xl mb-3 sm:mb-4"
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.06), rgba(5, 150, 105, 0.03))',
            border: '1px solid rgba(16, 185, 129, 0.1)',
          }}
        >
          <p className="text-[10px] sm:text-[11px] text-emerald-400/60 font-semibold uppercase tracking-wider mb-1.5 sm:mb-2">Converted Amount</p>
          {/* 📱 RESPONSIVE: Fluid converted amount — scales from 28px on iPhone SE to 38px on desktop */}
          <p className="text-[28px] sm:text-[33px] md:text-[38px] font-bold text-emerald-400 tracking-[-0.03em] leading-none break-all">
            {formatted}
          </p>
          <p className="text-[12px] sm:text-[14px] text-[#A1A1AA] mt-1.5 sm:mt-2 font-semibold">{to}</p>
        </motion.div>

        {/* Rate Footer */}
        {/* 📱 RESPONSIVE: Stack vertically on very narrow screens */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 text-[10px] sm:text-[11px] text-[#52525B]">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 shrink-0" />
            <span className="font-medium truncate">1 {from} = {rate} {to}</span>
          </div>
          <span className="truncate">{source && timestamp ? `${source} · ${timestamp}` : source || timestamp}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default CurrencyWidget;
