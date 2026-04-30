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
 * ProcessingSequence — Diagnostic Truthful Mode
 */
export function ProcessingSequence({ profile, onComplete }: Props) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState<string>("Initializing Connection...");
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    const startTime = performance.now();
    let isMounted = true;
    
    // Slow initial creep
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 98) return prev;
        return prev + 1;
      });
    }, 200);

    async function runOracle() {
      try {
        setStatusText("Requesting Engineering Matrix...");
        
        // Add a 60s timeout to the fetch
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        const res = await fetch("/fiveo/demo/api/oracle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || `Server Error (${res.status})`);
        }

        setStatusText("Synthesizing Engineering Narratives...");
        const data = await res.json();
        
        if (!isMounted) return;
        
        if (data.timing) {
          console.log(`[Oracle Timing Breakdown]
  Total: ${data.timing.total}ms
  Acquisition: ${data.timing.acquisition}ms
  Scoring: ${data.timing.scoring}ms
  Enrichment: ${data.timing.enrichment}ms
  AI: ${data.timing.ai}ms`);
        }
        
        clearInterval(timer);
        setProgress(100);
        setStatusText("Analysis Complete!");
        
        setTimeout(() => {
          if (isMounted) onComplete(data);
        }, 500); 
        
      } catch (err: any) {
        console.error("Oracle Execution Error:", err);
        clearInterval(timer);
        if (isMounted) {
          setStatusText(`Error: ${err.message || "Connection Interrupted"}`);
          setProgress(0);
        }
      }
    }

    runOracle();

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [profile, onComplete]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center py-6 relative overflow-hidden">
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
