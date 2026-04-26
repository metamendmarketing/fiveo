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
 * High-performance "dyno run" speedometer with "Exploding Finish".
 * 
 * Timing Logic:
 * - 0-20%: Spin-up (Fast)
 * - 20-80%: Computation (Slow & jittery)
 * - 80-100%: Redline Sprint (Extremely Fast/Chaotic)
 * - NO STALLS: Dials down to a crawl if API is slow, but keeps moving.
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
          results: [], selectionStrategy: "", vehicleLabel: "your vehicle", 
          calculatedCC: 0, fitmentMatches: 0, makeFitmentMatches: 0, 
          candidatePoolSize: 0, error: "API call failed" 
        };
        apiReady = true;
      }
    })();

    // 2. Execute progress simulation
    const runProgress = async () => {
      for (let i = 0; i <= 100; i++) {
        if (hasCompletedRef.current) return;

        setProgress(i);

        // Map progress thresholds to status messages
        const msg = [...PROCESSING_MESSAGES].reverse().find((m) => i >= m.threshold);
        if (msg) setStatusText(msg.text);

        let delay = 30;

        if (i < 20) {
          delay = 25;
        } else if (i >= 20 && i < 85) {
          // Phase 2: The Crunch
          // If API isn't ready as we approach the sprint, crawl but don't stop
          if (i > 70 && !apiReady) {
            delay = 600 + Math.random() * 400; // Snail's pace
          } else {
            delay = apiReady ? 60 : 120 + Math.random() * 100;
          }
        } else {
          // Phase 3: Redline Sprint (85-100)
          // Only sprint if API is ready. If not, wait at 85.
          if (!apiReady) {
            i = 84; // Hold at 84
            delay = 500;
          } else {
            delay = 10; // BLISTERING FAST
          }
        }

        await new Promise((r) => setTimeout(r, delay));
      }

      // 3. Explosion Hit (100%) - Instant Load
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
