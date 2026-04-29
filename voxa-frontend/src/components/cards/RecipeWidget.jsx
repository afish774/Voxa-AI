import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, PlayCircle, ExternalLink, ChevronDown, Globe, Utensils, AlertTriangle, Sparkles } from 'lucide-react';

// ============================================================================
// 🍳 RecipeWidget — Apple Premium Culinary Card
// ============================================================================
// Design DNA: iOS 17 Apple News+ / Cupertino Glassmorphism
// Features: Cinematic edge-to-edge thumbnail with gradient blend, 32px 
// backdrop blur, elegant typography, and frosted nested panels for ingredients.
// ============================================================================

const RecipeWidget = ({ data }) => {
  const {
    name = 'Recipe', category, area, thumbnail, ingredients,
    instructions, youtubeUrl, sourceUrl, error,
  } = data || {};

  const safeIngredients = ingredients || [];
  const safeInstructions = instructions || '';

  const [isExpanded, setIsExpanded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

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

  const shortInstructions = safeInstructions.length > 150
    ? safeInstructions.substring(0, 150) + '...'
    : safeInstructions;

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
      {/* ─── Cinematic Thumbnail Header ─── */}
      <div className="relative w-full h-48 sm:h-56 bg-[#111112]">

        {/* Loading Skeleton */}
        <AnimatePresence>
          {!imageLoaded && (
            <motion.div
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <ChefHat className="w-6 h-6 text-white/20" />
            </motion.div>
          )}
        </AnimatePresence>

        {thumbnail && (
          <img
            src={thumbnail}
            alt={name}
            onLoad={() => setImageLoaded(true)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-out
              ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        )}

        {/* Seamless Gradient Fade */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'linear-gradient(to bottom, rgba(20,20,22,0.1) 0%, rgba(20,20,22,0.4) 50%, rgba(20,20,22,0.9) 90%, rgba(20,20,22,1) 100%)'
        }} />

        {/* Floating Badges */}
        <div className="absolute top-5 left-5 right-5 flex items-start justify-between z-10">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.15)' }}>
            <Utensils className="w-3.5 h-3.5 text-[#FF9F0A]" />
            <span className="text-[11px] font-bold text-white uppercase tracking-wider">{category || 'Culinary'}</span>
          </div>
          {area && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.15)' }}>
              <Globe className="w-3.5 h-3.5 text-[#32ADE6]" />
              <span className="text-[11px] font-bold text-white uppercase tracking-wider">{area}</span>
            </div>
          )}
        </div>
      </div>

      <div className="relative z-10 px-5 sm:px-6 pb-6 -mt-6">

        {/* ─── Title ─── */}
        <h2 className="text-[26px] sm:text-[30px] font-bold text-white tracking-tight leading-none drop-shadow-md mb-6">
          {name}
        </h2>

        {/* ─── Ingredients Grid ─── */}
        {safeIngredients.length > 0 && (
          <div className="mb-6 p-4 rounded-[20px]" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-[#FF9F0A]" />
              <span className="text-[13px] font-semibold text-white/80 tracking-tight uppercase">Ingredients</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
              {safeIngredients.map((ing, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FF9F0A] opacity-60 mt-1.5 shrink-0" />
                  <span className="text-[14px] text-white/90 font-medium leading-snug">{ing}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Instructions (Expandable) ─── */}
        {safeInstructions && (
          <div className="relative mb-6">
            <h3 className="text-[15px] font-semibold text-white tracking-tight mb-2">Instructions</h3>
            <motion.div
              animate={{ height: isExpanded ? 'auto' : '65px' }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              className="overflow-hidden"
            >
              <p className="text-[14px] sm:text-[15px] text-white/70 leading-relaxed font-medium whitespace-pre-line">
                {isExpanded ? safeInstructions : shortInstructions}
              </p>
            </motion.div>

            {safeInstructions.length > 150 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 mt-2 text-[13px] font-semibold text-[#FF9F0A] hover:opacity-80 transition-opacity active:scale-95"
              >
                {isExpanded ? 'Show less' : 'Read more'}
                <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
                  <ChevronDown className="w-3.5 h-3.5" />
                </motion.div>
              </button>
            )}
          </div>
        )}

        {/* ─── Action Buttons ─── */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          {youtubeUrl && (
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3.5 rounded-[16px] text-[15px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: '#FF453A', boxShadow: '0 8px 16px -4px rgba(255, 69, 58, 0.3)' }}
            >
              <PlayCircle className="w-5 h-5" strokeWidth={2} /> Watch Video
            </a>
          )}
          {sourceUrl && (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3.5 rounded-[16px] text-[14px] font-semibold text-white transition-all active:scale-[0.98]"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              Source Recipe <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>

      </div>
    </motion.div>
  );
};

export default RecipeWidget;