/**
 * StepPreferences — Component & Brand Preferences
 * 
 * Final refinement step where users select their preferred injector type,
 * budget range, and manufacturer preference.
 */
"use client";

import { type BuildProfile } from "@/app/lib/constants";
import { Wrench, Gauge, Zap } from "lucide-react";

interface Props {
  profile: BuildProfile;
  onUpdate: (partial: Partial<BuildProfile>) => void;
  onNext: () => void;
  onBack: () => void;
}

const INJECTOR_TYPES = [
  { value: "oem" as const, label: "OEM Replacement", desc: "Factory spec, drop-in fit", icon: <Wrench className="w-5 h-5 stroke-[2px]" /> },
  { value: "performance" as const, label: "Performance", desc: "Higher flow, race-grade", icon: <Gauge className="w-5 h-5 stroke-[2px]" /> },
  { value: "best-of-both" as const, label: "Best of Both", desc: "OEM reliability, performance flow", icon: <Zap className="w-5 h-5 stroke-[2px]" /> },
];

const BUDGET_OPTIONS = [
  { value: "budget" as const, label: "Budget-Friendly", desc: "Best value for the money" },
  { value: "mid" as const, label: "Mid-Range", desc: "Quality without breaking the bank" },
  { value: "premium" as const, label: "Premium", desc: "Top-tier components, no compromise" },
];

const BRAND_OPTIONS = [
  { value: "fiveo" as const, label: "FiveO Motorsport" },
  { value: "bosch" as const, label: "Bosch" },
  { value: "no-preference" as const, label: "No Preference" },
];

export function StepPreferences({ profile, onUpdate, onNext }: Props) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-6">
      {/* Header */}
      <div className="w-full max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-black uppercase italic text-white mb-2 drop-shadow-md">
          Dialing It <span className="text-[#00AEEF]">In</span>
        </h2>
        <p className="text-xs text-white/50 uppercase tracking-[0.2em] font-bold drop-shadow-sm">
          Final preferences to refine your results
        </p>
      </div>

      <div className="w-full max-w-4xl mx-auto space-y-8">
        {/* Q10: Injector Preference */}
        <div>
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00AEEF] mb-3 block text-left">
            Injector Type Preference
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {INJECTOR_TYPES.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onUpdate({ injectorPref: opt.value })}
                className={`relative p-5 rounded-2xl border transition-all text-center group overflow-hidden flex flex-col items-center ${
                  profile.injectorPref === opt.value
                    ? "border-[#00AEEF] shadow-[0_0_20px_rgba(0,174,239,0.2)] text-white"
                    : "border-white/10 bg-white/5 backdrop-blur-sm text-white/50 hover:border-white/30 hover:bg-white/10"
                }`}
              >
                {profile.injectorPref === opt.value && (
                  <div className="absolute inset-0 bg-gradient-to-b from-[#00AEEF]/20 to-transparent" />
                )}
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full mb-3 relative flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <div className={`absolute inset-0 rounded-full transition-all duration-300 ${profile.injectorPref === opt.value ? "bg-[#00AEEF] shadow-[0_0_15px_rgba(0,174,239,0.5)]" : "bg-white/10"}`} />
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent border border-white/20" />
                    <div className={`relative z-10 ${profile.injectorPref === opt.value ? "text-white" : "text-white/60 group-hover:text-white"}`}>
                      {opt.icon}
                    </div>
                  </div>
                  <span className={`font-black uppercase text-xs block mb-1 ${profile.injectorPref === opt.value ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>{opt.label}</span>
                  <span className={`text-[10px] block ${profile.injectorPref === opt.value ? 'text-[#00AEEF]' : 'text-white/40 group-hover:text-white/60'}`}>{opt.desc}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Q11: Budget */}
        <div className="pt-[10px]">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00AEEF] mb-3 block text-left">
            Budget Range
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {BUDGET_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onUpdate({ budget: opt.value })}
                className={`relative p-5 rounded-2xl border transition-all text-center group overflow-hidden flex flex-col items-center ${
                  profile.budget === opt.value
                    ? "border-[#00AEEF] shadow-[0_0_20px_rgba(0,174,239,0.2)] text-white"
                    : "border-white/10 bg-white/5 backdrop-blur-sm text-white/50 hover:border-white/30 hover:bg-white/10"
                }`}
              >
                {profile.budget === opt.value && (
                  <div className="absolute inset-0 bg-gradient-to-b from-[#00AEEF]/20 to-transparent" />
                )}
                <div className="relative z-10">
                  <span className={`font-black uppercase text-xs block mb-1 ${profile.budget === opt.value ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>{opt.label}</span>
                  <span className={`text-[10px] block ${profile.budget === opt.value ? 'text-[#00AEEF]' : 'text-white/40 group-hover:text-white/60'}`}>{opt.desc}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Q12: Brand Preference */}
        <div className="pt-[10px]">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00AEEF] mb-3 block text-left">
            Brand Preference
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {BRAND_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onUpdate({ brandPref: opt.value })}
                className={`relative p-4 rounded-2xl border transition-all text-center group overflow-hidden flex flex-col items-center ${
                  profile.brandPref === opt.value
                    ? "border-[#00AEEF] shadow-[0_0_20px_rgba(0,174,239,0.2)] text-white"
                    : "border-white/10 bg-white/5 backdrop-blur-sm text-white/50 hover:border-white/30 hover:bg-white/10"
                }`}
              >
                {profile.brandPref === opt.value && (
                  <div className="absolute inset-0 bg-gradient-to-b from-[#00AEEF]/20 to-transparent" />
                )}
                <span className={`relative z-10 font-black uppercase text-xs block ${profile.brandPref === opt.value ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Education Beat */}
      <div className="w-full max-w-4xl mx-auto p-5 rounded-2xl border border-[#00AEEF]/20 bg-[#00AEEF]/10 backdrop-blur-md">
        <p className="text-sm text-white/80 leading-relaxed font-medium">
          <strong className="text-[#00AEEF] block mb-1 uppercase tracking-widest text-[10px]">Pro Tip</strong> 
          &quot;Best of Both&quot; selects injectors with OEM-grade build quality but performance-level flow rates. This is the most popular choice for street builds that need more fuel without sacrificing daily drivability.
        </p>
      </div>

      <div className="w-full max-w-4xl mx-auto">
        <button
          onClick={onNext}
          disabled={!profile.injectorPref}
          className="bg-[#E10600] text-white font-black italic uppercase tracking-[0.2em] rounded-sm transition-all duration-200 shadow-[0_4px_16px_rgba(225,6,0,0.25)] hover:bg-[#c70500] hover:-translate-y-[1px] hover:shadow-[0_6px_24px_rgba(225,6,0,0.35)] w-full py-4 text-sm disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Find My Injectors →
        </button>
      </div>
    </div>
  );
}
