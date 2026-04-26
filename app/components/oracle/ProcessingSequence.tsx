import { useEffect, useRef, useState } from "react";
import type { BuildProfile } from "@/app/lib/constants";
import { PROCESSING_MESSAGES } from "@/app/lib/constants";
import { OracleApiResponse } from "@/app/lib/types";
import { SpeedometerProgress } from "./SpeedometerProgress";

interface Props {
  profile: BuildProfile;
  onComplete: (data: OracleApiResponse) => void;
}

/**
 * ProcessingSequence — Analysis Synthesis Animation
 * 
 * Re-imagined as a high-performance "dyno run" speedometer.
 * 
 * Timing Logic:
 * - 0-30%: Initial spin-up (Fast)
 * - 30-75%: Deep computation (Slow/Gritty)
 * - 75-100%: Redline sprint (Fast/Intense)
 * - Total duration target: ~5-7 seconds
 */
export function ProcessingSequence({ profile, onComplete }: Props) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState<string>(PROCESSING_MESSAGES[0].text);
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    let apiData: OracleApiResponse | null = null;
    let apiReady = false;

    // 1. Initiate background analysis
    (async () => {
      try {
        const res = await fetch("/fiveo/demo/api/oracle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile }),
        });
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        apiData = await res.json();
        apiReady = true;
      } catch (err) {
        console.error("[ProcessingSequence] Analysis failed:", err);
        apiData = { 
          results: [], 
          selectionStrategy: "", 
          vehicleLabel: "your vehicle", 
          calculatedCC: 0, 
          fitmentMatches: 0, 
          makeFitmentMatches: 0, 
          candidatePoolSize: 0,
          error: "API call failed" 
        };
        apiReady = true;
      }
    })();

    // 2. Execute progress simulation with variable pacing
    const runProgress = async () => {
      for (let i = 0; i <= 100; i++) {
        if (hasCompletedRef.current) return;

        setProgress(i);

        // Map progress thresholds to status messages
        const msg = [...PROCESSING_MESSAGES]
          .reverse()
          .find((m) => i >= m.threshold);
        if (msg) setStatusText(msg.text);

        // Variable Pacing Logic
        let delay = 40; // Default fast

        if (i < 30) {
          // Phase 1: Spin-up
          delay = 30;
        } else if (i >= 30 && i < 75) {
          // Phase 2: The "Grind" (Slow down)
          // Slow down even more if API isn't ready
          delay = apiReady ? 80 : 150 + Math.random() * 100;
        } else if (i >= 75 && i < 95) {
          // Phase 3: Redline Sprint (Speed up)
          delay = 25;
        } else if (i >= 95) {
          // Phase 4: Final Velocity
          delay = 15;
        }

        await new Promise((r) => setTimeout(r, delay));

        // Safety check at 95% - wait for API if not ready
        if (i === 95 && !apiReady) {
          setStatusText("Securing maximum flow data...");
          while (!apiReady) {
            await new Promise((r) => setTimeout(r, 200));
          }
        }
      }

      // 3. Final Velocity Hit - Finish immediately
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true;
        // Small pause at 100% just for visual impact, then transition
        await new Promise((r) => setTimeout(r, 600));
        
        onComplete(apiData || { 
          results: [], 
          selectionStrategy: "", 
          vehicleLabel: "your vehicle", 
          calculatedCC: 0, 
          fitmentMatches: 0, 
          makeFitmentMatches: 0, 
          candidatePoolSize: 0 
        });
      }
    };

    runProgress();

    return () => {
      hasCompletedRef.current = true;
    };
  }, [profile, onComplete]); 

  return (
    <div className="w-full h-full flex flex-col items-center justify-center py-6">
      {/* Cinematic Gauge Area */}
      <SpeedometerProgress progress={progress} />

      {/* Dynamic Status Label */}
      <div className="mt-8 px-6 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full min-w-[280px]">
        <p className="text-[11px] text-white/70 font-black uppercase tracking-[0.25em] min-h-[1.5em] text-center">
          {statusText}
        </p>
      </div>
    </div>
  );
}
