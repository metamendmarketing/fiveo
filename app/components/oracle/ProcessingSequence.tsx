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
 * ProcessingSequence — Truthful Performance Mode
 * 
 * Configured to resolve immediately once API data is available.
 * Use this to measure real-world stopwatch performance.
 */
export function ProcessingSequence({ profile, onComplete }: Props) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState<string>(PROCESSING_MESSAGES[0].text);
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    const startTime = performance.now();
    let isMounted = true;
    
    // Slow initial creep to show "life"
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 98) return prev;
        return prev + 1;
      });
    }, 100);

    async function runOracle() {
      try {
        const res = await fetch("/fiveo/demo/api/oracle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile }),
        });
        
        if (!res.ok) throw new Error("Oracle failed to respond");
        const data = await res.json();
        
        if (!isMounted) return;
        
        const trueTime = Math.round(performance.now() - startTime);
        console.log(`[Oracle Performance] ⏱️ True processing time: ${trueTime}ms`);
        
        // JUMP TO COMPLETION
        clearInterval(timer);
        setProgress(100);
        setStatusText("Analysis Complete!");
        
        // Immediate transition to results
        setTimeout(() => {
          if (isMounted) onComplete(data);
        }, 500); 
        
      } catch (err) {
        console.error("Oracle Execution Error:", err);
        if (isMounted) setProgress(0);
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
      {/* Background Watermark Logo */}
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
