import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRightLeft, TrendingUp, AlertTriangle, Globe, Clock } from 'lucide-react';

// ============================================================================
// 💱 CurrencyWidget — Apple Premium Exchange Card
// ============================================================================
// Design DNA: iOS 17 Wallet / Cupertino Glassmorphism
// Features: 32px backdrop blur, soft emerald ambient glow, tabular numerals,
// and a highly legible hierarchical layout for financial data.
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
    source = 'European Central Bank',
    error,
  } = data || {};

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

  // ─── Number Formatting ───
  const formatNum = (num) => {
    const val = typeof num === 'number' ? num : parseFloat(num) || 0;
    return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  };

  const formattedInput = formatNum(inputAmount);
  const formattedConverted = formatNum(convertedAmount);
  const formattedRate = formatNum(rate);

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
      {/* ─── Ambient Emerald Glow ─── */}
      <div className="absolute top-0 right-0 w-full h-40 pointer-events-none opacity-20" style={{
        background: 'radial-gradient(ellipse at 50% -20%, #30D158 0%, transparent 60%)',
        filter: 'blur(40px)',
      }} />

      <div className="relative z-10 p-5 sm:p-6">

        {/* ─── Header: Conversion Title ─── */}
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(48, 209, 88, 0.15)' }}>
            <Globe className="w-4 h-4 text-[#30D158]" />
          </div>
          <span className="text-[14px] font-semibold text-white/80 tracking-tight uppercase">Currency Exchange</span>
        </div>

        {/* ─── Main Conversion Block ─── */}
        <div className="relative flex flex-col gap-2 mb-6">

          {/* Source Currency */}
          <div className="flex items-center justify-between p-4 rounded-[20px]" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex flex-col">
              <span className="text-[12px] text-white/50 font-medium tracking-wide uppercase mb-1">From</span>
              <span className="text-[24px] sm:text-[28px] font-bold text-white/90 tabular-nums leading-none tracking-tight">
                {formattedInput}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full">
              <span className="text-[18px]">{fromFlag}</span>
              <span className="text-[15px] font-bold text-white/90">{from}</span>
            </div>
          </div>

          {/* Swap Icon / Separator */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center shadow-lg z-10"
            style={{
              background: '#1C1C1E',
              border: '4px solid rgba(20, 20, 22, 0.65)'
            }}>
            <ArrowRightLeft className="w-4 h-4 text-[#30D158]" />
          </div>

          {/* Target Currency (Accentuated) */}
          <div className="flex items-center justify-between p-4 rounded-[20px]" style={{ background: 'rgba(48, 209, 88, 0.08)', border: '1px solid rgba(48, 209, 88, 0.15)' }}>
            <div className="flex flex-col">
              <span className="text-[12px] text-[#30D158] font-medium tracking-wide uppercase opacity-80 mb-1">To</span>
              <span className="text-[28px] sm:text-[32px] font-bold text-white tabular-nums leading-none tracking-tight">
                {formattedConverted}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(48, 209, 88, 0.15)' }}>
              <span className="text-[18px]">{toFlag}</span>
              <span className="text-[15px] font-bold text-[#30D158]">{to}</span>
            </div>
          </div>
        </div>

        {/* ─── Footer: Rate & Source Details ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-white/5">

          {/* Rate Pill */}
          <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-[12px] w-fit">
            <TrendingUp className="w-3.5 h-3.5 text-white/50" />
            <span className="text-[12px] font-semibold text-white/70">
              1 {from} = {formattedRate} {to}
            </span>
          </div>

          {/* Meta Info */}
          <div className="flex flex-col sm:items-end justify-center">
            {source && (
              <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">
                {source}
              </span>
            )}
            {timestamp && (
              <div className="flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3 text-white/30" />
                <span className="text-[11px] font-medium text-white/40">{timestamp}</span>
              </div>
            )}
          </div>

        </div>
      </div>
    </motion.div>
  );
};

export default CurrencyWidget;