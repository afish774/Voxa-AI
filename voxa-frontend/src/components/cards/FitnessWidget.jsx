import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Dumbbell, Apple, Activity, Timer, CheckCircle2, Award, TrendingUp, CalendarDays, ChevronRight } from 'lucide-react';

// ============================================================================
// 🏋️ FitnessWidget — Apple Premium Health & Activity Card
// ============================================================================
// Design DNA: iOS 17 Fitness / Apple Health
// Features: 32px backdrop blur, mode-adaptive ambient glows (Green/Orange/Blue),
// tabular numerals, and nested frosted glass panels for activity metrics.
// ============================================================================

const FitnessWidget = ({ data }) => {
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
  // 🟢 MODE: LOG (Workout Confirmation)
  // ==========================================================================
  if (mode === 'log') {
    const { exercise, duration, caloriesBurned, sets, reps, streak = 0, streakLabel } = data;
    const themeColor = '#30D158'; // iOS System Green

    return (
      <motion.div
        initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-[440px] rounded-[32px] overflow-hidden mt-5 shadow-2xl"
        style={{
          background: 'rgba(20, 20, 22, 0.65)',
          backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 24px 48px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
        }}
      >
        <div className="absolute top-0 right-0 w-3/4 h-48 pointer-events-none opacity-20" style={{
          background: `radial-gradient(ellipse at 80% -20%, ${themeColor} 0%, transparent 70%)`, filter: 'blur(40px)',
        }} />

        <div className="relative z-10 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" style={{ color: themeColor }} />
              <span className="text-[14px] font-semibold text-white/80 tracking-tight">Workout Recorded</span>
            </div>
          </div>

          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-[26px] sm:text-[28px] font-bold text-white tracking-tight leading-none capitalize mb-1">
                {exercise || 'Workout'}
              </h2>
              {(sets || reps) && (
                <p className="text-[13px] text-white/50 font-medium">
                  {sets && `${sets} Sets`} {sets && reps && '×'} {reps && `${reps} Reps`}
                </p>
              )}
            </div>
            {streak > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: 'rgba(255, 159, 10, 0.15)' }}>
                <Flame className="w-3.5 h-3.5 text-[#FF9F0A]" />
                <span className="text-[12px] font-bold text-[#FF9F0A]">{streakLabel || `${streak} Day Streak`}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-2">
            <div className="p-4 rounded-[20px] flex flex-col items-center justify-center text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <Timer className="w-5 h-5 text-white/40 mb-2" />
              <div className="flex items-baseline gap-1">
                <span className="text-[28px] font-bold text-white tabular-nums tracking-tight leading-none">{duration || 0}</span>
                <span className="text-[13px] font-semibold text-white/50">min</span>
              </div>
            </div>
            <div className="p-4 rounded-[20px] flex flex-col items-center justify-center text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <Flame className="w-5 h-5" style={{ color: themeColor, opacity: 0.8 }} mb-2 />
              <div className="flex items-baseline gap-1">
                <span className="text-[28px] font-bold tabular-nums tracking-tight leading-none" style={{ color: themeColor }}>{caloriesBurned || 0}</span>
                <span className="text-[13px] font-semibold text-white/50">kcal</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // ==========================================================================
  // 🟠 MODE: NUTRITION (Calorie / Macro Lookup)
  // ==========================================================================
  if (mode === 'nutrition') {
    const { query, servingSize, calories, protein, carbs, fat, fiber } = data;
    const themeColor = '#FF9F0A'; // iOS System Orange

    return (
      <motion.div
        initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-[440px] rounded-[32px] overflow-hidden mt-5 shadow-2xl"
        style={{
          background: 'rgba(20, 20, 22, 0.65)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)',
          border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 24px 48px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
        }}
      >
        <div className="absolute top-0 right-0 w-3/4 h-48 pointer-events-none opacity-20" style={{
          background: `radial-gradient(ellipse at 80% -20%, ${themeColor} 0%, transparent 70%)`, filter: 'blur(40px)',
        }} />

        <div className="relative z-10 p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255, 159, 10, 0.15)' }}>
              <Apple className="w-4 h-4 text-[#FF9F0A]" />
            </div>
            <span className="text-[14px] font-semibold text-white/80 tracking-tight uppercase">Nutrition Facts</span>
          </div>

          <div className="flex items-end justify-between mb-6 pb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="min-w-0 pr-4">
              <h2 className="text-[24px] sm:text-[26px] font-bold text-white tracking-tight leading-none capitalize truncate">{query}</h2>
              <p className="text-[13px] text-white/50 font-medium mt-1">{servingSize || 'Standard Serving'}</p>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[32px] sm:text-[38px] font-bold tracking-tighter leading-none tabular-nums" style={{ color: themeColor }}>
                {calories}
              </span>
              <span className="text-[11px] font-bold text-white/40 uppercase tracking-wider mt-1">Calories</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: 'Protein', value: protein, color: '#30D158' },
              { label: 'Carbs', value: carbs, color: '#0A84FF' },
              { label: 'Fat', value: fat, color: '#FF453A' },
              { label: 'Fiber', value: fiber, color: '#BF5AF2' }
            ].map((macro, idx) => (
              <div key={idx} className="flex flex-col p-3 rounded-[16px]" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wider mb-1">{macro.label}</span>
                <span className="text-[15px] font-bold tabular-nums" style={{ color: macro.color }}>{macro.value}g</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  // ==========================================================================
  // 🔵 MODE: SUMMARY (Weekly Overview)
  // ==========================================================================
  if (mode === 'summary') {
    const { period, totalWorkouts, totalMinutes, totalCalories, recentWorkouts } = data;
    const themeColor = '#0A84FF'; // iOS System Blue
    const safeRecentWorkouts = recentWorkouts || [];

    return (
      <motion.div
        initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-[440px] rounded-[32px] overflow-hidden mt-5 shadow-2xl"
        style={{
          background: 'rgba(20, 20, 22, 0.65)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)',
          border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 24px 48px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
        }}
      >
        <div className="absolute top-0 right-0 w-3/4 h-48 pointer-events-none opacity-20" style={{
          background: `radial-gradient(ellipse at 80% -20%, ${themeColor} 0%, transparent 70%)`, filter: 'blur(40px)',
        }} />

        <div className="relative z-10 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(10, 132, 255, 0.15)' }}>
                <Activity className="w-4 h-4 text-[#0A84FF]" />
              </div>
              <span className="text-[14px] font-semibold text-white/80 tracking-tight">Activity Summary</span>
            </div>
            <span className="text-[11px] font-bold text-white/40 uppercase tracking-wider bg-white/5 px-2.5 py-1 rounded-full">{period || 'This Week'}</span>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 p-4 rounded-[20px]" style={{ background: 'rgba(10, 132, 255, 0.1)', border: '1px solid rgba(10, 132, 255, 0.15)' }}>
              <Dumbbell className="w-4 h-4 text-[#0A84FF] mb-2" />
              <p className="text-[11px] font-semibold text-[#0A84FF] uppercase tracking-wider mb-0.5">Workouts</p>
              <p className="text-[24px] font-bold text-white tabular-nums tracking-tight leading-none">{totalWorkouts}</p>
            </div>
            <div className="flex-1 p-4 rounded-[20px]" style={{ background: 'rgba(48, 209, 88, 0.1)', border: '1px solid rgba(48, 209, 88, 0.15)' }}>
              <Flame className="w-4 h-4 text-[#30D158] mb-2" />
              <p className="text-[11px] font-semibold text-[#30D158] uppercase tracking-wider mb-0.5">Active Cal</p>
              <p className="text-[24px] font-bold text-white tabular-nums tracking-tight leading-none">{totalCalories}</p>
            </div>
          </div>

          {safeRecentWorkouts.length > 0 && (
            <div>
              <p className="text-[12px] text-white/40 font-semibold uppercase tracking-wider mb-2.5">Recent Sessions</p>
              <div className="flex flex-col gap-2">
                {safeRecentWorkouts.map((w, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-[16px] transition-colors hover:bg-white/5" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: '#30D158' }} />
                      <div className="flex flex-col min-w-0">
                        <span className="text-[14px] font-semibold text-white/90 truncate capitalize">{w.exercise || 'Workout'}</span>
                        <span className="text-[11px] text-white/40 font-medium truncate">{w.date || 'Recent'}</span>
                      </div>
                    </div>
                    <span className="text-[14px] font-semibold text-white/80 tabular-nums shrink-0 ml-3">
                      {w.duration || 0} min
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

export default FitnessWidget;