import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Telescope, Calendar, ChevronDown, ExternalLink, Sparkles, Copyright } from 'lucide-react';

// ============================================================================
// 🔭 NasaApodCard — Premium NASA Astronomy Picture of the Day Widget
// ============================================================================
// Design DNA: Glassmorphic deep-space aesthetic matching Voxa's OS-level card
// system. Features progressive image loading, expanding description, and
// cinematic entrance animation.
//
// Expected props (from cardData):
//   title       — Image title from NASA APOD API
//   date        — YYYY-MM-DD date string
//   explanation — Truncated description (≤400 chars from backend)
//   imageUrl    — Standard resolution image URL
//   hdUrl       — High-definition image URL
//   mediaType   — 'image' or 'video'
//   copyright   — Attribution string or 'NASA/Public Domain'
// ============================================================================

const NasaApodCard = ({ data }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const {
    title = 'Astronomy Picture of the Day',
    date,
    explanation = '',
    imageUrl,
    hdUrl,
    mediaType = 'image',
    copyright = 'NASA/Public Domain',
  } = data || {};

  // Format the date into a human-readable string
  const formattedDate = useMemo(() => {
    if (!date) return 'Today';
    try {
      return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return date;
    }
  }, [date]);

  // Truncate explanation for collapsed view
  const shortExplanation = useMemo(() => {
    if (!explanation) return '';
    if (explanation.length <= 140) return explanation;
    const truncated = explanation.substring(0, 140);
    const lastSpace = truncated.lastIndexOf(' ');
    return (lastSpace > 80 ? truncated.substring(0, lastSpace) : truncated) + '...';
  }, [explanation]);

  const displayUrl = imageUrl || hdUrl;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className="relative w-full max-w-[460px] rounded-[32px] overflow-hidden mt-5"
      style={{
        background: '#0B0B0C',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 32px 64px -16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      {/* ─── Ambient Deep-Space Glow ─── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
        }}
      />

      {/* ─── Header Badge ─── */}
      <div className="relative z-10 flex items-center justify-between px-7 pt-6 pb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-[12px] flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))',
              border: '1px solid rgba(139, 92, 246, 0.2)',
            }}
          >
            <Telescope className="w-[18px] h-[18px] text-violet-400" strokeWidth={1.8} />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-violet-400/80">
              NASA · APOD
            </span>
            <span className="text-[11px] text-[#71717A] font-medium leading-tight flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formattedDate}
            </span>
          </div>
        </div>

        {/* HD Link */}
        {hdUrl && (
          <a
            href={hdUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium text-[#A1A1AA] hover:text-white transition-colors duration-200"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <ExternalLink className="w-3 h-3" />
            HD
          </a>
        )}
      </div>

      {/* ─── Hero Image ─── */}
      <div className="relative mx-4 rounded-[20px] overflow-hidden" style={{ aspectRatio: '16 / 10' }}>
        {/* Shimmer Loading State */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 z-10">
            <div
              className="absolute inset-0 animate-pulse"
              style={{
                background: 'linear-gradient(135deg, rgba(30,30,35,1) 0%, rgba(45,45,55,1) 50%, rgba(30,30,35,1) 100%)',
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
              >
                <Sparkles className="w-8 h-8 text-violet-500/40" />
              </motion.div>
            </div>
          </div>
        )}

        {/* Error Fallback */}
        {imageError && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2"
            style={{ background: 'rgba(15,15,20,1)' }}
          >
            <Telescope className="w-10 h-10 text-violet-500/30" />
            <span className="text-[13px] text-[#52525B]">Image unavailable</span>
          </div>
        )}

        {/* Actual Image */}
        {displayUrl && mediaType !== 'video' && (
          <img
            src={displayUrl}
            alt={title}
            loading="lazy"
            className={`w-full h-full object-cover transition-opacity duration-700 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImageError(true);
              setImageLoaded(true);
            }}
          />
        )}

        {/* Video Placeholder */}
        {mediaType === 'video' && displayUrl && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2"
            style={{ background: 'rgba(15,15,20,1)' }}
          >
            <Telescope className="w-10 h-10 text-violet-500/50" />
            <span className="text-[13px] text-[#71717A]">Video — tap HD to watch</span>
          </div>
        )}

        {/* Bottom Gradient Veil */}
        <div
          className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, rgba(11,11,12,0.95) 0%, transparent 100%)',
          }}
        />
      </div>

      {/* ─── Title & Description ─── */}
      <div className="relative z-10 px-7 pt-4 pb-5">
        <h3
          className="text-[18px] font-semibold leading-snug tracking-[-0.02em] text-white/95"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: isExpanded ? 'unset' : 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {title}
        </h3>

        {explanation && (
          <>
            <AnimatePresence mode="wait">
              <motion.p
                key={isExpanded ? 'full' : 'short'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="mt-2.5 text-[13.5px] leading-[1.55] text-[#A1A1AA] font-normal"
              >
                {isExpanded ? explanation : shortExplanation}
              </motion.p>
            </AnimatePresence>

            {explanation.length > 140 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 mt-2.5 text-[12px] font-semibold tracking-wide text-violet-400/80 hover:text-violet-300 transition-colors duration-200 bg-transparent border-none cursor-pointer p-0"
              >
                {isExpanded ? 'Show less' : 'Read more'}
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </motion.div>
              </button>
            )}
          </>
        )}

        {/* ─── Copyright Footer ─── */}
        <div className="flex items-center gap-1 mt-3.5 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <Copyright className="w-3 h-3 text-[#52525B]" />
          <span className="text-[11px] text-[#52525B] font-medium tracking-wide">
            {copyright}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default NasaApodCard;
