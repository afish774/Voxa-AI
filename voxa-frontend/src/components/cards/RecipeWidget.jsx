import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChefHat, Youtube, ExternalLink, ChevronDown, Globe } from 'lucide-react';

// ============================================================================
// 🍳 RecipeWidget — Culinary Recipe Card
// ============================================================================
// Payload shape (from getRecipeTool):
//   name, category, area, thumbnail, ingredients[], instructions,
//   youtubeUrl, sourceUrl
// ============================================================================

const RecipeWidget = ({ data }) => {
  const {
    name = 'Recipe', category, area, thumbnail, ingredients = [],
    instructions = '', youtubeUrl, sourceUrl, error,
  } = data || {};
  const [showInstructions, setShowInstructions] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  if (error) {
    return (
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[440px] rounded-[28px] p-6 mt-5"
        style={{ background: '#0B0B0C', border: '1px solid rgba(239,68,68,0.12)' }}>
        <span className="text-[13px] text-red-400 font-medium">{error}</span>
      </motion.div>
    );
  }

  const shortInstructions = instructions.length > 200
    ? instructions.substring(0, 200) + '...'
    : instructions;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className="relative w-full max-w-[460px] rounded-[32px] overflow-hidden mt-5"
      style={{
        background: '#0B0B0C',
        border: '1px solid rgba(249, 115, 22, 0.08)',
        boxShadow: '0 32px 64px -16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      {/* Hero Image */}
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
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h3 className="text-[20px] font-bold text-white/95 tracking-[-0.02em] leading-tight">{name}</h3>
            <div className="flex items-center gap-2 mt-1.5 text-[12px] text-[#A1A1AA]">
              {category && <span className="px-2 py-0.5 rounded-md font-semibold" style={{
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
        <div className="p-7 pb-3">
          <div className="flex items-center gap-2 mb-2">
            <ChefHat className="w-4 h-4 text-orange-400/70" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-orange-400/70">Recipe</span>
          </div>
          <h3 className="text-[20px] font-bold text-white/95 tracking-[-0.02em]">{name}</h3>
          <div className="flex items-center gap-2 mt-1 text-[12px] text-[#71717A]">
            {category && <span>{category}</span>}
            {area && <><span>·</span><span>{area}</span></>}
          </div>
        </div>
      )}

      <div className="relative z-10 px-7 pb-6" style={{ marginTop: thumbnail && !imgError ? '-4px' : '8px' }}>
        {/* Ingredients Grid */}
        {ingredients.length > 0 && (
          <div className="mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#52525B] mb-2.5">Ingredients</p>
            <div className="grid grid-cols-2 gap-1.5">
              {ingredients.map((ing, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + i * 0.03 }}
                  className="flex items-center gap-2 text-[12px] py-1.5 px-2.5 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.02)' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#FB923C' }} />
                  <span className="text-[#D4D4D8] truncate">{ing}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        {instructions && (
          <div className="mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#52525B] mb-2">Instructions</p>
            <p className="text-[12.5px] text-[#A1A1AA] leading-relaxed">
              {showInstructions ? instructions : shortInstructions}
            </p>
            {instructions.length > 200 && (
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="flex items-center gap-0.5 mt-2 text-[11px] font-semibold text-orange-400/70 hover:text-orange-300 transition-colors bg-transparent border-none cursor-pointer p-0"
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
        <div className="flex items-center gap-2">
          {youtubeUrl && (
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-semibold text-red-400 transition-colors hover:bg-red-500/10"
              style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)' }}
            >
              <Youtube className="w-4 h-4" />
              Watch Video
            </a>
          )}
          {sourceUrl && (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-medium text-[#A1A1AA] transition-colors hover:bg-white/5"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Source
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default RecipeWidget;
