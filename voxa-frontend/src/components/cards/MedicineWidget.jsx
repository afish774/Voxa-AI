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
    name = 'Unknown', genericName, brandNames = [], purpose, dosage,
    warnings = [], interactions, adverseReactions, manufacturer,
    hasBlackBoxWarning = false, disclaimer, error,
  } = data || {};

  if (error) {
    return (
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[460px] rounded-[28px] p-6 mt-5"
        style={{ background: '#0B0B0C', border: '1px solid rgba(239,68,68,0.12)' }}>
        <span className="text-[13px] text-red-400 font-medium">{error}</span>
      </motion.div>
    );
  }

  const warningColor = hasBlackBoxWarning ? '#EF4444' : '#F59E0B';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className="relative w-full max-w-[460px] rounded-[32px] overflow-hidden mt-5"
      style={{
        background: '#0B0B0C',
        border: `1px solid ${hasBlackBoxWarning ? 'rgba(239,68,68,0.12)' : 'rgba(6, 182, 212, 0.08)'}`,
        boxShadow: '0 32px 64px -16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse at 50% 0%, ${hasBlackBoxWarning ? 'rgba(239,68,68,0.04)' : 'rgba(6,182,212,0.04)'} 0%, transparent 60%)`,
      }} />

      <div className="relative z-10 p-7">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{
              background: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(14,165,233,0.1))',
            }}>
              <Pill className="w-[18px] h-[18px] text-cyan-400" />
            </div>
            <div>
              <h3 className="text-[18px] font-bold text-white/95 tracking-[-0.02em]">{name}</h3>
              {genericName && genericName !== name && (
                <p className="text-[12px] text-[#71717A] font-medium mt-0.5">{genericName}</p>
              )}
            </div>
          </div>
          {hasBlackBoxWarning && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full" style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
            }}>
              <ShieldAlert className="w-3 h-3 text-red-400" />
              <span className="text-[9px] font-bold uppercase tracking-wider text-red-400">Black Box</span>
            </div>
          )}
        </div>

        {/* Brand Names */}
        {brandNames.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {brandNames.map((b, i) => (
              <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-cyan-400/80" style={{
                background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.1)',
              }}>{b}</span>
            ))}
          </div>
        )}

        {/* Purpose */}
        {purpose && (
          <div className="p-3.5 rounded-2xl mb-3" style={{ background: 'rgba(6,182,212,0.03)', border: '1px solid rgba(6,182,212,0.06)' }}>
            <p className="text-[10px] text-cyan-400/60 font-semibold uppercase tracking-wider mb-1.5">Indications & Usage</p>
            <p className="text-[13px] text-[#D4D4D8] leading-relaxed">{purpose}</p>
          </div>
        )}

        {/* Dosage */}
        {dosage && (
          <div className="p-3.5 rounded-2xl mb-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <p className="text-[10px] text-[#52525B] font-semibold uppercase tracking-wider mb-1.5">Dosage</p>
            <p className="text-[13px] text-[#A1A1AA] leading-relaxed">{dosage}</p>
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="p-3.5 rounded-2xl mb-3" style={{
            background: `${warningColor}08`,
            border: `1px solid ${warningColor}18`,
          }}>
            <div className="flex items-center gap-1.5 mb-2">
              <AlertTriangle className="w-3.5 h-3.5" style={{ color: warningColor }} />
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: warningColor }}>
                {hasBlackBoxWarning ? 'Black Box Warning' : 'Warnings'}
              </p>
            </div>
            {warnings.map((w, i) => (
              <p key={i} className="text-[12px] leading-relaxed mb-1.5 last:mb-0" style={{ color: `${warningColor}CC` }}>{w}</p>
            ))}
          </div>
        )}

        {/* Interactions */}
        {interactions && (
          <div className="p-3.5 rounded-2xl mb-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <p className="text-[10px] text-[#52525B] font-semibold uppercase tracking-wider mb-1.5">Drug Interactions</p>
            <p className="text-[12px] text-[#A1A1AA] leading-relaxed">{interactions}</p>
          </div>
        )}

        {/* Adverse Reactions */}
        {adverseReactions && (
          <div className="p-3.5 rounded-2xl mb-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <p className="text-[10px] text-[#52525B] font-semibold uppercase tracking-wider mb-1.5">Side Effects</p>
            <p className="text-[12px] text-[#A1A1AA] leading-relaxed">{adverseReactions}</p>
          </div>
        )}

        {/* Manufacturer */}
        {manufacturer && (
          <div className="flex items-center gap-1.5 mb-3 text-[11px] text-[#52525B]">
            <Factory className="w-3 h-3" />
            <span>{manufacturer}</span>
          </div>
        )}

        {/* Disclaimer */}
        <div className="flex items-start gap-1.5 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <Info className="w-3 h-3 text-[#3F3F46] mt-0.5 shrink-0" />
          <p className="text-[10px] text-[#3F3F46] leading-relaxed italic">
            {disclaimer || 'Not medical advice. Consult a qualified healthcare professional.'}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default MedicineWidget;
