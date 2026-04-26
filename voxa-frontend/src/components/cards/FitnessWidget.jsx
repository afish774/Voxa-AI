import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Dumbbell, Apple, Activity, Timer, Zap, Award, TrendingUp } from 'lucide-react';

// ============================================================================
// 🏋️ FitnessWidget — Multi-Mode Fitness & Nutrition Card
// ============================================================================
// Handles three modes:
//   mode: 'log'      — Workout logged confirmation with streak + weekly stats
//     { exercise, duration, caloriesBurned, sets, reps, streak, streakLabel, weeklyStats }
//   mode: 'nutrition' — Calorie/macro breakdown for food queries
//     { query, servingSize, calories, protein, carbs, fat, fiber, sodium, items }
//   mode: 'summary'   — Weekly fitness overview
//     { period, totalWorkouts, totalMinutes, totalCalories, exercises, recentWorkouts }
// ============================================================================

// Energy-themed accent colors
const NEON_GREEN = '#39FF14';
const NEON_ORANGE = '#FF6D00';
const CARD_BG = '#0B0B0C';

const FitnessWidget = ({ data }) => {
  if (!data) return null;
  const { mode } = data;

  // ── Log Mode (Workout Confirmation) ───────────────────────────────────────
  if (mode === 'log') {
    const { exercise, duration, caloriesBurned, sets, reps, streak = 0, streakLabel, weeklyStats } = data;

    return (
      <motion.div
        initial={{ opacity: 0, y: 15, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        // 📱 RESPONSIVE: Fluid width, responsive corners
        className="relative w-full max-w-[420px] rounded-[24px] sm:rounded-[28px] overflow-hidden mt-5"
        style={{
          background: CARD_BG,
          border: '1px solid rgba(57, 255, 20, 0.08)',
          boxShadow: '0 24px 48px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        {/* Neon glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(57, 255, 20, 0.05) 0%, transparent 60%)',
        }} />

        {/* 📱 RESPONSIVE: Mobile-first padding */}
        <div className="relative z-10 p-4 sm:p-5 md:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0" style={{
                background: 'linear-gradient(135deg, rgba(57,255,20,0.15), rgba(34,197,94,0.1))',
              }}>
                <Dumbbell className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-emerald-400" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-400/80">Workout Logged</span>
                {/* 🧹 QA FIX: Null-safe exercise fallback */}
                {/* 📱 RESPONSIVE: Truncate long exercise names */}
                <p className="text-[13px] sm:text-[14px] text-white/90 font-medium capitalize mt-0.5 truncate">{exercise || 'Workout'}</p>
              </div>
            </div>
            {streak > 0 && (
              <div className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full shrink-0" style={{
                background: 'rgba(251, 146, 60, 0.1)', border: '1px solid rgba(251, 146, 60, 0.15)',
              }}>
                <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-400" />
                <span className="text-[10px] sm:text-[11px] font-bold text-orange-300">{streakLabel || `${streak}d`}</span>
              </div>
            )}
          </div>

          {/* Stats Grid */}
          {/* 📱 RESPONSIVE: 2 cols on very small screens, 3 cols on sm+ */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5 mb-3 sm:mb-4">
            <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <Timer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#71717A] mx-auto mb-1" />
              {/* 🧹 QA FIX: Null-safe duration fallback */}
              <p className="text-[16px] sm:text-[18px] font-semibold text-white/90">{duration ?? '--'}</p>
              <p className="text-[9px] sm:text-[10px] text-[#52525B] uppercase tracking-wider font-semibold">mins</p>
            </div>
            <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl text-center" style={{ background: 'rgba(57,255,20,0.03)', border: '1px solid rgba(57,255,20,0.06)' }}>
              <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400/70 mx-auto mb-1" />
              {/* 🧹 QA FIX: Null-safe caloriesBurned fallback */}
              <p className="text-[16px] sm:text-[18px] font-semibold" style={{ color: NEON_GREEN }}>{caloriesBurned ?? 0}</p>
              <p className="text-[9px] sm:text-[10px] text-[#52525B] uppercase tracking-wider font-semibold">kcal</p>
            </div>
            {sets && reps ? (
              <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl text-center col-span-2 sm:col-span-1" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#71717A] mx-auto mb-1" />
                <p className="text-[16px] sm:text-[18px] font-semibold text-white/90">{sets}×{reps}</p>
                <p className="text-[9px] sm:text-[10px] text-[#52525B] uppercase tracking-wider font-semibold">sets</p>
              </div>
            ) : (
              <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl text-center col-span-2 sm:col-span-1" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#71717A] mx-auto mb-1" />
                <p className="text-[16px] sm:text-[18px] font-semibold text-white/90">{streak}</p>
                <p className="text-[9px] sm:text-[10px] text-[#52525B] uppercase tracking-wider font-semibold">streak</p>
              </div>
            )}
          </div>

          {/* Weekly Stats Bar */}
          {weeklyStats && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-0 px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)' }}>
              <span className="text-[10px] sm:text-[11px] text-[#52525B] font-semibold uppercase tracking-wider">This Week</span>
              <div className="flex items-center gap-3 sm:gap-4 text-[11px] sm:text-[12px] text-[#A1A1AA]">
                {/* 🧹 QA FIX: Null-safe weeklyStats field access */}
                <span>{weeklyStats.workouts ?? 0} sessions</span>
                <span>{weeklyStats.minutes ?? 0} min</span>
                <span className="font-semibold" style={{ color: NEON_GREEN }}>{weeklyStats.calories ?? 0} kcal</span>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // ── Nutrition Mode (Calorie Lookup) ───────────────────────────────────────
  if (mode === 'nutrition') {
    const { query, servingSize, calories, protein, carbs, fat, fiber, sodium, items } = data;
    const macros = [
      { label: 'Protein', value: protein, unit: 'g', color: '#3B82F6' },
      { label: 'Carbs', value: carbs, unit: 'g', color: NEON_ORANGE },
      { label: 'Fat', value: fat, unit: 'g', color: '#A855F7' },
      { label: 'Fiber', value: fiber, unit: 'g', color: '#22C55E' },
    ];
    const total = (protein || 0) + (carbs || 0) + (fat || 0);
    // 🧹 QA FIX: Null-safe items array
    const safeItems = items || [];

    return (
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        // 📱 RESPONSIVE: Fluid width, responsive corners
        className="relative w-full max-w-[420px] rounded-[24px] sm:rounded-[28px] overflow-hidden mt-5"
        style={{
          background: CARD_BG,
          border: '1px solid rgba(255, 109, 0, 0.08)',
          boxShadow: '0 24px 48px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(255, 109, 0, 0.05) 0%, transparent 60%)',
        }} />

        {/* 📱 RESPONSIVE: Mobile-first padding */}
        <div className="relative z-10 p-4 sm:p-5 md:p-6">
          <div className="flex items-center gap-2 sm:gap-2.5 mb-3 sm:mb-4">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0" style={{
              background: 'linear-gradient(135deg, rgba(255,109,0,0.15), rgba(249,115,22,0.1))',
            }}>
              <Apple className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-orange-400" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.12em] text-orange-400/80">Nutrition Info</span>
              {/* 🧹 QA FIX: Null-safe query fallback */}
              {/* 📱 RESPONSIVE: Truncate long food names */}
              <p className="text-[13px] sm:text-[14px] text-white/90 font-medium capitalize mt-0.5 truncate">{query || 'Food'}</p>
            </div>
          </div>

          {/* Calorie Hero */}
          <div className="text-center mb-4 sm:mb-5 p-3 sm:p-4 rounded-xl sm:rounded-2xl" style={{ background: 'rgba(255,109,0,0.04)', border: '1px solid rgba(255,109,0,0.08)' }}>
            {/* 📱 RESPONSIVE: Fluid calorie text */}
            <p className="text-[28px] sm:text-[32px] md:text-[36px] font-bold tracking-[-0.03em] leading-none" style={{ color: NEON_ORANGE }}>{calories ?? 0}</p>
            {/* 🧹 QA FIX: Null-safe servingSize fallback */}
            <p className="text-[11px] sm:text-[12px] text-[#71717A] mt-1 font-semibold uppercase tracking-wider">calories · {servingSize || 'per serving'}</p>
          </div>

          {/* Macro Bars */}
          <div className="flex flex-col gap-2 sm:gap-2.5">
            {macros.map((m, i) => (
              <div key={`macro-${i}`} className="flex items-center gap-2 sm:gap-3">
                <span className="text-[11px] sm:text-[12px] text-[#A1A1AA] w-12 sm:w-14 font-medium shrink-0">{m.label}</span>
                <div className="flex-1 h-1.5 sm:h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: total > 0 ? `${((m.value || 0) / total) * 100}%` : '0%' }}
                    transition={{ delay: 0.2 + i * 0.08, duration: 0.5 }}
                    className="h-full rounded-full"
                    style={{ background: m.color, minWidth: m.value > 0 ? '4px' : '0px' }}
                  />
                </div>
                <span className="text-[11px] sm:text-[12px] text-[#D4D4D8] font-semibold w-10 sm:w-12 text-right shrink-0">{m.value ?? 0}{m.unit}</span>
              </div>
            ))}
          </div>

          {/* Individual items — uses safeItems */}
          {safeItems.length > 1 && (
            <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              <p className="text-[10px] sm:text-[11px] text-[#52525B] font-semibold uppercase tracking-wider mb-2">Breakdown</p>
              {/* 🧹 QA FIX: Map over safeItems with null-safe field access */}
              {safeItems.map((item, i) => (
                <div key={`item-${i}`} className="flex justify-between py-1 sm:py-1.5 text-[11px] sm:text-[12px]">
                  <span className="text-[#A1A1AA] capitalize truncate min-w-0">{item.name || 'Item'}</span>
                  <span className="text-[#D4D4D8] font-semibold shrink-0 ml-2">{item.calories ?? 0} kcal</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // ── Summary Mode (Weekly Overview) ────────────────────────────────────────
  if (mode === 'summary') {
    const { period, totalWorkouts = 0, totalMinutes = 0, totalCalories = 0, exercises, recentWorkouts } = data;
    // 🧹 QA FIX: Null-safe arrays — destructuring default [] is bypassed when value is explicit null
    const safeExercises = exercises || [];
    const safeRecentWorkouts = recentWorkouts || [];

    return (
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        // 📱 RESPONSIVE: Fluid width, responsive corners
        className="relative w-full max-w-[460px] rounded-[24px] sm:rounded-[28px] md:rounded-[32px] overflow-hidden mt-5"
        style={{
          background: CARD_BG,
          border: '1px solid rgba(57, 255, 20, 0.06)',
          boxShadow: '0 32px 64px -16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(57, 255, 20, 0.04) 0%, transparent 60%)',
        }} />

        {/* 📱 RESPONSIVE: Mobile-first padding */}
        <div className="relative z-10 p-4 sm:p-5 md:p-7">
          <div className="flex items-center gap-2 mb-4 sm:mb-5">
            <Award className="w-4 h-4 text-emerald-400/70" />
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-400/70">Fitness Summary</span>
            {/* 🧹 QA FIX: Null-safe period fallback */}
            <span className="text-[10px] sm:text-[11px] text-[#52525B] ml-auto font-medium">{period || 'This Week'}</span>
          </div>

          {/* Big Stat Row */}
          {/* 📱 RESPONSIVE: 2 cols on tiny screens, 3 cols on sm+ */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-5">
            <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl text-center" style={{ background: 'rgba(57,255,20,0.03)', border: '1px solid rgba(57,255,20,0.06)' }}>
              <p className="text-[20px] sm:text-[22px] md:text-[24px] font-bold" style={{ color: NEON_GREEN }}>{totalWorkouts}</p>
              <p className="text-[9px] sm:text-[10px] text-[#52525B] uppercase tracking-wider font-semibold mt-1">Workouts</p>
            </div>
            <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <p className="text-[20px] sm:text-[22px] md:text-[24px] font-bold text-white/90">{totalMinutes}</p>
              <p className="text-[9px] sm:text-[10px] text-[#52525B] uppercase tracking-wider font-semibold mt-1">Minutes</p>
            </div>
            {/* 📱 RESPONSIVE: col-span-2 on mobile to fill the row when 3rd card wraps */}
            <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl text-center col-span-2 sm:col-span-1" style={{ background: 'rgba(255,109,0,0.03)', border: '1px solid rgba(255,109,0,0.06)' }}>
              <p className="text-[20px] sm:text-[22px] md:text-[24px] font-bold" style={{ color: NEON_ORANGE }}>{totalCalories}</p>
              <p className="text-[9px] sm:text-[10px] text-[#52525B] uppercase tracking-wider font-semibold mt-1">kcal</p>
            </div>
          </div>

          {/* Exercise Tags — uses safeExercises */}
          {safeExercises.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3 sm:mb-4">
              {/* 🧹 QA FIX: Map over safeExercises */}
              {safeExercises.map((ex, i) => (
                <span key={`ex-${i}`} className="px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-medium text-[#A1A1AA] capitalize" style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  {ex}
                </span>
              ))}
            </div>
          )}

          {/* Recent Workouts — uses safeRecentWorkouts */}
          {safeRecentWorkouts.length > 0 && (
            <div>
              <p className="text-[10px] sm:text-[11px] text-[#52525B] font-semibold uppercase tracking-wider mb-2">Recent Sessions</p>
              {/* 🧹 QA FIX: Map over safeRecentWorkouts with null-safe field access */}
              {safeRecentWorkouts.map((w, i) => (
                <div key={`workout-${i}`} className="flex items-center justify-between py-1.5 sm:py-2" style={{
                  borderBottom: i < safeRecentWorkouts.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                }}>
                  <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: NEON_GREEN }} />
                    <div className="min-w-0">
                      {/* 📱 RESPONSIVE: Truncate long exercise names */}
                      <p className="text-[12px] sm:text-[13px] text-[#D4D4D8] font-medium capitalize truncate">{w.exercise || 'Workout'}</p>
                      <p className="text-[10px] sm:text-[11px] text-[#52525B]">{w.date || ''} · {w.duration ?? 0} min</p>
                    </div>
                  </div>
                  <span className="text-[11px] sm:text-[12px] font-semibold shrink-0 ml-2" style={{ color: NEON_ORANGE }}>{w.calories ?? 0} kcal</span>
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

export default FitnessWidget;
