/**
 * StepGoal — Intent & Objective
 * 
 * Determines the primary reason the user is buying injectors.
 * This sets the trajectory for Layer 2 scoring overrides.
 */
"use client";

import { type BuildProfile, IMAGES } from "@/app/lib/constants";

const GOALS = [
  { value: "replace" as const, label: "OEM Replacement", desc: "Fixing misfires or failed stock injectors", image: IMAGES.diagnosticBay },
  { value: "improve" as const, label: "Mild Improvement", desc: "Slight upgrade for better spray pattern", image: IMAGES.mixedUse },
  { value: "max-power" as const, label: "Max Power", desc: "Feeding a high-horsepower build", image: IMAGES.dynoFlames },
];

interface Props {
  profile: BuildProfile;
  onUpdate: (partial: Partial<BuildProfile>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepGoal({ profile, onUpdate, onNext }: Props) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-6">
      {/* Header */}
      <div className="w-full max-w-2xl mx-auto text-left">
        <h2 className="text-2xl lg:text-3xl font-black uppercase italic text-white mb-1 drop-shadow-md">
          What is the <span className="text-[#00AEEF]">Mission</span>?
        </h2>
        <p className="text-[10px] text-white/50 uppercase tracking-[0.3em] font-black drop-shadow-sm">
          Define your primary objective
        </p>
      </div>

      {/* Goal Selection Cards — Always stacked vertically */}
      <div className="w-full max-w-2xl mx-auto">
        <div className="grid grid-cols-1 gap-4">
          {GOALS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onUpdate({ goal: opt.value });
                onNext();
              }}
              className={`relative overflow-hidden rounded-2xl border text-left group transition-all duration-300 hover:-translate-y-1 h-32 lg:h-40 ${
                profile.goal === opt.value
                  ? "border-[#00AEEF] shadow-[0_0_20px_rgba(0,174,239,0.3)]"
                  : "border-white/20 shadow-lg hover:border-white/50"
              }`}
              style={{ 
                backgroundImage: `url(${opt.image})`, 
                backgroundSize: "cover", 
                backgroundPosition: "center",
                filter: 'brightness(1.15) contrast(1.05)'
              }}
            >
              <div className={`absolute inset-0 transition-opacity duration-300 ${profile.goal === opt.value ? 'bg-gradient-to-t from-black/90 via-black/40 to-[#00AEEF]/20' : 'bg-gradient-to-t from-black/90 via-black/40 to-transparent group-hover:from-black/95'}`} />
              <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6 text-left">
                <h3 className={`font-black uppercase text-lg lg:text-xl leading-tight mb-1 ${profile.goal === opt.value ? 'text-white' : 'text-white/90 group-hover:text-white'}`}>
                  {opt.label}
                </h3>
                <p className={`text-[11px] font-medium tracking-wide ${profile.goal === opt.value ? 'text-[#00AEEF]' : 'text-gray-300'}`}>
                  {opt.desc}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
