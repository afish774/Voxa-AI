import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

const CryptoCard = ({ coin, price, change }) => {
  const numericChange = typeof change === 'number' ? change : parseFloat(change) || 0;
  const numericPrice = typeof price === 'number' ? price : parseFloat(price) || 0;
  const isPositive = numericChange > 0;

  // Format price with $ prefix and comma separators
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericPrice);

  const formattedChange = Math.abs(numericChange).toFixed(2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="glass-container relative overflow-hidden"
    >
      {/* Glowing background orb */}
      <div
        className={
          isPositive
            ? 'absolute -top-16 -left-16 w-56 h-56 rounded-full bg-emerald-500 opacity-20 blur-3xl pointer-events-none'
            : 'absolute -top-16 -left-16 w-56 h-56 rounded-full bg-rose-500 opacity-20 blur-3xl pointer-events-none'
        }
      />

      {/* Secondary subtle orb for depth */}
      <div
        className={
          isPositive
            ? 'absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-emerald-500 opacity-10 blur-3xl pointer-events-none'
            : 'absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-rose-500 opacity-10 blur-3xl pointer-events-none'
        }
      />

      {/* Content wrapper */}
      <div className="relative z-10 flex flex-col gap-3 min-h-[140px]">
        {/* Coin name — top left */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white/60 tracking-widest uppercase">
            {coin}
          </span>
        </div>

        {/* Price — large, bold, left-aligned */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.1 }}
          className="flex-1"
        >
          <h2 className="text-5xl font-black tabular-nums tracking-tight leading-none bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent drop-shadow-2xl">
            {formattedPrice}
          </h2>
        </motion.div>

        {/* Footer row — pill badge in bottom-right */}
        <div className="flex justify-end items-center pt-2">
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.2 }}
            className={
              isPositive
                ? 'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 backdrop-blur-md'
                : 'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 backdrop-blur-md'
            }
          >
            {isPositive ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            <span className="text-xs font-bold tabular-nums tracking-wide">
              {isPositive ? '+' : '-'}{formattedChange}%
            </span>
            <span className="text-[10px] font-medium opacity-60 uppercase">24h</span>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default CryptoCard;