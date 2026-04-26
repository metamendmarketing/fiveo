/**
 * OracleWizard.tsx — Main Wizard Shell & State Machine
 *
 * Manages the BuildProfile via useReducer, controls step navigation,
 * determines which steps to show based on entryMode, renders the
 * persistent BuildProfile sidebar and StepIndicator progress bar.
 */
"use client";

import React, { useReducer, useState, useCallback, useMemo, useRef, useEffect } from "react";
// Build Timestamp: 2026-04-26T15:01:00Z
import { AnimatePresence, motion } from "framer-motion";
import {
  type BuildProfile,
  type WizardStep,
  INITIAL_PROFILE,
  STEP_SEQUENCES,
  IMAGES,
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
import { EditBuildModal } from "@/app/components/oracle/EditBuildModal";

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
/**
 * OracleWizard — The entry point for the FiveO Fuel Injector Recommendation Engine.
 * 
 * This component manages the state machine for the multi-step diagnostic process.
 * It coordinates vehicle selection, performance goals, and engineering preferences
 * to build a profile that is ultimately scored by the heuristic engine and 
 * refined by the AI Oracle.
 * 
 * Features:
 * - Reducer-based state management for robust profile building.
 * - Dynamic step sequences based on entry mode (Guide vs Specs).
 * - Cinematic UI transitions and glassmorphic aesthetics.
 * - Memoized handlers to prevent unnecessary re-renders across steps.
 */
export default function OracleWizard() {
  const [profile, dispatch] = useReducer(profileReducer, INITIAL_PROFILE);
  const [stepIndex, setStepIndex] = useState(0);
  const [results, setResults] = useState<ScoredProduct[] | null>(null);
  const [apiData, setApiData] = useState<OracleApiResponse | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  /** 
   * Derive the current step sequence based on the selected entry mode 
   */
  const steps = useMemo(() => {
    if (!profile.entryMode) return ["entry"] as WizardStep[];
    return STEP_SEQUENCES[profile.entryMode] || STEP_SEQUENCES.guide;
  }, [profile.entryMode]);

  const currentStep = steps[stepIndex] || "entry";

  /** Ref for the wizard container — used to scroll into view on step change */
  const wizardRef = useRef<HTMLDivElement>(null);

  /** Scroll wizard into view on every step transition */
  useEffect(() => {
    if (wizardRef.current) {
      wizardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [stepIndex]);

  /** 
   * Delay the appearance of the Build Profile sidebar to prevent 
   * layout squeezing during the Entry Mode -> Step 1 transition.
   * Also ensures perfect centering on the home screen by keeping it single-column.
   */
  const [showSidebar, setShowSidebar] = useState(false);
  useEffect(() => {
    if (stepIndex > 0 && currentStep !== 'processing' && currentStep !== 'results') {
      const timer = setTimeout(() => setShowSidebar(true), 500); 
      return () => clearTimeout(timer);
    } else {
      setShowSidebar(false);
    }
  }, [stepIndex, currentStep]);

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
    (mode: "guide" | "setup" | "specs" | "oem") => {
      update({ 
        entryMode: mode,
        // Auto-set goal for OEM mode to streamline the flow
        goal: mode === "oem" ? "replace" : profile.goal 
      });
      // Skip to the first real step after mode selection
      setStepIndex(1);
    },
    [update, profile.goal]
  );

  const handleProcessingComplete = useCallback(
    (data: OracleApiResponse) => {
      setResults(data.results || []);
      setApiData(data);
      next();
    },
    [next]
  );

  const handleRestart = useCallback(() => {
    dispatch({ type: "RESET" });
    setStepIndex(0);
    setResults(null);
    setApiData(null);
  }, []);

  const handleEditBuild = useCallback(() => {
    setIsEditModalOpen(true);
  }, []);

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
            onRestart={handleRestart}
            onEdit={handleEditBuild}
          />
        );
      default:
        return null;
    }
  }

  const getStepBackground = (step: WizardStep) => {
    switch (step) {
      case "entry": return IMAGES.engineBayHero;
      case "vehicle-type":
      case "vehicle-details": return IMAGES.diagnosticBay;
      case "engine-status": return IMAGES.diagnosticBay;
      case "goal": return IMAGES.dynoFlames;
      case "usage": return IMAGES.mixedUse;
      case "priorities": return IMAGES.sunsetHighway;
      case "performance": return IMAGES.trackDrift;
      case "preferences": return IMAGES.carbonFiber;
      case "expert-specs": return IMAGES.diagnosticBay;
      case "processing": return IMAGES.engineBayHero;
      case "results": return IMAGES.darkWeave;
      default: return IMAGES.diagnosticBay;
    }
  };

  return (
    <div className="w-full">
      {/* Progress tracking UI */}
      {currentStep !== "entry" && currentStep !== "results" && currentStep !== "processing" && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <StepIndicator
            percent={progressPercent}
          />
        </div>
      )}

      {/* Main step container — expands to fit content on phones, cinematic on lg+ */}
      <div
        ref={wizardRef}
        className={`relative w-full max-w-7xl mx-auto lg:rounded-[2.5rem] lg:border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] lg:overflow-clip
          ${currentStep === 'results' ? '' : 'lg:aspect-video'}`}
      >
        {/* Dynamic Background Layer */}
        <div 
          className="absolute inset-0 transition-opacity duration-1000 lg:rounded-[2.5rem]"
          style={{
            backgroundImage: `url(${getStepBackground(currentStep)})`,
            backgroundSize: "cover", 
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black/95 backdrop-blur-[2px] lg:rounded-[2.5rem]" />
        
        {/* Content Container — centered within the cinematic frame */}
        <div className={`relative z-10 w-full p-4 sm:p-6 lg:p-16 ${currentStep === 'results' ? '' : `flex flex-col ${showSidebar ? 'lg:flex-row' : ''} items-center justify-center gap-4 ${showSidebar ? 'lg:gap-12' : ''} h-full`}`}>
          {/* Active Step Content */}
          <div className={`flex-1 min-w-0 w-full ${currentStep === 'results' ? '' : 'flex flex-col items-center justify-center'}`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="w-full"
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Profile Summary Sidebar — desktop only */}
          {showSidebar && (
            <div className="hidden lg:block w-80 shrink-0">
              <BuildProfilePanel profile={profile} />
            </div>
          )}
        </div>
        {/* Profile Summary — mobile only, below content */}
        {showSidebar && (
          <div className="lg:hidden relative z-10 px-4 pb-4">
            <BuildProfilePanel profile={profile} />
          </div>
        )}
      </div>

      {/* Step Navigation Footer */}
      {currentStep !== "entry" && currentStep !== "processing" && currentStep !== "results" && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center border-t border-gray-100 mt-8">
          <button onClick={back} className="oracle-cta-secondary text-sm">
            ← Back
          </button>
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
            Step {stepIndex} of {steps.length - 2}
          </span>
        </div>
      )}


      {/* Edit Build Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <EditBuildModal 
            profile={profile}
            onClose={() => setIsEditModalOpen(false)}
            onSubmit={(updatedProfile) => {
              dispatch({ type: "UPDATE", payload: updatedProfile });
              setIsEditModalOpen(false);
              setResults(null);
              setApiData(null);
              const processingIndex = steps.indexOf("processing");
              if (processingIndex !== -1) {
                setStepIndex(processingIndex);
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
