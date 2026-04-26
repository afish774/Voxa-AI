import React from 'react';
import { motion } from 'framer-motion';
import { Calculator, Equal, ArrowRight } from 'lucide-react';

// ============================================================================
// 🧮 CalculatorWidget — Futuristic Math Solver Card
// ============================================================================
// Payload shape (from calculateTool):
//   expression — "15% of 2400"
//   result     — "360" (formatted string)
//   rawResult  — 360 (number)
//   formula    — "15% × 2400"
//   steps      — ["Step 1", "Step 2", ...]
//   type       — "percentage_value" | "arithmetic" | "bmi" | ...
//   extras     — { ... } additional computed values
// ============================================================================

const TYPE_LABELS = {
  arithmetic: 'Arithmetic', percentage_value: 'Percentage', percentage_what: 'Percentage',
  tip: 'Tip Calculator', discount: 'Discount', unit_conversion: 'Unit Conversion',
  bmi: 'BMI Calculator', compound_interest: 'Compound Interest',
  simple_interest: 'Simple Interest', age: 'Age Calculator',
};

const CalculatorWidget = ({ data }) => {
  const {
    expression = '', result = '0', formula, steps,
    type = 'arithmetic', extras, error,
  } = data || {};
  // 🧹 QA FIX: Null-safe array — destructuring default [] is bypassed when value is explicit null
  const safeSteps = steps || [];

  if (error) {
    return (
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
        // 📱 RESPONSIVE: Fluid error card
        className="w-full max-w-[420px] rounded-[24px] sm:rounded-[28px] p-4 sm:p-6 mt-5"
        style={{ background: '#0B0B0C', border: '1px solid rgba(239,68,68,0.12)' }}>
        <span className="text-[12px] sm:text-[13px] text-red-400 font-medium break-words">{error}</span>
      </motion.div>
    );
  }

  const typeLabel = TYPE_LABELS[type] || 'Calculator';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      // 📱 RESPONSIVE: Fluid width, responsive corners
      className="relative w-full max-w-[420px] rounded-[24px] sm:rounded-[28px] md:rounded-[32px] overflow-hidden mt-5"
      style={{
        background: '#0B0B0C',
        border: '1px solid rgba(139, 92, 246, 0.08)',
        boxShadow: '0 32px 64px -16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 50% 0%, rgba(139, 92, 246, 0.05) 0%, transparent 60%)',
      }} />

      {/* 📱 RESPONSIVE: Mobile-first padding */}
      <div className="relative z-10 p-4 sm:p-5 md:p-7">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4 sm:mb-5">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0" style={{
            background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.18)',
          }}>
            <Calculator className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-400" />
          </div>
          <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.12em] text-violet-400/70">{typeLabel}</span>
        </div>

        {/* Expression */}
        {/* 📱 RESPONSIVE: overflow-x-auto with hide-scrollbar for long expressions, break-all fallback */}
        <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl mb-3 sm:mb-4 overflow-x-auto" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', WebkitOverflowScrolling: 'touch' }}>
          <p className="text-[13px] sm:text-[15px] text-[#D4D4D8] font-mono font-medium tracking-tight break-all whitespace-pre-wrap">{expression}</p>
        </div>

        {/* Steps — uses safeSteps */}
        {safeSteps.length > 0 && (
          <div className="mb-3 sm:mb-4">
            <p className="text-[9px] sm:text-[10px] text-[#52525B] font-semibold uppercase tracking-wider mb-1.5 sm:mb-2">Solution Steps</p>
            <div className="flex flex-col gap-1 sm:gap-1.5">
              {/* 🧹 QA FIX: Map over safeSteps */}
              {safeSteps.map((step, i) => (
                <motion.div
                  key={`step-${i}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.06 }}
                  // 📱 RESPONSIVE: overflow-x-auto for very long math steps
                  className="flex items-start gap-2 sm:gap-2.5 py-1 sm:py-1.5 px-2.5 sm:px-3 rounded-md sm:rounded-lg overflow-x-auto"
                  style={{
                    background: i === safeSteps.length - 1 ? 'rgba(139,92,246,0.04)' : 'transparent',
                    WebkitOverflowScrolling: 'touch',
                  }}
                >
                  <span className="text-[9px] sm:text-[10px] font-bold text-[#3F3F46] mt-0.5 shrink-0 w-3 sm:w-4 text-right">{i + 1}</span>
                  <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#3F3F46] mt-0.5 shrink-0" />
                  {/* 📱 RESPONSIVE: break-all for math expressions that can be very long */}
                  <span className="text-[12px] sm:text-[13px] text-[#A1A1AA] font-mono leading-snug break-all">{step}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Formula (if different from steps) */}
        {formula && safeSteps.length === 0 && (
          // 📱 RESPONSIVE: overflow-x-auto + break-all for formulas
          <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl mb-3 sm:mb-4 overflow-x-auto" style={{ background: 'rgba(255,255,255,0.02)', WebkitOverflowScrolling: 'touch' }}>
            <p className="text-[11px] sm:text-[12px] text-[#71717A] font-mono break-all">{formula}</p>
          </div>
        )}

        {/* Result — Hero */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          // 📱 RESPONSIVE: Fluid padding
          className="p-4 sm:p-5 rounded-xl sm:rounded-2xl text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(168, 85, 247, 0.04))',
            border: '1px solid rgba(139, 92, 246, 0.12)',
          }}
        >
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
            <Equal className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-400/60" />
            <span className="text-[10px] sm:text-[11px] text-violet-400/60 font-semibold uppercase tracking-wider">Result</span>
          </div>
          {/* 📱 RESPONSIVE: Fluid result text, break-all for long numeric results */}
          <p className="text-[26px] sm:text-[30px] md:text-[36px] font-bold text-violet-300 tracking-[-0.03em] leading-none font-mono break-all">{result}</p>
        </motion.div>

        {/* Extras */}
        {extras && Object.keys(extras).length > 0 && (
          // 📱 RESPONSIVE: Grid stays 2-col, tighter gap on mobile
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mt-3 sm:mt-4">
            {Object.entries(extras).map(([key, val], i) => (
              <div key={key} className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <p className="text-[9px] sm:text-[10px] text-[#52525B] uppercase tracking-wider font-semibold mb-0.5">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </p>
                {/* 🧹 QA FIX: Null-safe val display */}
                {/* 📱 RESPONSIVE: break-all for numeric extras */}
                <p className="text-[12px] sm:text-[14px] text-[#D4D4D8] font-semibold font-mono truncate">{val ?? '--'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CalculatorWidget;
