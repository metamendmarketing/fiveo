/**
 * StepEntryMode — The Ignition Screen
 * 
 * The entry point of the Oracle wizard. Users select one of three funnels:
 * 1. Guide Me: Full educational experience.
 * 2. I Know My Setup: Technical matching for known vehicle/mods.
 * 3. I Know My Specs: Direct engineering input for advanced users.
 */
"use client";

import { IMAGES } from "@/app/lib/constants";

const PATHS = [
  {
    mode: "guide" as const,
    title: "Guide Me",
    tagline: "Built for first-timers and weekend warriors.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 12l10 10 10-10L12 2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    mode: "setup" as const,
    title: "I Know My Setup",
    tagline: "You know your build. We'll match the tech.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.66-5.66L7.17 8.1l4.25 4.25 8.49-8.49 1.41 1.41z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.66 10.5a10 10 0 11-3.14-6.36" />
      </svg>
    ),
  },
  {
    mode: "specs" as const,
    title: "I Know My Specs",
    tagline: "Direct input. No hand-holding.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="2" x2="12" y2="22" />
        <line x1="2" y1="12" x2="22" y2="12" />
      </svg>
    ),
  },
];

export function StepEntryMode({
  onSelect,
}: {
  onSelect: (mode: "guide" | "setup" | "specs") => void;
}) {
  return (
    <div 
      className="relative rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] min-h-[65vh] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-16 overflow-hidden"
      style={{
        backgroundImage: `url(${IMAGES.engineBayHero})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Dark overlay for contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/80 to-black/90" />

      {/* Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto w-full">
        <h1
          className="font-black uppercase italic text-white mb-2 tracking-tighter drop-shadow-md"
          style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
        >
          Fuel Injector <span style={{ color: "#00AEEF" }}>Oracle</span>
        </h1>
        <p className="text-white/60 text-[10px] uppercase tracking-[0.25em] font-bold mb-16">
          The ultimate technical sizing assistant for high-performance builds
        </p>

        <h2 className="text-white text-lg font-bold mb-8">
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
