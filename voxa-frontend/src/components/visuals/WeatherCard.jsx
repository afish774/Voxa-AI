import React, { useRef } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { CloudRain, Sun, Cloud, CloudSnow, CloudLightning, Wind } from 'lucide-react';

// Map condition string to a lucide-react icon component
const getWeatherIcon = (condition) => {
  const map = {
    'Rain': CloudRain,
    'Sunny': Sun,
    'Cloudy': Cloud,
    'Snow': CloudSnow,
    'Thunderstorm': CloudLightning,
    'Windy': Wind,
  };
  return map[condition] ?? Cloud;
};

export default function WeatherCard({ data, theme }) {
  const location = data?.location || '';
  const temp = data?.temp ?? '--';
  const condition = data?.condition || 'Cloudy';

  const cardRef = useRef(null);

  // Motion values for 3D tilt
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  // Spring config per spec: stiffness: 300, damping: 30
  const springConfig = { stiffness: 300, damping: 30 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Map [0, 1] to ±15 degrees
  // rotateY: left edge = -15, right edge = +15
  const rotateY = useTransform(smoothX, [0, 1], [-15, 15]);
  // rotateX: top edge = +15, bottom edge = -15
  const rotateX = useTransform(smoothY, [0, 1], [15, -15]);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0.5);
    mouseY.set(0.5);
  };

  const WeatherIcon = getWeatherIcon(condition);

  return (
    <div style={{ perspective: 1000, marginTop: 24 }}>
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          rotateX,
          rotateY,
          transformPerspective: 1000,
          transformStyle: 'preserve-3d',
        }}
        className="glass-container relative overflow-hidden cursor-grab select-none"
      >
        {/* Ambient glow background */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-sky-500 opacity-10 blur-3xl" />
        </div>

        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 pointer-events-none z-0 rounded-[2rem] bg-gradient-to-b from-white/5 to-transparent" />

        {/* Card content — centered layout */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center py-4 gap-2">
          {/* Location — small muted text */}
          <span className="text-sm font-semibold text-white/50 tracking-wider uppercase">
            {location}
          </span>

          {/* Massive temperature */}
          <motion.h1
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.1 }}
            className="text-8xl font-extralight tabular-nums tracking-tighter leading-none text-white drop-shadow-2xl"
            style={{ transform: 'translateZ(30px)' }}
          >
            {temp}°
          </motion.h1>

          {/* Weather icon — 48x48 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.15 }}
            className="mt-2"
            style={{ transform: 'translateZ(20px)' }}
          >
            <WeatherIcon className="w-12 h-12 text-white/70" strokeWidth={1.5} />
          </motion.div>

          {/* Condition label */}
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg font-semibold text-white/60 tracking-wide capitalize"
            style={{ transform: 'translateZ(15px)' }}
          >
            {condition}
          </motion.span>
        </div>
      </motion.div>
    </div>
  );
}