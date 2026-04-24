/**
 * StepPriorities — Driver Preference Weighting
 * 
 * Users select multiple priorities (Idle Quality, Value, Peak Power, Brand).
 * Directly impacts the "priorityBoost" in the heuristic engine.
 */
"use client";

import type { BuildProfile } from "@/app/lib/constants";
import { PRIORITY_OPTIONS } from "@/app/lib/constants";

interface Props {
  profile: BuildProfile;
  onUpdate: (partial: Partial<BuildProfile>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepPriorities({ profile, onUpdate, onNext }: Props) {
  const handleToggle = (priority: string) => {
    const current = [...profile.priorities];
    const idx = current.indexOf(priority);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else if (current.length < 3) {
      current.push(priority);
    }
    onUpdate({ priorities: current });
  };

  const canAdvance = profile.priorities.length >= 2;

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.12)] min-h-[65vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-full max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black uppercase italic text-black mb-2">
            What Matters <span className="text-[#00AEEF]">Most</span>
          </h2>
          <p className="text-xs text-gray-500 uppercase tracking-[0.2em] font-bold mb-2">
            Select 2-3 priorities in order of importance
          </p>
          <p className="text-xs text-gray-400">
            Tap to rank — first selection = highest priority
          </p>
        </div>

        <div className="space-y-3">
          {PRIORITY_OPTIONS.map((p) => {
            const rank = profile.priorities.indexOf(p) + 1;
            const isActive = rank > 0;
            return (
              <button
                key={p}
                onClick={() => handleToggle(p)}
                className={`w-full flex items-center justify-between px-5 py-4 rounded-xl text-[13px] font-bold uppercase tracking-[0.05em] transition-all duration-200 border ${
                  isActive 
                    ? "border-[#00AEEF] bg-[#00AEEF]/5 text-black shadow-sm" 
                    : "border-gray-200 bg-white text-gray-500 hover:border-[#00AEEF]/50 hover:bg-gray-50"
                }`}
              >
                <span>{p}</span>
                {isActive && (
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#00AEEF] text-white text-[11px] font-black">
                    {rank}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Education Beat */}
        <div className="mt-8 p-5 rounded-xl border border-blue-100 bg-blue-50/50">
          <p className="text-sm text-gray-600 leading-relaxed font-medium">
            <strong className="text-[#00AEEF] block mb-1 uppercase tracking-widest text-[10px]">How this helps</strong> 
            Your priorities directly influence how we weight our scoring engine. &quot;Peak Horsepower&quot; prioritizes flow capacity, &quot;Reliability&quot; favors OEM-grade construction, and &quot;Plug-and-Play&quot; ensures connector compatibility.
          </p>
        </div>

        <div className="mt-8">
          <button
            onClick={onNext}
            disabled={!canAdvance}
            className="bg-[#E10600] text-white font-black italic uppercase tracking-[0.2em] rounded-sm transition-all duration-200 shadow-[0_4px_16px_rgba(225,6,0,0.25)] hover:bg-[#c70500] hover:-translate-y-[1px] hover:shadow-[0_6px_24px_rgba(225,6,0,0.35)] w-full py-4 text-sm disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}
