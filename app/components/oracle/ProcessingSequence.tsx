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

    // 1. Kick off analysis immediately (Tier: top3)
    (async () => {
      try {
        const res = await fetch("/fiveo/demo/api/oracle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile, tier: "top3" }),
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
          delay = 100; // 2s
        } else if (current >= 20 && current < 70) {
          delay = 150 + Math.random() * 100; // ~10s
        } else if (current >= 70 && current < 90) {
          delay = 200; // 4s
        } else {
          delay = 300; // 3s
        }

        await new Promise((r) => setTimeout(r, delay));
        current += 1;

        // Sync check at the end
        if (current >= 98 && !apiReady) {
          current = 98;
          while(!apiReady) {
            await new Promise(r => setTimeout(r, 500));
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
