/**
 * StepPreferences — Component & Brand Preferences
 * 
 * Final refinement step where users select their preferred injector type,
 * budget range, and manufacturer preference.
 */
"use client";

import type { BuildProfile } from "@/app/lib/constants";

interface Props {
  profile: BuildProfile;
  onUpdate: (partial: Partial<BuildProfile>) => void;
  onNext: () => void;
  onBack: () => void;
}

const INJECTOR_TYPES = [
  { value: "oem" as const, label: "OEM Replacement", desc: "Factory spec, drop-in fit", icon: "🔧" },
  { value: "performance" as const, label: "Performance", desc: "Higher flow, race-grade", icon: "🏁" },
  { value: "best-of-both" as const, label: "Best of Both", desc: "OEM reliability, performance flow", icon: "⚡" },
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
    <div className="relative oracle-bg-preferences min-h-[65vh] flex items-center justify-center px-6 py-12">
      <div className="relative z-10 w-full max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black uppercase italic text-black mb-2">
            Dialing It <span className="text-[#00AEEF]">In</span>
          </h2>
          <p className="text-xs text-gray-500 uppercase tracking-[0.2em] font-bold">
            Final preferences to refine your results
          </p>
        </div>

        <div className="space-y-8">
          {/* Q10: Injector Preference */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3 block text-center">
              Injector Type Preference
            </label>
            <div className="grid grid-cols-3 gap-3">
              {INJECTOR_TYPES.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onUpdate({ injectorPref: opt.value })}
                  className={`p-5 rounded-md border-2 text-center transition-all ${
                    profile.injectorPref === opt.value
                      ? "border-[#00AEEF] bg-blue-50 text-[#00AEEF] shadow-md"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <div className="text-2xl mb-2">{opt.icon}</div>
                  <span className="font-bold uppercase text-xs block mb-1">{opt.label}</span>
                  <span className="text-[10px] text-gray-400 block">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Q11: Budget */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3 block text-center">
              Budget Range
            </label>
            <div className="grid grid-cols-3 gap-3">
              {BUDGET_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onUpdate({ budget: opt.value })}
                  className={`p-5 rounded-md border-2 text-center transition-all ${
                    profile.budget === opt.value
                      ? "border-[#00AEEF] bg-blue-50 text-[#00AEEF] shadow-md"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <span className="font-bold uppercase text-xs block mb-1">{opt.label}</span>
                  <span className="text-[10px] text-gray-400 block">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Q12: Brand Preference */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3 block text-center">
              Brand Preference
            </label>
            <div className="grid grid-cols-3 gap-3">
              {BRAND_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onUpdate({ brandPref: opt.value })}
                  className={`p-5 rounded-md border-2 text-center transition-all ${
                    profile.brandPref === opt.value
                      ? "border-[#00AEEF] bg-blue-50 text-[#00AEEF] shadow-md"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <span className="font-bold uppercase text-xs block">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Education Beat */}
        <div className="oracle-education-beat mt-8">
          <strong>Pro Tip:</strong> &quot;Best of Both&quot; selects injectors with OEM-grade build quality
          but performance-level flow rates. This is the most popular choice for street builds
          that need more fuel without sacrificing daily drivability.
        </div>

        <div className="mt-8">
          <button
            onClick={onNext}
            disabled={!profile.injectorPref}
            className="oracle-cta-primary w-full text-sm disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Find My Injectors →
          </button>
        </div>
      </div>
    </div>
  );
}
