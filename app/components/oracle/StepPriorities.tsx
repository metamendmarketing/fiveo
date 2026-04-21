/**
 * StepPriorities — Q6: Priority ranking (tap to rank 1-2-3)
 * Centered layout on light background
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
    <div className="oracle-bg-vehicle min-h-[65vh] flex items-center justify-center px-6 py-12">
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
                className={`w-full oracle-priority-chip justify-between text-sm ${isActive ? "oracle-priority-chip-active" : ""}`}
              >
                <span>{p}</span>
                {isActive && (
                  <span className="oracle-priority-chip-rank">{rank}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Education Beat */}
        <div className="oracle-education-beat mt-8">
          <strong>How this helps:</strong> Your priorities directly influence how we weight our
          scoring engine. "Horsepower" prioritizes flow capacity, "Reliability" favors OEM-grade
          construction, and "Plug-and-Play" ensures connector compatibility.
        </div>

        <div className="mt-8">
          <button
            onClick={onNext}
            disabled={!canAdvance}
            className="oracle-cta-primary w-full text-sm disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}
