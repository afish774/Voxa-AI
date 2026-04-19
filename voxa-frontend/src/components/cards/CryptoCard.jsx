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
  const SVG_H = 100; // Slightly taller to accommodate sharp peaks

  const sparkline = useMemo(() => {
    if (!sparklineData || !Array.isArray(sparklineData) || sparklineData.length < 2) return null;

    const data = sparklineData.map(Number).filter((n) => !isNaN(n));
    if (data.length < 2) return null;

    const minV = Math.min(...data);
    const maxV = Math.max(...data);
    const range = maxV - minV || 1;
    const pad = 12;

    const points = data.map((v, i) => ({
      x: (i / (data.length - 1)) * SVG_W,
      y: pad + (1 - (v - minV) / range) * (SVG_H - pad * 2),
    }));

    // Sharp jagged line (matching reference) instead of smooth cubic bezier
    let d = `M ${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x},${points[i].y}`;
    }

    // Peak point (max value)
    const peakIdx = data.indexOf(maxV);
    const peak = points[peakIdx];

    return { d, peak, peakPrice: maxV };
  }, [sparklineData]);

  // Dynamic date for the tooltip (matching the format in the reference)
  const formattedDate = useMemo(() => {
    return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="bg-[#0E0E0E] rounded-[32px] p-7 relative overflow-hidden w-full max-w-[420px] border border-white/5"
      style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)' }}
    >
      {/* ─── Background Grid Pattern ─── */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
          backgroundPosition: 'center top'
        }}
      />

      {/* ─── Top Row: Price (left) + Coin Pill (right) ─── */}
      <div className="relative z-10 flex items-start justify-between">
        {/* Price block */}
        <div>
          <div className="flex items-baseline leading-none tracking-tight">
            <span className="text-[40px] font-semibold text-white">${integerPart}</span>
            <span className="text-[22px] font-medium text-white/40 ml-0.5">{decimalPart}</span>
          </div>

          {/* Change indicator */}
          <div
            className={
              isPositive
                ? 'text-emerald-500 text-[15px] font-medium flex items-center gap-1.5 mt-2.5 tracking-wide'
                : 'text-rose-500 text-[15px] font-medium flex items-center gap-1.5 mt-2.5 tracking-wide'
            }
          >
            <span className="text-xs">{isPositive ? '▲' : '▼'}</span>
            <span>{Math.abs(numericChange).toFixed(2)}%</span>
          </div>
        </div>

        {/* Coin identity pill */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-[#1A1A1A] flex items-center justify-center shadow-lg border border-white/5">
            {/* Using the original Hexagon icon to maintain stable dependencies */}
            <Hexagon className="w-6 h-6 text-white" strokeWidth={2} />
          </div>
          <div className="flex flex-col">
            <span className="text-white font-medium text-[17px] leading-tight">{coin || 'Crypto'}</span>
            <span className="text-white/40 text-[13px] font-medium tracking-wide mt-0.5 uppercase">{symbol || 'COIN'}</span>
          </div>
        </div>
      </div>

      {/* ─── Sparkline Chart ─── */}
      {sparkline && (
        <div className="relative z-10 mt-8 h-[100px]">
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            preserveAspectRatio="none"
            className="overflow-visible"
          >
            {/* Main jagged line (Unfilled, sharp strokes) */}
            <path
              d={sparkline.d}
              stroke="rgba(255,255,255,0.3)"
              strokeWidth={1.5}
              strokeLinejoin="round"
              strokeLinecap="round"
              fill="none"
            />

            {/* Peak dot */}
            <circle
              cx={sparkline.peak.x}
              cy={sparkline.peak.y}
              r={4.5}
              fill="white"
            />
          </svg>

          {/* Floating tooltip above peak */}
          <div
            className="absolute bg-[#1A1A1A] rounded-xl px-3.5 py-2 pointer-events-none shadow-xl border border-white/5"
            style={{
              left: `${(sparkline.peak.x / SVG_W) * 100}%`,
              top: `${sparkline.peak.y - 54}px`,
              transform: 'translateX(-50%)',
            }}
          >
            <p className="text-white text-[14px] font-medium whitespace-nowrap leading-tight text-center">
              ${sparkline.peakPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-white/40 text-[11px] font-medium text-center leading-tight mt-1">
              {formattedDate}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default CryptoCard;