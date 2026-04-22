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
import { OracleApiResponse, ScoredProduct } from "@/app/lib/types";
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

/**
 * Reducer for managing the BuildProfile state.
 */
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

/**
 * Step animation variants for smooth transitions.
 */
const stepVariants = {
  enter: { opacity: 0, x: 24 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
};

/**
 * OracleWizard — Main Wizard Shell & State Machine
 *
 * This component orchestrates the entire multi-step fuel injector sizing flow.
 * It manages the global wizard state (BuildProfile), handles navigation logic,
 * and renders the appropriate step components.
 */
export default function OracleWizard() {
  const [profile, dispatch] = useReducer(profileReducer, INITIAL_PROFILE);
  const [stepIndex, setStepIndex] = useState(0);
  const [results, setResults] = useState<ScoredProduct[] | null>(null);
  const [apiData, setApiData] = useState<OracleApiResponse | null>(null);

  /** 
   * Derive the current step sequence based on the selected entry mode 
   */
  const steps = useMemo(() => {
    if (!profile.entryMode) return ["entry"] as WizardStep[];
    return STEP_SEQUENCES[profile.entryMode] || STEP_SEQUENCES.guide;
  }, [profile.entryMode]);

  const currentStep = steps[stepIndex] || "entry";

  /**
   * Calculate progress percentage for the progress bar.
   * Excludes 'entry' and 'results' from the denominator.
   */
  const progressPercent = useMemo(() => {
    if (stepIndex === 0) return 0;
    const total = steps.length - 1; 
    return Math.min(Math.round((stepIndex / total) * 100), 100);
  }, [stepIndex, steps.length]);

  /**
   * Update the global profile state.
   */
  const update = useCallback(
    (partial: Partial<BuildProfile>) => {
      // Cast known numeric values to ensure data integrity
      const sanitized = { ...partial };
      if ("makeId" in sanitized && sanitized.makeId !== undefined) sanitized.makeId = sanitized.makeId ? Number(sanitized.makeId) : null;
      if ("modelId" in sanitized && sanitized.modelId !== undefined) sanitized.modelId = sanitized.modelId ? Number(sanitized.modelId) : null;
      if ("year" in sanitized && sanitized.year !== undefined) sanitized.year = sanitized.year ? Number(sanitized.year) : null;
      
      dispatch({ type: "UPDATE", payload: sanitized });
    },
    []
  );

  const next = useCallback(() => {
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  }, [steps.length]);

  const back = useCallback(() => {
    setStepIndex((i) => Math.max(i - 1, 0));
  }, []);

  const handleEntrySelect = useCallback(
    (mode: "guide" | "setup" | "specs") => {
      update({ entryMode: mode });
      // Skip to the first real step after mode selection
      setStepIndex(1);
    },
    [update]
  );

  const handleProcessingComplete = useCallback(
    (data: OracleApiResponse) => {
      setResults(data.results || []);
      setApiData(data);
      next();
    },
    [next]
  );

  /**
   * Render the current step component with injected props.
   */
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
      {/* Progress tracking UI */}
      {currentStep !== "entry" && currentStep !== "results" && currentStep !== "processing" && (
        <div className="max-w-4xl mx-auto px-8 lg:px-28 pt-4">
          <StepIndicator
            percent={progressPercent}
          />
        </div>
      )}

      {/* Main step container */}
      <div className="relative">
        <div className="flex gap-0 lg:gap-8 max-w-7xl mx-auto">
          {/* Active Step Content */}
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

          {/* Profile Summary Sidebar */}
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

      {/* Step Navigation Footer */}
      {currentStep !== "entry" && currentStep !== "processing" && currentStep !== "results" && (
        <div className="max-w-4xl mx-auto px-8 lg:px-28 py-6 flex justify-between items-center">
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
