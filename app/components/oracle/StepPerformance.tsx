/**
 * StepPerformance — Power & Fuel Specification
 * 
 * Users specify Target HP, Fuel Type (E85/Pump), and Key Modifications.
 * Drives the "requiredCC" calculation and triggers specific heuristic boosts
 * for forced induction or high-ethanol content.
 */
"use client";

import { useState } from "react";
import type { BuildProfile } from "@/app/lib/constants";
import { IMAGES, MOD_OPTIONS } from "@/app/lib/constants";

const HP_PRESETS = [
  { value: "stock", label: "Stock Power", hp: 0 },
  { value: "+50", label: "+50 HP", hp: 50 },
  { value: "+100", label: "+100 HP", hp: 100 },
  { value: "+150", label: "150+ HP", hp: 150 },
  { value: "custom", label: "Custom", hp: null },
  { value: "unsure", label: "Not Sure", hp: null },
];

const FUEL_OPTIONS = [
  { value: "pump" as const, label: "Pump Gas", desc: "91/93 Octane", image: IMAGES.pumpGas },
  { value: "e85" as const, label: "E85 / Flex Fuel", desc: "Ethanol blend", image: IMAGES.fuelE85 },
  { value: "race" as const, label: "Race Fuel", desc: "100+ Octane", image: IMAGES.raceFuel },
];

interface Props {
  profile: BuildProfile;
  onUpdate: (partial: Partial<BuildProfile>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepPerformance({ profile, onUpdate, onNext }: Props) {
  const [customHP, setCustomHP] = useState("");
  const [section, setSection] = useState<"hp" | "fuel" | "mods">("hp");

  const handleHPSelect = (preset: (typeof HP_PRESETS)[0]) => {
    if (preset.value === "custom") {
      onUpdate({ hpMode: "custom" });
    } else {
      onUpdate({ hpMode: preset.value as "stock" | "+50" | "+100" | "+150" | "custom" | "unsure", targetHP: preset.hp });
      setTimeout(() => setSection("fuel"), 200);
    }
  };

  const handleCustomHP = () => {
    const hp = parseInt(customHP);
    if (hp > 0) {
      onUpdate({ targetHP: hp, hpMode: "custom" });
      setSection("fuel");
    }
  };

  const handleFuelSelect = (fuel: "pump" | "e85" | "race") => {
    onUpdate({ fuelType: fuel });
    // If engine is stock, we don't need to ask for modifications
    if (profile.engineStatus === "stock") {
      setTimeout(() => onNext(), 200);
    } else {
      setTimeout(() => setSection("mods"), 200);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-black uppercase italic text-white mb-2 drop-shadow-md">
            The <span className="text-[#00AEEF]">Numbers</span>
          </h2>
          <p className="text-[10px] text-white/50 uppercase tracking-[0.2em] font-bold drop-shadow-sm">
            {section === "hp" && "Power target"}
            {section === "fuel" && "Fuel type"}
            {section === "mods" && "Installed modifications"}
          </p>
          {/* Sub-section breadcrumb */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {(["hp", "fuel", "mods"] as const)
              .filter(s => s !== "mods" || profile.engineStatus !== "stock")
              .map((s, i, arr) => (
              <div key={s} className="flex items-center gap-2">
                <button
                  onClick={() => setSection(s)}
                  className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${
                    section === s ? "text-[#00AEEF]" : "text-white/30 hover:text-white/60"
                  }`}
                >
                  {s === "hp" ? "Power" : s === "fuel" ? "Fuel" : "Mods"}
                </button>
                {i < arr.length - 1 && <span className="text-white/20 text-xs">›</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Section: HP */}
        {section === "hp" && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              {HP_PRESETS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => handleHPSelect(p)}
                  className={`flex items-center justify-center text-center gap-3 px-4 py-5 rounded-xl text-[13px] font-semibold uppercase tracking-[0.05em] cursor-pointer transition-all duration-200 border ${
                    profile.hpMode === p.value 
                      ? "border-[#00AEEF] shadow-[0_0_20px_rgba(0,174,239,0.3)] text-white" 
                      : "border-white/10 bg-white/5 backdrop-blur-sm text-white/60 hover:border-white/30 hover:bg-white/10"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {profile.hpMode === "custom" && (
              <div className="flex gap-3 mt-4">
                <input
                  type="number"
                  value={customHP}
                  onChange={(e) => setCustomHP(e.target.value)}
                  placeholder="Enter HP target..."
                  className="flex-1 h-14 bg-white/5 border border-white/20 rounded-xl px-5 text-white text-lg font-bold outline-none focus:border-[#00AEEF] placeholder-white/20 backdrop-blur-sm"
                />
                <button onClick={handleCustomHP} className="bg-[#E10600] text-white font-black italic uppercase tracking-[0.2em] rounded-md transition-all duration-200 shadow-[0_4px_16px_rgba(225,6,0,0.25)] hover:bg-[#c70500] hover:-translate-y-[1px] hover:shadow-[0_6px_24px_rgba(225,6,0,0.35)] px-8">
                  Set
                </button>
              </div>
            )}
          </div>
        )}

        {/* Section: Fuel Type */}
        {section === "fuel" && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {FUEL_OPTIONS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => handleFuelSelect(f.value)}
                  className={`relative overflow-hidden rounded-2xl border text-left group transition-all duration-300 hover:-translate-y-1 h-44 ${
                    profile.fuelType === f.value 
                      ? "border-[#00AEEF] shadow-[0_0_20px_rgba(0,174,239,0.3)] text-white" 
                      : "border-white/20 shadow-lg hover:border-white/50 text-white/50"
                  }`}
                  style={{ backgroundImage: `url(${f.image})`, backgroundSize: "cover", backgroundPosition: "center" }}
                >
                  <div className={`absolute inset-0 transition-opacity duration-300 ${profile.fuelType === f.value ? 'bg-gradient-to-t from-black/90 via-black/40 to-[#00AEEF]/20' : 'bg-gradient-to-t from-black/90 via-black/40 to-transparent group-hover:from-black/95'}`} />
                  <div className="absolute bottom-0 left-0 right-0 p-5 text-center relative z-10">
                    <h3 className={`font-black uppercase text-sm mb-0.5 ${profile.fuelType === f.value ? 'text-white' : 'text-white/90 group-hover:text-white'}`}>{f.label}</h3>
                    <p className={`text-[10px] tracking-wide ${profile.fuelType === f.value ? 'text-[#00AEEF]' : 'text-gray-300'}`}>{f.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => { onUpdate({ fuelType: "unsure" }); setSection("mods"); }}
              className="bg-transparent text-white/40 font-bold uppercase tracking-widest text-[10px] border border-white/20 rounded-xl px-5 py-3 hover:text-white hover:border-white/50 hover:bg-white/10 transition-colors w-full backdrop-blur-sm"
            >
              Not Sure Yet
            </button>
          </div>
        )}

        {/* Section: Mods */}
        {section === "mods" && (
          <div>
            <div className="grid grid-cols-2 gap-3">
              {MOD_OPTIONS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => {
                    const current = [...profile.mods];
                    if (m.value === "none") {
                      onUpdate({ mods: ["none"] });
                      return;
                    }
                    const filtered = current.filter((v) => v !== "none");
                    const idx = filtered.indexOf(m.value);
                    if (idx >= 0) filtered.splice(idx, 1);
                    else filtered.push(m.value);
                    onUpdate({ mods: filtered });
                  }}
                  className={`flex items-center justify-center text-center gap-3 px-4 py-5 rounded-xl text-[13px] font-semibold uppercase tracking-[0.05em] cursor-pointer transition-all duration-200 border ${
                    profile.mods.includes(m.value) 
                      ? "border-[#00AEEF] shadow-[0_0_20px_rgba(0,174,239,0.3)] text-white" 
                      : "border-white/10 bg-white/5 backdrop-blur-sm text-white/60 hover:border-white/30 hover:bg-white/10"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Education Beat */}
            <div className="mt-8 p-5 rounded-2xl border border-[#00AEEF]/20 bg-[#00AEEF]/10 backdrop-blur-md">
              <p className="text-sm text-white/80 leading-relaxed font-medium">
                <strong className="text-[#00AEEF] block mb-1 uppercase tracking-widest text-[10px]">Technical Note</strong> 
                Forced induction (Turbo/Supercharger) significantly increases fuel demand. Selecting this triggers our high-flow matching algorithm to ensure you don&apos;t run lean under boost.
              </p>
            </div>

            <div className="mt-8">
              <button onClick={onNext} className="bg-[#E10600] text-white font-black italic uppercase tracking-[0.2em] rounded-sm transition-all duration-200 shadow-[0_4px_16px_rgba(225,6,0,0.25)] hover:bg-[#c70500] hover:-translate-y-[1px] hover:shadow-[0_6px_24px_rgba(225,6,0,0.35)] w-full py-4 text-sm">
                Continue Analysis →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
