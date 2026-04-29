import React from 'react';
import { motion } from 'framer-motion';
import { Pill, AlertTriangle, ShieldAlert, Info, Factory, Activity, FileText } from 'lucide-react';

// ============================================================================
// 💊 MedicineWidget — Apple Premium Clinical Drug Card
// ============================================================================
// Design DNA: iOS 17 Health App / Cupertino Glassmorphism
// Features: 32px backdrop blur, highly legible typographic hierarchy for dense
// medical text, and adaptive ambient glows (Cyan default, Red for Black Box).
// ============================================================================

const MedicineWidget = ({ data }) => {
  const {
    name = 'Unknown', genericName, brandNames, purpose, dosage,
    warnings, interactions, adverseReactions, manufacturer,
    hasBlackBoxWarning = false, disclaimer, error,
  } = data || {};

  // ─── Error State ───
  if (error) {
    return (
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[460px] rounded-[24px] sm:rounded-[28px] p-5 mt-5"
        style={{ background: 'rgba(28, 28, 30, 0.8)', border: '1px solid rgba(255,69,58,0.2)' }}>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#FF453A] shrink-0" />
          <span className="text-[13px] text-[#FF453A] font-medium tracking-tight break-words">{error}</span>
        </div>
      </motion.div>
    );
  }

  const safeBrandNames = brandNames || [];
  const safeWarnings = warnings || [];

  // Adaptive Theme: Red for Black Box warnings, Cyan for standard meds
  const themeColor = hasBlackBoxWarning ? '#FF453A' : '#32ADE6';
  const IconColor = hasBlackBoxWarning ? '#FF453A' : '#32ADE6';

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
      {/* ─── Ambient Clinical Glow ─── */}
      <div className="absolute top-0 right-0 w-3/4 h-40 pointer-events-none opacity-20" style={{
        background: `radial-gradient(ellipse at 80% -20%, ${themeColor} 0%, transparent 70%)`,
        filter: 'blur(40px)',
      }} />

      <div className="relative z-10 p-5 sm:p-6">

        {/* ─── Header: Drug Name & FDA Badge ─── */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
              style={{ background: `rgba(${hasBlackBoxWarning ? '255, 69, 58' : '50, 173, 230'}, 0.15)` }}>
              <Pill className="w-6 h-6" style={{ color: IconColor }} />
            </div>
            <div className="min-w-0 flex flex-col pt-0.5">
              <h2 className="text-[22px] sm:text-[24px] font-bold text-white tracking-tight leading-none capitalize truncate pr-2">
                {name}
              </h2>
              {genericName && genericName.toLowerCase() !== name.toLowerCase() && (
                <p className="text-[13px] text-white/50 font-medium tracking-wide mt-1.5 capitalize">
                  {genericName}
                </p>
              )}
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md shrink-0"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
            FDA Data
          </span>
        </div>

        {/* ─── Black Box Warning (Highest Priority) ─── */}
        {hasBlackBoxWarning && (
          <div className="mb-4 p-4 rounded-[20px]" style={{ background: 'rgba(255, 69, 58, 0.1)', border: '1px solid rgba(255, 69, 58, 0.2)' }}>
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="w-4 h-4 text-[#FF453A]" />
              <span className="text-[13px] font-bold text-[#FF453A] uppercase tracking-wider">Black Box Warning</span>
            </div>
            <p className="text-[13px] text-white/90 font-medium leading-relaxed">
              This medication carries a severe FDA warning. Please consult your doctor regarding critical safety risks.
            </p>
          </div>
        )}

        {/* ─── Brand Names Chips ─── */}
        {safeBrandNames.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {safeBrandNames.slice(0, 4).map((brand, i) => (
              <span key={i} className="px-2.5 py-1 rounded-full text-[11px] font-semibold text-white/70"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.05)' }}>
                {brand}
              </span>
            ))}
          </div>
        )}

        {/* ─── Clinical Data Grid ─── */}
        <div className="flex flex-col gap-3">

          {/* Purpose */}
          {purpose && (
            <div className="p-4 rounded-[20px]" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="flex items-center gap-2 mb-1.5">
                <Info className="w-4 h-4 text-[#32ADE6]" />
                <span className="text-[12px] font-semibold text-white/60 tracking-tight">Purpose & Indication</span>
              </div>
              <p className="text-[13.5px] sm:text-[14px] text-white/90 font-medium leading-relaxed">
                {purpose}
              </p>
            </div>
          )}

          {/* Dosage */}
          {dosage && (
            <div className="p-4 rounded-[20px]" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="flex items-center gap-2 mb-1.5">
                <FileText className="w-4 h-4 text-[#32ADE6]" />
                <span className="text-[12px] font-semibold text-white/60 tracking-tight">Dosage</span>
              </div>
              <p className="text-[13.5px] sm:text-[14px] text-white/90 font-medium leading-relaxed line-clamp-4">
                {dosage}
              </p>
            </div>
          )}

          {/* Adverse Reactions (Side Effects) */}
          {adverseReactions && (
            <div className="p-4 rounded-[20px]" style={{ background: 'rgba(255, 159, 10, 0.05)', border: '1px solid rgba(255, 159, 10, 0.1)' }}>
              <div className="flex items-center gap-2 mb-1.5">
                <Activity className="w-4 h-4 text-[#FF9F0A]" />
                <span className="text-[12px] font-semibold text-[#FF9F0A] tracking-tight opacity-90">Side Effects</span>
              </div>
              <p className="text-[13.5px] sm:text-[14px] text-white/80 font-medium leading-relaxed line-clamp-3">
                {adverseReactions}
              </p>
            </div>
          )}

          {/* Specific Warnings */}
          {safeWarnings.length > 0 && !hasBlackBoxWarning && (
            <div className="p-4 rounded-[20px]" style={{ background: 'rgba(255, 69, 58, 0.05)', border: '1px solid rgba(255, 69, 58, 0.1)' }}>
              <div className="flex items-center gap-2 mb-1.5">
                <AlertTriangle className="w-4 h-4 text-[#FF453A]" />
                <span className="text-[12px] font-semibold text-[#FF453A] tracking-tight opacity-90">Warnings</span>
              </div>
              <p className="text-[13px] text-white/80 font-medium leading-relaxed line-clamp-3">
                {safeWarnings[0]}
              </p>
            </div>
          )}

        </div>

        {/* ─── Footer: Manufacturer & Disclaimer ─── */}
        <div className="mt-5 pt-4 flex flex-col gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>

          {manufacturer && (
            <div className="flex items-center gap-2 text-white/40">
              <Factory className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[11px] font-semibold tracking-wide truncate uppercase">
                Mfg: {manufacturer}
              </span>
            </div>
          )}

          <div className="p-3 rounded-[12px]" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <span className="text-[10px] text-white/30 font-semibold uppercase tracking-wider leading-relaxed block text-center">
              {disclaimer || 'Not medical advice. Consult a healthcare provider.'}
            </span>
          </div>

        </div>

      </div>
    </motion.div>
  );
};

export default MedicineWidget;