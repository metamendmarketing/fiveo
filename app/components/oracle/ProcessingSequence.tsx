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
 * Precisely timed for a 43.28-second "Expert Analysis" experience.
 * 
 * Progression Profile:
 * - 0-20%: Initial spin-up (Fast - 2s)
 * - 20-60%: Deep Data Crunch (Slow & Variable - 30s)
 * - 60-90%: Building Momentum (Gradual Acceleration - 10s)
 * - 90-100%: Sudden Redline Burst (Blistering Finish - 1.28s)
 */
export function ProcessingSequence({ profile, onComplete }: Props) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState<string>(PROCESSING_MESSAGES[0].text);
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    let apiData: OracleApiResponse | null = null;
    let apiReady = false;

    // 1. Kick off analysis immediately
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
          results: [], selectionStrategy: "", vehicleLabel: "your vehicle", 
          calculatedCC: 0, fitmentMatches: 0, makeFitmentMatches: 0, candidatePoolSize: 0 
        };
        apiReady = true;
      }
    })();

    // 2. Execute precision-timed progress simulation
    const runProgress = async () => {
      let current = 0;
      
      while (current < 100) {
        if (hasCompletedRef.current) return;

        setProgress(current);

        const msg = [...PROCESSING_MESSAGES].reverse().find((m) => current >= m.threshold);
        if (msg) setStatusText(msg.text);

        let delay = 100;

        if (current < 20) {
          // Phase 1: 0-20% (Fast - approx 2s total)
          delay = 100;
        } else if (current >= 20 && current < 60) {
          // Phase 2: 20-60% (Deep Crunch - approx 30s total)
          // 40 steps at ~750ms avg
          delay = 400 + Math.random() * 700;
        } else if (current >= 60 && current < 90) {
          // Phase 3: 60-90% (Building - approx 10s total)
          // 30 steps accelerating from 500ms down to 150ms
          const factor = (current - 60) / 30;
          delay = 500 - (factor * 350);
        } else {
          // Phase 4: 90-100% (Burst - approx 1.28s total)
          // 10 steps at ~128ms
          const factor = (current - 90) / 10;
          delay = 150 - (factor * 100);
        }

        await new Promise((r) => setTimeout(r, delay));
        current += 1;

        // If we hit 99% and API isn't back, crawl slowly until it is.
        // With 43 seconds, it's virtually guaranteed to be ready.
        if (current === 99 && !apiReady) {
          while(!apiReady) {
            await new Promise(r => setTimeout(r, 200));
          }
        }
      }

      // Final state
      setProgress(100);
      setStatusText("Maximum Velocity Reached!");
      await new Promise(r => setTimeout(r, 200));

      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true;
        onComplete(apiData || { 
          results: [], selectionStrategy: "", vehicleLabel: "your vehicle", 
          calculatedCC: 0, fitmentMatches: 0, makeFitmentMatches: 0, candidatePoolSize: 0 
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
      <SpeedometerProgress progress={progress} />

      <div className="mt-8 px-6 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full min-w-[280px]">
        <p className="text-[11px] text-white/70 font-black uppercase tracking-[0.25em] min-h-[1.5em] text-center">
          {statusText}
        </p>
      </div>
    </div>
  );
}
