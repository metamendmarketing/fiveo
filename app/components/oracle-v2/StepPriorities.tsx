/**
 * StepPriorities — Driver Preference Weighting
 * 
 * Users select multiple priorities (Idle Quality, Value, Peak Power, Brand).
 * Directly impacts the "priorityBoost" in the heuristic engine.
 */
"use client";

import { type BuildProfile, PRIORITY_OPTIONS } from "@/app/lib-v2/constants";
import { Wind, Banknote, Zap, ShieldCheck } from "lucide-react";

const PRIORITY_ICONS: Record<string, React.ReactNode> = {
  "Idle Quality": <Wind className="w-4 h-4" />,
  "Value / Cost": <Banknote className="w-4 h-4" />,
  "Peak Horsepower": <Zap className="w-4 h-4" />,
  "Brand Reputation": <ShieldCheck className="w-4 h-4" />,
};

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
    <div className="w-full h-full flex flex-col items-center justify-center gap-[10px]">
      {/* Header */}
      <div className="w-full max-w-2xl mx-auto text-left">
        <h2 className="text-3xl font-black uppercase italic text-white mb-2 drop-shadow-md">
          What Matters <span className="text-[#00AEEF]">Most</span>
        </h2>
        <p className="text-xs text-white/50 uppercase tracking-[0.2em] font-bold mb-1 drop-shadow-sm">
          Select 2-3 priorities in order of importance
        </p>
        <p className="text-xs text-white/40">
          Tap to rank — first selection = highest priority
        </p>
      </div>

      <div className="w-full max-w-2xl mx-auto">
        <div className="flex flex-col gap-[10px]">
          {PRIORITY_OPTIONS.map((p) => {
            const rank = profile.priorities.indexOf(p) + 1;
            const isActive = rank > 0;
            return (
              <button
                key={p}
                onClick={() => handleToggle(p)}
                className={`relative w-full flex items-center justify-between px-5 py-4 rounded-xl text-[13px] font-bold uppercase tracking-[0.05em] transition-all duration-200 border overflow-hidden group ${
                  isActive 
                    ? "border-[#00AEEF] shadow-[0_0_20px_rgba(0,174,239,0.2)] text-white" 
                    : "border-white/10 bg-white/5 backdrop-blur-sm text-white/60 hover:border-white/30 hover:bg-white/10"
                }`}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-[#00AEEF]/20 to-transparent" />
                )}
                <div className="relative z-10 flex items-center gap-3">
                  <div className={`transition-colors ${isActive ? "text-[#00AEEF]" : "text-white/30 group-hover:text-white/60"}`}>
                    {PRIORITY_ICONS[p]}
                  </div>
                  <span className={isActive ? "text-white" : "group-hover:text-white"}>{p}</span>
                </div>
                <span className="relative z-10 flex gap-2">
                  {isActive && (
                    <span className="bg-[#00AEEF] text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                      {rank}
                    </span>
                  )}
                  {/* Empty state visual affordance */}
                  {!isActive && profile.priorities.length < 3 && (
                    <span className="w-5 h-5 rounded-full border-2 border-white/20 group-hover:border-[#00AEEF]/50 transition-colors" />
                  )}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-8 pt-6 border-t border-white/10">
          <button
            onClick={onNext}
            disabled={!canAdvance}
            className="bg-[#E10600] text-white font-black italic uppercase tracking-[0.2em] rounded-sm transition-all duration-200 shadow-[0_4px_16px_rgba(225,6,0,0.25)] hover:bg-[#c70500] hover:-translate-y-[1px] hover:shadow-[0_6px_24px_rgba(225,6,0,0.35)] w-full py-4 text-sm disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Confirm Priorities →
          </button>
          
          {/* Helper text showing what remains */}
          {!canAdvance && (
            <p className="text-center text-[10px] text-white/40 mt-4 uppercase tracking-widest font-bold">
              Select {2 - profile.priorities.length} more to continue
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
