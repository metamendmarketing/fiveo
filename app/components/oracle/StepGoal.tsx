/**
 * StepGoal — Build Intent Selection
 * 
 * Users select their primary performance goal (Replace, Improve, Max Power, Fix).
 * This selection influences the heuristic weighting and the AI's "Selection Strategy".
 */
"use client";

import type { BuildProfile } from "@/app/lib/constants";
import { IMAGES } from "@/app/lib/constants";

const GOALS = [
  { value: "replace" as const, label: "Replace Worn Injectors", desc: "OEM feel, factory reliability", image: IMAGES.diagnosticBay },
  { value: "improve" as const, label: "Improve Performance", desc: "More power, better response", image: IMAGES.improveStreet },
  { value: "max-power" as const, label: "Max Power / Racing", desc: "All-out performance build", image: IMAGES.dynoFlames },
  { value: "fix-issues" as const, label: "Fix Fueling Issues", desc: "Misfires, lean conditions, rough idle", image: IMAGES.diagnosticBay },
];

interface Props {
  profile: BuildProfile;
  onUpdate: (partial: Partial<BuildProfile>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepGoal({ profile, onUpdate, onNext }: Props) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] min-h-[65vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-full max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-black uppercase italic text-black mb-2">
            Your <span className="text-[#00AEEF]">Mission</span>
          </h2>
          <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-bold">
            What&apos;s your goal with these injectors?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {GOALS.map((g) => (
            <button
              key={g.value}
              onClick={() => {
                onUpdate({ goal: g.value });
                setTimeout(onNext, 200);
              }}
              className={`relative overflow-hidden rounded-xl border bg-cover bg-center cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(0,0,0,0.12)] h-52 md:h-56 group ${
                profile.goal === g.value 
                  ? "border-[#00AEEF] shadow-[0_0_0_2px_rgba(0,174,239,0.3)]" 
                  : "border-gray-200"
              }`}
              style={{ backgroundImage: `url(${g.image})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity group-hover:from-black/95"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 text-left">
                <h3 className="text-white font-black uppercase text-xl leading-tight mb-1">
                  {g.label}
                </h3>
                <p className="text-gray-300 text-[11px] font-medium tracking-wide">{g.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
