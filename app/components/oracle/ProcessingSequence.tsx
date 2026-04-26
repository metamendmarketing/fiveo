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

    // 2. Execute progress simulation with Sub-Decimal Smoothness
    const runProgress = async () => {
      let current = 0;
      
      while (current <= 100) {
        if (hasCompletedRef.current) return;

        setProgress(current);

        // Map status messages
        const msg = [...PROCESSING_MESSAGES].reverse().find((m) => current >= m.threshold);
        if (msg) setStatusText(msg.text);

        // Dynamic Pacing logic
        let delay = 40;
        let increment = 1;

        if (current < 25) {
          // Phase 1: Fast Start
          delay = 25;
          increment = 0.8;
        } else if (current >= 25 && current < 83) {
          // Phase 2: The Deep Crunch
          delay = apiReady ? 60 : 100 + Math.random() * 80;
          increment = apiReady ? 0.6 : 0.3;
        } else {
          // Phase 3: The Sprint (83-100)
          // If API isn't ready, crawl at 0.1 increments to keep it moving
          if (!apiReady) {
            delay = 200;
            increment = 0.1;
          } else {
            // Blistering but smooth sprint
            delay = 20;
            increment = 1.2;
          }
        }

        await new Promise((r) => setTimeout(r, delay));
        current += increment;

        // Cap at 100
        if (current > 100) current = 101; 
      }

      // 3. Instant Completion
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
