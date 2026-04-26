import React from 'react';
import { motion } from 'framer-motion';
import { Newspaper, ExternalLink, Clock } from 'lucide-react';

// ============================================================================
// 📰 NewsWidget — Premium News Headlines Card
// ============================================================================
// Payload shape (from getNewsTool):
//   category  — "Technology" | "Sports" | "Business" ...
//   articles  — [{ title, source, url, publishedAt, description }]
// ============================================================================

const CATEGORY_COLORS = {
  Technology: '#3B82F6', Sports: '#22C55E', Business: '#F59E0B', Health: '#10B981',
  Entertainment: '#A855F7', World: '#6366F1', Nation: '#EF4444', Science: '#0EA5E9',
  'Breaking News': '#EF4444',
};

const NewsWidget = ({ data }) => {
  const { category = 'News', articles, error } = data || {};
  // 🧹 QA FIX: Null-safe array — destructuring default [] is bypassed when value is explicit null
  const safeArticles = articles || [];
  const accent = CATEGORY_COLORS[category] || '#6366F1';

  if (error || !safeArticles.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        // 📱 RESPONSIVE: Fluid error card
        className="w-full max-w-[460px] rounded-[24px] sm:rounded-[28px] p-4 sm:p-6 mt-5"
        style={{ background: '#0B0B0C', border: '1px solid rgba(239,68,68,0.12)' }}
      >
        <span className="text-[12px] sm:text-[13px] text-red-400 font-medium break-words">{error || 'No articles found'}</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      // 📱 RESPONSIVE: Fluid width, responsive corners
      className="relative w-full max-w-[460px] rounded-[24px] sm:rounded-[28px] md:rounded-[32px] overflow-hidden mt-5"
      style={{
        background: '#0B0B0C',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 32px 64px -16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse at 50% 0%, ${accent}10 0%, transparent 60%)`,
      }} />

      {/* 📱 RESPONSIVE: Mobile-first padding */}
      <div className="relative z-10 p-4 sm:p-5 md:p-7">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4 sm:mb-5">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0" style={{
            background: `${accent}18`, border: `1px solid ${accent}25`,
          }}>
            <Newspaper className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: accent }} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: `${accent}CC` }}>
              {category}
            </span>
            {/* 🧹 QA FIX: Use safeArticles for count */}
            <p className="text-[10px] sm:text-[11px] text-[#52525B] font-medium">{safeArticles.length} articles</p>
          </div>
        </div>

        {/* Articles List */}
        {/* 📱 RESPONSIVE: Single column list — flex-col, tighter gap on mobile */}
        <div className="flex flex-col gap-0.5 sm:gap-1">
          {/* 🧹 QA FIX: Map over safeArticles; use article.url as key with index fallback */}
          {safeArticles.map((article, i) => (
            <motion.a
              key={article.url || `article-${i}`}
              href={article.url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }}
              // 📱 RESPONSIVE: Touch-friendly padding, min-h for touch target
              className="group flex gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg sm:rounded-xl transition-colors duration-200 min-h-[44px]"
              style={{ background: 'transparent' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              {/* Number */}
              <span className="text-[11px] sm:text-[12px] font-bold mt-0.5 shrink-0 w-4 sm:w-5 text-right" style={{ color: `${accent}60` }}>
                {i + 1}
              </span>

              <div className="flex-1 min-w-0">
                {/* 📱 RESPONSIVE: line-clamp-2 prevents long titles from breaking layout */}
                <p className="text-[13px] sm:text-[14px] text-[#E4E4E7] font-medium leading-snug tracking-[-0.01em] group-hover:text-white transition-colors line-clamp-2">
                  {/* 🧹 QA FIX: Null-safe title fallback */}
                  {article.title || 'Untitled'}
                </p>
                {article.description && (
                  // 📱 RESPONSIVE: line-clamp-1 on description
                  <p className="text-[11px] sm:text-[12px] text-[#52525B] mt-0.5 sm:mt-1 leading-relaxed line-clamp-1">{article.description}</p>
                )}
                {/* 📱 RESPONSIVE: Wrap metadata on narrow screens */}
                <div className="flex items-center flex-wrap gap-2 sm:gap-3 mt-1 sm:mt-1.5 text-[10px] sm:text-[11px] text-[#52525B]">
                  {/* 🧹 QA FIX: Null-safe source fallback */}
                  <span className="font-semibold truncate max-w-[120px]">{article.source || 'Unknown'}</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {/* 🧹 QA FIX: Null-safe publishedAt fallback */}
                    <span className="truncate">{article.publishedAt || 'Recently'}</span>
                  </div>
                </div>
              </div>

              <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#3F3F46] mt-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.a>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default NewsWidget;
