import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Wind, CloudRain, Droplets, MapPin } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════
// 🌤️ ATMOSPHERIC RENDERING ENGINE (Premium Live Animations)
// ═══════════════════════════════════════════════════════════════════

const SunnyEffect = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <motion.div
      animate={{ rotate: 360, scale: [1, 1.05, 1] }}
      transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      className="absolute -top-16 -right-16 w-64 h-64 rounded-full"
      style={{
        background: 'radial-gradient(circle, rgba(255,215,0,0.15) 0%, rgba(255,165,0,0) 60%)',
        filter: 'blur(30px)'
      }}
    />
    <div className="absolute top-10 right-10 w-24 h-24 rounded-full bg-white/5 blur-2xl" />
  </div>
);

const CloudyEffect = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-60">
    <motion.div
      animate={{ x: [-20, 20, -20] }}
      transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      className="absolute -top-10 -left-10 w-48 h-48 rounded-full"
      style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)', filter: 'blur(25px)' }}
    />
    <motion.div
      animate={{ x: [20, -20, 20] }}
      transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-10 right-0 w-64 h-64 rounded-full"
      style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)', filter: 'blur(30px)' }}
    />
  </div>
);

const RainEffect = () => {
  const drops = useMemo(() => Array.from({ length: 40 }), []);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {drops.map((_, i) => (
        <motion.div
          key={i}
          className="absolute bg-gradient-to-b from-transparent to-white/30"
          style={{
            width: Math.random() * 1.5 + 0.5,
            height: Math.random() * 30 + 15,
            left: `${Math.random() * 100}%`,
            top: -50,
            transform: 'rotate(15deg)'
          }}
          animate={{ y: [0, 400], opacity: [0, 1, 0] }}
          transition={{
            duration: Math.random() * 0.5 + 0.5,
            repeat: Infinity,
            ease: "linear",
            delay: Math.random() * 2
          }}
        />
      ))}
    </div>
  );
};

const SnowEffect = () => {
  const flakes = useMemo(() => Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    size: Math.random() * 3 + 2,
    duration: Math.random() * 4 + 4,
    delay: Math.random() * 3
  })), []);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {flakes.map(f => (
        <motion.div
          key={f.id}
          className="absolute bg-white/60 rounded-full blur-[1px]"
          style={{ width: f.size, height: f.size, left: f.left, top: -20 }}
          animate={{ y: [0, 350], x: [-15, 15, -15], opacity: [0, 0.8, 0] }}
          transition={{
            y: { duration: f.duration, repeat: Infinity, ease: "linear", delay: f.delay },
            x: { duration: 3, repeat: Infinity, ease: "easeInOut" },
            opacity: { duration: f.duration, repeat: Infinity, ease: "easeInOut", delay: f.delay }
          }}
        />
      ))}
    </div>
  );
};

const StormEffect = () => {
  const drops = useMemo(() => Array.from({ length: 50 }), []);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none bg-[#050508]">
      {/* Lightning Flashes */}
      <motion.div
        className="absolute inset-0 bg-white/20"
        animate={{ opacity: [0, 0, 0.8, 0, 0, 0.4, 0, 0, 0] }}
        transition={{ duration: 6, repeat: Infinity, times: [0, 0.8, 0.82, 0.84, 0.86, 0.88, 0.9, 0.95, 1] }}
      />
      {/* Fast Heavy Rain */}
      {drops.map((_, i) => (
        <motion.div
          key={i}
          className="absolute bg-gradient-to-b from-transparent to-white/40"
          style={{
            width: Math.random() * 2 + 1,
            height: Math.random() * 40 + 20,
            left: `${Math.random() * 100}%`,
            top: -60,
            transform: 'rotate(10deg)'
          }}
          animate={{ y: [0, 450] }}
          transition={{
            duration: Math.random() * 0.3 + 0.3,
            repeat: Infinity,
            ease: "linear",
            delay: Math.random()
          }}
        />
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 📱 THE PREMIUM WEATHER CARD
// ═══════════════════════════════════════════════════════════════════

const WeatherCard = ({ location, temp, condition, windSpeed, humidity, rainChance }) => {

  // Clean Data Fallbacks
  const loc = location || "Unknown Location";
  const temperature = temp !== undefined ? temp : "--";
  const desc = condition || "Clear";
  const _windSpeed = windSpeed || "-- km/h";
  const _humidity = humidity || "--%";
  const _rainChance = rainChance || "--%";

  // Intelligent Condition Parser
  const getAtmosphere = (c) => {
    const raw = c.toLowerCase();
    if (raw.includes('rain') || raw.includes('drizzle') || raw.includes('shower')) return 'rainy';
    if (raw.includes('snow') || raw.includes('ice') || raw.includes('blizzard')) return 'snowy';
    if (raw.includes('storm') || raw.includes('thunder')) return 'stormy';
    if (raw.includes('cloud') || raw.includes('overcast') || raw.includes('fog')) return 'cloudy';
    return 'sunny';
  };

  const atmosphere = getAtmosphere(desc);

  // Dynamic Date Formatting
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long'
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="relative flex flex-col justify-between w-full max-w-[340px] h-[380px] rounded-[36px] overflow-hidden"
      style={{
        background: '#0B0B0C',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)'
      }}
    >
      {/* ─── Render Live Atmosphere Animation ─── */}
      {atmosphere === 'sunny' && <SunnyEffect />}
      {atmosphere === 'cloudy' && <CloudyEffect />}
      {atmosphere === 'rainy' && <RainEffect />}
      {atmosphere === 'snowy' && <SnowEffect />}
      {atmosphere === 'stormy' && <StormEffect />}

      {/* ─── Understated Background Grid ─── */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03] z-0"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px),
                            linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* ─── Top Section: Location & Date ─── */}
      <div className="relative z-10 p-7 pb-0 flex flex-col items-center">
        <div className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 backdrop-blur-sm mb-3">
          <MapPin className="w-3 h-3 text-[#A1A1AA]" />
          <span className="text-[#F4F4F5] text-xs font-semibold tracking-wide uppercase">{loc}</span>
        </div>
        <p className="text-[#71717A] text-[11px] font-medium tracking-widest uppercase">{today}</p>
      </div>

      {/* ─── Middle Section: Temperature & Condition ─── */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-grow">
        <div className="flex items-start tracking-tighter">
          <span className="text-[#FFFFFF] text-[84px] font-medium leading-none">{temperature}</span>
          <span className="text-[#A1A1AA] text-[32px] font-medium mt-2">°</span>
        </div>
        <div className="mt-2 px-4 py-1.5 rounded-[10px] bg-white/[0.03] border border-white/[0.04] backdrop-blur-md">
          <span className="text-[#FFFFFF] text-[14px] font-medium capitalize tracking-wide drop-shadow-md">
            {desc}
          </span>
        </div>
      </div>

      {/* ─── Bottom Section: High-End Data Pill ─── */}
      <div className="relative z-10 p-5 pt-0">
        <div
          className="flex items-center justify-between px-6 py-4 rounded-[20px] backdrop-blur-xl"
          style={{
            background: 'rgba(24,24,27,0.5)',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)'
          }}
        >
          {/* Wind */}
          <div className="flex flex-col items-center gap-1.5 w-1/3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <Wind className="w-3.5 h-3.5 text-[#A1A1AA]" strokeWidth={1.5} />
            </div>
            <span className="text-[#71717A] text-[9px] leading-none font-bold uppercase tracking-widest">Wind</span>
            <span className="text-[#F4F4F5] font-semibold text-[11px] leading-none">{_windSpeed}</span>
          </div>

          {/* Rain */}
          <div className="flex flex-col items-center gap-1.5 w-1/3 border-x border-white/5">
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <CloudRain className="w-3.5 h-3.5 text-[#A1A1AA]" strokeWidth={1.5} />
            </div>
            <span className="text-[#71717A] text-[9px] leading-none font-bold uppercase tracking-widest">Rain</span>
            <span className="text-[#F4F4F5] font-semibold text-[11px] leading-none">{_rainChance}</span>
          </div>

          {/* Humidity */}
          <div className="flex flex-col items-center gap-1.5 w-1/3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <Droplets className="w-3.5 h-3.5 text-[#A1A1AA]" strokeWidth={1.5} />
            </div>
            <span className="text-[#71717A] text-[9px] leading-none font-bold uppercase tracking-widest">Humid</span>
            <span className="text-[#F4F4F5] font-semibold text-[11px] leading-none">{_humidity}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default WeatherCard;