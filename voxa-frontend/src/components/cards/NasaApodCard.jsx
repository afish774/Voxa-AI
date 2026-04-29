import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Calendar, ChevronDown, ExternalLink, Copyright, AlertTriangle, Image as ImageIcon, PlayCircle } from 'lucide-react';

// ============================================================================
// 🔭 NasaApodCard — Apple Premium Astronomy Card
// ============================================================================
// Design DNA: iOS 17 App Store "Today" Tab / Cupertino Glassmorphism
// Features: Immersive edge-to-edge media with gradient blending, 32px 
// backdrop blur, dynamic image loading, and spring-animated expandable text.
// ============================================================================

const NasaApodCard = ({ data }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const {
    title = 'Astronomy Picture of the Day',
    date,
    explanation = '',
    imageUrl,
    hdUrl,
    mediaType = 'image',
    copyright = 'Public Domain',
    error
  } = data || {};

  // ─── Error State ───
  if (error) {
    return (
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[440px] rounded-[24px] sm:rounded-[28px] p-5 mt-5"
        style={{ background: 'rgba(28, 28, 30, 0.8)', border: '1px solid rgba(255,69,58,0.2)' }}>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#FF453A] shrink-0" />
          <span className="text-[13px] text-[#FF453A] font-medium tracking-tight break-words">{error}</span>
        </div>
      </motion.div>
    );
  }

  const isVideo = mediaType === 'video';
  const cleanExplanation = explanation.replace(/\s+/g, ' ').trim();
  const shortExplanation = cleanExplanation.length > 160
    ? cleanExplanation.substring(0, 160) + '...'
    : cleanExplanation;

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
      {/* ─── Immersive Media Header ─── */}
      <div className="relative w-full aspect-square sm:aspect-[4/3] bg-[#000000]">

        {/* Loading Skeleton / Placeholder */}
        <AnimatePresence>
          {!imageLoaded && (
            <motion.div
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-[#111112]"
            >
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}>
                <Sparkles className="w-6 h-6 text-[#BF5AF2] opacity-40" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Media Element */}
        {imageUrl && (
          <img
            src={imageUrl}
            alt={title}
            onLoad={() => setImageLoaded(true)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-out
              ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        )}

        {/* Seamless Gradient Fade to Body */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'linear-gradient(to bottom, rgba(20,20,22,0.1) 0%, rgba(20,20,22,0.4) 50%, rgba(20,20,22,0.85) 85%, rgba(20,20,22,1) 100%)'
        }} />

        {/* Header Tags (Top Left/Right) */}
        <div className="absolute top-5 left-5 flex items-center gap-1.5 px-3 py-1.5 rounded-full"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <Sparkles className="w-3.5 h-3.5 text-[#BF5AF2]" />
          <span className="text-[11px] font-bold text-white uppercase tracking-wider">NASA APOD</span>
        </div>

        {/* Play Icon Overlay (If Video) */}
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <PlayCircle className="w-16 h-16 text-white/80 drop-shadow-xl" strokeWidth={1.5} />
          </div>
        )}

        {/* Title & Date (Bottom of Media Area) */}
        <div className="absolute bottom-0 left-0 w-full px-5 sm:px-6 pb-2 z-10">
          <h2 className="text-[24px] sm:text-[28px] font-bold text-white tracking-tight leading-tight drop-shadow-lg">
            {title}
          </h2>
          <div className="flex items-center gap-1.5 mt-2 text-white/70">
            <Calendar className="w-3.5 h-3.5" />
            <span className="text-[13px] font-semibold tracking-wide">{date}</span>
          </div>
        </div>
      </div>

      {/* ─── Body Content ─── */}
      <div className="relative z-10 px-5 sm:px-6 pt-3 pb-6" style={{ background: 'rgba(20,20,22,0.65)' }}>

        {/* Expandable Explanation */}
        <div className="relative">
          <motion.div
            animate={{ height: isExpanded ? 'auto' : '68px' }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden"
          >
            <p className="text-[14px] sm:text-[15px] text-white/80 leading-relaxed font-medium">
              {isExpanded ? cleanExplanation : shortExplanation}
            </p>
          </motion.div>

          {cleanExplanation.length > 160 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 mt-2 text-[13px] font-semibold text-[#BF5AF2] hover:opacity-80 transition-opacity active:scale-95"
            >
              {isExpanded ? 'Show less' : 'Read more'}
              <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
                <ChevronDown className="w-3.5 h-3.5" />
              </motion.div>
            </button>
          )}
        </div>

        {/* Footer Actions & Meta */}
        <div className="flex items-center justify-between mt-6 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>

          <div className="flex items-center gap-1.5 text-white/40">
            <Copyright className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold uppercase tracking-wider line-clamp-1 max-w-[150px]">
              {copyright}
            </span>
          </div>

          <a
            href={hdUrl || imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-bold text-white transition-all hover:bg-white/10 active:scale-95"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {isVideo ? 'Watch Original' : 'View HD Image'} <ExternalLink className="w-3.5 h-3.5" />
          </a>

        </div>
      </div>
    </motion.div>
  );
};

export default NasaApodCard;