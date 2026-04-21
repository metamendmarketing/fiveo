/**
 * StepGoal — Q4: Intent/Goal with action photography cards
 * Centered layout with 2x2 image cards
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
    <div className="oracle-bg-intent min-h-[65vh] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black uppercase italic text-white mb-2">
            Your <span className="text-[#00AEEF]">Mission</span>
          </h2>
          <p className="text-xs text-white/50 uppercase tracking-[0.2em] font-bold">
            What's your goal with these injectors?
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
              className={`oracle-card h-52 md:h-56 ${
                profile.goal === g.value ? "oracle-card-selected" : ""
              }`}
              style={{ backgroundImage: `url(${g.image})` }}
            >
              <div className="oracle-card-content absolute bottom-0 left-0 right-0 px-8 py-10">
                <h3 className="text-white font-black uppercase text-lg leading-tight mb-1">
                  {g.label}
                </h3>
                <p className="text-white/50 text-xs font-medium">{g.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
