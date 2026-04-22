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
    setTimeout(() => setSection("mods"), 200);
  };

  return (
    <div className="oracle-bg-performance min-h-[65vh] flex items-center justify-center px-8 lg:px-28 py-12">
      <div className="w-full max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black uppercase italic text-white mb-2">
            The <span className="text-[#00AEEF]">Numbers</span>
          </h2>
          <p className="text-xs text-white/50 uppercase tracking-[0.2em] font-bold">
            {section === "hp" && "Power target"}
            {section === "fuel" && "Fuel type"}
            {section === "mods" && "Installed modifications"}
          </p>
          {/* Sub-section breadcrumb */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {(["hp", "fuel", "mods"] as const).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <button
                  onClick={() => setSection(s)}
                  className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${
                    section === s ? "text-[#00AEEF]" : "text-white/25 hover:text-white/40"
                  }`}
                >
                  {s === "hp" ? "Power" : s === "fuel" ? "Fuel" : "Mods"}
                </button>
                {i < 2 && <span className="text-white/15 text-xs">›</span>}
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
                  className={`oracle-mod-check justify-center text-center py-5 ${
                    profile.hpMode === p.value ? "oracle-mod-check-active" : ""
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
                  className="flex-1 h-14 bg-white/5 border border-white/10 rounded px-5 text-white text-lg font-bold outline-none focus:border-[#00AEEF]"
                />
                <button onClick={handleCustomHP} className="oracle-cta-primary px-6">
                  Set
                </button>
              </div>
            )}
          </div>
        )}

        {/* Section: Fuel Type */}
        {section === "fuel" && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {FUEL_OPTIONS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => handleFuelSelect(f.value)}
                  className={`oracle-card h-44 ${
                    profile.fuelType === f.value ? "oracle-card-selected" : ""
                  }`}
                  style={{ backgroundImage: `url(${f.image})` }}
                >
                  <div className="oracle-card-content absolute bottom-0 left-0 right-0 p-5 text-center">
                    <h3 className="text-white font-black uppercase text-sm mb-0.5">{f.label}</h3>
                    <p className="text-white/40 text-[10px]">{f.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => { onUpdate({ fuelType: "unsure" }); setSection("mods"); }}
              className="oracle-cta-secondary w-full mt-4 text-xs"
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
                  className={`oracle-mod-check justify-center text-center py-5 ${
                    profile.mods.includes(m.value) ? "oracle-mod-check-active" : ""
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Education Beat */}
            <div className="mt-8 p-4 rounded border border-[#00AEEF]/20 bg-[#00AEEF]/5">
              <p className="text-xs text-white/50 leading-relaxed">
                <strong className="text-[#00AEEF]">Turbo/Supercharger?</strong> Forced induction
                significantly increases fuel demand. Selecting this triggers our high-flow matching
                algorithm to ensure you don&apos;t run lean under boost.
              </p>
            </div>

            <div className="mt-6">
              <button onClick={onNext} className="oracle-cta-primary w-full text-sm">
                Continue →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
