import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

const CryptoCard = ({ coin, price, change }) => {
    const isUp = parseFloat(change) >= 0;

    const formattedPrice = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 6
    }).format(parseFloat(price));

    const formattedChange = Math.abs(parseFloat(change)).toFixed(2);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="relative overflow-hidden rounded-3xl bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 p-6 w-[320px] shadow-2xl"
        >
            {/* Dynamic Background Glow matching the reference */}
            <div className={`absolute -top-16 -right-16 w-64 h-64 blur-[100px] rounded-full opacity-20 pointer-events-none transition-colors duration-1000 ${isUp ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>

            {/* HEADER */}
            <div className="flex justify-between items-start mb-8 relative z-10">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-lg leading-none">
                                {coin ? coin.charAt(0).toUpperCase() : '₿'}
                            </span>
                        </div>
                        <span className="text-lg font-bold text-white tracking-wide capitalize">
                            {coin ? coin.replace('-', ' ') : 'Bitcoin'}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                    <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">Live</span>
                </div>
            </div>

            {/* BODY: Price matching reference layout */}
            <div className="relative z-10 flex flex-col mb-6">
                <span className="text-xs font-semibold text-white/40 tracking-widest uppercase mb-1">Current Price</span>
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="text-4xl font-black tabular-nums tracking-tighter text-white"
                >
                    {formattedPrice}
                </motion.div>
            </div>

            {/* FOOTER: Percentage Pill matching reference */}
            <div className="relative z-10">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold tabular-nums text-sm ${isUp ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                    {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    <span>{isUp ? '+' : '-'}{formattedChange}%</span>
                    <span className="text-[10px] font-medium opacity-70 ml-0.5 uppercase">(24h)</span>
                </div>
            </div>
        </motion.div>
    );
};

export default CryptoCard;