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
 * Features:
 * - 0 to 300 MPH progress mapping
 * - "Afterburner" phase at 99% with flame effects
 * - Digital readout and screen shake
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
      // Sweep from 0 to 100
      for (let i = 0; i <= 100; i++) {
        if (hasCompletedRef.current) return;

        setProgress(i);

        // Map progress thresholds to status messages
        const msg = [...PROCESSING_MESSAGES]
          .reverse()
          .find((m) => i >= m.threshold);
        if (msg) setStatusText(msg.text);

        // Pacing Logic
        let delay = 50;
        
        if (i < 20) {
          // Phase 1: Initial Spin-up (Fast)
          delay = 25;
        } else if (i >= 20 && i < 80) {
          // Phase 2: Deep Analysis (Slow & Methodical)
          // Adjust based on API readiness to keep it feeling alive
          delay = apiReady ? 90 : 150 + Math.random() * 150;
        } else if (i >= 80) {
          // Phase 3: Final Sprint (Fast)
          delay = 15;
        }

        await new Promise((r) => setTimeout(r, delay));
        
        // Safety check at 95% - if API is somehow still not ready, wait here
        if (i === 95 && !apiReady) {
          setStatusText("Finalizing high-flow synthesis...");
          while (!apiReady) {
            await new Promise((r) => setTimeout(r, 200));
          }
        }
      }

      // 4. Hit Top Speed (100%) - Instant Load
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true;
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
      <div className="mt-8 px-6 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full">
        <p className="text-[11px] text-white/70 font-black uppercase tracking-[0.25em] min-h-[1.5em] text-center">
          {statusText}
        </p>
      </div>
    </div>
  );
}
