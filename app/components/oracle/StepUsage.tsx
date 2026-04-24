/**
 * StepUsage — Application Environment Selection
 * 
 * Users specify how the vehicle will be used (Daily, Track, Towing, Off-road).
 * Influences the AI's "Pro Tip" and match strategy selection.
 */
"use client";

import type { BuildProfile } from "@/app/lib/constants";
import { IMAGES } from "@/app/lib/constants";

const USAGE_OPTIONS = [
  { value: "daily" as const, label: "Daily Driver", desc: "Commute, errands, road trips", image: IMAGES.sunsetHighway },
  { value: "street" as const, label: "Street Performance", desc: "Spirited driving, weekend warrior", image: IMAGES.nightStreet },
  { value: "track" as const, label: "Track / Racing", desc: "Competition, drag, circuit", image: IMAGES.trackDrift },
  { value: "mixed" as const, label: "Mixed Use", desc: "Daily driving + occasional track days", image: IMAGES.mixedUse },
];

interface Props {
  profile: BuildProfile;
  onUpdate: (partial: Partial<BuildProfile>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepUsage({ profile, onUpdate, onNext }: Props) {
  return (
    <div className="bg-[#0a0a0a] text-white rounded-2xl border border-white/5 min-h-[65vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-full max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black uppercase italic text-white mb-2">
            How You <span className="text-[#00AEEF]">Drive</span>
          </h2>
          <p className="text-xs text-white/50 uppercase tracking-[0.2em] font-bold">
            How do you use your vehicle?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {USAGE_OPTIONS.map((u) => (
            <button
              key={u.value}
              onClick={() => {
                onUpdate({ usage: u.value });
                setTimeout(onNext, 200);
              }}
              className={`relative overflow-hidden rounded-md border border-white/5 bg-cover bg-center cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(0,0,0,0.2)] hover:border-[#00AEEF]/20 h-52 md:h-56 ${
                profile.usage === u.value ? "relative overflow-hidden rounded-md border border-white/5 bg-cover bg-center cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(0,0,0,0.2)] hover:border-[#00AEEF]/20-selected" : ""
              }`}
              style={{ backgroundImage: `url(${u.image})` }}
            >
              <div className="relative overflow-hidden rounded-md border border-white/5 bg-cover bg-center cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(0,0,0,0.2)] hover:border-[#00AEEF]/20-content absolute bottom-0 left-0 right-0 p-6">
                <h3 className="text-white font-black uppercase text-lg leading-tight mb-1">
                  {u.label}
                </h3>
                <p className="text-white/50 text-xs font-medium">{u.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
