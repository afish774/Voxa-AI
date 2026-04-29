import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Hexagon, TrendingUp, TrendingDown } from 'lucide-react';

// ============================================================================
// 🪙 CryptoCard — Apple Premium Live Market Widget
// ============================================================================
// Design DNA: iOS 17 Wallet / Cupertino Glassmorphism
// Features: 32px backdrop blur, adaptive performance glow, tabular numerals,
// and an organic, zero-clip animated SVG sparkline.
// ============================================================================

const CryptoCard = ({ coin, symbol, price, change, sparklineData }) => {
  const numericPrice = typeof price === 'number' ? price : parseFloat(price) || 0;
  const numericChange = typeof change === 'number' ? change : parseFloat(change) || 0;
  const isPositive = numericChange >= 0;

  // iOS System Colors
  const themeColor = isPositive ? '#30D158' : '#FF453A';
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  // ─── Premium Typography Formatting ───
  const priceFormatted = numericPrice.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // ─── Logo Fallback Engine ───
  const safeSymbol = symbol ? symbol.toLowerCase() : '';
  const logoUrls = [
    `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/${safeSymbol}.svg`,
    `https://assets.coincap.io/assets/icons/${safeSymbol}@2x.png`
  ];
  const [logoIndex, setLogoIndex] = useState(0);

  // ─── Sparkline Engine (Organic Market Curve) ───
  const SVG_W = 400;
  const SVG_H = 120;

  const sparkline = useMemo(() => {
    if (!sparklineData || !Array.isArray(sparklineData) || sparklineData.length < 2) return null;

    const maxP = Math.max(...sparklineData);
    const minP = Math.min(...sparklineData);
    const range = maxP - minP || 1;

    // Add vertical padding so the stroke doesn't clip
    const PADDING_Y = 12;
    const usableH = SVG_H - PADDING_Y * 2;

    const points = sparklineData.map((val, i) => {
      const x = (i / (sparklineData.length - 1)) * SVG_W;
      const y = PADDING_Y + usableH - ((val - minP) / range) * usableH;
      return { x, y, val };
    });

    let path = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const cp1x = p1.x + (p2.x - p1.x) / 2;
      const cp1y = p1.y;
      const cp2x = p1.x + (p2.x - p1.x) / 2;
      const cp2y = p2.y;
      path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }

    return { organicPath: path, endPoint: points[points.length - 1], endPrice: points[points.length - 1].val };
  }, [sparklineData]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full max-w-[440px] rounded-[32px] overflow-hidden mt-5 shadow-2xl"
      style={{
        background: 'rgba(20, 20, 22, 0.65)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 24px 48px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
      }}
    >
      {/* ─── Ambient Adaptive Glow ─── */}
      <div className="absolute top-0 right-0 w-3/4 h-48 pointer-events-none opacity-20" style={{
        background: `radial-gradient(ellipse at 80% -20%, ${themeColor} 0%, transparent 70%)`,
        filter: 'blur(40px)',
      }} />

      {/* ─── Header: Coin & Trend ─── */}
      <div className="relative z-10 flex items-start justify-between px-5 sm:px-6 pt-6 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 shadow-md" style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02))',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <img
              src={logoUrls[logoIndex]}
              alt={symbol}
              className="w-7 h-7 object-contain drop-shadow-md"
              onError={() => logoIndex < logoUrls.length - 1 && setLogoIndex(prev => prev + 1)}
              style={{ display: logoIndex < logoUrls.length ? 'block' : 'none' }}
            />
            {logoIndex >= logoUrls.length && <Hexagon className="w-6 h-6 text-white/50" />}
          </div>
          <div className="min-w-0">
            <h2 className="text-[20px] sm:text-[22px] font-bold text-white tracking-tight leading-none truncate capitalize">
              {coin}
            </h2>
            <p className="text-[12px] sm:text-[13px] text-white/50 font-bold uppercase tracking-wider mt-1">
              {symbol}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full shrink-0"
          style={{ background: `rgba(${isPositive ? '48, 209, 88' : '255, 69, 58'}, 0.15)`, border: `1px solid rgba(${isPositive ? '48, 209, 88' : '255, 69, 58'}, 0.2)` }}>
          <TrendIcon className="w-3.5 h-3.5" style={{ color: themeColor }} />
          <span className="text-[12px] font-bold tracking-wider" style={{ color: themeColor }}>
            {isPositive ? '+' : ''}{numericChange.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* ─── Primary Price Display ─── */}
      <div className="relative z-10 px-5 sm:px-6 py-2">
        <div className="flex items-baseline gap-1">
          <span className="text-[28px] sm:text-[32px] font-semibold text-white/50">$</span>
          <span className="text-[44px] sm:text-[52px] font-bold text-white tracking-tighter leading-none tabular-nums">
            {priceFormatted}
          </span>
        </div>
      </div>

      {/* ─── Animated Sparkline Chart ─── */}
      {sparkline ? (
        <div className="relative w-full h-[140px] mt-2 pb-4">
          <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} preserveAspectRatio="none" className="w-full h-full drop-shadow-[0_8px_12px_rgba(0,0,0,0.5)]">
            <defs>
              <linearGradient id={`gradient-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={themeColor} stopOpacity="0.4" />
                <stop offset="100%" stopColor={themeColor} stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <motion.path
              d={`${sparkline.organicPath} L ${SVG_W},${SVG_H} L 0,${SVG_H} Z`}
              fill={`url(#gradient-${symbol})`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 1 }}
            />
            <motion.path
              d={sparkline.organicPath}
              fill="none"
              stroke={themeColor}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.5, ease: [0.25, 1, 0.5, 1] }}
            />
            <motion.circle
              cx={sparkline.endPoint.x}
              cy={sparkline.endPoint.y}
              r="4.5"
              fill="#FFFFFF"
              stroke={themeColor}
              strokeWidth="2.5"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.4, type: "spring" }}
            />
            <motion.circle
              cx={sparkline.endPoint.x}
              cy={sparkline.endPoint.y}
              r="12"
              fill="none"
              stroke={themeColor}
              strokeWidth="1.5"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            />
          </svg>

          {/* ─── Zero-Clip Rate Shower ─── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1, duration: 0.4 }}
            className="absolute right-0 flex flex-col items-end pointer-events-none"
            style={{
              top: `calc(${(sparkline.endPoint.y / SVG_H) * 100}% - 48px)`,
              marginRight: '8px'
            }}
          >
            <div className="flex flex-col items-center justify-center px-3.5 py-1.5 rounded-[12px] shadow-lg"
              style={{
                background: 'rgba(28,28,30,0.85)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
              <span className="text-white text-[13px] font-bold tabular-nums leading-tight tracking-tight">
                ${sparkline.endPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px]"
              style={{ borderTopColor: 'rgba(28,28,30,0.85)', marginRight: '16px' }} />
          </motion.div>
        </div>
      ) : (
        <div className="h-4" /> // Spacing fallback if no sparkline data
      )}
    </motion.div>
  );
};

export default CryptoCard;