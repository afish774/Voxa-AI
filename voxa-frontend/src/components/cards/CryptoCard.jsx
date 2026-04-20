import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Hexagon } from 'lucide-react';

const CryptoCard = ({ coin, symbol, price, change, sparklineData }) => {
  const numericPrice = typeof price === 'number' ? price : parseFloat(price) || 0;
  const numericChange = typeof change === 'number' ? change : parseFloat(change) || 0;
  const isPositive = numericChange >= 0;

  // Premium Typography Formatting
  const priceFormatted = numericPrice.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const dotIndex = priceFormatted.indexOf('.');
  const integerPart = dotIndex >= 0 ? priceFormatted.slice(0, dotIndex) : priceFormatted;
  const decimalPart = dotIndex >= 0 ? priceFormatted.slice(dotIndex) : '.00';

  // Dynamic Official Logo Fetcher
  const [imgError, setImgError] = useState(false);
  const iconUrl = symbol ? `https://assets.coincap.io/assets/icons/${symbol.toLowerCase()}@2x.png` : null;

  // ─── Sparkline Engine (Senior Fallback Logic) ───────────────
  const SVG_W = 360;
  const SVG_H = 150;

  const sparkline = useMemo(() => {
    let data = sparklineData;

    // Generates a realistic "Random Walk" if API data is missing
    if (!data || !Array.isArray(data) || data.length < 2) {
      data = [];
      const startPrice = numericPrice / (1 + numericChange / 100);
      let curr = startPrice;
      const steps = 50;
      const baseTrend = (numericPrice - startPrice) / steps;

      for (let i = 0; i < steps; i++) {
        // Pseudo-random deterministic noise
        const rand = Math.abs(Math.sin(i * 12.9898 + numericPrice) * 43758.5453) % 1;
        const volatility = numericPrice * 0.0015 * (rand - 0.5);
        curr += baseTrend + volatility;
        data.push(curr);
      }
    }

    // Anchor exactly to the live price
    if (data.length > 0) {
      data[data.length - 1] = numericPrice;
    }

    const minV = Math.min(...data);
    const maxV = Math.max(...data);
    const range = maxV - minV || 1;

    // Exact padding to match the reference image's visual weight
    const padX = 2;
    const padY = 36;

    const points = data.map((v, i) => ({
      x: padX + (i / (data.length - 1)) * (SVG_W - padX * 2),
      y: padY + (1 - (v - minV) / range) * (SVG_H - padY * 2),
    }));

    let d = `M ${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x},${points[i].y}`;
    }

    const endIdx = data.length - 1;
    const endPoint = points[endIdx];

    return { d, endPoint, endPrice: numericPrice };
  }, [sparklineData, numericPrice, numericChange]);

  const formattedDate = useMemo(() => {
    return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 40 }}
      className="relative overflow-hidden w-full max-w-[440px] rounded-[40px] p-8"
      style={{
        // Ultra-premium matte black with an incredibly subtle inner bevel highlight
        background: '#0D0D0F',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 20px 40px -10px rgba(0,0,0,0.8)',
        border: '1px solid rgba(255,255,255,0.03)'
      }}
    >
      {/* ─── Understated Background Grid ─── */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px),
                            linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
          backgroundPosition: 'left top'
        }}
      />

      {/* ─── Top Row ─── */}
      <div className="relative z-10 flex items-start justify-between">

        {/* Price & Change */}
        <div className="flex flex-col mt-1">
          <div className="flex items-baseline font-sans tracking-tight">
            <span className="text-[44px] font-medium text-[#F4F4F5] leading-none">${integerPart}</span>
            <span className="text-[20px] font-medium text-[#A1A1AA] leading-none ml-[1px]">{decimalPart}</span>
          </div>

          <div
            className={`mt-2.5 flex items-center gap-1.5 text-[14px] font-medium tracking-wide ${isPositive ? 'text-[#30D158]' : 'text-[#FF453A]'
              }`}
          >
            <span className="text-[11px]">{isPositive ? '▲' : '▼'}</span>
            <span>{Math.abs(numericChange).toFixed(2)}%</span>
          </div>
        </div>

        {/* Coin Info Identity */}
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center relative overflow-hidden"
            style={{
              background: '#1A1A1C',
              boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.04)'
            }}
          >
            {!imgError && iconUrl ? (
              <img
                src={iconUrl}
                alt={symbol}
                className="w-[22px] h-[22px] object-contain opacity-90"
                onError={() => setImgError(true)}
              />
            ) : (
              <Hexagon className="w-5 h-5 text-[#A1A1AA]" strokeWidth={1.5} />
            )}
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-[#F4F4F5] font-medium text-[18px] leading-tight capitalize tracking-tight">
              {coin || 'Crypto'}
            </span>
            <span className="text-[#71717A] text-[13px] font-medium leading-tight mt-0.5 uppercase tracking-widest">
              {symbol || 'COIN'}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Sparkline Chart (Live Right-Edge Anchored) ─── */}
      {sparkline && (
        <div className="relative z-10 mt-10 -mx-4 h-[150px]">
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            preserveAspectRatio="none"
            className="overflow-visible"
          >
            {/* Elegant Fade Gradient for the Line */}
            <defs>
              <linearGradient id="seniorGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgba(255,255,255,0.05)" />
                <stop offset="40%" stopColor="rgba(255,255,255,0.15)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.7)" />
              </linearGradient>
            </defs>

            {/* The Line */}
            <motion.path
              d={sparkline.d}
              stroke="url(#seniorGrad)"
              strokeWidth={1.5}
              strokeLinejoin="round"
              strokeLinecap="round"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />

            {/* Restrained Live Pulse Base */}
            <circle
              cx={sparkline.endPoint.x}
              cy={sparkline.endPoint.y}
              r={3.5}
              fill="#FFFFFF"
            />

            {/* Soft, Sophisticated Breathing Animation */}
            <motion.circle
              cx={sparkline.endPoint.x}
              cy={sparkline.endPoint.y}
              r={3.5}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth={1}
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 2.5, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            />
          </svg>

          {/* Premium Tooltip (Anchored above the live point) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="absolute px-3 py-1.5 pointer-events-none rounded-[10px] flex flex-col items-center justify-center"
            style={{
              background: '#1C1C1E',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 8px 16px rgba(0,0,0,0.4)',
              // Precisely aligns the center of the tooltip to the dot
              transform: 'translate(-50%, -100%)',
              left: `${(sparkline.endPoint.x / SVG_W) * 100}%`,
              top: `${sparkline.endPoint.y - 12}px`,
            }}
          >
            <p className="text-[#F4F4F5] text-[13px] font-medium whitespace-nowrap leading-tight tracking-tight">
              ${sparkline.endPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[#71717A] text-[10px] font-medium leading-tight mt-[3px] tracking-wide">
              {formattedDate}
            </p>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default CryptoCard;