import React from 'react';
import { motion } from 'framer-motion';
import { Pill, AlertTriangle, ShieldAlert, Info, Factory } from 'lucide-react';

// ============================================================================
// 💊 MedicineWidget — Clinical Drug Information Card
// ============================================================================
// Payload shape (from getMedicineTool):
//   name, genericName, brandNames[], purpose, dosage, warnings[],
//   interactions, adverseReactions, manufacturer,
//   hasBlackBoxWarning, disclaimer
// ============================================================================

const MedicineWidget = ({ data }) => {
  const {
    name = 'Unknown', genericName, brandNames, purpose, dosage,
    warnings, interactions, adverseReactions, manufacturer,
    hasBlackBoxWarning = false, disclaimer, error,
  } = data || {};
  // 🧹 QA FIX: Null-safe arrays — destructuring default [] is bypassed when value is explicit null
  const safeBrandNames = brandNames || [];
  const safeWarnings = warnings || [];

  if (error) {
    return (
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
        // 📱 RESPONSIVE: Fluid error card
        className="w-full max-w-[460px] rounded-[24px] sm:rounded-[28px] p-4 sm:p-6 mt-5"
        style={{ background: '#0B0B0C', border: '1px solid rgba(239,68,68,0.12)' }}>
        <span className="text-[12px] sm:text-[13px] text-red-400 font-medium break-words">{error}</span>
      </motion.div>
    );
  }

  const warningColor = hasBlackBoxWarning ? '#EF4444' : '#F59E0B';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      // 📱 RESPONSIVE: Fluid width, responsive corners
      className="relative w-full max-w-[460px] rounded-[24px] sm:rounded-[28px] md:rounded-[32px] overflow-hidden mt-5"
      style={{
        background: '#0B0B0C',
        border: `1px solid ${hasBlackBoxWarning ? 'rgba(239,68,68,0.12)' : 'rgba(6, 182, 212, 0.08)'}`,
        boxShadow: '0 32px 64px -16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse at 50% 0%, ${hasBlackBoxWarning ? 'rgba(239,68,68,0.04)' : 'rgba(6,182,212,0.04)'} 0%, transparent 60%)`,
      }} />

      {/* 📱 RESPONSIVE: Mobile-first padding */}
      <div className="relative z-10 p-4 sm:p-5 md:p-7">
        {/* Header */}
        {/* 📱 RESPONSIVE: Wrap black box badge on narrow screens */}
        <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0" style={{
              background: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(14,165,233,0.1))',
            }}>
              <Pill className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-cyan-400" />
            </div>
            <div className="min-w-0">
              {/* 📱 RESPONSIVE: Fluid drug name, truncate if very long */}
              <h3 className="text-[16px] sm:text-[17px] md:text-[18px] font-bold text-white/95 tracking-[-0.02em] truncate">{name}</h3>
              {genericName && genericName !== name && (
                <p className="text-[11px] sm:text-[12px] text-[#71717A] font-medium mt-0.5 truncate">{genericName}</p>
              )}
            </div>
          </div>
          {hasBlackBoxWarning && (
            <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full shrink-0" style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
            }}>
              <ShieldAlert className="w-3 h-3 text-red-400" />
              <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-red-400">Black Box</span>
            </div>
          )}
        </div>

        {/* Brand Names — uses safeBrandNames */}
        {safeBrandNames.length > 0 && (
          // 📱 RESPONSIVE: Flex-wrap for brand name tags
          <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-3 sm:mb-4">
            {/* 🧹 QA FIX: Map over safeBrandNames */}
            {safeBrandNames.map((b, i) => (
              <span key={`brand-${i}`} className="px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold text-cyan-400/80" style={{
                background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.1)',
              }}>{b}</span>
            ))}
          </div>
        )}

        {/* Purpose */}
        {purpose && (
          // 📱 RESPONSIVE: Tighter padding, break-words for long clinical text
          <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl mb-2.5 sm:mb-3" style={{ background: 'rgba(6,182,212,0.03)', border: '1px solid rgba(6,182,212,0.06)' }}>
            <p className="text-[9px] sm:text-[10px] text-cyan-400/60 font-semibold uppercase tracking-wider mb-1 sm:mb-1.5">Indications & Usage</p>
            <p className="text-[12px] sm:text-[13px] text-[#D4D4D8] leading-relaxed break-words">{purpose}</p>
          </div>
        )}

        {/* Dosage */}
        {dosage && (
          <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl mb-2.5 sm:mb-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <p className="text-[9px] sm:text-[10px] text-[#52525B] font-semibold uppercase tracking-wider mb-1 sm:mb-1.5">Dosage</p>
            {/* 📱 RESPONSIVE: break-words for dosage instructions */}
            <p className="text-[12px] sm:text-[13px] text-[#A1A1AA] leading-relaxed break-words">{dosage}</p>
          </div>
        )}

        {/* Warnings — uses safeWarnings */}
        {safeWarnings.length > 0 && (
          <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl mb-2.5 sm:mb-3" style={{
            background: `${warningColor}08`,
            border: `1px solid ${warningColor}18`,
          }}>
            <div className="flex items-center gap-1.5 mb-1.5 sm:mb-2">
              <AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" style={{ color: warningColor }} />
              <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider" style={{ color: warningColor }}>
                {hasBlackBoxWarning ? 'Black Box Warning' : 'Warnings'}
              </p>
            </div>
            {/* 🧹 QA FIX: Map over safeWarnings */}
            {/* 📱 RESPONSIVE: break-words on each warning line */}
            {safeWarnings.map((w, i) => (
              <p key={`warn-${i}`} className="text-[11px] sm:text-[12px] leading-relaxed mb-1 sm:mb-1.5 last:mb-0 break-words" style={{ color: `${warningColor}CC` }}>{w}</p>
            ))}
          </div>
        )}

        {/* Interactions */}
        {interactions && (
          <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl mb-2.5 sm:mb-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <p className="text-[9px] sm:text-[10px] text-[#52525B] font-semibold uppercase tracking-wider mb-1 sm:mb-1.5">Drug Interactions</p>
            {/* 📱 RESPONSIVE: break-words for interaction text */}
            <p className="text-[11px] sm:text-[12px] text-[#A1A1AA] leading-relaxed break-words">{interactions}</p>
          </div>
        )}

        {/* Adverse Reactions */}
        {adverseReactions && (
          <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl mb-2.5 sm:mb-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <p className="text-[9px] sm:text-[10px] text-[#52525B] font-semibold uppercase tracking-wider mb-1 sm:mb-1.5">Side Effects</p>
            {/* 📱 RESPONSIVE: break-words for adverse reactions */}
            <p className="text-[11px] sm:text-[12px] text-[#A1A1AA] leading-relaxed break-words">{adverseReactions}</p>
          </div>
        )}

        {/* Manufacturer */}
        {manufacturer && (
          <div className="flex items-center gap-1.5 mb-2.5 sm:mb-3 text-[10px] sm:text-[11px] text-[#52525B] min-w-0">
            <Factory className="w-3 h-3 shrink-0" />
            {/* 📱 RESPONSIVE: Truncate long manufacturer names */}
            <span className="truncate">{manufacturer}</span>
          </div>
        )}

        {/* Disclaimer */}
        <div className="flex items-start gap-1.5 p-2.5 sm:p-3 rounded-lg sm:rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <Info className="w-3 h-3 text-[#3F3F46] mt-0.5 shrink-0" />
          {/* 📱 RESPONSIVE: break-words for disclaimer */}
          <p className="text-[9px] sm:text-[10px] text-[#3F3F46] leading-relaxed italic break-words">
            {disclaimer || 'Not medical advice. Consult a qualified healthcare professional.'}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default MedicineWidget;
