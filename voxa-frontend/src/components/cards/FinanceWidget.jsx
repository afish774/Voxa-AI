import React from 'react';
import { motion } from 'framer-motion';
import { Receipt, ArrowDownCircle, ArrowUpCircle, Wallet, PieChart, TrendingUp, TrendingDown, Minus, CheckCircle2 } from 'lucide-react';

// ============================================================================
// 💰 FinanceWidget — Apple Premium Wallet & Insights Card
// ============================================================================
// Design DNA: iOS 17 Apple Card / Cupertino Glassmorphism
// Features: 32px backdrop blur, adaptive semantic glows (Surplus vs Deficit),
// tabular numerals, and nested glass panels for transaction history.
// ============================================================================

const CATEGORY_COLORS = {
  Food: '#FF9F0A', Transport: '#0A84FF', Entertainment: '#BF5AF2', Health: '#30D158',
  Shopping: '#FF375F', Utilities: '#5E5CE6', Rent: '#FF453A', Salary: '#32ADE6',
  Freelance: '#30D158', Travel: '#FF9F0A', Education: '#BF5AF2', Investment: '#0A84FF',
  Other: '#8E8E93',
};

const FinanceWidget = ({ data }) => {
  if (!data) return null;
  const { mode, error } = data;

  // ─── Error State ───
  if (error) {
    return (
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[420px] rounded-[24px] sm:rounded-[28px] p-5 mt-5"
        style={{ background: 'rgba(28, 28, 30, 0.8)', border: '1px solid rgba(255,69,58,0.2)' }}>
        <span className="text-[13px] text-[#FF453A] font-medium tracking-tight break-words">{error}</span>
      </motion.div>
    );
  }

  // ==========================================================================
  // 🎟️ MODE: RECEIPT (Transaction Logged)
  // ==========================================================================
  if (mode === 'receipt') {
    const { transactionId, type, amount, category, description, date, time } = data;
    const isIncome = type === 'income';
    const themeColor = isIncome ? '#30D158' : '#FF453A';
    const TypeIcon = isIncome ? ArrowUpCircle : ArrowDownCircle;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-[400px] rounded-[32px] overflow-hidden mt-5 shadow-2xl"
        style={{
          background: 'rgba(20, 20, 22, 0.65)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 24px 48px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
        }}
      >
        <div className="absolute top-0 left-0 w-full h-32 pointer-events-none opacity-20" style={{
          background: `radial-gradient(ellipse at 50% -20%, ${themeColor} 0%, transparent 70%)`,
          filter: 'blur(40px)',
        }} />

        <div className="relative z-10 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" style={{ color: themeColor }} />
              <span className="text-[14px] font-semibold text-white/80 tracking-tight">Transaction Logged</span>
            </div>
            <span className="text-[11px] font-mono text-white/40 uppercase tracking-wider">{transactionId}</span>
          </div>

          <div className="flex flex-col items-center justify-center text-center mb-6">
            <span className="text-[13px] font-medium text-white/50 mb-1">{isIncome ? 'Received' : 'Spent'}</span>
            <div className="flex items-baseline gap-1">
              <span className="text-[24px] sm:text-[28px] font-semibold text-white/50">$</span>
              <span className="text-[44px] sm:text-[52px] font-bold text-white tracking-tighter leading-none tabular-nums">
                {amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-[20px] flex flex-col gap-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-white/50 font-medium">Category</span>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: CATEGORY_COLORS[category] || '#8E8E93' }} />
                <span className="text-[14px] font-semibold text-white/90">{category}</span>
              </div>
            </div>
            <div className="w-full h-[1px]" style={{ background: 'rgba(255,255,255,0.05)' }} />
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-white/50 font-medium">Description</span>
              <span className="text-[14px] font-medium text-white/90 max-w-[160px] truncate">{description}</span>
            </div>
            <div className="w-full h-[1px]" style={{ background: 'rgba(255,255,255,0.05)' }} />
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-white/50 font-medium">Date & Time</span>
              <span className="text-[13px] font-medium text-white/80">{date} at {time}</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // ==========================================================================
  // 📊 MODE: SUMMARY (Spending Report)
  // ==========================================================================
  if (mode === 'summary') {
    const { period, totalIncome, totalExpenses, balance, topCategories, recentTransactions, healthStatus } = data;
    const safeTopCategories = topCategories || [];
    const safeRecentTransactions = recentTransactions || [];

    const isSurplus = healthStatus === 'surplus';
    const isDeficit = healthStatus === 'deficit';
    const themeColor = isSurplus ? '#30D158' : isDeficit ? '#FF453A' : '#8E8E93';

    return (
      <motion.div
        initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-[440px] rounded-[32px] overflow-hidden mt-5 shadow-2xl"
        style={{
          background: 'rgba(20, 20, 22, 0.65)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 24px 48px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
        }}
      >
        <div className="absolute top-0 right-0 w-3/4 h-48 pointer-events-none opacity-20" style={{
          background: `radial-gradient(ellipse at 80% -20%, ${themeColor} 0%, transparent 70%)`,
          filter: 'blur(40px)',
        }} />

        <div className="relative z-10 p-5 sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <Wallet className="w-4 h-4 text-white/90" />
              </div>
              <span className="text-[14px] font-semibold text-white/80 tracking-tight">Spending Summary</span>
            </div>
            <span className="text-[11px] font-bold text-white/40 uppercase tracking-wider bg-white/5 px-2.5 py-1 rounded-full">{period}</span>
          </div>

          {/* Balance Display */}
          <div className="mb-6">
            <p className="text-[12px] text-white/50 font-medium uppercase tracking-wider mb-1">Net Balance</p>
            <div className="flex items-baseline gap-1">
              <span className="text-[28px] sm:text-[32px] font-semibold" style={{ color: themeColor }}>{balance >= 0 ? '+' : '-'}$</span>
              <span className="text-[40px] sm:text-[46px] font-bold text-white tracking-tighter leading-none tabular-nums">
                {Math.abs(balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Income vs Expenses Bar */}
          <div className="flex items-center gap-2 mb-6">
            <div className="flex-1 p-3 rounded-[18px]" style={{ background: 'rgba(48, 209, 88, 0.1)', border: '1px solid rgba(48, 209, 88, 0.15)' }}>
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-[#30D158]" />
                <span className="text-[11px] font-semibold text-[#30D158] uppercase tracking-wider">In</span>
              </div>
              <span className="text-[16px] font-bold text-white tabular-nums tracking-tight">
                ${totalIncome?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex-1 p-3 rounded-[18px]" style={{ background: 'rgba(255, 69, 58, 0.1)', border: '1px solid rgba(255, 69, 58, 0.15)' }}>
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingDown className="w-3.5 h-3.5 text-[#FF453A]" />
                <span className="text-[11px] font-semibold text-[#FF453A] uppercase tracking-wider">Out</span>
              </div>
              <span className="text-[16px] font-bold text-white tabular-nums tracking-tight">
                ${totalExpenses?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Recent Transactions */}
          {safeRecentTransactions.length > 0 && (
            <div className="mb-4">
              <p className="text-[12px] text-white/40 font-semibold uppercase tracking-wider mb-2.5">Recent Activity</p>
              <div className="flex flex-col gap-2">
                {safeRecentTransactions.map((tx, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-[16px] transition-colors hover:bg-white/5" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: CATEGORY_COLORS[tx.category] || '#8E8E93' }} />
                      <div className="flex flex-col min-w-0">
                        <span className="text-[14px] font-semibold text-white/90 truncate capitalize">{tx.desc}</span>
                        <span className="text-[11px] text-white/40 font-medium truncate">{tx.category} • {tx.date}</span>
                      </div>
                    </div>
                    <span className="text-[14px] font-semibold tabular-nums shrink-0 ml-3" style={{ color: tx.amount >= 0 ? '#30D158' : '#FF453A' }}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return null;
};

export default FinanceWidget;