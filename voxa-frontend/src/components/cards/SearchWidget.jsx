import React from 'react';
import { motion } from 'framer-motion';
import { Search, Globe } from 'lucide-react';

// ============================================================================
// 🔍 SearchWidget — Deep Research Indicator
// ============================================================================
// Minimalist "scanning the web" status card. Tavily search doesn't produce a
// persistent card (results are woven into the LLM's text response), so this
// widget serves as a visual indicator that deep research is underway.
//
// Payload shape (if rendered):
//   query — "What is the latest on quantum computing?"
// ============================================================================

const SearchWidget = ({ data }) => {
  const { query = 'Searching...' } = data || {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -5, scale: 0.98 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      // 📱 RESPONSIVE: w-full on mobile, constrained on desktop
      className="relative w-full max-w-[400px] rounded-xl sm:rounded-2xl overflow-hidden mt-4"
      style={{
        background: '#0B0B0C',
        border: '1px solid rgba(99, 102, 241, 0.08)',
        boxShadow: '0 16px 32px -8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      {/* Scanning animation overlay */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, rgba(99, 102, 241, 0.06) 0%, transparent 70%)',
        }}
      />

      {/* 📱 RESPONSIVE: Fluid padding, centered content */}
      <div className="relative z-10 flex items-center gap-3 sm:gap-3.5 px-4 sm:px-5 py-3.5 sm:py-4">
        {/* Animated search icon */}
        <div className="relative shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center" style={{
            background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.15)',
          }}>
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />
          </div>
          {/* Pulsing ring */}
          <motion.div
            className="absolute inset-0 rounded-lg sm:rounded-xl"
            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeOut' }}
            style={{ border: '1px solid rgba(99, 102, 241, 0.3)' }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Globe className="w-3 h-3 text-indigo-400/50" />
            <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.12em] text-indigo-400/60">Deep Research</span>
          </div>
          {/* 📱 RESPONSIVE: Truncate long search queries, break-words fallback */}
          <p className="text-[12px] sm:text-[13px] text-[#A1A1AA] font-medium truncate leading-snug">
            {query}
          </p>
        </div>

        {/* Scanning dots */}
        <div className="flex items-center gap-1 shrink-0">
          {[0, 0.2, 0.4].map((delay, i) => (
            <motion.div
              key={i}
              className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full"
              style={{ background: '#6366F1' }}
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ repeat: Infinity, duration: 1.2, delay, ease: 'easeInOut' }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default SearchWidget;
