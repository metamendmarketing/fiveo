/**
 * StepExpertSpecs — Direct Technical Input
 * 
 * Used by the "Setup & Specs" entry mode. Allows users to bypass vehicle
 * matching and directly enter desired flow rates, fuel pressure,
 * and connector types.
 */
"use client";

import type { BuildProfile } from "@/app/lib/constants";

interface Props {
  profile: BuildProfile;
  onUpdate: (partial: Partial<BuildProfile>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepExpertSpecs({ profile, onUpdate, onNext }: Props) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black uppercase italic text-white mb-2">
            Direct <span className="text-[#00AEEF]">Input</span>
          </h2>
          <p className="text-xs text-white/50 uppercase tracking-[0.2em] font-bold">
            Enter your specifications directly
          </p>
        </div>

        <div className="space-y-6">
          {/* QX1: Desired Injector Size */}
          <div className="bg-white/5 border border-white/10 rounded-md p-5">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00AEEF] mb-2 block">
              Desired Injector Size (cc/min)
            </label>
            <input
              type="number"
              value={profile.desiredSizeCC || ""}
              onChange={(e) => onUpdate({ desiredSizeCC: e.target.value ? parseInt(e.target.value) : null })}
              placeholder="e.g. 550"
              className="w-full h-14 bg-white/5 border border-white/10 rounded px-5 text-white text-lg font-mono font-bold outline-none focus:border-[#00AEEF] transition-colors"
            />
            {profile.desiredSizeCC && (
              <p className="text-white/40 text-xs mt-2 font-mono">
                = {(profile.desiredSizeCC / 10.5).toFixed(1)} lb/hr
              </p>
            )}
          </div>

          {/* QX2: Fuel Pressure */}
          <div className="bg-white/5 border border-white/10 rounded-md p-5">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00AEEF] mb-2 block">
              Fuel Pressure (PSI) — Default: 43.5
            </label>
            <input
              type="number"
              value={profile.fuelPressurePSI || ""}
              onChange={(e) => onUpdate({ fuelPressurePSI: e.target.value ? parseFloat(e.target.value) : null })}
              placeholder="43.5"
              className="w-full h-14 bg-white/5 border border-white/10 rounded px-5 text-white text-lg font-mono font-bold outline-none focus:border-[#00AEEF] transition-colors"
            />
          </div>

          {/* QX3: Headroom Preference */}
          <div className="bg-white/5 border border-white/10 rounded-md p-5">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00AEEF] mb-3 block text-center">
              Headroom Preference
            </label>
            <div className="grid grid-cols-1 gap-[10px]">
              {([
                { value: "conservative", label: "Conservative", desc: "More overhead" },
                { value: "balanced", label: "Balanced", desc: "Standard 80% DC" },
                { value: "aggressive", label: "Aggressive", desc: "Tight sizing" },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onUpdate({ headroomPref: opt.value })}
                  className={`flex items-center justify-between py-4 px-5 bg-white/5 border rounded text-[13px] font-semibold uppercase tracking-[0.05em] cursor-pointer transition-all duration-200 ${
                    profile.headroomPref === opt.value 
                      ? "border-[#00AEEF] text-white shadow-[0_0_15px_rgba(0,174,239,0.3)]" 
                      : "border-white/10 text-white/70 hover:border-[#00AEEF]/30 hover:text-white"
                  }`}
                >
                  <span className="font-black text-xs">{opt.label}</span>
                  <span className="text-[10px] text-white/40 font-medium">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* QX4: Connector Type */}
          <div className="bg-white/5 border border-white/10 rounded-md p-5">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00AEEF] mb-2 block">
              Connector Type (Optional)
            </label>
            <select
              value={profile.connectorType || ""}
              onChange={(e) => onUpdate({ connectorType: e.target.value || null })}
              className="w-full h-14 bg-white/5 border border-white/10 rounded px-5 text-white text-sm font-bold outline-none focus:border-[#00AEEF] transition-colors cursor-pointer"
            >
              <option value="" className="bg-gray-900">Any</option>
              <option value="EV1" className="bg-gray-900">EV1 (Jetronic)</option>
              <option value="EV6" className="bg-gray-900">EV6 (USCAR/EV14)</option>
              <option value="Denso" className="bg-gray-900">Denso (Toyota/Honda)</option>
              <option value="Keihin" className="bg-gray-900">Keihin (Honda OEM)</option>
            </select>
          </div>
        </div>

        <div className="mt-8">
          <button onClick={onNext} className="bg-[#E10600] text-white font-black italic uppercase tracking-[0.2em] rounded-sm transition-all duration-200 shadow-[0_4px_16px_rgba(225,6,0,0.25)] hover:bg-[#c70500] hover:-translate-y-[1px] hover:shadow-[0_6px_24px_rgba(225,6,0,0.35)] w-full py-4 text-sm">
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}
