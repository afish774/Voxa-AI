import React from 'react';
import { motion } from 'framer-motion';
import { Languages, ArrowDown, Sparkles } from 'lucide-react';

// ============================================================================
// 🌐 TranslateWidget — Dual-Pane Translation Card
// ============================================================================
// Payload shape (from getTranslateTool):
//   original         — "Hello, how are you?"
//   translated       — "नमस्ते, आप कैसे हैं?"
//   fromLanguage     — "English"
//   toLanguage       — "Hindi"
//   fromCode         — "en"
//   toCode           — "hi"
//   needsRomanization — true (for non-Latin scripts)
//   quality          — "95%" | null
//   poweredBy        — "MyMemory Translation API"
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

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[440px] rounded-[28px] p-6 mt-5"
        style={{ background: '#0B0B0C', border: '1px solid rgba(239,68,68,0.12)' }}
      >
        <span className="text-[13px] text-red-400 font-medium">{error}</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className="relative w-full max-w-[460px] rounded-[32px] overflow-hidden mt-5"
      style={{
        background: '#0B0B0C',
        border: '1px solid rgba(99, 102, 241, 0.08)',
        boxShadow: '0 32px 64px -16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 50% 0%, rgba(99, 102, 241, 0.06) 0%, transparent 60%)',
      }} />

      <div className="relative z-10 p-7">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-indigo-400/70" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-indigo-400/70">Translation</span>
          </div>
          {quality && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{
              background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.12)',
            }}>
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] font-bold text-emerald-400">{quality} match</span>
            </div>
          )}
        </div>

        {/* Original Text Pane */}
        <div className="p-4 rounded-2xl mb-3" style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.05)',
        }}>
          <div className="flex items-center gap-2 mb-2.5">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-[#A1A1AA]" style={{
              background: 'rgba(255,255,255,0.06)',
            }}>
              {fromLanguage}
            </span>
            {fromCode && (
              <span className="text-[10px] text-[#52525B] font-mono uppercase">{fromCode}</span>
            )}
          </div>
          <p className="text-[15px] text-[#D4D4D8] leading-relaxed font-normal">{original}</p>
        </div>

        {/* Arrow Divider */}
        <div className="flex justify-center -my-1.5 relative z-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.15)',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.1)',
            }}
          >
            <ArrowDown className="w-4 h-4 text-indigo-400" />
          </motion.div>
        </div>

        {/* Translated Text Pane */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="p-4 rounded-2xl mt-3"
          style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.06), rgba(139, 92, 246, 0.03))',
            border: '1px solid rgba(99, 102, 241, 0.1)',
          }}
        >
          <div className="flex items-center gap-2 mb-2.5">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-indigo-400" style={{
              background: 'rgba(99, 102, 241, 0.12)',
            }}>
              {toLanguage}
            </span>
            {toCode && (
              <span className="text-[10px] text-[#52525B] font-mono uppercase">{toCode}</span>
            )}
            {needsRomanization && (
              <span className="text-[9px] text-[#52525B] font-medium ml-auto">Non-Latin Script</span>
            )}
          </div>
          <p
            className="text-white/95 leading-relaxed font-medium"
            style={{
              fontSize: needsRomanization ? '18px' : '16px',
              lineHeight: needsRomanization ? '1.7' : '1.6',
              letterSpacing: needsRomanization ? '0.01em' : '-0.01em',
            }}
          >
            {translated}
          </p>
        </motion.div>

        {/* Footer */}
        {poweredBy && (
          <p className="text-[10px] text-[#3F3F46] text-center mt-4 font-medium">{poweredBy}</p>
        )}
      </div>
    </motion.div>
  );
};

export default TranslateWidget;
