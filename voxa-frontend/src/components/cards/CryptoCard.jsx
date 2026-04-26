import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Hexagon } from 'lucide-react';

const CryptoCard = ({ coin, symbol, price, change, sparklineData }) => {
  const numericPrice = typeof price === 'number' ? price : parseFloat(price) || 0;
  const numericChange = typeof change === 'number' ? change : parseFloat(change) || 0;
  const isPositive = numericChange >= 0;
  const themeColor = isPositive ? '#30D158' : '#FF453A';

  // Premium Typography Formatting
  const priceFormatted = numericPrice.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const dotIndex = priceFormatted.indexOf('.');
  const integerPart = dotIndex >= 0 ? priceFormatted.slice(0, dotIndex) : priceFormatted;
  const decimalPart = dotIndex >= 0 ? priceFormatted.slice(dotIndex) : '.00';

  // ─── Senior Logo Fallback Engine ───
  const safeSymbol = symbol ? symbol.toLowerCase() : '';
  const logoUrls = [
    `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/${safeSymbol}.svg`,
    `https://assets.coincap.io/assets/icons/${safeSymbol}@2x.png`
  ];
  const [logoIndex, setLogoIndex] = useState(0);

  // ─── Sparkline Engine (Organic Market Curve + Safe Padding) ───────────────
  const SVG_W = 400;
  const SVG_H = 160;

  const sparkline = useMemo(() => {
    let data = sparklineData;

    // Generates a highly realistic, smooth market trajectory if API lacks history
    if (!data || !Array.isArray(data) || data.length < 2) {
      data = [];
      const startPrice = numericPrice / (1 + numericChange / 100);
      const steps = 60;

      for (let i = 0; i < steps; i++) {
        const progress = i / (steps - 1);
        // Base trend line from yesterday to today
        const trend = startPrice + (numericPrice - startPrice) * progress;
        // Organic multi-layered wave noise
        const noise = (Math.sin(i * 0.4) * 0.6 + Math.sin(i * 1.1) * 0.4) * (numericPrice * 0.0015);
        data.push(trend + noise);
      }
    }

    // Absolutely anchor the final tick to the real live price
    if (data.length > 0) {
      data[data.length - 1] = numericPrice;
    }

    const minV = Math.min(...data);
    const maxV = Math.max(...data);
    const range = maxV - minV || 1;

    // 🛠️ THE ZERO-CLIP FIX: Massive top padding so the tooltip always has room
    const padX = 2;
    const padTop = 64;
    const padBottom = 4;
    const usableHeight = SVG_H - padTop - padBottom;

    const points = data.map((v, i) => ({
      x: padX + (i / (data.length - 1)) * (SVG_W - padX * 2),
      y: padTop + (1 - (v - minV) / range) * usableHeight,
    }));

    let d = `M ${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x},${points[i].y}`;
    }

    // Create a closed path for the soft gradient fill underneath
    const fillD = `${d} L ${points[points.length - 1].x},${SVG_H} L ${points[0].x},${SVG_H} Z`;

    const endIdx = data.length - 1;
    const endPoint = points[endIdx];

    return { d, fillD, endPoint, endPrice: numericPrice };
  }, [sparklineData, numericPrice, numericChange]);

  const formattedDate = useMemo(() => {
    return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="relative flex flex-col justify-between w-full max-w-[420px] h-[310px] p-7 rounded-[36px] overflow-hidden"
      style={{
        background: '#0B0B0C',
        border: '1px solid rgba(255,255,255,0.06)',
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

          <div className="mt-2 flex items-center gap-1.5 text-[15px] font-semibold tracking-wide" style={{ color: themeColor }}>
            <span className="text-[12px]">{isPositive ? '▲' : '▼'}</span>
            <span>{Math.abs(numericChange).toFixed(2)}%</span>
          </div>
        </div>

        {/* Coin Identity */}
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-[14px] flex items-center justify-center relative overflow-hidden backdrop-blur-md"
            style={{
              background: 'rgba(255,255,255,0.03)',
              boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.05)'
            }}
          >
            {logoIndex < logoUrls.length ? (
              <img
                src={logoUrls[logoIndex]}
                alt={symbol}
                className="w-[26px] h-[26px] object-contain drop-shadow-md"
                onError={() => setLogoIndex(prev => prev + 1)}
              />
            ) : (
              <Hexagon className="w-5 h-5 text-[#A1A1AA]" strokeWidth={1.5} />
            )}
          </div>
          <div className="flex flex-col">
            {/* 🧹 QA FIX: Added truncate to prevent long coin name overflow */}
            <span className="text-[#FFFFFF] font-medium text-[17px] leading-tight capitalize tracking-tight truncate max-w-[120px]">
              {coin || 'Crypto'}
            </span>
            <span className="text-[#71717A] text-[13px] font-semibold leading-tight mt-[2px] uppercase tracking-widest">
              {symbol || 'COIN'}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Sparkline Chart Area ─── */}
      <div className="relative z-10 flex-grow w-full mt-8 -mx-2">
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          preserveAspectRatio="none"
          className="overflow-visible"
        >
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.9)" />
            </linearGradient>
            <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>

          {/* Soft Fill Underneath */}
          <motion.path
            d={sparkline.fillD}
            fill="url(#fillGrad)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 1 }}
          />

          {/* Precision Line */}
          <motion.path
            d={sparkline.d}
            stroke="url(#lineGrad)"
            strokeWidth={1.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />

          {/* Solid White End Dot */}
          <circle cx={sparkline.endPoint.x} cy={sparkline.endPoint.y} r={4} fill="#FFFFFF" />

          {/* Subtle Live Breathing Pulse */}
          <motion.circle
            cx={sparkline.endPoint.x}
            cy={sparkline.endPoint.y}
            r={4}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={1.5}
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{ scale: 3.5, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          />
        </svg>

        {/* ─── ZERO-CLIP RATE SHOWER ─── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, duration: 0.4 }}
          className="absolute right-0 flex flex-col items-end pointer-events-none"
          style={{
            // Uses percentage to strictly track the Y position, minus 48px to float above the dot
            top: `calc(${(sparkline.endPoint.y / SVG_H) * 100}% - 48px)`,
            marginRight: '8px' // Keeps it gently off the exact right wall
          }}
        >
          <div className="flex flex-col items-center justify-center px-3.5 py-1.5 rounded-[10px] backdrop-blur-md"
            style={{
              background: 'rgba(28,28,30,0.85)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 10px 24px rgba(0,0,0,0.6)',
            }}>
            <span className="text-[#FFFFFF] text-[13px] font-semibold whitespace-nowrap leading-tight tracking-tight">
              ${sparkline.endPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[#A1A1AA] text-[10px] font-medium leading-tight mt-[3px] tracking-wide">
              {formattedDate}
            </span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default CryptoCard;