/**
 * BuildProfilePanel — Real-time Synthesis Sidebar
 * 
 * Displays a summary of the user's current selections from the BuildProfile.
 * Acts as a persistent "memory" for the user as they progress through the wizard.
 */
"use client";

import type { BuildProfile } from "@/app/lib/constants";

export function BuildProfilePanel({ profile }: { profile: BuildProfile }) {
  const items: { label: string; value: string | null }[] = [
    {
      label: "Vehicle",
      value: profile.year && profile.make && profile.model
        ? `${profile.year} ${profile.make} ${profile.model}`
        : null,
    },
    { label: "Engine", value: profile.engineLabel || profile.engineCode },
    {
      label: "Build Level",
      value: profile.engineStatus
        ? { stock: "Stock", "light-mods": "Light Mods", "heavily-modified": "Heavily Modified" }[profile.engineStatus]
        : null,
    },
    {
      label: "Target CC",
      value: profile.desiredSizeCC ? `${profile.desiredSizeCC} CC` : null,
    },
    {
      label: "Base PSI",
      value: profile.fuelPressurePSI ? `${profile.fuelPressurePSI} PSI` : null,
    },
    {
      label: "Headroom",
      value: profile.headroomPref
        ? { conservative: "Conservative", balanced: "Balanced", aggressive: "Aggressive" }[profile.headroomPref]
        : null,
    },
    {
      label: "Goal",
      value: profile.goal
        ? { replace: "Replace Worn", improve: "Improve Performance", "max-power": "Max Power", "fix-issues": "Fix Issues" }[profile.goal]
        : null,
    },
    {
      label: "Usage",
      value: profile.usage
        ? { daily: "Daily Driver", street: "Street Performance", track: "Track / Racing", mixed: "Mixed Use" }[profile.usage]
        : null,
    },
    {
      label: "Target HP",
      value: profile.targetHP ? `+${profile.targetHP} HP` : (profile.hpMode !== "unsure" ? profile.hpMode : null),
    },
    {
      label: "Fuel",
      value: profile.fuelType
        ? { pump: "Pump Gas", e85: "E85 / Flex", race: "Race Fuel", unsure: "Not Sure" }[profile.fuelType]
        : null,
    },
    {
      label: "Mods",
      value: profile.mods.length > 0 ? profile.mods.join(", ") : null,
    },
    {
      label: "Priorities",
      value: profile.priorities.length > 0 ? profile.priorities.join(" > ") : null,
    },
    {
      label: "Budget",
      value: profile.budget
        ? { budget: "Budget", mid: "Mid-Range", premium: "Premium" }[profile.budget]
        : null,
    },
    {
      label: "Connector",
      value: profile.connectorType,
    },
  ];

  const activeItems = items.filter((i) => i.value);

  if (activeItems.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl p-6">
        <div className="text-[10px] font-black uppercase tracking-widest text-[#00AEEF] mb-3 drop-shadow-sm">Your Build</div>
        <p className="text-xs text-white/40">Answer questions to build your profile...</p>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl p-6 sticky top-24">
      <div className="text-[10px] font-black uppercase tracking-widest text-[#00AEEF] mb-6 drop-shadow-sm">Your Build</div>
      <div className="space-y-5">
        {activeItems.map((item) => (
          <div key={item.label} className="border-l-2 border-[#00AEEF]/30 pl-3">
            <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/40 mb-1">
              {item.label}
            </div>
            <div className="text-[13px] font-semibold text-white/90 leading-snug">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
