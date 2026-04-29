import React from 'react';
import { motion } from 'framer-motion';
import { Globe, Sparkles } from 'lucide-react';

// ============================================================================
// 🔍 SearchWidget — Apple Premium Deep Research Indicator
// ============================================================================
// Design DNA: iOS 17 Siri / Dynamic Island Activity
// Features: 32px backdrop blur, centralized indigo ambient glow, fluid 
// breathing animations, and staggered scanning dots to indicate active network.
// ============================================================================

const SearchWidget = ({ data }) => {
  const { query = 'Scanning the live internet...' } = data || {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -5, scale: 0.98 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full max-w-[420px] rounded-[28px] overflow-hidden mt-4 shadow-2xl"
      style={{
        background: 'rgba(20, 20, 22, 0.65)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 16px 32px -8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
      }}
    >
      {/* ─── Ambient Deep Research Glow ─── */}
      <div className="absolute inset-0 pointer-events-none opacity-20" style={{
        background: 'radial-gradient(ellipse at 50% 50%, #5E5CE6 0%, transparent 60%)',
        filter: 'blur(30px)',
      }} />

      <div className="relative z-10 flex items-center gap-4 p-4 sm:p-5">

        {/* ─── Animated Activity Ring ─── */}
        <div className="relative flex items-center justify-center w-12 h-12 rounded-full shrink-0">
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{ scale: [1, 1.35, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            style={{ border: '2px solid #5E5CE6' }}
          />
          <div className="relative w-10 h-10 rounded-full flex items-center justify-center shadow-inner"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <Globe className="w-5 h-5 text-[#5E5CE6]" />
          </div>
        </div>

        {/* ─── Query Text ─── */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3 h-3 text-[#5E5CE6]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/50">
              Deep Research
            </span>
          </div>
          <p className="text-[14px] sm:text-[15px] font-medium text-white/90 truncate leading-snug">
            {query}
          </p>
        </div>

        {/* ─── Staggered Scanning Dots ─── */}
        <div className="flex items-center gap-1.5 shrink-0 px-2">
          {[0, 0.2, 0.4].map((delay, i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: '#5E5CE6' }}
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
              transition={{ repeat: Infinity, duration: 1.2, delay, ease: 'easeInOut' }}
            />
          ))}
        </div>

      </div>
    </motion.div>
  );
};

export default SearchWidget;