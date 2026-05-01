/**
 * StepEntryMode — The Ignition Screen
 * 
 * Portrait: Vertical card layout with generous sizing, fills the screen.
 * Landscape: Compact horizontal layout, fits within ~345px viewport.
 * Desktop (lg+): 4-across vertical cards with full sizing.
 */
"use client";


import { Sparkles, Cpu, Wrench, ShieldCheck } from "lucide-react";

const PATHS = [
  {
    mode: "guide" as const,
    title: "Guide Me",
    tagline: "Built for first-timers and weekend warriors.",
    icon: <Sparkles className="w-7 h-7 text-white stroke-[2px] relative z-10" />,
    accent: "#f59e0b", // Amber
  },
  {
    mode: "setup" as const,
    title: "I Know My Build",
    tagline: "You know your build. We'll match the tech.",
    icon: <Wrench className="w-7 h-7 text-white stroke-[2px] relative z-10" />,
    accent: "#E10600", // FiveO Red
  },
  {
    mode: "specs" as const,
    title: "I Know My Specs",
    tagline: "Direct input. No hand-holding.",
    icon: <Cpu className="w-7 h-7 text-white stroke-[2px] relative z-10" />,
    accent: "#00AEEF", // FiveO Blue
  },
  {
    mode: "oem" as const,
    title: "OEM Replacement",
    tagline: "Stock car? Fix it fast with verified parts.",
    icon: <ShieldCheck className="w-7 h-7 text-white stroke-[2px] relative z-10" />,
    accent: "#10b981", // Emerald
  },
];

export function StepEntryMode({
  onSelect,
}: {
  onSelect: (mode: "guide" | "setup" | "specs" | "oem") => void;
}) {
  return (
    <div className="w-full py-6 lg:py-16">
      <div className="w-full max-w-5xl mx-auto text-center">
        {/* Title */}
        <h1
          className="font-black uppercase italic text-white mb-1 tracking-tighter drop-shadow-md"
          style={{ fontSize: "clamp(1.3rem, 4vw, 3.5rem)" }}
        >
          Fuel Injector <span style={{ color: "#00AEEF" }}>Oracle</span>
        </h1>
        <p className="text-white/60 text-[8px] lg:text-[10px] uppercase tracking-[0.2em] font-bold mb-2 lg:mb-6 drop-shadow-sm">
          The ultimate technical sizing assistant for high-performance builds
        </p>
        <h2 className="text-white text-xs lg:text-lg font-bold drop-shadow-md uppercase tracking-wider">
          How do you want to dial in your injectors?
        </h2>

        <div className="h-[10px]" />

        {/* Card grid */}
        <div className="entry-card-grid">
          {PATHS.map((p) => (
            <button
              key={p.mode}
              onClick={() => onSelect(p.mode)}
              className="entry-card bg-white/95 backdrop-blur-md rounded-xl lg:rounded-2xl border border-white/20 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl active:scale-[0.98] group"
              style={{ 
                // @ts-ignore
                "--hover-color": p.accent 
              }}
            >
              {/* Animated Glow Effect */}
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500" 
                style={{ backgroundColor: p.accent }}
              />

              <div className="entry-card-icon rounded-full shrink-0 relative overflow-hidden flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <div 
                  className="absolute inset-0 opacity-90 transition-colors duration-300" 
                  style={{ backgroundColor: p.accent }}
                />
                <div className="absolute inset-0 bg-white/20 backdrop-blur-sm" />
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"
                  style={{ backgroundColor: p.accent }}
                />
                {p.icon}
              </div>
              <div className="min-w-0 relative z-10">
                <h3 className="text-gray-900 font-black uppercase italic entry-card-title">
                  {p.title}
                </h3>
                <p className="text-gray-500 entry-card-tagline font-medium leading-tight lg:leading-relaxed">
                  {p.tagline}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
