import React from 'react';
import { motion } from 'framer-motion';
import { Languages, ArrowDown, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';

// ============================================================================
// 🌐 TranslateWidget — Apple Premium Translation Card
// ============================================================================
// Design DNA: iOS 17 Apple Translate / Cupertino Glassmorphism
// Features: 32px backdrop blur, ambient indigo glow, fluid typography for 
// non-Latin scripts, and elegant overlapping glass panels.
// ============================================================================

const TranslateWidget = ({ data }) => {
  const {
    original = '',
    translated = '',
    fromLanguage = 'Source',
    toLanguage = 'Target',
    fromCode = '',
    toCode = '',
    needsRomanization = false,
    quality,
    poweredBy = '',
    error,
  } = data || {};

  // ─── Error State ───
  if (error) {
    return (
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[440px] rounded-[24px] sm:rounded-[28px] p-5 mt-5"
        style={{ background: 'rgba(28, 28, 30, 0.8)', border: '1px solid rgba(255,69,58,0.2)' }}>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#FF453A] shrink-0" />
          <span className="text-[13px] text-[#FF453A] font-medium tracking-tight break-words">{error}</span>
        </div>
      </motion.div>
    );
  }

  const themeColor = '#5E5CE6'; // iOS System Indigo

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
      {/* ─── Ambient Translation Glow ─── */}
      <div className="absolute top-0 right-0 w-full h-48 pointer-events-none opacity-20" style={{
        background: `radial-gradient(ellipse at 80% -20%, ${themeColor} 0%, transparent 70%)`,
        filter: 'blur(40px)',
      }} />

      <div className="relative z-10 p-5 sm:p-6 pb-6">

        {/* ─── Header ─── */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(94, 92, 230, 0.15)' }}>
              <Languages className="w-4 h-4 text-[#5E5CE6]" />
            </div>
            <span className="text-[14px] font-semibold text-white/80 tracking-tight uppercase">Translation</span>
          </div>
          {quality && (
            <div className="flex items-center gap-1 text-[#30D158]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold uppercase tracking-wider">{quality}</span>
            </div>
          )}
        </div>

        {/* ─── Dual Pane Container ─── */}
        <div className="relative flex flex-col gap-2">

          {/* Source Pane */}
          <div className="flex flex-col p-4 sm:p-5 rounded-[24px]"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-white/60"
                style={{ background: 'rgba(255,255,255,0.08)' }}>
                {fromLanguage}
              </span>
              {fromCode && <span className="text-[10px] text-white/30 font-mono uppercase">{fromCode}</span>}
            </div>
            <p className="text-[15px] sm:text-[17px] text-white/70 font-medium leading-relaxed break-words">
              {original}
            </p>
          </div>

          {/* Floating Intersection Arrow */}
          <div className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center shadow-lg z-10"
            style={{ background: '#1C1C1E', border: '3px solid rgba(20, 20, 22, 0.8)' }}>
            <ArrowDown className="w-3.5 h-3.5 text-[#5E5CE6]" />
          </div>

          {/* Target Pane */}
          <div className="flex flex-col p-4 sm:p-5 rounded-[24px]"
            style={{ background: 'rgba(94, 92, 230, 0.1)', border: '1px solid rgba(94, 92, 230, 0.2)' }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-[#5E5CE6]"
                style={{ background: 'rgba(94, 92, 230, 0.15)' }}>
                {toLanguage}
              </span>
              {toCode && <span className="text-[10px] text-[#5E5CE6]/50 font-mono uppercase">{toCode}</span>}
              {needsRomanization && (
                <span className="ml-auto text-[10px] font-semibold text-[#5E5CE6] opacity-80 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Non-Latin
                </span>
              )}
            </div>
            <p
              className="text-white font-semibold leading-snug break-words"
              style={{
                fontSize: needsRomanization ? 'clamp(18px, 4vw, 22px)' : 'clamp(16px, 3vw, 20px)',
                letterSpacing: needsRomanization ? '0.01em' : '-0.01em',
              }}
            >
              {translated}
            </p>
          </div>

        </div>

        {/* ─── Footer ─── */}
        {poweredBy && (
          <div className="mt-4 text-right">
            <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">
              Powered by {poweredBy}
            </span>
          </div>
        )}

      </div>
    </motion.div>
  );
};

export default TranslateWidget;