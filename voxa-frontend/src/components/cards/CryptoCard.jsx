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

  // ─── Senior Logo Fallback Engine ───
  // Tries high-res SVG first, falls back to PNG, then safely defaults to generic icon
  const safeSymbol = symbol ? symbol.toLowerCase() : '';
  const logoUrls = [
    `https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@master/svg/color/${safeSymbol}.svg`,
    `https://assets.coincap.io/assets/icons/${safeSymbol}@2x.png`
  ];
  const [logoIndex, setLogoIndex] = useState(0);

  // ─── Sparkline Engine (Realistic & mathematically safe) ───────────────
  const SVG_W = 380;
  const SVG_H = 140;

  const sparkline = useMemo(() => {
    let data = sparklineData;

    // Generates a highly realistic, jagged market chart if API data is missing
    if (!data || !Array.isArray(data) || data.length < 2) {
      data = [];
      const startPrice = numericPrice / (1 + numericChange / 100);
      let curr = startPrice;
      const steps = 80;
      const baseTrend = (numericPrice - startPrice) / steps;

      for (let i = 0; i < steps; i++) {
        // Multi-frequency sine waves create incredibly realistic organic market noise
        const organicNoise = Math.sin(i * 0.4) * 0.6 + Math.cos(i * 1.7) * 0.4;
        const volatility = numericPrice * 0.0018 * organicNoise;
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

    // 🛠️ SENIOR FIX: Asymmetrical padding. 
    // Massive top padding ensures the tooltip NEVER clips outside the card bounds.
    const padX = 2;
    const padTop = 54;
    const padBottom = 12;
    const usableHeight = SVG_H - padTop - padBottom;

    const points = data.map((v, i) => ({
      x: padX + (i / (data.length - 1)) * (SVG_W - padX * 2),
      y: padTop + (1 - (v - minV) / range) * usableHeight,
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
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      // Enforced rigid dimensions prevent all layout collapses
      className="relative flex flex-col justify-between w-full max-w-[420px] h-[300px] p-7 rounded-[36px] overflow-hidden"
      style={{
        background: '#0B0B0C', // Ultra-deep premium matte black
        border: '1px solid rgba(255,255,255,0.05)',
        // The inset shadow simulates physical 3D glass edge reflection
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)'
      }}
    >
      {/* ─── Understated Background Grid ─── */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px),
                            linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          backgroundPosition: 'left top'
        }}
      />

      {/* ─── Top Header Row ─── */}
      <div className="relative z-10 flex items-start justify-between w-full">

        {/* Price & Change */}
        <div className="flex flex-col">
          <div className="flex items-baseline font-sans tracking-tight">
            <span className="text-[40px] font-semibold text-[#FFFFFF] leading-none tracking-[-0.02em]">${integerPart}</span>
            <span className="text-[20px] font-medium text-[#A1A1AA] leading-none ml-[2px]">.{decimalPart.replace('.', '')}</span>
          </div>

          <div
            className={`mt-2 flex items-center gap-1.5 text-[15px] font-semibold tracking-wide ${isPositive ? 'text-[#30D158]' : 'text-[#FF453A]'
              }`}
          >
            <span className="text-[12px]">{isPositive ? '▲' : '▼'}</span>
            <span>{Math.abs(numericChange).toFixed(2)}%</span>
          </div>
        </div>

        {/* Coin Identity */}
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-[14px] flex items-center justify-center relative overflow-hidden"
            style={{
              background: '#161618',
              boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.02)'
            }}
          >
            {logoIndex < logoUrls.length ? (
              <img
                src={logoUrls[logoIndex]}
                alt={symbol}
                className="w-6 h-6 object-contain"
                onError={() => setLogoIndex(prev => prev + 1)}
              />
            ) : (
              <Hexagon className="w-5 h-5 text-[#A1A1AA]" strokeWidth={1.5} />
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-[#FFFFFF] font-medium text-[17px] leading-tight capitalize tracking-tight">
              {coin || 'Crypto'}
            </span>
            <span className="text-[#71717A] text-[13px] font-semibold leading-tight mt-[2px] uppercase tracking-widest">
              {symbol || 'COIN'}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Sparkline Chart Area ─── */}
      <div className="relative z-10 flex-grow w-full mt-6 -mx-2">
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          preserveAspectRatio="none"
          className="overflow-visible"
        >
          {/* Subtle Glow Gradient for the Line */}
          <defs>
            <linearGradient id="premiumGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(255,255,255,0.05)" />
              <stop offset="30%" stopColor="rgba(255,255,255,0.15)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.8)" />
            </linearGradient>
          </defs>

          {/* Precision Jagged Path */}
          <motion.path
            d={sparkline.d}
            stroke="url(#premiumGrad)"
            strokeWidth={1.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />

          {/* Solid White End Dot */}
          <circle
            cx={sparkline.endPoint.x}
            cy={sparkline.endPoint.y}
            r={4.5}
            fill="#FFFFFF"
          />

          {/* Subtle Live Breathing Pulse */}
          <motion.circle
            cx={sparkline.endPoint.x}
            cy={sparkline.endPoint.y}
            r={4.5}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={1}
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: 2.8, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
          />
        </svg>

        {/* Premium Dark Pill Tooltip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          className="absolute flex flex-col items-center justify-center px-3.5 py-1.5 rounded-[10px] pointer-events-none"
          style={{
            background: '#1A1A1C',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            // Safely offsets to the left and up, perfectly pointing to the live dot
            transform: 'translate(-100%, -100%)',
            left: `${(sparkline.endPoint.x / SVG_W) * 100}%`,
            top: `${sparkline.endPoint.y}px`,
            marginLeft: '6px', // Fine-tuning optical alignment
            marginTop: '-12px'
          }}
        >
          <span className="text-[#FFFFFF] text-[13px] font-semibold whitespace-nowrap leading-tight tracking-tight">
            ${sparkline.endPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[#71717A] text-[10px] font-medium leading-tight mt-[3px] tracking-wide">
            {formattedDate}
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default CryptoCard;