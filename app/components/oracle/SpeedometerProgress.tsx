import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SpeedometerProgressProps {
  progress: number; // 0 to 100
}

export const SpeedometerProgress: React.FC<SpeedometerProgressProps> = ({ progress }) => {
  // Map progress (0-100) to needle rotation
  // Start: approx 225deg (-135deg from top), End: approx 135deg (total 270deg range)
  const rotation = (progress / 100) * 270 - 135;

  const showHalo = progress >= 95;
  const showFullFlames = progress >= 99;

  // Constants for SVG circles
  const radius = 85;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (progress / 100) * (circumference * 0.75); // 0.75 of circle

  return (
    <div className="relative flex flex-col items-center justify-center py-10 select-none">
      <div className="relative w-80 h-80 flex items-center justify-center">
        
        {/* 1. Fire Halo Animation (Outer Glow) */}
        <AnimatePresence>
          {showHalo && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ 
                opacity: 1, 
                scale: [1, 1.05, 1],
                rotate: [0, 360]
              }}
              exit={{ opacity: 0 }}
              transition={{ 
                opacity: { duration: 0.5 },
                scale: { repeat: Infinity, duration: 2 },
                rotate: { repeat: Infinity, duration: 10, ease: "linear" }
              }}
              className="absolute inset-0 rounded-full"
              style={{
                background: showFullFlames 
                  ? "radial-gradient(circle, transparent 60%, rgba(239, 68, 68, 0.4) 70%, rgba(245, 158, 11, 0.6) 85%, transparent 100%)"
                  : "radial-gradient(circle, transparent 65%, rgba(239, 68, 68, 0.2) 80%, transparent 100%)",
                filter: "blur(8px)"
              }}
            />
          )}
        </AnimatePresence>

        {/* 2. Intense Flame Particles (at 100%) */}
        {showFullFlames && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ 
                  scale: [1, 1.5, 0.5],
                  opacity: [0.8, 1, 0],
                  y: [0, -40 - Math.random() * 40],
                  x: [0, (Math.random() - 0.5) * 40],
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 0.6 + Math.random() * 0.4,
                  delay: i * 0.05
                }}
                className="absolute left-1/2 top-1/2 w-4 h-4 bg-orange-500 rounded-full blur-[6px]"
                style={{ 
                  transform: `rotate(${i * 30}deg) translateY(-140px)`
                }}
              />
            ))}
          </div>
        )}

        {/* 3. Main Gauge SVG */}
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_0_20px_rgba(0,0,0,1)] relative z-10">
          <defs>
            {/* Carbon Fiber Pattern */}
            <pattern id="carbon" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
              <rect width="10" height="10" fill="#111" />
              <path d="M0 0 L5 5 M5 0 L10 5 M0 5 L5 10 M5 5 L10 10" stroke="#1a1a1a" strokeWidth="1" />
            </pattern>

            {/* Glowing Gradient for progress */}
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

          {/* Background Outer Ring (Chrome) */}
          <circle cx="100" cy="100" r="98" fill="#222" stroke="#444" strokeWidth="1.5" />
          <circle cx="100" cy="100" r="95" fill="url(#carbon)" stroke="#000" strokeWidth="2" />

          {/* Track Shadow */}
          <path
            d="M 43.5 156.5 A 80 80 0 1 1 156.5 156.5"
            fill="none"
            stroke="rgba(0,0,0,0.5)"
            strokeWidth="10"
            strokeLinecap="round"
          />

          {/* Active Progress Glow Arc */}
          <motion.path
            d="M 43.5 156.5 A 80 80 0 1 1 156.5 156.5"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={377} // Approx 3/4 of circle
            initial={{ strokeDashoffset: 377 }}
            animate={{ strokeDashoffset: 377 - (progress / 100) * 377 }}
            transition={{ type: "spring", stiffness: 40, damping: 15 }}
            filter="url(#outerGlow)"
            className="opacity-80"
          />

          {/* Tick Marks & Numbers */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300].map((val) => {
            const angle = (val / 300) * 270 - 225;
            const rad = (angle * Math.PI) / 180;
            const x1 = 100 + 78 * Math.cos(rad);
            const y1 = 100 + 78 * Math.sin(rad);
            const x2 = 100 + 88 * Math.cos(rad);
            const y2 = 100 + 88 * Math.sin(rad);
            
            // Sub-ticks
            const subTicks = [];
            if (val < 300) {
              for (let j = 1; j < 3; j++) {
                const subAngle = angle + (j * 30) / 3;
                const sRad = (subAngle * Math.PI) / 180;
                subTicks.push(
                  <line 
                    key={`${val}-${j}`}
                    x1={100 + 82 * Math.cos(sRad)} y1={100 + 82 * Math.sin(sRad)}
                    x2={100 + 88 * Math.cos(sRad)} y2={100 + 88 * Math.sin(sRad)}
                    stroke="#555" strokeWidth="1"
                  />
                );
              }
            }

            // Text Positioning
            const tx = 100 + 60 * Math.cos(rad);
            const ty = 100 + 60 * Math.sin(rad);

            return (
              <React.Fragment key={val}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fff" strokeWidth="2" opacity="0.8" />
                {subTicks}
                <text 
                  x={tx} y={ty} 
                  fill="#fff" 
                  fontSize="10" 
                  fontWeight="900"
                  textAnchor="middle" 
                  alignmentBaseline="middle"
                  className="font-mono opacity-60"
                >
                  {val}
                </text>
              </React.Fragment>
            );
          })}

          {/* Center Text */}
          <text x="100" y="85" fill="#555" fontSize="8" fontWeight="bold" textAnchor="middle" className="uppercase tracking-widest">MPH</text>

          {/* Digital Percentage Counter */}
          <rect x="75" y="140" width="50" height="25" rx="3" fill="#000" stroke="#333" strokeWidth="1" />
          <text 
            x="100" y="157" 
            fill={progress > 95 ? "#ef4444" : "#f59e0b"} 
            fontSize="14" 
            fontWeight="black" 
            textAnchor="middle" 
            className="font-mono"
            style={{ textShadow: `0 0 10px ${progress > 95 ? '#ef4444' : '#f59e0b'}66` }}
          >
            {Math.round(progress)}%
          </text>

          {/* Needle Base Pin (3D Effect) */}
          <circle cx="100" cy="100" r="10" fill="#333" />
          <circle cx="100" cy="100" r="10" fill="url(#carbon)" />
          <circle cx="100" cy="100" r="8" fill="none" stroke="#555" strokeWidth="1" />

          {/* Tapered Needle - Bounding Box Anchor Hack */}
          <g transform="translate(100, 100)">
            <motion.g
              animate={{ rotate: rotation }}
              transition={{ type: "spring", stiffness: 45, damping: 12 }}
            >
              {/* Force the bounding box to be centered at 0,0 */}
              <rect x="-100" y="-100" width="200" height="200" fill="transparent" pointerEvents="none" />
              
              {/* Needle Body (relative to base at 0,0) */}
              <path 
                d="M -3 3 L 0 -75 L 3 3 Z" 
                fill={progress > 95 ? "#ef4444" : "#fff"}
                style={{ filter: "drop-shadow(0 0 5px rgba(255,0,0,0.5))" }}
              />
              {/* Highlight */}
              <path 
                d="M -1 0 L 0 -72 L 1 0 Z" 
                fill="rgba(255,255,255,0.3)"
              />
            </motion.g>
          </g>

          {/* Needle Pin Center (Always Top Layer) */}
          <circle cx="100" cy="100" r="10" fill="#333" />
          <circle cx="100" cy="100" r="10" fill="url(#carbon)" />
          <circle cx="100" cy="100" r="8" fill="none" stroke="#555" strokeWidth="1" />
          <circle cx="100" cy="100" r="4" fill="#666" />
          <circle cx="100" cy="100" r="2" fill="#999" />
        </svg>

        {/* Shake Container */}
        {progress > 90 && (
          <motion.div
            animate={{ x: [-1, 1, -1], y: [1, -1, 1] }}
            transition={{ repeat: Infinity, duration: 0.1 }}
            className="absolute inset-0 pointer-events-none border-[10px] border-transparent"
          />
        )}
      </div>
    </div>
  );
};
