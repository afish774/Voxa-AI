import React from 'react';
import { motion } from 'framer-motion';
import { Newspaper, ExternalLink, Clock, Globe, ChevronRight, AlertTriangle } from 'lucide-react';

// ============================================================================
// 📰 NewsWidget — Apple Premium Headlines Card
// ============================================================================
// Design DNA: iOS 17 Apple News / Cupertino Glassmorphism
// Features: 32px backdrop blur, category-driven ambient glows, hairline 
// dividers, and a premium typography hierarchy (Hero headline + standard list).
// ============================================================================

const CATEGORY_COLORS = {
  Technology: '#0A84FF', Sports: '#30D158', Business: '#FF9F0A', Health: '#FF375F',
  Entertainment: '#BF5AF2', World: '#5E5CE6', Nation: '#FF453A', Science: '#32ADE6',
  'Breaking News': '#FF453A', 'News': '#8E8E93',
};

const NewsWidget = ({ data }) => {
  const { category = 'News', articles, error } = data || {};
  const safeArticles = articles || [];
  const themeColor = CATEGORY_COLORS[category] || '#0A84FF';

  // ─── Error State ───
  if (error || (!error && safeArticles.length === 0)) {
    return (
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[420px] rounded-[24px] sm:rounded-[28px] p-5 mt-5"
        style={{ background: 'rgba(28, 28, 30, 0.8)', border: '1px solid rgba(255,69,58,0.2)' }}>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#FF453A] shrink-0" />
          <span className="text-[13px] text-[#FF453A] font-medium tracking-tight break-words">
            {error || 'No recent articles found for this topic.'}
          </span>
        </div>
      </motion.div>
    );
  }

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
      {/* ─── Ambient Category Glow ─── */}
      <div className="absolute top-0 left-0 w-full h-40 pointer-events-none opacity-20" style={{
        background: `radial-gradient(ellipse at 20% -20%, ${themeColor} 0%, transparent 70%)`,
        filter: 'blur(40px)',
      }} />

      <div className="relative z-10 p-5 sm:p-6">

        {/* ─── Header: News Category ─── */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <Newspaper className="w-4 h-4 text-white/90" />
            </div>
            <span className="text-[14px] font-semibold text-white/80 tracking-tight uppercase">Top Stories</span>
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
            style={{ color: themeColor, background: `${themeColor}20`, border: `1px solid ${themeColor}30` }}>
            {category}
          </span>
        </div>

        {/* ─── Article List ─── */}
        <div className="flex flex-col gap-1">
          {safeArticles.map((article, index) => {
            const isHero = index === 0;

            return (
              <a
                key={index}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block p-4 rounded-[20px] transition-all hover:bg-white/5 active:scale-[0.98]"
                style={{
                  background: isHero ? 'rgba(255,255,255,0.04)' : 'transparent',
                  border: isHero ? '1px solid rgba(255,255,255,0.05)' : '1px solid transparent',
                  borderTop: !isHero && index !== 0 ? '1px solid rgba(255,255,255,0.05)' : undefined,
                  borderRadius: isHero ? '20px' : '0px'
                }}
              >
                {/* Source & Time Metadata */}
                <div className="flex items-center gap-2 mb-2 text-[11px] text-white/50 font-medium">
                  <Globe className="w-3 h-3" />
                  <span className="font-semibold text-white/70 truncate max-w-[120px]">{article.source || 'News Source'}</span>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span className="truncate">{article.publishedAt || 'Recent'}</span>
                </div>

                {/* Article Title */}
                <h3 className={`font-bold text-white/95 tracking-tight leading-snug group-hover:text-white transition-colors line-clamp-3 mb-2
                  ${isHero ? 'text-[17px] sm:text-[19px]' : 'text-[15px] sm:text-[16px]'}`}>
                  {article.title || 'Untitled Article'}
                </h3>

                {/* Description (Only for Hero or if it fits well) */}
                {isHero && article.description && (
                  <p className="text-[13px] text-white/60 leading-relaxed line-clamp-2 mb-3">
                    {article.description}
                  </p>
                )}

                {/* Read More Link (Hero Only) */}
                {isHero && (
                  <div className="flex items-center gap-1 text-[12px] font-semibold" style={{ color: themeColor }}>
                    Read Full Story <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                )}
              </a>
            );
          })}
        </div>

      </div>
    </motion.div>
  );
};

export default NewsWidget;