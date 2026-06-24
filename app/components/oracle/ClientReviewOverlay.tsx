"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BuildProfile } from "@/app/lib/constants";
import { ScoredProduct } from "@/app/lib/types";

interface Props {
  profile: BuildProfile;
  activeResults: ScoredProduct[] | null;
  currentStep: string;
}

export function ClientReviewOverlay({ profile, activeResults, currentStep }: Props) {
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [isV2, setIsV2] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [reviewerName, setReviewerName] = useState("");

  useEffect(() => {
    // Only activate if ?client_review=true is in the URL
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("client_review") === "true") {
      setIsReviewMode(true);
    }
    // Determine if we are currently in V2 based on pathname
    if (window.location.pathname.includes("/v2")) {
      setIsV2(true);
    }
  }, []);

  if (!isReviewMode) return null;

  const handleToggle = () => {
    // Save profile to session storage so it can be restored after navigation
    sessionStorage.setItem("oracleReviewProfile", JSON.stringify(profile));
    
    // Toggle URL with the correct base path
    const targetUrl = isV2 ? "/fiveo/demo/?client_review=true" : "/fiveo/demo/v2?client_review=true";
    window.location.href = targetUrl;
  };

  const handleSubmitFeedback = async () => {
    if (!feedback.trim() || !reviewerName.trim()) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch("/fiveo/demo/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version_active: isV2 ? "V2" : "V1",
          current_step: currentStep,
          vehicle_profile: profile,
          active_results: activeResults,
          notes: feedback,
          reviewer_name: reviewerName.trim(),
        }),
      });

      if (!res.ok) throw new Error("Failed to submit feedback");
      
      setSubmitSuccess(true);
      setTimeout(() => {
        setIsModalOpen(false);
        setFeedback("");
        setSubmitSuccess(false);
      }, 2000);
    } catch (error) {
      console.error(error);
      alert("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Review Panel */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] bg-[#09090b]/90 backdrop-blur-md border border-white/20 p-3 rounded-full shadow-2xl flex items-center gap-4 text-white">
        <div className="px-3 py-1 bg-black/50 rounded-full border border-white/10 flex flex-col">
          <span className="text-[10px] text-[#a8a8a8] uppercase tracking-widest leading-none mb-1">Review Mode</span>
          <span className="text-xs font-bold leading-none text-[#00AEEF]">
            {isV2 ? "V2: Strict Fitment" : "V1: Broad Match"}
          </span>
        </div>

        <button
          onClick={handleToggle}
          className="bg-white/10 hover:bg-white/20 transition-colors px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider"
        >
          Switch to {isV2 ? "V1" : "V2"}
        </button>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#E10600] hover:bg-[#ff1a1a] transition-colors px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          Feedback
        </button>
      </div>

      {/* Feedback Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !isSubmitting && setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-[#111] border border-white/20 p-6 rounded-2xl w-full max-w-lg shadow-2xl text-white"
            >
              <h2 className="text-xl font-bold mb-2">Provide Feedback</h2>
              <p className="text-sm text-gray-400 mb-4">
                Your feedback will automatically include your current vehicle profile, wizard step, and active recommendations.
              </p>
              
              <input
                type="text"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                placeholder="Your Name (e.g. John Doe)"
                className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-sm focus:outline-none focus:border-[#00AEEF] mb-3"
              />

              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="What do you like or dislike about these results? Any app issues?"
                className="w-full h-32 bg-black/50 border border-white/10 rounded-lg p-3 text-sm focus:outline-none focus:border-[#00AEEF] resize-none mb-4"
              />

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg text-sm font-bold bg-white/5 hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitFeedback}
                  disabled={isSubmitting || !feedback.trim() || !reviewerName.trim()}
                  className="px-6 py-2 rounded-lg text-sm font-bold bg-[#00AEEF] hover:bg-[#0090c7] transition-colors disabled:opacity-50 flex items-center justify-center min-w-[120px]"
                >
                  {submitSuccess ? "Sent!" : isSubmitting ? "Sending..." : "Submit Feedback"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
