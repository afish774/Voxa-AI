import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Hexagon } from 'lucide-react';

const CryptoCard = ({ coin, symbol, price, change, sparklineData }) => {
  const numericPrice = typeof price === 'number' ? price : parseFloat(price) || 0;
  const numericChange = typeof change === 'number' ? change : parseFloat(change) || 0;
  const isPositive = numericChange >= 0;

  // Format price into Big Integer and Small Decimal parts
  const priceFormatted = numericPrice.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const dotIndex = priceFormatted.indexOf('.');
  const integerPart = dotIndex >= 0 ? priceFormatted.slice(0, dotIndex) : priceFormatted;
  const decimalPart = dotIndex >= 0 ? priceFormatted.slice(dotIndex) : '.00';

  // Dynamic Logo Fetcher with state for fallback
  const [imgError, setImgError] = useState(false);
  const iconUrl = symbol ? `https://assets.coincap.io/assets/icons/${symbol.toLowerCase()}@2x.png` : null;

  // ─── Sparkline Engine (Anchored to the Right Edge) ───────────────
  const SVG_W = 340;
  const SVG_H = 160;

  const sparkline = useMemo(() => {
    let data = sparklineData;

    // Mathematical Fallback if API lacks chart history
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
    }

    // Force the final point to exactly match the current live price
    if (data.length > 0) {
      data[data.length - 1] = numericPrice;
    }

    const minV = Math.min(...data);
    const maxV = Math.max(...data);
    const range = maxV - minV || 1;
    const padX = 4; // Padding to prevent right-edge clipping
    const padY = 40; // Extra top padding so tooltip fits beautifully

    const points = data.map((v, i) => ({
      x: padX + (i / (data.length - 1)) * (SVG_W - padX * 2),
      y: padY + (1 - (v - minV) / range) * (SVG_H - padY * 2),
    }));

    let d = `M ${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x},${points[i].y}`;
    }

    // Target the right-most point (Live Data) instead of the peak
    const endIdx = data.length - 1;
    const endPoint = points[endIdx];

    return { d, endPoint, endPrice: numericPrice };
  }, [sparklineData, numericPrice, numericChange]);

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
      {/* ─── Premium Drifting Grid ─── */}
      <motion.div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        animate={{ backgroundPosition: ["0px 0px", "42px 42px"] }}
        transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px),
                            linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: '42px 42px',
        }}
      />

      {/* ─── Top Row: Price (left) + Official Coin Logo (right) ─── */}
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <div className="flex items-baseline font-sans tracking-tight drop-shadow-md">
            <span className="text-[42px] font-semibold text-white leading-none">${integerPart}</span>
            <span className="text-[22px] font-medium text-white/40 leading-none ml-0.5">{decimalPart}</span>
          </div>

          <div
            className={`mt-3 flex items-center gap-1.5 text-[15px] font-semibold tracking-wide drop-shadow-sm ${isPositive ? 'text-[#34C759]' : 'text-[#FF3B30]'
              }`}
          >
            <span className="text-xs">{isPositive ? '▲' : '▼'}</span>
            <span>{Math.abs(numericChange).toFixed(2)}%</span>
          </div>
        </div>

        <div className="flex items-center gap-3.5">
          <div
            className="w-[46px] h-[46px] rounded-full flex items-center justify-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #2A2A2C 0%, #151516 100%)',
              boxShadow: '0 8px 16px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.05)'
            }}
          >
            {!imgError && iconUrl ? (
              <img
                src={iconUrl}
                alt={symbol}
                className="w-6 h-6 object-contain drop-shadow-lg"
                onError={() => setImgError(true)}
              />
            ) : (
              <Hexagon className="w-6 h-6 text-white/90 drop-shadow-md" strokeWidth={2} />
            )}
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-white font-medium text-[19px] leading-tight capitalize tracking-tight drop-shadow-md">
              {coin || 'Crypto'}
            </span>
            <span className="text-white/40 text-[13px] font-medium leading-tight mt-0.5 uppercase tracking-widest">
              {symbol || 'COIN'}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Sparkline Chart (Live Right-Edge Anchored) ─── */}
      {sparkline && (
        <div className="relative z-10 mt-8 h-[160px]">
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            preserveAspectRatio="none"
            className="overflow-visible"
          >
            {/* Premium Gradient Stroke: Fades in from left to right */}
            <defs>
              <linearGradient id="sparkGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgba(255,255,255,0.02)" />
                <stop offset="50%" stopColor="rgba(255,255,255,0.15)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.9)" />
              </linearGradient>
            </defs>

            <motion.path
              d={sparkline.d}
              stroke="url(#sparkGrad)"
              strokeWidth={1.5}
              strokeLinejoin="round"
              strokeLinecap="round"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />

            {/* Solid Final Dot (Live Price Point) */}
            <motion.circle
              cx={sparkline.endPoint.x}
              cy={sparkline.endPoint.y}
              r={4.5}
              fill="#FFFFFF"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.4, type: "spring" }}
            />

            {/* Expanding Live Radar Pulse */}
            <motion.circle
              cx={sparkline.endPoint.x}
              cy={sparkline.endPoint.y}
              r={4.5}
              fill="none"
              stroke={isPositive ? "#34C759" : "#FFFFFF"}
              strokeWidth={2}
              initial={{ scale: 1, opacity: 0.8 }}
              animate={{ scale: 4, opacity: 0 }}
              transition={{ delay: 1.5, repeat: Infinity, duration: 2, ease: "easeOut" }}
            />
          </svg>

          {/* Floating Rate Container (Anchored perfectly above the live pulse) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.4 }}
            className="absolute px-3.5 py-2 pointer-events-none backdrop-blur-md rounded-xl flex flex-col items-end"
            style={{
              background: 'rgba(20,20,22,0.85)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 10px 24px rgba(0,0,0,0.6)',
              right: '0px',
              top: `${sparkline.endPoint.y - 66}px`, // Sits cleanly right above the dot
            }}
          >
            <div className="flex items-center gap-2">
              {/* Internal pulsing indicator */}
              <div className={`w-1.5 h-1.5 rounded-full ${isPositive ? 'bg-[#34C759]' : 'bg-[#FF3B30]'} animate-pulse`} />
              <p className="text-white text-[14px] font-semibold whitespace-nowrap leading-tight text-right">
                ${sparkline.endPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <p className="text-white/40 text-[10px] font-bold text-right leading-tight mt-1 tracking-widest uppercase">
              Live Rate
            </p>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default CryptoCard;