import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

// ============================================================================
// ✅ ActionReceiptWidget — Apple Premium System Notification
// ============================================================================
// Design DNA: iOS 17 Dynamic Island / System Notification Pill
// Features: 32px backdrop blur, highly compact pill design, System Green 
// success indicator, and smooth spring-based physics for entry/exit.
// ============================================================================

const ActionReceiptWidget = ({ data }) => {
  const { message = 'Action completed' } = data || {};

  // Strip the "RECEIPT:" prefix and extract clean message
  const cleanMessage = (() => {
    const raw = message || 'Action completed';
    const stripped = raw.replace(/^RECEIPT:/i, '').trim();
    // If format is "Type:Message", extract just the message
    const colonIdx = stripped.indexOf(':');
    if (colonIdx > 0 && colonIdx < 20) {
      return stripped.substring(colonIdx + 1).trim() || stripped;
    }
    return stripped;
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="relative flex items-center gap-3 mt-4 px-4 py-3.5 rounded-full w-full sm:w-fit max-w-full sm:max-w-[400px] shadow-xl overflow-hidden"
      style={{
        background: 'rgba(28, 28, 30, 0.75)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 12px 32px -8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
      }}
    >
      {/* ─── Subtle Success Glow ─── */}
      <div className="absolute left-0 w-16 h-full pointer-events-none opacity-20" style={{
        background: 'radial-gradient(circle at 0% 50%, #30D158 0%, transparent 100%)',
      }} />

      {/* ─── Check Icon ─── */}
      <div className="relative flex items-center justify-center shrink-0">
        <CheckCircle2 className="w-5 h-5 text-[#30D158]" strokeWidth={2.5} />
      </div>

      {/* ─── Message Text ─── */}
      <p className="relative z-10 text-[14px] font-semibold text-white/95 tracking-tight leading-snug truncate pr-2">
        {cleanMessage}
      </p>

    </motion.div>
  );
};

export default ActionReceiptWidget;