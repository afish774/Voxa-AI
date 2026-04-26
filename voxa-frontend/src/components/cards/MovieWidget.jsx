import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Film, Star, Clock, Users, Trophy, ChevronDown } from 'lucide-react';

// ============================================================================
// 🎬 MovieWidget — Cinematic Movie/TV Show Card
// ============================================================================
// Payload shape (from getMovieTool):
//   title, year, type, imdbRating, rottenTomatoes, metascore, genre,
//   director, cast, runtime, plot, poster, rated, awards
// ============================================================================

const MovieWidget = ({ data }) => {
  const {
    title = 'Unknown', year, type = 'Movie', imdbRating, rottenTomatoes,
    metascore, genre, director, cast, runtime, plot, poster, rated, awards, error,
  } = data || {};
  const [plotExpanded, setPlotExpanded] = useState(false);
  const [posterLoaded, setPosterLoaded] = useState(false);
  const [posterError, setPosterError] = useState(false);

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

  // 🧹 QA FIX: Null-safe plot — protect against null.length and null.substring() crashes
  const safePlot = plot || '';
  const shortPlot = safePlot.length > 120 ? safePlot.substring(0, 120) + '...' : safePlot;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      // 📱 RESPONSIVE: Fluid width, responsive corners
      className="relative w-full max-w-[460px] rounded-[24px] sm:rounded-[28px] md:rounded-[32px] overflow-hidden mt-5"
      style={{
        background: '#0B0B0C',
        border: '1px solid rgba(245, 158, 11, 0.08)',
        boxShadow: '0 32px 64px -16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 50% 0%, rgba(245, 158, 11, 0.05) 0%, transparent 60%)',
      }} />

      {/* 📱 RESPONSIVE: Stack vertically on mobile (poster on top), horizontal on sm+ */}
      <div className="relative z-10 flex flex-col sm:flex-row gap-0">
        {/* Poster */}
        {poster && !posterError && (
          <>
            {/* Mobile: full-width poster with 16:9 aspect ratio */}
            <div className="sm:hidden relative w-full" style={{ aspectRatio: '16 / 9' }}>
              {!posterLoaded && (
                <div className="absolute inset-0 animate-pulse" style={{ background: 'rgba(30,30,35,1)' }} />
              )}
              <img
                src={poster}
                alt={title}
                className={`w-full h-full object-cover transition-opacity duration-500 ${posterLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setPosterLoaded(true)}
                onError={() => setPosterError(true)}
              />
              {/* Bottom gradient for mobile overlay */}
              <div className="absolute inset-0 pointer-events-none" style={{
                background: 'linear-gradient(to top, #0B0B0C 0%, rgba(11,11,12,0.4) 50%, transparent 100%)',
              }} />
            </div>

            {/* Desktop: side poster */}
            <div className="hidden sm:block w-[130px] shrink-0 relative">
              {!posterLoaded && (
                <div className="absolute inset-0 animate-pulse" style={{ background: 'rgba(30,30,35,1)' }} />
              )}
              <img
                src={poster}
                alt={title}
                className={`w-full h-full object-cover transition-opacity duration-500 ${posterLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setPosterLoaded(true)}
                onError={() => setPosterError(true)}
              />
              <div className="absolute inset-0 pointer-events-none" style={{
                background: 'linear-gradient(to right, transparent 60%, #0B0B0C 100%)',
              }} />
            </div>
          </>
        )}

        {/* Details */}
        {/* 📱 RESPONSIVE: Mobile-first padding */}
        <div className="flex-1 p-4 sm:p-5 min-w-0" style={poster && !posterError ? { marginTop: '-1px' } : {}}>
          {/* Header */}
          <div className="flex items-start gap-2 mb-1 flex-wrap">
            <span className="px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-amber-400/80" style={{
              background: 'rgba(245,158,11,0.1)',
            }}>{type}</span>
            {rated && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-[#71717A]" style={{
                border: '1px solid rgba(255,255,255,0.08)',
              }}>{rated}</span>
            )}
          </div>

          {/* 🧹 QA FIX: Added line-clamp-2 to prevent long movie titles from overflowing */}
          {/* 📱 RESPONSIVE: Fluid title text */}
          <h3 className="text-[16px] sm:text-[18px] font-bold text-white/95 tracking-[-0.02em] leading-tight mt-1.5 sm:mt-2 line-clamp-2">{title}</h3>
          {/* 📱 RESPONSIVE: Wrap year/runtime/genre metadata */}
          <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 mt-1 text-[11px] sm:text-[12px] text-[#71717A]">
            {year && <span>{year}</span>}
            {runtime && <><span>·</span><span className="flex items-center gap-1"><Clock className="w-3 h-3" />{runtime}</span></>}
            {/* 🧹 QA FIX: Null-safe genre — protect against null.split() crash */}
            {genre && <><span>·</span><span className="truncate max-w-[100px] sm:max-w-[120px]">{genre.split(',')[0]}</span></>}
          </div>

          {/* Ratings */}
          {/* 📱 RESPONSIVE: Wrap ratings badges on narrow screens */}
          <div className="flex items-center flex-wrap gap-1.5 sm:gap-3 mt-2.5 sm:mt-3">
            {imdbRating && (
              <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg" style={{ background: 'rgba(245,158,11,0.08)' }}>
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span className="text-[12px] sm:text-[13px] font-bold text-amber-400">{imdbRating}</span>
                <span className="text-[9px] sm:text-[10px] text-[#52525B] font-medium">/10</span>
              </div>
            )}
            {rottenTomatoes && (
              <div className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg" style={{ background: 'rgba(239,68,68,0.08)' }}>
                <span className="text-[11px] sm:text-[12px] font-bold text-red-400">🍅 {rottenTomatoes}</span>
              </div>
            )}
            {metascore && (
              <div className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg" style={{
                background: parseInt(metascore) >= 60 ? 'rgba(34,197,94,0.08)' : 'rgba(245,158,11,0.08)',
              }}>
                <span className="text-[11px] sm:text-[12px] font-bold" style={{
                  color: parseInt(metascore) >= 60 ? '#22C55E' : '#F59E0B',
                }}>MC {metascore}</span>
              </div>
            )}
          </div>

          {/* Director & Cast */}
          {director && (
            <div className="flex items-center gap-1.5 mt-2.5 sm:mt-3 text-[11px] sm:text-[12px] min-w-0">
              <Film className="w-3 h-3 text-[#52525B] shrink-0" />
              <span className="text-[#71717A] shrink-0">Dir:</span>
              {/* 📱 RESPONSIVE: Truncate long director names */}
              <span className="text-[#A1A1AA] font-medium truncate">{director}</span>
            </div>
          )}
          {cast && (
            <div className="flex items-center gap-1.5 mt-1 text-[11px] sm:text-[12px] min-w-0">
              <Users className="w-3 h-3 text-[#52525B] shrink-0" />
              {/* 📱 RESPONSIVE: Truncate long cast lists */}
              <span className="text-[#A1A1AA] truncate">{cast}</span>
            </div>
          )}

          {/* Awards */}
          {awards && (
            <div className="flex items-center gap-1.5 mt-2 text-[10px] sm:text-[11px] min-w-0">
              <Trophy className="w-3 h-3 text-amber-500/50 shrink-0" />
              {/* 📱 RESPONSIVE: line-clamp-1 for very long award descriptions */}
              <span className="text-[#52525B] italic line-clamp-1">{awards}</span>
            </div>
          )}

          {/* Plot — uses safePlot */}
          {safePlot && (
            <div className="mt-2.5 sm:mt-3 pt-2.5 sm:pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              {/* 📱 RESPONSIVE: break-words prevents long plot text from overflowing */}
              <p className="text-[11px] sm:text-[12px] text-[#A1A1AA] leading-relaxed break-words">
                {plotExpanded ? safePlot : shortPlot}
              </p>
              {/* 🧹 QA FIX: Use safePlot.length instead of plot.length */}
              {safePlot.length > 120 && (
                <button
                  onClick={() => setPlotExpanded(!plotExpanded)}
                  // 📱 RESPONSIVE: min-h-[44px] for touch target
                  className="flex items-center gap-0.5 mt-1 text-[10px] sm:text-[11px] font-semibold text-amber-400/70 hover:text-amber-300 transition-colors bg-transparent border-none cursor-pointer p-0 min-h-[44px] sm:min-h-0"
                >
                  {plotExpanded ? 'Less' : 'More'}
                  <motion.div animate={{ rotate: plotExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="w-3 h-3" />
                  </motion.div>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MovieWidget;
