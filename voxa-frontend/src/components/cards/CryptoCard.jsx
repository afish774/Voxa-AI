import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Hexagon } from 'lucide-react';

const CryptoCard = ({ coin, symbol, price, change, sparklineData }) => {
  const numericPrice = typeof price === 'number' ? price : parseFloat(price) || 0;
  const numericChange = typeof change === 'number' ? change : parseFloat(change) || 0;
  const isPositive = numericChange >= 0;

  // Split price at decimal — integer large, decimal smaller
  const priceFormatted = numericPrice.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const dotIndex = priceFormatted.indexOf('.');
  const integerPart = dotIndex >= 0 ? priceFormatted.slice(0, dotIndex) : priceFormatted;
  const decimalPart = dotIndex >= 0 ? priceFormatted.slice(dotIndex) : '.00';

  // ─── Sparkline Computation ───────────────────────────────────────
  const SVG_W = 280;
  const SVG_H = 80;

  const sparkline = useMemo(() => {
    if (!sparklineData || !Array.isArray(sparklineData) || sparklineData.length < 2) return null;

    const data = sparklineData.map(Number).filter((n) => !isNaN(n));
    if (data.length < 2) return null;

    const minV = Math.min(...data);
    const maxV = Math.max(...data);
    const range = maxV - minV || 1;
    const pad = 8;

    const points = data.map((v, i) => ({
      x: (i / (data.length - 1)) * SVG_W,
      y: pad + (1 - (v - minV) / range) * (SVG_H - pad * 2),
    }));

    // Smooth cubic bezier path
    let d = `M ${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx = (prev.x + curr.x) / 2;
      d += ` C ${cpx},${prev.y} ${cpx},${curr.y} ${curr.x},${curr.y}`;
    }

    // Gradient fill path (close path along bottom)
    const fillD = d + ` L ${points[points.length - 1].x},${SVG_H} L ${points[0].x},${SVG_H} Z`;

    // Peak point (max value)
    const peakIdx = data.indexOf(maxV);
    const peak = points[peakIdx];

    return { d, fillD, peak, peakPrice: maxV };
  }, [sparklineData]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="bg-zinc-950 rounded-3xl p-6 relative overflow-hidden w-full max-w-md"
      style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)' }}
    >
      {/* Dynamic glow orb */}
      <div
        className={
          isPositive
            ? 'absolute -top-10 -left-10 w-48 h-48 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none'
            : 'absolute -top-10 -left-10 w-48 h-48 rounded-full bg-rose-500/20 blur-3xl pointer-events-none'
        }
      />

      {/* ─── Top Row: Price (left) + Coin Pill (right) ─── */}
      <div className="relative z-10 flex items-start justify-between">
        {/* Price block */}
        <div>
          <div className="flex items-baseline leading-none">
            <span className="text-4xl font-bold text-white tracking-tight">${integerPart}</span>
            <span className="text-2xl font-normal text-white/50 align-bottom">{decimalPart}</span>
          </div>

          {/* Change indicator */}
          <div
            className={
              isPositive
                ? 'text-emerald-400 text-sm font-medium flex items-center gap-1 mt-2'
                : 'text-rose-400 text-sm font-medium flex items-center gap-1 mt-2'
            }
          >
            <span>{isPositive ? '▲' : '▼'}</span>
            <span>{Math.abs(numericChange).toFixed(2)}%</span>
          </div>
        </div>

        {/* Coin identity pill */}
        <div className="bg-zinc-800/80 rounded-2xl px-3 py-2 flex items-center gap-2">
          <Hexagon className="w-6 h-6 text-white/60" strokeWidth={1.5} />
          <div className="flex flex-col">
            <span className="text-white font-semibold text-sm leading-tight">{coin || 'Crypto'}</span>
            {symbol && (
              <span className="text-zinc-400 text-xs leading-tight">{symbol}</span>
            )}
          </div>
        </div>
      </div>

      {/* ─── Sparkline Chart ─── */}
      {sparkline && (
        <div className="relative z-10 mt-4">
          <svg
            width="100%"
            height={SVG_H}
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            preserveAspectRatio="none"
            className="overflow-visible"
          >
            {/* Gradient definition for fill under the line */}
            <defs>
              <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </linearGradient>
            </defs>

            {/* Fill area under the curve */}
            <path d={sparkline.fillD} fill="url(#sparkFill)" />

            {/* Main line */}
            <path
              d={sparkline.d}
              stroke="rgba(255,255,255,0.5)"
              strokeWidth={1.5}
              fill="none"
            />

            {/* Peak dot */}
            <circle
              cx={sparkline.peak.x}
              cy={sparkline.peak.y}
              r={4}
              fill="white"
            />
          </svg>

          {/* Floating tooltip above peak */}
          <div
            className="absolute bg-zinc-800/90 rounded-xl px-3 py-1.5 pointer-events-none backdrop-blur-sm border border-white/10"
            style={{
              left: `${(sparkline.peak.x / SVG_W) * 100}%`,
              top: `${sparkline.peak.y - 44}px`,
              transform: 'translateX(-50%)',
            }}
          >
            <p className="text-white text-xs font-semibold whitespace-nowrap leading-tight">
              ${sparkline.peakPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-zinc-400 text-[10px] text-center leading-tight">16 March, 2024</p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default CryptoCard;