/**
 * StepEntryMode — The Ignition Screen
 * 
 * The entry point of the Oracle wizard. Users select one of three funnels:
 * 1. Guide Me: Full educational experience.
 * 2. I Know My Setup: Technical matching for known vehicle/mods.
 * 3. I Know My Specs: Direct engineering input for advanced users.
 */
"use client";

import { Compass, Wrench, SlidersHorizontal } from "lucide-react";

const PATHS = [
  {
    mode: "guide" as const,
    title: "Guide Me",
    tagline: "Built for first-timers and weekend warriors.",
    icon: <Compass className="w-8 h-8 stroke-[1.5px]" />,
  },
  {
    mode: "setup" as const,
    title: "I Know My Setup",
    tagline: "You know your build. We'll match the tech.",
    icon: <Wrench className="w-8 h-8 stroke-[1.5px]" />,
  },
  {
    mode: "specs" as const,
    title: "I Know My Specs",
    tagline: "Direct input. No hand-holding.",
    icon: <SlidersHorizontal className="w-8 h-8 stroke-[1.5px]" />,
  },
];

export function StepEntryMode({
  onSelect,
}: {
  onSelect: (mode: "guide" | "setup" | "specs") => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] px-4 py-16">
      {/* Content */}
      <div className="text-center max-w-4xl mx-auto w-full">
        <h1
          className="font-black uppercase italic text-white mb-2 tracking-tighter drop-shadow-md"
          style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
        >
          Fuel Injector <span style={{ color: "#00AEEF" }}>Oracle</span>
        </h1>
        <p className="text-white/60 text-[10px] uppercase tracking-[0.25em] font-bold mb-16 drop-shadow-sm">
          The ultimate technical sizing assistant for high-performance builds
        </p>

        <h2 className="text-white text-lg font-bold mb-8 drop-shadow-md">
          How do you want to dial in your injectors?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {PATHS.map((p) => (
            <button
              key={p.mode}
              onClick={() => onSelect(p.mode)}
              className="bg-white/95 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.2)] hover:border-[#00AEEF]/50 group p-8 text-center flex flex-col items-center gap-5"
            >
              <div className="w-16 h-16 rounded-full bg-slate-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-[#00AEEF]/10 group-hover:text-[#00AEEF] transition-colors">
                {p.icon}
              </div>
              <div>
                <h3 className="text-gray-900 font-black uppercase italic text-lg mb-2">
                  {p.title}
                </h3>
                <p className="text-gray-500 text-[11px] font-medium leading-relaxed">
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
