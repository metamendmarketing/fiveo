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
 * - 0-20%: Spin-up (Fast - 2s)
 * - 20-70%: Deep Data Crunch (Slow & Variable - 25s)
 * - 70-90%: Building Overheat (Gradual Acceleration - 10s)
 * - 90-100%: Redline Final Velocity (Deliberate & Intense - 6.28s)
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
          // Phase 1: 0-20% (Fast - 2s)
          delay = 100;
        } else if (current >= 20 && current < 70) {
          // Phase 2: 20-70% (Crunch - ~10s)
          delay = 200;
        } else if (current >= 70 && current < 90) {
          // Phase 3: 70-90% (Building Overheat - ~4s)
          delay = 200;
        } else {
          // Phase 4: 90-100% (Redline Velocity - ~2.5s)
          delay = 250;
        }

        await new Promise((r) => setTimeout(r, delay));
        
        // REAL SPEED TEST: Jump to 100 immediately if data is ready
        if (apiReady) {
          current = 100;
          setProgress(100);
          break;
        }

        current += 1;

        // Safety check - wait at 98 if API isn't ready
        if (current === 98 && !apiReady) {
          while(!apiReady) {
            await new Promise(r => setTimeout(r, 200));
          }
        }
      }

      // Final state
      setProgress(100);
      setStatusText("Maximum Velocity Reached!");
      await new Promise(r => setTimeout(r, 1000));

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
    <div className="w-full h-full flex flex-col items-center justify-center py-6 relative overflow-hidden">
      {/* Background Watermark Logo - 2X Size */}
      <div className="absolute top-6 left-6 opacity-15 pointer-events-none">
        <img 
          src="https://www.fiveomotorsport.com/media/logo/stores/1/fiveo-logo-dec-2022-01_2.png" 
          alt="" 
          className="w-64 md:w-96 grayscale brightness-150"
        />
      </div>

      <SpeedometerProgress progress={progress} />

      <div className="mt-8 px-6 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full min-w-[280px] relative z-10">
        <p className="text-[11px] text-white/70 font-black uppercase tracking-[0.25em] min-h-[1.5em] text-center">
          {statusText}
        </p>
      </div>
    </div>
  );
}
