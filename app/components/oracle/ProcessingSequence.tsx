/**
 * ProcessingSequence — Synthesis animation with real API call
 *
 * Pattern borrowed from Marquis: fires API in background,
 * runs paced progress bar with status messages,
 * accelerates once real data arrives.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import type { BuildProfile } from "@/app/lib/constants";
import { PROCESSING_MESSAGES } from "@/app/lib/constants";

interface Props {
  profile: BuildProfile;
  onComplete: (data: any) => void;
}

export function ProcessingSequence({ profile, onComplete }: Props) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState<string>(PROCESSING_MESSAGES[0].text);
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    let apiData: any = null;
    let apiReady = false;

    // 1. Fire API call in background
    const fetchTask = (async () => {
      try {
        const res = await fetch("api/oracle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile }),
        });
        apiData = await res.json();
        apiReady = true;
      } catch (err) {
        console.error("[ProcessingSequence] API call failed:", err);
        apiData = { results: [], error: "API call failed" };
        apiReady = true;
      }
    })();

    // 2. Run progress simulation
    const runProgress = async () => {
      for (let i = 0; i <= 99; i++) {
        if (hasCompletedRef.current) return;

        setProgress(i);

        // Update status text based on threshold
        const msg = [...PROCESSING_MESSAGES]
          .reverse()
          .find((m) => i >= m.threshold);
        if (msg) setStatusText(msg.text);

        // Pacing: slower when waiting for API, fast when data arrived
        let delay = 60;
        if (i >= 15 && i < 85) {
          delay = apiReady ? 30 : 200 + Math.random() * 500;
        } else if (i >= 85) {
          delay = apiReady ? 20 : Math.max(80, 300 - (i - 85) * 15);
        }

        await new Promise((r) => setTimeout(r, delay));
      }

      // Wait for actual data if animation finished first
      if (!apiReady) {
        setStatusText("Securing final match data...");
        while (!apiReady) {
          await new Promise((r) => setTimeout(r, 200));
        }
      }

      // Final tick
      setProgress(100);
      setStatusText("Analysis Complete!");
      await new Promise((r) => setTimeout(r, 600));

      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true;
        onComplete(apiData || { results: [] });
      }
    };

    runProgress();

    return () => {
      hasCompletedRef.current = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="oracle-bg-processing min-h-[70vh] flex flex-col items-center justify-center px-4 py-16">
      {/* Radar rings */}
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

      {/* Progress percentage */}
      <div className="oracle-progress-percent mb-6">
        {progress}
        <span className="text-lg text-white/40 ml-1">%</span>
      </div>

      {/* Progress bar */}
      <div className="oracle-progress-bar mb-6">
        <div
          className="oracle-progress-bar-fill"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Status text */}
      <p className="text-sm text-white/60 font-medium tracking-wide min-h-[1.5em]">
        {statusText}
      </p>
    </div>
  );
}
