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
        className="w-full max-w-[420px] rounded-[28px] p-6 mt-5"
        style={{ background: '#0B0B0C', border: '1px solid rgba(239,68,68,0.12)' }}
      >
        <span className="text-[13px] text-red-400 font-medium">{error}</span>
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
      className="relative w-full max-w-[420px] rounded-[32px] overflow-hidden mt-5"
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

      <div className="relative z-10 p-7">
        {/* Header */}
        <div className="flex items-center gap-2 mb-5">
          <ArrowRightLeft className="w-4 h-4 text-emerald-400/70" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-400/70">Currency Conversion</span>
        </div>

        {/* From → To Row */}
        <div className="flex items-center justify-between mb-6">
          {/* From */}
          <div className="flex items-center gap-3">
            <span className="text-[28px]">{fromFlag}</span>
            <div>
              <p className="text-[20px] font-bold text-white/90 tracking-tight">{from}</p>
              <p className="text-[14px] text-[#A1A1AA] font-medium">
                {parseFloat(inputAmount).toLocaleString('en-US', { maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Arrow */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.12)',
            }}
          >
            <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
          </motion.div>

          {/* To */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[20px] font-bold text-white/90 tracking-tight">{to}</p>
              <p className="text-[14px] text-[#71717A] font-medium">Target</p>
            </div>
            <span className="text-[28px]">{toFlag}</span>
          </div>
        </div>

        {/* Converted Amount — Hero */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-center p-5 rounded-2xl mb-4"
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.06), rgba(5, 150, 105, 0.03))',
            border: '1px solid rgba(16, 185, 129, 0.1)',
          }}
        >
          <p className="text-[11px] text-emerald-400/60 font-semibold uppercase tracking-wider mb-2">Converted Amount</p>
          <p className="text-[38px] font-bold text-emerald-400 tracking-[-0.03em] leading-none">
            {formatted}
          </p>
          <p className="text-[14px] text-[#A1A1AA] mt-2 font-semibold">{to}</p>
        </motion.div>

        {/* Rate Footer */}
        <div className="flex items-center justify-between text-[11px] text-[#52525B]">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span className="font-medium">1 {from} = {rate} {to}</span>
          </div>
          <span>{source && timestamp ? `${source} · ${timestamp}` : source || timestamp}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default CurrencyWidget;
