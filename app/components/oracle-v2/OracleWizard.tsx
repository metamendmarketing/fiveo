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
} from "@/app/lib-v2/constants";
import { OracleApiResponse, ScoredProduct } from "@/app/lib-v2/types";
import { StepIndicator } from "@/app/components/ui/StepIndicator";
import { BuildProfilePanel } from "@/app/components/oracle-v2/BuildProfile";
import { StepEntryMode } from "@/app/components/oracle-v2/StepEntryMode";
import { StepVehicle } from "@/app/components/oracle-v2/StepVehicle";
import { StepGoal } from "@/app/components/oracle-v2/StepGoal";
import { StepUsage } from "@/app/components/oracle-v2/StepUsage";
import { StepPriorities } from "@/app/components/oracle-v2/StepPriorities";
import { StepPerformance } from "@/app/components/oracle-v2/StepPerformance";
import { StepPreferences } from "@/app/components/oracle-v2/StepPreferences";
import { StepExpertSpecs } from "@/app/components/oracle-v2/StepExpertSpecs";
import { ProcessingSequence } from "@/app/components/oracle-v2/ProcessingSequence";
import { ResultsPresentation } from "@/app/components/oracle-v2/ResultsPresentation";
import { EditBuildModal } from "@/app/components/oracle-v2/EditBuildModal";

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
/**
 * OracleWizard — The entry point for the FiveO Fuel Injector Recommendation Engine.
 * 
 * This component manages the state machine for the multi-step diagnostic process.
 * It coordinates vehicle selection, performance goals, and engineering preferences
 * to build a profile that is ultimately scored by the heuristic engine and 
 * refined by the AI Oracle.
 * 
 * Architecture:
 * - State Management: React useReducer for robust BuildProfile consistency.
 * - Navigation: Index-based step tracking with dynamic STEP_SEQUENCES.
 * - Performance: Memoized callbacks and derived state to ensure 60fps transitions.
 * - UI/UX: Cinematic framer-motion transitions with glassmorphic depth.
 */
export default function OracleWizard() {
  const [profile, dispatch] = useReducer(profileReducer, INITIAL_PROFILE);
  const [stepIndex, setStepIndex] = useState(0);
  const [results, setResults] = useState<ScoredProduct[] | null>(null);
  const [apiData, setApiData] = useState<OracleApiResponse | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  /** 
   * Memoized step sequence. 
   * Dynamically switches based on entryMode (e.g., 'oem' skips performance questions).
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

      {/* Main step container — expands to fit content on phones, cinematic on lg+ */}
      <div
        ref={wizardRef}
        className={`relative w-full max-w-7xl mx-auto lg:rounded-[2.5rem] lg:border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center 
          ${currentStep === 'results' ? '' : (currentStep === 'entry' ? 'min-h-[500px] lg:min-h-[600px]' : 'min-h-[500px] lg:min-h-[700px]')}`}
      >
        {/* Dynamic Background Layer */}
        <div 
          className="absolute inset-0 transition-opacity duration-1000 lg:rounded-[2.5rem]"
          style={{
            backgroundImage: `url(${getStepBackground(currentStep)})`,
            backgroundSize: (currentStep === "preferences" || currentStep === "results") ? "800px" : "cover", 
            backgroundPosition: "center",
            backgroundRepeat: (currentStep === "preferences" || currentStep === "results") ? "repeat" : "no-repeat",
          }}
        />
        <div className={`absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black/95 lg:rounded-[2.5rem] ${(currentStep === 'preferences' || currentStep === 'results') ? '' : 'backdrop-blur-[2px]'}`} />
        
        {/* Content Container — centered within the cinematic frame */}
        <div className={`relative z-10 w-full p-4 sm:p-6 lg:px-16 ${currentStep === 'entry' ? 'lg:py-16' : 'lg:pt-16 lg:pb-4'} ${currentStep === 'results' ? '' : `flex flex-col ${showSidebar ? 'lg:flex-row' : ''} items-center justify-center gap-4 ${showSidebar ? 'lg:gap-12' : ''}`}`}>
          {/* Active Step Content */}
          <div className={`flex-1 min-w-0 w-full ${currentStep === 'results' ? '' : 'flex flex-col'}`}>
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

        {/* Discreet Navigation — Inside the frame at the bottom */}
        {currentStep !== "entry" && currentStep !== "processing" && currentStep !== "results" && (
          <div className="relative z-10 w-full px-8 pb-6 mt-auto flex justify-between items-center opacity-60 hover:opacity-100 transition-opacity">
            <button 
              onClick={back} 
              className="text-white/80 hover:text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2 group transition-colors"
            >
              <span className="group-hover:-translate-x-1 transition-transform">←</span> Back
            </button>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 italic">
              Step {stepIndex} of {steps.length - 2}
            </span>
          </div>
        )}
      </div>



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
