/**
 * OracleWizard.tsx — Main Wizard Shell & State Machine
 *
 * Manages the BuildProfile via useReducer, controls step navigation,
 * determines which steps to show based on entryMode, renders the
 * persistent BuildProfile sidebar and StepIndicator progress bar.
 */
"use client";

import React, { useReducer, useState, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  type BuildProfile,
  type WizardStep,
  INITIAL_PROFILE,
  STEP_SEQUENCES,
} from "@/app/lib/constants";
import { StepIndicator } from "@/app/components/ui/StepIndicator";
import { BuildProfilePanel } from "@/app/components/oracle/BuildProfile";
import { StepEntryMode } from "@/app/components/oracle/StepEntryMode";
import { StepVehicle } from "@/app/components/oracle/StepVehicle";
import { StepGoal } from "@/app/components/oracle/StepGoal";
import { StepUsage } from "@/app/components/oracle/StepUsage";
import { StepPriorities } from "@/app/components/oracle/StepPriorities";
import { StepPerformance } from "@/app/components/oracle/StepPerformance";
import { StepPreferences } from "@/app/components/oracle/StepPreferences";
import { StepExpertSpecs } from "@/app/components/oracle/StepExpertSpecs";
import { ProcessingSequence } from "@/app/components/oracle/ProcessingSequence";
import { ResultsPresentation } from "@/app/components/oracle/ResultsPresentation";

// ─── Reducer ───
type ProfileAction =
  | { type: "UPDATE"; payload: Partial<BuildProfile> }
  | { type: "RESET" };

function profileReducer(state: BuildProfile, action: ProfileAction): BuildProfile {
  switch (action.type) {
    case "UPDATE":
      return { ...state, ...action.payload };
    case "RESET":
      return INITIAL_PROFILE;
    default:
      return state;
  }
}

// ─── Step animation variants ───
const stepVariants = {
  enter: { opacity: 0, x: 24 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
};

export default function OracleWizard() {
  const [profile, dispatch] = useReducer(profileReducer, INITIAL_PROFILE);
  const [stepIndex, setStepIndex] = useState(0);
  const [results, setResults] = useState<any[] | null>(null);
  const [apiData, setApiData] = useState<any>(null);

  // Derive step sequence from entry mode
  const steps = useMemo(() => {
    if (!profile.entryMode) return ["entry"] as WizardStep[];
    return STEP_SEQUENCES[profile.entryMode] || STEP_SEQUENCES.guide;
  }, [profile.entryMode]);

  const currentStep = steps[stepIndex] || "entry";

  // Progress percentage (exclude entry and results from count)
  const progressPercent = useMemo(() => {
    if (stepIndex === 0) return 0;
    const total = steps.length - 1; // exclude results
    return Math.min(Math.round((stepIndex / total) * 100), 100);
  }, [stepIndex, steps.length]);

  const update = useCallback(
    (partial: Partial<BuildProfile>) => {
      dispatch({ type: "UPDATE", payload: partial });
    },
    []
  );

  const next = useCallback(() => {
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  }, [steps.length]);

  const back = useCallback(() => {
    setStepIndex((i) => Math.max(i - 1, 0));
  }, []);

  const goToStep = useCallback(
    (step: WizardStep) => {
      const idx = steps.indexOf(step);
      if (idx >= 0) setStepIndex(idx);
    },
    [steps]
  );

  const handleEntrySelect = useCallback(
    (mode: "guide" | "setup" | "specs") => {
      update({ entryMode: mode });
      // After setting entry mode, advance to step 1 of the new sequence
      setStepIndex(1);
    },
    [update]
  );

  const handleProcessingComplete = useCallback(
    (data: any) => {
      setResults(data.results || []);
      setApiData(data);
      next();
    },
    [next]
  );

  // Determine if current step is dark-themed (for text contrast)
  const isDarkStep = ["entry", "engine-status", "goal", "usage", "performance", "expert-specs", "processing"].includes(currentStep);

  // ─── Render current step ───
  function renderStep() {
    const commonProps = { profile, onUpdate: update, onNext: next, onBack: back };

    switch (currentStep) {
      case "entry":
        return <StepEntryMode onSelect={handleEntrySelect} />;
      case "vehicle-details":
        return <StepVehicle {...commonProps} showTypeSelector={profile.entryMode === "guide"} />;
      case "goal":
        return <StepGoal {...commonProps} />;
      case "usage":
        return <StepUsage {...commonProps} />;
      case "priorities":
        return <StepPriorities {...commonProps} />;
      case "performance":
        return <StepPerformance {...commonProps} />;
      case "preferences":
        return <StepPreferences {...commonProps} />;
      case "expert-specs":
        return <StepExpertSpecs {...commonProps} />;
      case "processing":
        return (
          <ProcessingSequence
            profile={profile}
            onComplete={handleProcessingComplete}
          />
        );
      case "results":
        return (
          <ResultsPresentation
            profile={profile}
            results={results || []}
            apiData={apiData}
            onRestart={() => {
              dispatch({ type: "RESET" });
              setStepIndex(0);
              setResults(null);
              setApiData(null);
            }}
          />
        );
      default:
        return null;
    }
  }

  return (
    <div className="w-full">
      {/* Step indicator — hidden on entry and results */}
      {currentStep !== "entry" && currentStep !== "results" && currentStep !== "processing" && (
        <div className="max-w-4xl mx-auto px-4 pt-4">
          <StepIndicator
            current={stepIndex}
            total={steps.length}
            percent={progressPercent}
          />
        </div>
      )}

      {/* Main content area */}
      <div className="relative">
        <div className="flex gap-0 lg:gap-8 max-w-7xl mx-auto">
          {/* Step content */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Build Profile sidebar — visible after entry, hidden on processing/results */}
          {profile.entryMode &&
            currentStep !== "entry" &&
            currentStep !== "processing" &&
            currentStep !== "results" && (
              <div className="hidden lg:block w-72 shrink-0 pt-4">
                <BuildProfilePanel profile={profile} />
              </div>
            )}
        </div>
      </div>

      {/* Navigation footer — hidden on entry, processing, results */}
      {currentStep !== "entry" && currentStep !== "processing" && currentStep !== "results" && (
        <div className="max-w-4xl mx-auto px-4 py-6 flex justify-between items-center">
          <button onClick={back} className="oracle-cta-secondary text-sm">
            ← Back
          </button>
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
            Step {stepIndex} of {steps.length - 2}
          </span>
        </div>
      )}
    </div>
  );
}
