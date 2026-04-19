import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Hexagon } from 'lucide-react';

const CryptoCard = ({ coin, symbol, price, change, sparklineData }) => {
  const numericPrice = typeof price === 'number' ? price : parseFloat(price) || 0;
  const numericChange = typeof change === 'number' ? change : parseFloat(change) || 0;
  const isPositive = numericChange >= 0;

  // Track if the dynamic logo fails to load
  const [imgError, setImgError] = useState(false);

  // Format price into Big Integer and Small Decimal parts
  const priceFormatted = numericPrice.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const dotIndex = priceFormatted.indexOf('.');
  const integerPart = dotIndex >= 0 ? priceFormatted.slice(0, dotIndex) : priceFormatted;
  const decimalPart = dotIndex >= 0 ? priceFormatted.slice(dotIndex) : '.00';

  // ─── Sparkline Engine (Handles Missing API Data) ─────────────────
  const SVG_W = 340;
  const SVG_H = 140;

  const sparkline = useMemo(() => {
    let data = sparklineData;

    if (!data || !Array.isArray(data) || data.length < 2) {
      data = [];
      const startPrice = numericPrice / (1 + numericChange / 100);
      let curr = startPrice;
      const steps = 40;
      const baseTrend = (numericPrice - startPrice) / steps;

      for (let i = 0; i < steps; i++) {
        const rand = Math.abs(Math.sin(i * 12.9898 + numericPrice) * 43758.5453) % 1;
        const volatility = numericPrice * 0.003 * (rand - 0.5);
        curr += baseTrend + volatility;
        data.push(curr);
      }
      data[steps - 1] = numericPrice;
    }

    const minV = Math.min(...data);
    const maxV = Math.max(...data);
    const range = maxV - minV || 1;
    const padX = 0;
    const padY = 24;

    const points = data.map((v, i) => ({
      x: padX + (i / (data.length - 1)) * (SVG_W - padX * 2),
      y: padY + (1 - (v - minV) / range) * (SVG_H - padY * 2),
    }));

    let d = `M ${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x},${points[i].y}`;
    }

    const peakIdx = data.indexOf(maxV);
    const peak = points[peakIdx];
    const latest = points[points.length - 1]; // Right-most point for the live pulse

    return { d, peak, peakPrice: maxV, latest };
  }, [sparklineData, numericPrice, numericChange]);

  const formattedDate = useMemo(() => {
    return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{
        y: -4,
        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.15), 0 32px 64px -12px rgba(0,0,0,0.9)',
        transition: { duration: 0.3, ease: "easeOut" }
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="relative overflow-hidden w-full max-w-[420px] rounded-[36px] p-8"
      style={{
        background: 'linear-gradient(180deg, #18181A 0%, #0D0D0F 100%)',
        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.08), 0 24px 48px -12px rgba(0,0,0,0.8)',
        border: '1px solid rgba(255,255,255,0.04)'
      }}
    >
      {/* ─── Background Grid Pattern ─── */}
      <motion.div
        className="absolute inset-0 pointer-events-none opacity-[0.06]"
        animate={{ backgroundPosition: ["0px 0px", "42px 42px"] }}
        transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px),
                            linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: '42px 42px',
        }}
      />

      {/* ─── Top Row: Price (left) + Coin Badge (right) ─── */}
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <div className="flex items-baseline font-sans tracking-tight">
            <span className="text-[42px] font-semibold text-white leading-none">${integerPart}</span>
            <span className="text-[22px] font-medium text-white/40 leading-none ml-0.5">{decimalPart}</span>
          </div>

          <div
            className={`mt-3 flex items-center gap-1.5 text-[15px] font-semibold tracking-wide ${isPositive ? 'text-[#34C759]' : 'text-[#FF3B30]'
              }`}
          >
            <span className="text-xs">{isPositive ? '▲' : '▼'}</span>
            <span>{Math.abs(numericChange).toFixed(2)}%</span>
          </div>
        </div>

        <div className="flex items-center gap-3.5">
          <div
            className="w-[46px] h-[46px] rounded-full flex items-center justify-center relative shadow-xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #2A2A2C 0%, #151516 100%)',
              boxShadow: '0 8px 16px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.08)'
            }}
          >
            {/* Dynamic Logo Loader with safe fallback */}
            {!imgError && symbol ? (
              <img
                src={`https://assets.coincap.io/assets/icons/${symbol.toLowerCase()}@2x.png`}
                alt={symbol}
                onError={() => setImgError(true)}
                className="w-6 h-6 object-contain z-10"
              />
            ) : (
              <Hexagon className="w-6 h-6 text-white/90 z-10" strokeWidth={2} />
            )}
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-white font-medium text-[19px] leading-tight capitalize tracking-tight">
              {coin || 'Crypto'}
            </span>
            <span className="text-white/40 text-[13px] font-medium leading-tight mt-0.5 uppercase tracking-widest">
              {symbol || 'COIN'}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Sparkline Chart ─── */}
      {sparkline && (
        <div className="relative z-10 mt-8 -mx-2 h-[140px]">
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            preserveAspectRatio="none"
            className="overflow-visible"
            style={{ filter: 'drop-shadow(0px 4px 6px rgba(255,255,255,0.15))' }} // Subtle line glow
          >
            {/* Draw-in Animation for the Line */}
            <motion.path
              d={sparkline.d}
              stroke="rgba(255,255,255,0.4)"
              strokeWidth={1.5}
              strokeLinejoin="round"
              strokeLinecap="round"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />

            {/* LIVE PULSE: Solid Dot at the Leading Edge (Right Side) */}
            <motion.circle
              cx={sparkline.latest.x}
              cy={sparkline.latest.y}
              r={4.5}
              fill="#FFFFFF"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.4, type: "spring" }}
            />

            {/* LIVE PULSE: Expanding Radar Ring at the Leading Edge */}
            <motion.circle
              cx={sparkline.latest.x}
              cy={sparkline.latest.y}
              r={4.5}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth={1.5}
              initial={{ scale: 1, opacity: 0.8 }}
              animate={{ scale: 3.5, opacity: 0 }}
              transition={{ delay: 1.5, repeat: Infinity, duration: 1.8, ease: "easeOut" }}
            />
          </svg>

          {/* Floating Peak Tooltip (Kept at highest point) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.4 }}
            className="absolute px-3 py-2 pointer-events-none backdrop-blur-md rounded-xl"
            style={{
              background: 'rgba(30,30,32,0.85)',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 10px 20px rgba(0,0,0,0.5)',
              left: `${(sparkline.peak.x / SVG_W) * 100}%`,
              top: `${sparkline.peak.y - 58}px`,
              transform: 'translateX(-50%)',
            }}
          >
            <p className="text-white text-[13px] font-medium whitespace-nowrap leading-tight text-center">
              ${sparkline.peakPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-white/40 text-[10px] font-medium text-center leading-tight mt-1 tracking-wide">
              {formattedDate}
            </p>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default CryptoCard;