import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChefHat, Play, ExternalLink, ChevronDown, Globe } from 'lucide-react';

// ============================================================================
// 🍳 RecipeWidget — Culinary Recipe Card
// ============================================================================
// Payload shape (from getRecipeTool):
//   name, category, area, thumbnail, ingredients[], instructions,
//   youtubeUrl, sourceUrl
// ============================================================================

const RecipeWidget = ({ data }) => {
  const {
    name = 'Recipe', category, area, thumbnail, ingredients,
    instructions, youtubeUrl, sourceUrl, error,
  } = data || {};
  // 🧹 QA FIX: Null-safe array and string — destructuring defaults bypass explicit null
  const safeIngredients = ingredients || [];
  const safeInstructions = instructions || '';
  const [showInstructions, setShowInstructions] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  if (error) {
    return (
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
        // 📱 RESPONSIVE: Fluid error card
        className="w-full max-w-[440px] rounded-[24px] sm:rounded-[28px] p-4 sm:p-6 mt-5"
        style={{ background: '#0B0B0C', border: '1px solid rgba(239,68,68,0.12)' }}>
        <span className="text-[12px] sm:text-[13px] text-red-400 font-medium break-words">{error}</span>
      </motion.div>
    );
  }

  // 🧹 QA FIX: Use safeInstructions for length check to prevent null.length crash
  const shortInstructions = safeInstructions.length > 200
    ? safeInstructions.substring(0, 200) + '...'
    : safeInstructions;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      // 📱 RESPONSIVE: Fluid width, responsive corners
      className="relative w-full max-w-[460px] rounded-[24px] sm:rounded-[28px] md:rounded-[32px] overflow-hidden mt-5"
      style={{
        background: '#0B0B0C',
        border: '1px solid rgba(249, 115, 22, 0.08)',
        boxShadow: '0 32px 64px -16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      {/* Hero Image — 📱 RESPONSIVE: Full-width on all devices */}
      {thumbnail && !imgError && (
        <div className="relative w-full" style={{ aspectRatio: '16 / 9' }}>
          {!imgLoaded && (
            <div className="absolute inset-0 animate-pulse" style={{ background: 'rgba(30,30,35,1)' }} />
          )}
          <img
            src={thumbnail}
            alt={name}
            className={`w-full h-full object-cover transition-opacity duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'linear-gradient(to top, #0B0B0C 0%, rgba(11,11,12,0.6) 40%, transparent 100%)',
          }} />
          {/* Title overlay */}
          {/* 📱 RESPONSIVE: Fluid overlay padding */}
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 md:p-6">
            {/* 📱 RESPONSIVE: Fluid title text, line-clamp for long recipe names */}
            <h3 className="text-[17px] sm:text-[18px] md:text-[20px] font-bold text-white/95 tracking-[-0.02em] leading-tight line-clamp-2">{name}</h3>
            {/* 📱 RESPONSIVE: Wrap category + area tags */}
            <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 mt-1 sm:mt-1.5 text-[11px] sm:text-[12px] text-[#A1A1AA]">
              {category && <span className="px-1.5 sm:px-2 py-0.5 rounded-md font-semibold" style={{
                background: 'rgba(249,115,22,0.12)', color: '#FB923C',
              }}>{category}</span>}
              {area && (
                <span className="flex items-center gap-1">
                  <Globe className="w-3 h-3" />{area}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* No-image header fallback */}
      {(!thumbnail || imgError) && (
        // 📱 RESPONSIVE: Mobile-first padding
        <div className="p-4 sm:p-5 md:p-7 pb-2 sm:pb-3">
          <div className="flex items-center gap-2 mb-2">
            <ChefHat className="w-4 h-4 text-orange-400/70" />
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.12em] text-orange-400/70">Recipe</span>
          </div>
          {/* 📱 RESPONSIVE: line-clamp-2 for long recipe names */}
          <h3 className="text-[17px] sm:text-[18px] md:text-[20px] font-bold text-white/95 tracking-[-0.02em] line-clamp-2">{name}</h3>
          <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 mt-1 text-[11px] sm:text-[12px] text-[#71717A]">
            {category && <span>{category}</span>}
            {area && <><span>·</span><span>{area}</span></>}
          </div>
        </div>
      )}

      {/* 📱 RESPONSIVE: Mobile-first content padding */}
      <div className="relative z-10 px-4 sm:px-5 md:px-7 pb-5 md:pb-6" style={{ marginTop: thumbnail && !imgError ? '-4px' : '8px' }}>
        {/* Ingredients Grid — uses safeIngredients */}
        {safeIngredients.length > 0 && (
          <div className="mb-3 sm:mb-4">
            <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.1em] text-[#52525B] mb-2 sm:mb-2.5">Ingredients</p>
            {/* 📱 RESPONSIVE: 1 col on very small, 2 col on default mobile+ */}
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-1 sm:gap-1.5">
              {/* 🧹 QA FIX: Map over safeIngredients */}
              {safeIngredients.map((ing, i) => (
                <motion.div
                  key={`ing-${i}`}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + i * 0.03 }}
                  className="flex items-center gap-2 text-[11px] sm:text-[12px] py-1.5 px-2 sm:px-2.5 rounded-md sm:rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.02)' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#FB923C' }} />
                  {/* 📱 RESPONSIVE: Truncate long ingredient names */}
                  <span className="text-[#D4D4D8] truncate">{ing}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions — uses safeInstructions */}
        {safeInstructions && (
          <div className="mb-3 sm:mb-4">
            <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.1em] text-[#52525B] mb-1.5 sm:mb-2">Instructions</p>
            {/* 📱 RESPONSIVE: break-words prevents long instruction text from overflowing */}
            <p className="text-[11.5px] sm:text-[12.5px] text-[#A1A1AA] leading-relaxed break-words">
              {showInstructions ? safeInstructions : shortInstructions}
            </p>
            {/* 🧹 QA FIX: Use safeInstructions.length */}
            {safeInstructions.length > 200 && (
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                // 📱 RESPONSIVE: min-h-[44px] for touch target
                className="flex items-center gap-0.5 mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] font-semibold text-orange-400/70 hover:text-orange-300 transition-colors bg-transparent border-none cursor-pointer p-0 min-h-[44px] sm:min-h-0"
              >
                {showInstructions ? 'Show less' : 'Read full recipe'}
                <motion.div animate={{ rotate: showInstructions ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="w-3 h-3" />
                </motion.div>
              </button>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {/* 📱 RESPONSIVE: Wrap buttons on narrow screens, min touch target */}
        <div className="flex items-center flex-wrap gap-2">
          {youtubeUrl && (
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              // 📱 RESPONSIVE: min-h-[44px] touch target
              className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-[12px] font-semibold text-red-400 transition-colors hover:bg-red-500/10 min-h-[44px]"
              style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)' }}
            >
              <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Watch Video
            </a>
          )}
          {sourceUrl && (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              // 📱 RESPONSIVE: min-h-[44px] touch target
              className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-[12px] font-medium text-[#A1A1AA] transition-colors hover:bg-white/5 min-h-[44px]"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              Source
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default RecipeWidget;
