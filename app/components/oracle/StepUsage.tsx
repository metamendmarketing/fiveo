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
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-black uppercase italic text-white mb-2 drop-shadow-md">
            How You <span className="text-[#00AEEF]">Drive</span>
          </h2>
          <p className="text-[10px] text-white/50 uppercase tracking-[0.2em] font-black drop-shadow-sm mb-6">
            How do you use your vehicle?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {USAGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onUpdate({ usage: opt.value });
                setTimeout(onNext, 200);
              }}
              className={`relative overflow-hidden rounded-2xl border text-left group transition-all duration-300 hover:-translate-y-1 h-52 md:h-56 ${
                profile.usage === opt.value
                  ? "border-[#00AEEF] shadow-[0_0_20px_rgba(0,174,239,0.3)]"
                  : "border-white/20 shadow-lg hover:border-white/50"
              }`}
              style={{ backgroundImage: `url(${opt.image})`, backgroundSize: "cover", backgroundPosition: "center" }}
            >
              <div className={`absolute inset-0 transition-opacity duration-300 ${profile.usage === opt.value ? 'bg-gradient-to-t from-black/90 via-black/40 to-[#00AEEF]/20' : 'bg-gradient-to-t from-black/90 via-black/40 to-transparent group-hover:from-black/95'}`} />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-left">
                <h3 className={`font-black uppercase text-xl leading-tight mb-1 ${profile.usage === opt.value ? 'text-white' : 'text-white/90 group-hover:text-white'}`}>
                  {opt.label}
                </h3>
                <p className={`text-[11px] font-medium tracking-wide ${profile.usage === opt.value ? 'text-[#00AEEF]' : 'text-gray-300'}`}>
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
