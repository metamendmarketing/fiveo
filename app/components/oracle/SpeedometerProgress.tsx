import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SpeedometerProgressProps {
  progress: number; // 0 to 100
}

export const SpeedometerProgress: React.FC<SpeedometerProgressProps> = ({ progress }) => {
  // Map progress (0-100) to speed (0-300 MPH)
  const speed = Math.round(progress * 3);
  
  // Map progress to needle rotation (e.g., -110deg to 110deg)
  const rotation = (progress / 100) * 220 - 110;

  // Flame triggers
  const showFlames = progress >= 98;
  const isBurnt = progress >= 100;

  return (
    <div className="relative flex flex-col items-center justify-center py-10 overflow-visible">
      {/* Speedometer SVG Container */}
      <div className="relative w-72 h-44 sm:w-80 sm:h-48 flex items-end justify-center">
        
        {/* Flames Layer (behind gauge) */}
        <AnimatePresence>
          {showFlames && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1.1 }}
              exit={{ opacity: 0 }}
              className="absolute -top-12 inset-x-0 flex justify-center pointer-events-none z-0"
            >
              <div className="relative flex gap-2">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      height: [40, 80, 50, 90, 60],
                      y: [0, -10, 0, -20, 0],
                      opacity: [0.6, 1, 0.8]
                    }}
                    transition={{ 
                      duration: 0.5 + Math.random() * 0.5, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="w-4 bg-gradient-to-t from-red-600 via-orange-500 to-yellow-300 rounded-full blur-[4px]"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <svg viewBox="0 0 200 120" className="w-full h-full drop-shadow-2xl relative z-10">
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#333333" />
              <stop offset="33%" stopColor="#10b981" />
              <stop offset="66%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background Track */}
          <path
            d="M 20 100 A 80 80 0 1 1 180 100"
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Active Progress Track */}
          <motion.path
            d="M 20 100 A 80 80 0 1 1 180 100"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray="251.32"
            initial={{ strokeDashoffset: 251.32 }}
            animate={{ strokeDashoffset: 251.32 - (progress / 100) * 251.32 }}
            transition={{ type: "spring", stiffness: 50, damping: 20 }}
            filter="url(#glow)"
          />

          {/* Tick Marks */}
          {[0, 50, 100, 150, 200, 250, 300].map((val, i) => {
            const angle = (i / 6) * 180 - 180;
            const x1 = 100 + 70 * Math.cos((angle * Math.PI) / 180);
            const y1 = 100 + 70 * Math.sin((angle * Math.PI) / 180);
            const x2 = 100 + 85 * Math.cos((angle * Math.PI) / 180);
            const y2 = 100 + 85 * Math.sin((angle * Math.PI) / 180);
            return (
              <line
                key={val}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={speed >= val ? "#fff" : "#444"}
                strokeWidth="2"
              />
            );
          })}

          {/* Needle Base */}
          <circle cx="100" cy="100" r="8" fill="#fff" />
          <circle cx="100" cy="100" r="4" fill="#00AEEF" />

          {/* Needle */}
          <motion.g
            animate={{ rotate: rotation }}
            style={{ originX: "100px", originY: "100px" }}
            transition={{ type: "spring", stiffness: 60, damping: 15 }}
          >
            <line
              x1="100" y1="100"
              x2="100" y2="35"
              stroke="#ef4444"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path d="M 97 45 L 100 30 L 103 45 Z" fill="#ef4444" />
          </motion.g>
        </svg>

        {/* Digital Readout */}
        <div className="absolute bottom-4 flex flex-col items-center">
          <motion.div 
            animate={progress > 90 ? { scale: [1, 1.1, 1] } : {}}
            transition={{ repeat: Infinity, duration: 0.2 }}
            className={`text-5xl font-black italic tracking-tighter ${progress > 95 ? 'text-red-500' : 'text-white'} drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]`}
            style={{ fontFamily: 'var(--font-open-sans-condensed), sans-serif' }}
          >
            {speed}
          </motion.div>
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mt-[-4px]">
            Miles Per Hour
          </div>
        </div>
      </div>

      {/* Screen Shake Effect for high speeds */}
      {progress > 90 && (
        <motion.div
          animate={{ x: [-1, 1, -1], y: [1, -1, 1] }}
          transition={{ repeat: Infinity, duration: 0.1 }}
          className="absolute inset-0 pointer-events-none"
        />
      )}
    </div>
  );
};
