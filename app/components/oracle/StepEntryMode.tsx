/**
 * StepEntryMode — Q0: "The Ignition Screen"
 * Full-bleed engine bay hero + three path selection cards
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
      className="relative min-h-[70vh] flex flex-col items-center justify-center px-4 py-12"
      style={{
        backgroundImage: `url(${IMAGES.engineBayHero})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/80 to-black/90" />

      {/* Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto">
        <h1
          className="font-black uppercase italic text-white mb-2 tracking-tighter"
          style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
        >
          Fuel Injector <span style={{ color: "#00AEEF" }}>Oracle</span>
        </h1>
        <p className="text-white/60 text-xs uppercase tracking-[0.25em] font-bold mb-12">
          The ultimate technical sizing assistant for high-performance builds
        </p>

        <h2 className="text-white/90 text-lg font-bold mb-8">
          How do you want to dial in your injectors?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-3xl mx-auto">
          {PATHS.map((p, i) => (
            <button
              key={p.mode}
              onClick={() => onSelect(p.mode)}
              className="oracle-card group px-8 py-14 text-left"
              style={{ animationDelay: `${i * 150}ms` }}
            >
              <div className="oracle-card-content flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-[#00AEEF] group-hover:bg-[#00AEEF]/20 transition-colors">
                  {p.icon}
                </div>
                <div>
                  <h3 className="text-white font-black uppercase italic text-lg mb-1">
                    {p.title}
                  </h3>
                  <p className="text-white/50 text-xs font-medium">
                    {p.tagline}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
