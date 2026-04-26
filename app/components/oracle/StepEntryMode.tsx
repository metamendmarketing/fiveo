/**
 * StepEntryMode — The Ignition Screen
 * 
 * The entry point of the Oracle wizard. Users select one of three funnels:
 * 1. Guide Me: Full educational experience.
 * 2. I Know My Setup: Technical matching for known vehicle/mods.
 * 3. I Know My Specs: Direct engineering input for advanced users.
 */
"use client";


import { Compass, Wrench, SlidersHorizontal, Settings2 } from "lucide-react";

const PATHS = [
  {
    mode: "guide" as const,
    title: "Guide Me",
    tagline: "Built for first-timers and weekend warriors.",
    icon: <Compass className="w-8 h-8 text-white stroke-[2px] relative z-10" />,
  },
  {
    mode: "setup" as const,
    title: "I Know My Setup",
    tagline: "You know your build. We'll match the tech.",
    icon: <Wrench className="w-8 h-8 text-white stroke-[2px] relative z-10" />,
  },
  {
    mode: "specs" as const,
    title: "I Know My Specs",
    tagline: "Direct input. No hand-holding.",
    icon: <SlidersHorizontal className="w-8 h-8 text-white stroke-[2px] relative z-10" />,
  },
  {
    mode: "oem" as const,
    title: "OEM Replacement",
    tagline: "Stock car? Fix it fast with verified parts.",
    icon: <Settings2 className="w-8 h-8 text-white stroke-[2px] relative z-10" />,
  },
];

export function StepEntryMode({
  onSelect,
}: {
  onSelect: (mode: "guide" | "setup" | "specs" | "oem") => void;
}) {
  return (
    /* Outer wrapper: flex-1 stretches to fill the full wizard height */
    <div className="w-full flex-1 flex flex-col">
      {/* Content column: flex-1 fills available height, centers text header */}
      <div className="w-full max-w-5xl mx-auto flex-1 flex flex-col px-2 sm:px-4">
        {/* Title block — compact, does not flex-grow */}
        <div className="text-center pt-4 sm:pt-6 md:pt-8 pb-2 sm:pb-4">
          <h1
            className="font-black uppercase italic text-white mb-1 md:mb-2 tracking-tighter drop-shadow-md"
            style={{ fontSize: "clamp(1.2rem, 4vw, 3.5rem)" }}
          >
            Fuel Injector <span style={{ color: "#00AEEF" }}>Oracle</span>
          </h1>
          <p className="text-white/60 text-[8px] md:text-[10px] uppercase tracking-[0.25em] font-bold mb-2 md:mb-4 drop-shadow-sm">
            The ultimate technical sizing assistant for high-performance builds
          </p>
          <h2 className="text-white text-xs md:text-lg font-bold drop-shadow-md uppercase tracking-wider">
            How do you want to dial in your injectors?
          </h2>
        </div>

        {/* Card grid — flex-1 fills remaining height, auto-rows-fr makes rows equal */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 flex-1 pb-4 sm:pb-6"
          style={{ gridAutoRows: '1fr' }}
        >
          {PATHS.map((p) => (
            <button
              key={p.mode}
              onClick={() => onSelect(p.mode)}
              className="bg-white/95 backdrop-blur-md rounded-xl md:rounded-2xl border border-white/20 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,174,239,0.15)] hover:border-[#00AEEF]/50 active:scale-[0.98] group p-3 sm:p-4 md:p-8 flex flex-col items-center justify-center gap-2 sm:gap-3 md:gap-5 h-full"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full shrink-0 relative overflow-hidden flex items-center justify-center shadow-[0_8px_20px_rgba(0,174,239,0.4)] group-hover:scale-110 transition-transform duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-[#00AEEF] to-[#0070B8] opacity-90" />
                <div className="absolute inset-0 bg-white/20 backdrop-blur-sm" />
                {p.icon}
              </div>
              <div className="text-center min-w-0">
                <h3 className="text-gray-900 font-black uppercase italic text-xs sm:text-sm md:text-lg mb-0.5 md:mb-2">
                  {p.title}
                </h3>
                <p className="text-gray-500 text-[9px] sm:text-[10px] md:text-[11px] font-medium leading-snug md:leading-relaxed">
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
