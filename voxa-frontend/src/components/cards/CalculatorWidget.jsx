import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, FunctionSquare, Equal, ChevronDown, AlertTriangle, Layers } from 'lucide-react';

// ============================================================================
// 🧮 CalculatorWidget — Apple Premium Math Solver
// ============================================================================
// Design DNA: iOS 17 Calculator / Cupertino Glassmorphism
// Features: 32px backdrop blur, ambient indigo analytical glow, precise 
// tabular numerals, and elegantly animated expandable step-by-step breakdowns.
// ============================================================================

const TYPE_LABELS = {
  arithmetic: 'Arithmetic', percentage_value: 'Percentage', percentage_what: 'Percentage',
  tip: 'Tip Calculator', discount: 'Discount', unit_conversion: 'Conversion',
  bmi: 'BMI Calculator', compound_interest: 'Compound Interest',
  simple_interest: 'Simple Interest', age: 'Age Calculator',
};

const CalculatorWidget = ({ data }) => {
  const {
    expression = '', result = '0', formula, steps,
    type = 'arithmetic', extras, error,
  } = data || {};

  const safeSteps = steps || [];
  const [showSteps, setShowSteps] = useState(false);

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

  const themeColor = '#5E5CE6'; // iOS System Indigo

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
      {/* ─── Ambient Analytical Glow ─── */}
      <div className="absolute top-0 right-0 w-3/4 h-48 pointer-events-none opacity-20" style={{
        background: `radial-gradient(ellipse at 80% -20%, ${themeColor} 0%, transparent 70%)`,
        filter: 'blur(40px)',
      }} />

      <div className="relative z-10 p-5 sm:p-6 pb-6">

        {/* ─── Header: Mode & Label ─── */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(94, 92, 230, 0.15)' }}>
              <Calculator className="w-4 h-4 text-[#5E5CE6]" />
            </div>
            <span className="text-[14px] font-semibold text-white/80 tracking-tight uppercase">Solver</span>
          </div>
          <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider px-2 py-1 rounded-md"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)' }}>
            {TYPE_LABELS[type] || 'Calculation'}
          </span>
        </div>

        {/* ─── Primary Calculation Display ─── */}
        <div className="flex flex-col gap-1 mb-5 text-right">
          <div className="flex items-center justify-end gap-2 text-white/50 mb-1">
            <span className="text-[16px] sm:text-[18px] font-medium leading-none break-words">
              {expression}
            </span>
            <Equal className="w-4 h-4 shrink-0" />
          </div>

          <div className="w-full text-right">
            <span className="text-[44px] sm:text-[52px] font-bold text-white tracking-tighter leading-none tabular-nums break-all drop-shadow-sm">
              {result}
            </span>
          </div>

          {formula && (
            <div className="flex items-center justify-end gap-1.5 mt-2">
              <FunctionSquare className="w-3.5 h-3.5 text-[#5E5CE6]" />
              <span className="text-[12px] font-medium text-white/40 tracking-wider">
                {formula}
              </span>
            </div>
          )}
        </div>

        {/* ─── Extra Variables Grid ─── */}
        {extras && Object.keys(extras).length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {Object.entries(extras).map(([key, val], i) => (
              <div key={key} className="flex flex-col p-3 rounded-[16px]" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wider mb-1 truncate">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span className="text-[15px] font-semibold text-white/90 tabular-nums leading-tight break-words">
                  {val}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ─── Step-by-Step Expansion ─── */}
        {safeSteps.length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setShowSteps(!showSteps)}
              className="flex items-center gap-1.5 text-[12px] font-semibold text-[#5E5CE6] hover:text-[#7d7aff] transition-colors w-full p-2"
            >
              <Layers className="w-4 h-4" />
              {showSteps ? 'Hide steps' : 'View step-by-step solution'}
              <motion.div animate={{ rotate: showSteps ? 180 : 0 }} transition={{ duration: 0.3 }} className="ml-auto">
                <ChevronDown className="w-4 h-4" />
              </motion.div>
            </button>

            <AnimatePresence>
              {showSteps && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-col gap-2.5 mt-3 pt-3 px-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    {safeSteps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <span className="text-[11px] font-bold text-[#5E5CE6] bg-[#5E5CE6]/10 w-5 h-5 flex items-center justify-center rounded-full shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="text-[13px] text-white/80 font-medium leading-relaxed">
                          {step}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

      </div>
    </motion.div>
  );
};

export default CalculatorWidget;