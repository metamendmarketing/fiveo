import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SpeedometerProgressProps {
  progress: number; // 0 to 100
}

export const SpeedometerProgress: React.FC<SpeedometerProgressProps> = ({ progress }) => {
  // Sync logic: Both arc and needle follow a 270-degree sweep
  // Arc starts at -225 deg (bottom-left)
  // Needle starts at -135 deg relative to pointing UP (0 deg)
  // 0 MPH is at -135 deg from UP.
  const rotation = (progress / 100) * 270 - 135;

  const showEarlyHeat = progress >= 70; // 210 MPH
  const showIntenseHeat = progress >= 80; // 240 MPH
  const showFullFlames = progress >= 95;

  return (
    <div className="relative flex flex-col items-center justify-center py-10 select-none overflow-visible">
      <div className="relative w-80 h-80 flex items-center justify-center">
        
        {/* 1. Fire Halo Animation (Outer Glow) - Starts early at 240 MPH */}
        <AnimatePresence>
          {showIntenseHeat && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ 
                opacity: progress / 100, 
                scale: [1, 1.04, 1],
                rotate: [0, 360]
              }}
              exit={{ opacity: 0 }}
              transition={{ 
                scale: { repeat: Infinity, duration: 1.5 },
                rotate: { repeat: Infinity, duration: 8, ease: "linear" }
              }}
              className="absolute inset-0 rounded-full"
              style={{
                background: `radial-gradient(circle, transparent 62%, 
                  ${progress > 95 ? 'rgba(255, 69, 0, 0.6)' : 'rgba(255, 165, 0, 0.3)'} 75%, 
                  ${progress > 95 ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 200, 0, 0.2)'} 90%, 
                  transparent 100%)`,
                filter: "blur(12px)"
              }}
            />
          )}
        </AnimatePresence>

        {/* 2. Intense Flame Particles (White-Hot) */}
        {showFullFlames && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(16)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ 
                  scale: [1, 1.8, 0.5],
                  opacity: [0.9, 1, 0],
                  y: [0, -60 - Math.random() * 60],
                  x: [0, (Math.random() - 0.5) * 60],
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 0.4 + Math.random() * 0.3,
                  delay: i * 0.03
                }}
                className="absolute left-1/2 top-1/2 w-3 h-6 bg-white rounded-full blur-[4px]"
                style={{ 
                  transform: `rotate(${i * 22.5}deg) translateY(-140px)`,
                  boxShadow: "0 0 20px #ff4500, 0 0 40px #ff8c00"
                }}
              />
            ))}
          </div>
        )}

        {/* 3. Main Gauge SVG */}
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_0_30px_rgba(0,0,0,0.8)] relative z-10">
          <defs>
            {/* High-End Glass Texture */}
            <pattern id="brushed" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
              <rect width="10" height="10" fill="#080808" />
              <path d="M0 0 L10 10 M-2 8 L2 12 M8 -2 L12 2" stroke="#121212" strokeWidth="0.5" />
            </pattern>

            <linearGradient id="chromeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#666" />
              <stop offset="50%" stopColor="#222" />
              <stop offset="100%" stopColor="#444" />
            </linearGradient>

            <linearGradient id="gaugeGradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#059669" /> {/* Deep Green */}
              <stop offset="40%" stopColor="#fbbf24" /> {/* Amber */}
              <stop offset="70%" stopColor="#ef4444" /> {/* Red */}
              <stop offset="100%" stopColor="#ffffff" /> {/* White Hot */}
            </linearGradient>

            <filter id="neonGlow">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            
            <filter id="glassReflect">
              <feGaussianBlur stdDeviation="1" />
            </filter>
          </defs>

          {/* Background Bezel */}
          <circle cx="100" cy="100" r="99" fill="url(#chromeGradient)" />
          <circle cx="100" cy="100" r="96" fill="#000" />
          <circle cx="100" cy="100" r="94" fill="url(#brushed)" />

          {/* Track Shadow (Groove) */}
          <path
            d="M 43.5 156.5 A 80 80 0 1 1 156.5 156.5"
            fill="none"
            stroke="rgba(255,255,255,0.03)"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Active Progress Glow Arc - SYNCED Sweep */}
          <motion.path
            d="M 43.5 156.5 A 80 80 0 1 1 156.5 156.5"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={377}
            initial={{ strokeDashoffset: 377 }}
            animate={{ strokeDashoffset: 377 - (progress / 100) * 377 }}
            transition={{ type: "spring", stiffness: 45, damping: 15 }}
            filter="url(#neonGlow)"
            className="opacity-90"
          />

          {/* Tick Marks & Numbers */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300].map((val) => {
            const angle = (val / 300) * 270 - 225;
            const rad = (angle * Math.PI) / 180;
            const x1 = 100 + 82 * Math.cos(rad);
            const y1 = 100 + 82 * Math.sin(rad);
            const x2 = 100 + 90 * Math.cos(rad);
            const y2 = 100 + 90 * Math.sin(rad);
            
            const isTarget = (progress * 3) >= val;

            return (
              <React.Fragment key={val}>
                <line 
                  x1={x1} y1={y1} x2={x2} y2={y2} 
                  stroke={isTarget ? "#fff" : "#333"} 
                  strokeWidth="2" 
                  className="transition-colors duration-300"
                />
                <text 
                  x={100 + 68 * Math.cos(rad)} y={100 + 68 * Math.sin(rad)} 
                  fill={isTarget ? "#fff" : "#444"} 
                  fontSize="9" 
                  fontWeight="900"
                  textAnchor="middle" 
                  alignmentBaseline="middle"
                  className="font-mono transition-colors duration-300"
                >
                  {val}
                </text>
              </React.Fragment>
            );
          })}

          {/* Digital Readout Box */}
          <rect x="75" y="142" width="50" height="22" rx="4" fill="#050505" stroke="#1a1a1a" strokeWidth="1" />
          <text 
            x="100" y="157" 
            fill={progress > 90 ? "#fff" : "#00AEEF"} 
            fontSize="14" 
            fontWeight="black" 
            textAnchor="middle" 
            className="font-mono"
            style={{ textShadow: progress > 90 ? "0 0 10px #fff" : "none" }}
          >
            {Math.round(progress)}%
          </text>

          {/* Tapered Needle - Bounding Box Anchor Hack */}
          <g transform="translate(100, 100)">
            <motion.g
              animate={{ rotate: rotation }}
              transition={{ type: "spring", stiffness: 45, damping: 12 }}
            >
              <rect x="-100" y="-100" width="200" height="200" fill="transparent" pointerEvents="none" />
              
              {/* Premium Red Needle */}
              <path 
                d="M -3 4 L 0 -78 L 3 4 Z" 
                fill={progress > 85 ? "#fff" : "#ef4444"}
                style={{ 
                  filter: `drop-shadow(0 0 ${progress > 80 ? '8px' : '3px'} ${progress > 80 ? '#fff' : 'rgba(255,0,0,0.5)'})`,
                  transition: "fill 0.3s ease"
                }}
              />
              {/* Needle Reflection */}
              <path 
                d="M -1 0 L 0 -74 L 1 0 Z" 
                fill="rgba(255,255,255,0.4)"
              />
            </motion.g>
          </g>

          {/* Center Pin - Glass Cap */}
          <circle cx="100" cy="100" r="10" fill="#111" />
          <circle cx="100" cy="100" r="8" fill="#222" stroke="#444" strokeWidth="1" />
          <circle cx="100" cy="100" r="4" fill="#666" />
          {/* Glass Highlight Overlay */}
          <path 
            d="M 30 50 A 70 70 0 0 1 170 50" 
            fill="none" 
            stroke="rgba(255,255,255,0.05)" 
            strokeWidth="40" 
            strokeLinecap="round" 
            filter="url(#glassReflect)"
          />
        </svg>

        {/* External Glass Reflection */}
        <div className="absolute inset-4 rounded-full pointer-events-none overflow-hidden opacity-20">
          <div className="absolute top-[-20%] left-[-20%] w-[150%] h-[50%] bg-gradient-to-b from-white to-transparent rotate-[-45deg]" />
        </div>

        {/* Shake Container */}
        {progress > 85 && (
          <motion.div
            animate={{ x: [-1, 1, -1], y: [1, -1, 1] }}
            transition={{ repeat: Infinity, duration: 0.1 }}
            className="absolute inset-0 pointer-events-none"
          />
        )}
      </div>
    </div>
  );
};
