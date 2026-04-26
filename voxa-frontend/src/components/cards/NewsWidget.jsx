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
  const { category = 'News', articles = [], error } = data || {};
  const accent = CATEGORY_COLORS[category] || '#6366F1';

  if (error || !articles.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[460px] rounded-[28px] p-6 mt-5"
        style={{ background: '#0B0B0C', border: '1px solid rgba(239,68,68,0.12)' }}
      >
        <span className="text-[13px] text-red-400 font-medium">{error || 'No articles found'}</span>
      </motion.div>
    );
  }

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
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse at 50% 0%, ${accent}10 0%, transparent 60%)`,
      }} />

      <div className="relative z-10 p-7">
        {/* Header */}
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{
            background: `${accent}18`, border: `1px solid ${accent}25`,
          }}>
            <Newspaper className="w-4 h-4" style={{ color: accent }} />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: `${accent}CC` }}>
              {category}
            </span>
            <p className="text-[11px] text-[#52525B] font-medium">{articles.length} articles</p>
          </div>
        </div>

        {/* Articles List */}
        <div className="flex flex-col gap-1">
          {articles.map((article, i) => (
            <motion.a
              key={i}
              href={article.url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }}
              className="group flex gap-3 p-3 rounded-xl transition-colors duration-200"
              style={{ background: 'transparent' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              {/* Number */}
              <span className="text-[12px] font-bold mt-0.5 shrink-0 w-5 text-right" style={{ color: `${accent}60` }}>
                {i + 1}
              </span>

              <div className="flex-1 min-w-0">
                <p className="text-[14px] text-[#E4E4E7] font-medium leading-snug tracking-[-0.01em] group-hover:text-white transition-colors line-clamp-2">
                  {article.title}
                </p>
                {article.description && (
                  <p className="text-[12px] text-[#52525B] mt-1 leading-relaxed line-clamp-1">{article.description}</p>
                )}
                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-[#52525B]">
                  <span className="font-semibold">{article.source}</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    <span>{article.publishedAt}</span>
                  </div>
                </div>
              </div>

              <ExternalLink className="w-3.5 h-3.5 text-[#3F3F46] mt-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.a>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default NewsWidget;
