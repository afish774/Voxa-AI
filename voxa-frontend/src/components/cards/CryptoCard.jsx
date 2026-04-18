import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Bitcoin, Activity } from 'lucide-react';

const CryptoCard = ({ coin, price, change }) => {
    // Determine if the price is up or down
    const isUp = parseFloat(change) >= 0;

    // Format the numbers beautifully
    const formattedPrice = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 6 // Allows small altcoins to show decimal places
    }).format(parseFloat(price));

    const formattedChange = Math.abs(parseFloat(change)).toFixed(2);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="glass-container relative overflow-hidden"
        >
            {/* Dynamic Background Glow */}
            <div className={`absolute -top-10 -right-10 w-48 h-48 blur-[80px] rounded-full opacity-30 pointer-events-none transition-colors duration-1000 ${isUp ? 'bg-emerald-500' : 'bg-red-500'}`}></div>

            {/* HEADER */}
            <div className="flex justify-between items-center mb-6 relative z-10">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                    <Bitcoin className="w-4 h-4 text-amber-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/90">Crypto Market</span>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                    <Activity className="w-3.5 h-3.5 text-white/40" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Live Data</span>
                </div>
            </div>

            {/* BODY: Coin Name & Price */}
            <div className="relative z-10 flex flex-col items-center justify-center py-4">
                <span className="text-sm font-bold text-white/60 tracking-widest uppercase mb-2">
                    {coin.replace('-', ' ')}
                </span>

                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="text-5xl font-black tabular-nums tracking-tighter drop-shadow-2xl bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent"
                >
                    {formattedPrice}
                </motion.div>
            </div>

            {/* FOOTER: 24h Change Indicator */}
            <div className="mt-4 pt-4 border-t border-white/10 relative z-10 flex justify-center">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-md border ${isUp ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                    {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    <span className="text-sm font-bold tabular-nums tracking-wide">
                        {isUp ? '+' : '-'}{formattedChange}% <span className="text-[10px] font-medium opacity-60 ml-1 uppercase">24h</span>
                    </span>
                </div>
            </div>
        </motion.div>
    );
};

export default CryptoCard;