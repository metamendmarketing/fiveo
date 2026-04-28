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
 * ProcessingSequence — API-Driven Progress Animation
 * 
 * The speedometer now reflects REAL API response time:
 * - 0→80%: Smooth animation while waiting for the API
 * - 80%: Holds here until API data arrives
 * - 80→100%: Quick completion animation once data is ready
 * - Delivers results immediately after the visual finish
 */
export function ProcessingSequence({ profile, onComplete }: Props) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState<string>(PROCESSING_MESSAGES[0].text);
  const hasCompletedRef = useRef(false);
  const apiDataRef = useRef<OracleApiResponse | null>(null);
  const apiReadyRef = useRef(false);

  useEffect(() => {
    // 1. Kick off analysis immediately
    (async () => {
      try {
        const res = await fetch("/fiveo/demo/api/oracle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile }),
        });
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        apiDataRef.current = await res.json();
        apiReadyRef.current = true;
      } catch (err) {
        console.error("[ProcessingSequence] Analysis failed:", err);
        apiDataRef.current = { 
          results: [], selectionStrategy: "", vehicleLabel: "your vehicle", 
          calculatedCC: 0, fitmentMatches: 0, makeFitmentMatches: 0, candidatePoolSize: 0 
        };
        apiReadyRef.current = true;
      }
    })();

    // 2. API-driven progress animation
    const runProgress = async () => {
      let current = 0;

      // Phase A: Animate 0→80% smoothly (approx 3-4 seconds)
      // This gives the user immediate visual feedback
      while (current < 80) {
        if (hasCompletedRef.current) return;

        setProgress(current);
        const msg = [...PROCESSING_MESSAGES].reverse().find((m) => current >= m.threshold);
        if (msg) setStatusText(msg.text);

        // If API finishes early, accelerate to 80%
        const speed = apiReadyRef.current ? 20 : 80;
        const delay = apiReadyRef.current ? 30 : (40 + Math.random() * 30);
        await new Promise((r) => setTimeout(r, delay));
        current += (100 - current) / speed;
        current = Math.min(Math.round(current), 79);
        
        // Bump past thresholds to avoid getting stuck
        if (current < 5) current = Math.max(current, 1);
      }

      // Phase B: Hold at 80% until API responds
      setProgress(80);
      setStatusText("Generating expert analysis...");

      while (!apiReadyRef.current) {
        if (hasCompletedRef.current) return;
        await new Promise(r => setTimeout(r, 200));
      }

      // Phase C: API is ready — animate 80→100% quickly (~1.5s)
      for (let i = 81; i <= 100; i++) {
        if (hasCompletedRef.current) return;
        setProgress(i);
        const msg = [...PROCESSING_MESSAGES].reverse().find((m) => i >= m.threshold);
        if (msg) setStatusText(msg.text);
        await new Promise(r => setTimeout(r, 75));
      }

      // Final state
      setProgress(100);
      setStatusText("Maximum Velocity Reached!");
      await new Promise(r => setTimeout(r, 800));

      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true;
        onComplete(apiDataRef.current || { 
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
