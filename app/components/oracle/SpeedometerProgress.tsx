import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SpeedometerProgressProps {
  progress: number; // 0 to 100
}

export const SpeedometerProgress: React.FC<SpeedometerProgressProps> = ({ progress }) => {
  const rotation = (progress / 100) * 270 - 135;

  // Shake Intensity Calculation (starts at 80, violent at 100)
  const shakeIntensity = progress >= 80 
    ? Math.pow((progress - 80) / 20, 2) * 6 // Quadratic growth up to 6px
    : 0;

  return (
    <div className="relative flex flex-col items-center justify-center py-10 select-none overflow-visible">
      {/* Violent Shake Container */}
      <motion.div 
        animate={progress >= 80 ? {
          x: [-shakeIntensity, shakeIntensity, -shakeIntensity],
          y: [shakeIntensity, -shakeIntensity, shakeIntensity],
        } : {}}
        transition={{ repeat: Infinity, duration: 0.05 }}
        className="relative w-80 h-80 flex items-center justify-center"
      >
        
        {/* 1. Exterior Aura (Fire Halo) - The focal point of the animation */}
        <AnimatePresence>
          {progress >= 60 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ 
                opacity: 1, 
                scale: [1, 1.03, 1],
                rotate: [0, 360]
              }}
              exit={{ opacity: 0 }}
              transition={{ 
                scale: { repeat: Infinity, duration: 1.5 },
                rotate: { repeat: Infinity, duration: 12, ease: "linear" }
              }}
              className="absolute inset-[-30px] rounded-full"
              style={{
                background: progress >= 95
                  ? "radial-gradient(circle, transparent 60%, rgba(255,255,255,0.8) 70%, rgba(255,255,255,0.4) 85%, transparent 100%)" // White-Hot
                  : progress >= 90
                  ? "radial-gradient(circle, transparent 60%, rgba(239, 68, 68, 0.7) 75%, rgba(255, 69, 0, 0.5) 90%, transparent 100%)" // Intense Red/Orange
                  : progress >= 75
                  ? "radial-gradient(circle, transparent 65%, rgba(245, 158, 11, 0.5) 80%, transparent 100%)" // Orange
                  : "radial-gradient(circle, transparent 65%, rgba(252, 211, 77, 0.3) 80%, transparent 100%)", // Yellow
                filter: `blur(${progress >= 90 ? '20px' : '12px'})`,
                zIndex: 5
              }}
            />
          )}
        </AnimatePresence>

        {/* 2. Main Gauge SVG - Clean Interface */}
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_0_20px_rgba(0,0,0,1)] relative z-10">
          <defs>
            <pattern id="carbon" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
              <rect width="10" height="10" fill="#111" />
              <path d="M0 0 L5 5 M5 0 L10 5 M0 5 L5 10 M5 5 L10 10" stroke="#1a1a1a" strokeWidth="1" />
            </pattern>

            <linearGradient id="gaugeGradient" gradientTransform="rotate(90)">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>

            <filter id="outerGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <circle cx="100" cy="100" r="98" fill="#222" stroke="#444" strokeWidth="1.5" />
          <circle cx="100" cy="100" r="95" fill="url(#carbon)" stroke="#000" strokeWidth="2" />

          <path
            d="M 43.5 156.5 A 80 80 0 1 1 156.5 156.5"
            fill="none"
            stroke="rgba(0,0,0,0.5)"
            strokeWidth="10"
            strokeLinecap="round"
          />

          <motion.path
            d="M 43.5 156.5 A 80 80 0 1 1 156.5 156.5"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={377}
            initial={{ strokeDashoffset: 377 }}
            animate={{ strokeDashoffset: 377 - (progress / 100) * 377 }}
            transition={{ type: "spring", stiffness: 40, damping: 15 }}
            filter="url(#outerGlow)"
            className="opacity-80"
          />

          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300].map((val) => {
            const angle = (val / 300) * 270 - 225;
            const rad = (angle * Math.PI) / 180;
            const x1 = 100 + 78 * Math.cos(rad);
            const y1 = 100 + 78 * Math.sin(rad);
            const x2 = 100 + 88 * Math.cos(rad);
            const y2 = 100 + 88 * Math.sin(rad);
            const tx = 100 + 60 * Math.cos(rad);
            const ty = 100 + 60 * Math.sin(rad);

            return (
              <React.Fragment key={val}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fff" strokeWidth="2" opacity="0.8" />
                <text x={tx} y={ty} fill="#fff" fontSize="10" fontWeight="900" textAnchor="middle" alignmentBaseline="middle" className="font-mono opacity-60">{val}</text>
              </React.Fragment>
            );
          })}

          <text x="100" y="85" fill="#555" fontSize="8" fontWeight="bold" textAnchor="middle" className="uppercase tracking-widest">MPH</text>

          <rect x="75" y="140" width="50" height="25" rx="3" fill="#000" stroke="#333" strokeWidth="1" />
          <text 
            x="100" y="157" 
            fill={progress > 95 ? "#fff" : "#f59e0b"} 
            fontSize="14" 
            fontWeight="black" 
            textAnchor="middle" 
            className="font-mono"
            style={{ textShadow: `0 0 10px ${progress > 95 ? '#fff' : '#f59e0b'}ee` }}
          >
            {Math.round(progress)}%
          </text>

          {/* Tapered Needle */}
          <g transform="translate(100, 100)">
            <motion.g
              animate={{ rotate: rotation }}
              transition={{ type: "spring", stiffness: 45, damping: 12 }}
            >
              <rect x="-100" y="-100" width="200" height="200" fill="none" opacity={0} pointerEvents="none" />
              <path 
                d="M -3 3 L 0 -75 L 3 3 Z" 
                fill={progress > 90 ? "#fff" : "#ef4444"}
                style={{ filter: progress > 90 ? "drop-shadow(0 0 8px #fff)" : "drop-shadow(0 0 5px rgba(255,0,0,0.5))" }}
              />
              <path d="M -1 0 L 0 -72 L 1 0 Z" fill="rgba(255,255,255,0.3)" />
            </motion.g>
          </g>

          <circle cx="100" cy="100" r="10" fill="#333" />
          <circle cx="100" cy="100" r="10" fill="url(#carbon)" />
          <circle cx="100" cy="100" r="8" fill="none" stroke="#555" strokeWidth="1" />
          <circle cx="100" cy="100" r="4" fill="#666" />
          <circle cx="100" cy="100" r="2" fill="#999" />
        </svg>
      </motion.div>
    </div>
  );
};
