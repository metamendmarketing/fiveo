import { useEffect, useRef, useState } from "react";
import type { BuildProfile } from "@/app/lib/constants";
import { PROCESSING_MESSAGES } from "@/app/lib/constants";
import { OracleApiResponse } from "@/app/lib/types";

interface Props {
  profile: BuildProfile;
  onComplete: (data: OracleApiResponse) => void;
}

/**
 * ProcessingSequence — Analysis Synthesis Animation
 * 
 * This component performs the background API call to the Oracle engine
 * while displaying a paced "scanning" animation to manage user expectations.
 * The progress bar accelerates once the actual data is received.
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

    // 2. Execute progress simulation
    const runProgress = async () => {
      for (let i = 0; i <= 99; i++) {
        if (hasCompletedRef.current) return;

        setProgress(i);

        // Map progress thresholds to status messages
        const msg = [...PROCESSING_MESSAGES]
          .reverse()
          .find((m) => i >= m.threshold);
        if (msg) setStatusText(msg.text);

        // Intelligent pacing: slow until API is ready, then sprint to finish
        let delay = 60;
        if (i >= 15 && i < 85) {
          delay = apiReady ? 20 : 150 + Math.random() * 300;
        } else if (i >= 85) {
          delay = apiReady ? 15 : Math.max(80, 300 - (i - 85) * 15);
        }

        await new Promise((r) => setTimeout(r, delay));
      }

      // Safeguard: Ensure API data has arrived before transitioning
      if (!apiReady) {
        setStatusText("Securing final match data...");
        while (!apiReady) {
          await new Promise((r) => setTimeout(r, 200));
        }
      }

      // Transition to results
      setProgress(100);
      setStatusText("Analysis Complete!");
      await new Promise((r) => setTimeout(r, 800));

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
    <div className="w-full h-full flex flex-col items-center justify-center py-12">
      {/* Visual Radar Rings */}
      <div className="relative flex items-center justify-center mb-12">
        <div className="oracle-radar-ring-outer absolute" />
        <div className="oracle-radar-ring flex items-center justify-center">
          <svg
            className="w-10 h-10 text-[#00AEEF]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
      </div>

      {/* Progress Readout */}
      <div className="text-[32px] font-black italic text-[#00AEEF] font-[var(--font-open-sans-condensed)] mb-6">
        {progress}
        <span className="text-lg text-white/40 ml-1">%</span>
      </div>

      {/* Progress Bar Container */}
      <div className="w-full max-w-[320px] h-[3px] bg-white/10 rounded-[2px] overflow-hidden mb-6">
        <div
          className="w-full max-w-[320px] h-[3px] bg-white/10 rounded-[2px] overflow-hidden-fill"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Dynamic Status Label */}
      <p className="text-sm text-white/60 font-medium tracking-wide min-h-[1.5em] text-center">
        {statusText}
      </p>
    </div>
  );
}
