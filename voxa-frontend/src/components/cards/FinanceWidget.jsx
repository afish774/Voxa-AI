import React from 'react';
import { motion } from 'framer-motion';
import { Receipt, ArrowDownCircle, ArrowUpCircle, Wallet, PieChart, TrendingUp, TrendingDown, Minus } from 'lucide-react';

// ============================================================================
// 💰 FinanceWidget — Personal Finance Card
// ============================================================================
// Handles two modes:
//   mode: 'receipt'  — Glowing success ticket after logging a transaction
//     { mode, transactionId, type, amount, category, description, date, time, typeLabel }
//   mode: 'summary'  — Sleek spending breakdown
//     { mode, period, totalIncome, totalExpenses, balance, transactionCount,
//       topCategories: [{name, amount, percent}],
//       recentTransactions: [{desc, amount, category, date}],
//       healthStatus: 'surplus'|'deficit'|'break-even' }
// ============================================================================

const CATEGORY_COLORS = {
  Food: '#F59E0B', Transport: '#3B82F6', Entertainment: '#A855F7', Health: '#10B981',
  Shopping: '#EC4899', Utilities: '#6366F1', Rent: '#EF4444', Salary: '#22C55E',
  Freelance: '#14B8A6', Travel: '#F97316', Education: '#8B5CF6', Investment: '#0EA5E9',
  Other: '#71717A',
};

const FinanceWidget = ({ data }) => {
  if (!data) return null;
  const { mode } = data;

  // ── Receipt Mode ──────────────────────────────────────────────────────────
  if (mode === 'receipt') {
    const { transactionId, type, amount, category, description, date, time, typeLabel } = data;
    const isIncome = type === 'income';
    const accentColor = isIncome ? '#22C55E' : '#F59E0B';

    return (
      <motion.div
        initial={{ opacity: 0, y: 15, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="relative w-full max-w-[420px] rounded-[28px] overflow-hidden mt-5"
        style={{
          background: '#0B0B0C',
          border: `1px solid ${isIncome ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)'}`,
          boxShadow: `0 24px 48px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)`,
        }}
      >
        {/* Glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `radial-gradient(ellipse at 50% 0%, ${isIncome ? 'rgba(34,197,94,0.06)' : 'rgba(245,158,11,0.06)'} 0%, transparent 60%)`,
        }} />

        <div className="relative z-10 p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{
                background: `linear-gradient(135deg, ${accentColor}22, ${accentColor}11)`,
              }}>
                {isIncome
                  ? <ArrowUpCircle className="w-[18px] h-[18px]" style={{ color: accentColor }} />
                  : <ArrowDownCircle className="w-[18px] h-[18px]" style={{ color: accentColor }} />
                }
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: accentColor }}>
                  {typeLabel || (isIncome ? '💰 Income' : '💸 Expense')}
                </span>
                <p className="text-[11px] text-[#52525B] font-medium">#{transactionId}</p>
              </div>
            </div>
            <Receipt className="w-4 h-4 text-[#3F3F46]" />
          </div>

          {/* Amount */}
          <div className="mb-3">
            <span className="text-[32px] font-semibold text-white/95 tracking-[-0.02em] leading-none">
              {isIncome ? '+' : '-'}₹{parseFloat(amount || 0).toLocaleString('en-IN')}
            </span>
          </div>

          {/* Details */}
          <div className="flex flex-col gap-1.5">
            <p className="text-[14px] text-[#D4D4D8] font-medium capitalize">{description}</p>
            <div className="flex items-center gap-3 text-[12px] text-[#71717A]">
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{
                background: `${CATEGORY_COLORS[category] || '#71717A'}15`,
                color: CATEGORY_COLORS[category] || '#71717A',
              }}>
                {category}
              </span>
              <span>{date}</span>
              {time && <span>{time}</span>}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // ── Summary Mode ──────────────────────────────────────────────────────────
  if (mode === 'summary') {
    const { period, totalIncome = 0, totalExpenses = 0, balance = 0, transactionCount = 0, topCategories = [], recentTransactions = [], healthStatus } = data;
    const statusColor = healthStatus === 'surplus' ? '#22C55E' : healthStatus === 'deficit' ? '#EF4444' : '#71717A';

    return (
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        className="relative w-full max-w-[460px] rounded-[32px] overflow-hidden mt-5"
        style={{
          background: '#0B0B0C',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 32px 64px -16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(99, 102, 241, 0.05) 0%, transparent 60%)',
        }} />

        <div className="relative z-10 p-7">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-4 h-4 text-indigo-400/70" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-indigo-400/70">Finance Summary</span>
          </div>
          <p className="text-[13px] text-[#71717A] mb-5 font-medium">{period} · {transactionCount} transactions</p>

          {/* Balance Banner */}
          <div className="flex items-center justify-between p-4 rounded-2xl mb-4" style={{
            background: `${statusColor}08`,
            border: `1px solid ${statusColor}15`,
          }}>
            <div>
              <p className="text-[11px] text-[#71717A] uppercase tracking-wider font-semibold mb-1">Net Balance</p>
              <span className="text-[28px] font-semibold text-white/95 tracking-[-0.02em] leading-none">
                {balance >= 0 ? '+' : ''}₹{Math.abs(balance).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
              background: `${statusColor}15`,
            }}>
              {healthStatus === 'surplus' ? <TrendingUp className="w-5 h-5" style={{ color: statusColor }} />
                : healthStatus === 'deficit' ? <TrendingDown className="w-5 h-5" style={{ color: statusColor }} />
                : <Minus className="w-5 h-5" style={{ color: statusColor }} />
              }
            </div>
          </div>

          {/* Income / Expense Row */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="p-3 rounded-xl" style={{ background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.08)' }}>
              <p className="text-[11px] text-emerald-400/60 font-semibold uppercase tracking-wider mb-1">Income</p>
              <p className="text-[18px] font-semibold text-emerald-400 tracking-tight">+₹{totalIncome.toLocaleString('en-IN')}</p>
            </div>
            <div className="p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.08)' }}>
              <p className="text-[11px] text-red-400/60 font-semibold uppercase tracking-wider mb-1">Expenses</p>
              <p className="text-[18px] font-semibold text-red-400 tracking-tight">-₹{totalExpenses.toLocaleString('en-IN')}</p>
            </div>
          </div>

          {/* Top Categories */}
          {topCategories.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <PieChart className="w-3.5 h-3.5 text-[#52525B]" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#52525B]">Top Spending</span>
              </div>
              <div className="flex flex-col gap-2">
                {topCategories.map((cat, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[13px] text-[#D4D4D8] font-medium">{cat.name}</span>
                        <span className="text-[12px] text-[#A1A1AA] font-semibold">₹{cat.amount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${cat.percent}%` }}
                          transition={{ delay: 0.3 + i * 0.1, duration: 0.6, ease: 'easeOut' }}
                          className="h-full rounded-full"
                          style={{ background: CATEGORY_COLORS[cat.name] || '#71717A' }}
                        />
                      </div>
                    </div>
                    <span className="text-[11px] text-[#52525B] font-bold w-8 text-right">{cat.percent}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Transactions */}
          {recentTransactions.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#52525B] mb-2">Recent</p>
              {recentTransactions.map((tx, i) => (
                <div key={i} className="flex items-center justify-between py-2" style={{
                  borderBottom: i < recentTransactions.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: tx.amount >= 0 ? '#22C55E' : '#EF4444' }} />
                    <div>
                      <p className="text-[13px] text-[#D4D4D8] font-medium capitalize">{tx.desc}</p>
                      <p className="text-[11px] text-[#52525B]">{tx.category} · {tx.date}</p>
                    </div>
                  </div>
                  <span className="text-[13px] font-semibold" style={{ color: tx.amount >= 0 ? '#22C55E' : '#EF4444' }}>
                    {tx.amount >= 0 ? '+' : ''}₹{Math.abs(tx.amount).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return null;
};

export default FinanceWidget;
