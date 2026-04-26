import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

// ============================================================================
// ✅ ActionReceiptWidget — Minimalist Glowing Notification Pill
// ============================================================================
// Ultra-compact confirmation for actions like "Email sent", "Reminder saved".
// Replaces the inline receipt JSX in ChatDisplay.jsx with a dedicated component.
//
// Payload shape:
//   message — "RECEIPT:Reminder:Your reminder has been set for 3:00 PM"
//   (may include "RECEIPT:" prefix which gets stripped)
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
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -5, scale: 0.98 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      // 📱 RESPONSIVE: w-full on mobile, auto-width on desktop, fluid padding
      className="flex items-center gap-2.5 sm:gap-3 mt-4 px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl w-full sm:w-fit max-w-full sm:max-w-[400px]"
      style={{
        background: 'rgba(16, 185, 129, 0.06)',
        border: '1px solid rgba(16, 185, 129, 0.12)',
        boxShadow: '0 8px 24px -8px rgba(16, 185, 129, 0.1), inset 0 1px 0 rgba(16, 185, 129, 0.05)',
      }}
    >
      {/* Glow dot */}
      <div
        className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shrink-0"
        style={{
          background: 'rgba(16, 185, 129, 0.15)',
          boxShadow: '0 0 12px rgba(16, 185, 129, 0.2)',
        }}
      >
        <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" strokeWidth={3} />
      </div>

      {/* 📱 RESPONSIVE: Break long messages gracefully */}
      <span className="text-[13px] sm:text-[14px] text-[#D4D4D8] font-medium leading-snug tracking-[-0.01em] break-words min-w-0">
        {cleanMessage}
      </span>
    </motion.div>
  );
};

export default ActionReceiptWidget;
