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
  ];

  const activeItems = items.filter((i) => i.value);

  if (activeItems.length === 0) {
    return (
      <div className="bg-[#0f0f0f]/75 backdrop-blur-md border border-white/10 rounded-lg shadow-[0_4px_24px_rgba(0,0,0,0.15)] p-5">
        <div className="bg-[#0f0f0f]/75 backdrop-blur-md border border-white/10 rounded-lg shadow-[0_4px_24px_rgba(0,0,0,0.15)]-label mb-3">Your Build</div>
        <p className="text-xs text-white/40">Answer questions to build your profile...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#0f0f0f]/75 backdrop-blur-md border border-white/10 rounded-lg shadow-[0_4px_24px_rgba(0,0,0,0.15)] oracle-sidebar-panel sticky top-24">
      <div className="bg-[#0f0f0f]/75 backdrop-blur-md border border-white/10 rounded-lg shadow-[0_4px_24px_rgba(0,0,0,0.15)]-label mb-4">Your Build</div>
      <div className="space-y-3">
        {activeItems.map((item) => (
          <div key={item.label}>
            <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/30 mb-0.5">
              {item.label}
            </div>
            <div className="bg-[#0f0f0f]/75 backdrop-blur-md border border-white/10 rounded-lg shadow-[0_4px_24px_rgba(0,0,0,0.15)]-value">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
