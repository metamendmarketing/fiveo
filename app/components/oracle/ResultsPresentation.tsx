/**
 * ResultsPresentation — Final results page showing matched products
 * Features interactive 'Explore' modals and expanded AI narratives.
 */
"use client";

import React, { useState } from "react";
import { BuildProfile } from "@/app/lib/constants";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  profile: BuildProfile;
  results: any[];
  apiData: any;
  onRestart: () => void;
}

export function ResultsPresentation({ profile, results, apiData, onRestart }: Props) {
  const [selectedResult, setSelectedResult] = useState<any | null>(null);

  if (!results || results.length === 0) {
    return (
      <div className="oracle-bg-results min-h-[60vh] px-6 py-20 flex items-center justify-center">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-black uppercase italic text-black mb-4">
            No Matches Found
          </h2>
          <p className="text-gray-500 mb-8">
            {apiData?.reason || "We couldn't find injectors matching your exact specifications. Try adjusting your criteria."}
          </p>
          <button onClick={onRestart} className="oracle-cta-primary">
            Start Over
          </button>
        </div>
      </div>
    );
  }

  const topPick = results[0];
  const others = results.slice(1);

  return (
    <div className="oracle-bg-results min-h-[60vh] px-8 py-24">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-20">
          <h2 className="text-3xl font-black uppercase italic text-black mb-2">
            Oracle <span data-deploy-sig="SIG-1776813350" className="text-[#E10600]">Selection v3.5</span>
          </h2>
          <div className="h-0.5 w-16 bg-[#E10600] mx-auto mb-8"></div>
          <p className="text-[10px] text-gray-400 uppercase tracking-[0.4em] font-black">
            {results.length} Precision-Matched Component{results.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* AI Selection Strategy */}
        {apiData?.selectionStrategy && (
          <div className="oracle-strategy-card p-10 mb-16 text-white shadow-2xl">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#00AEEF] mb-6">
              Expert Advisor Strategy & Methodology
            </h3>
            <p className="text-base text-white/80 leading-relaxed italic border-l-2 border-[#00AEEF]/30 pl-6">
              "{apiData.selectionStrategy}"
            </p>
          </div>
        )}

        {/* Results Container */}
        <div className="flex flex-col gap-12">
          
          {/* 1. TOP PICK (Featured) */}
          {topPick && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="oracle-result-card ring-1 ring-gray-200 rounded-xl overflow-hidden bg-white shadow-2xl relative"
            >
              <div className="absolute top-0 right-0 p-6">
                <div className="oracle-expert-pick inline-block bg-black text-white px-5 py-1.5 text-[9px] uppercase font-black tracking-widest italic">
                  ★ Primary Match
                </div>
              </div>

              <div className="md:flex items-stretch min-h-[380px]">
                {/* Image Section */}
                <div className="md:w-2/5 bg-gray-50 flex items-center justify-center p-16 border-r border-gray-100">
                  <img 
                    src={topPick.product?.heroImageUrl || topPick.product?.hero_image_url} 
                    alt={topPick.product?.name}
                    className="w-full h-full object-contain max-h-72"
                  />
                </div>
                
                {/* Content Section */}
                <div className="md:w-3/5 p-16 flex flex-col justify-center">
                   <div className="mb-6">
                      <span className="text-[9px] px-3 py-1 font-black bg-[#E10600] text-white uppercase italic tracking-widest">
                        {topPick.matchStrategy || "Top Recommendation"}
                      </span>
                   </div>
                   <h3 className="text-2xl font-black uppercase italic text-black leading-tight mb-3">
                     {topPick.product?.name}
                   </h3>
                   <p className="text-[#00AEEF] text-xs font-bold uppercase tracking-[0.2em] mb-8">
                     {topPick.product?.manufacturer || topPick.product?.brand || "FiveO"} Precision Core | {topPick.product?.size_cc || topPick.product?.flow_rate_cc || "—"} cc/min
                   </p>

                   {/* Score */}
                   <div className="flex items-center gap-6 mb-10">
                      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${topPick.score || 0}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                          className="h-full bg-[#00AEEF]"
                        />
                      </div>
                      <span className="text-2xl font-black text-[#00AEEF] tracking-tighter">{Number(topPick.score).toFixed(1)}% Match</span>
                   </div>

                   <div className="flex flex-wrap gap-6 items-center">
                      <button 
                        onClick={() => setSelectedResult(topPick)}
                        className="oracle-cta-primary px-10 py-4 text-xs font-black tracking-[0.2em]"
                      >
                        Explore Tech Deep-Dive
                      </button>
                      {topPick.product?.product_url && (
                        <a 
                          href={topPick.product.product_url} 
                          target="_blank" 
                          className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-300 hover:text-black transition-colors"
                        >
                          View in Store →
                        </a>
                      )}
                   </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 2. REMAINING RECOMMENDATIONS (Centered Grid) */}
          {others.length > 0 && (
            <div className="oracle-grid-centered w-full mt-4">
              {others.map((result: any, i: number) => (
                <motion.div
                  key={result.product?.id || i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * (i + 1) }}
                  onClick={() => setSelectedResult(result)}
                  className="oracle-result-card oracle-card-clickable bg-white rounded-lg border border-gray-100 overflow-hidden flex flex-col group shadow-sm hover:shadow-xl"
                >
                  {/* Image Container - Fixed height, centered */}
                  <div className="h-64 bg-gray-50 flex items-center justify-center p-8 border-b border-gray-50 group-hover:bg-white transition-colors">
                    <img 
                      src={result.product?.heroImageUrl || result.product?.hero_image_url} 
                      alt={result.product?.name}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Content */}
                  <div className="p-8 flex-1 flex flex-col">
                    <div className="mb-4">
                      <span className="text-[8px] font-black uppercase tracking-widest text-[#00AEEF] border border-[#00AEEF]/30 px-2 py-0.5 rounded-sm">
                        {result.matchStrategy || "Expert Alternative"}
                      </span>
                    </div>

                    <h4 className="text-base font-black uppercase italic text-black leading-tight mb-4 min-h-[2.5rem] line-clamp-2">
                       {result.product?.name}
                    </h4>

                    {/* Compact Score */}
                    <div className="mt-auto pt-6 border-t border-gray-50">
                      <div className="flex justify-between items-center mb-6">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Match Score</span>
                        <span className="text-xl font-black text-[#00AEEF]">{Number(result.score).toFixed(1)}%</span>
                      </div>
                      
                      <button 
                        className="w-full bg-black text-white text-[10px] font-black uppercase py-4 tracking-[0.2em] hover:bg-[#00AEEF] transition-colors rounded-sm"
                      >
                        Review Analysis
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Global Restart */}
        <div className="text-center mt-24">
          <button onClick={onRestart} className="oracle-cta-secondary px-12 py-4 opacity-40 hover:opacity-100 transition-opacity text-[10px]">
            Return to Advisor and Start New Build
          </button>
        </div>
      </div>

      {/* THE ORACLE DEEP-DIVE MODAL */}
      <AnimatePresence>
        {selectedResult && (
          <div className="oracle-modal-overlay" onClick={() => setSelectedResult(null)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="oracle-modal-content overflow-visible"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-50 p-8 flex justify-between items-center z-10 rounded-t-xl">
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#00AEEF] mb-1">Oracle Technical Deep-Dive</h3>
                  <p className="text-[9px] text-gray-300 font-bold uppercase tracking-widest italic">Authentic FiveO Expert Knowledge</p>
                </div>
                <button 
                  onClick={() => setSelectedResult(null)}
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 transition-colors text-xs"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-10 md:p-16">
                <div className="md:flex gap-16 mb-16">
                   <div className="md:w-1/3 mb-10 md:mb-0">
                      <div className="bg-gray-50 rounded-xl p-10 aspect-square flex items-center justify-center shadow-inner">
                        <img 
                          src={selectedResult.product?.heroImageUrl || selectedResult.product?.hero_image_url} 
                          alt={selectedResult.product?.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                   </div>
                   <div className="md:w-2/3 flex flex-col justify-center">
                      <h2 className="text-3xl font-black uppercase italic text-black leading-tight mb-6">
                        {selectedResult.product?.name}
                      </h2>
                      <div className="flex flex-wrap gap-4 mb-8">
                        <span className="bg-black text-white text-[9px] font-black px-4 py-1.5 uppercase italic tracking-widest">{selectedResult.matchStrategy}</span>
                        <span className="bg-[#00AEEF]/10 text-[#00AEEF] text-[9px] font-black px-4 py-1.5 uppercase italic tracking-widest border border-[#00AEEF]/20">{selectedResult.score}% Compatibility</span>
                      </div>
                      <p className="text-xl text-gray-700 font-medium leading-relaxed italic border-l-4 border-gray-100 pl-8">
                        "{selectedResult.preferenceSummary}"
                      </p>
                   </div>
                </div>

                <div className="h-px w-full bg-gray-50 mb-16"></div>

                {/* The Technical Narrative */}
                <div className="mb-16">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-300 mb-8 text-center underline underline-offset-8 decoration-[#00AEEF]/30">Full Technical Rationale</h4>
                  <div className="oracle-narrative-text whitespace-pre-wrap px-1 sm:px-8">
                    {selectedResult.technicalNarrative || "Calibrating expert technical rationale... This specific model is a standout choice for high-duty cycle applications. It features advanced internal solenoid architecture that maintains linear flow even under heat-soak conditions common in performance tuning."}
                  </div>
                  
                  <div className="oracle-pro-tip mx-1 sm:mx-8">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#00AEEF] mb-3 font-not-italic">FiveO Expert Tuning Pro-Tip</p>
                    <p className="text-gray-700 not-italic text-sm leading-relaxed">
                      "Ensure your ECU is calibrated for the specific impedance and flow rate of this {selectedResult.product?.brand || "FiveO"} injector. While this model is high-impedance and universally compatible, we recommend verified dead-time mapping at 13.5V for the crispest idle quality. Reach out to our technical team for the exact CSV mapping for your specific ECU platform."
                    </p>
                  </div>
                </div>

                {/* Specs Grid */}
                <div className="bg-gray-50 rounded-2xl p-10 mb-16 border border-gray-100">
                  <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-black/20 mb-8">Engineering Specifications</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
                    <div>
                      <p className="text-[10px] font-black uppercase text-[#00AEEF] mb-2 tracking-widest">Flow Rate</p>
                      <p className="text-base font-black text-black">{selectedResult.product?.flow_rate_cc || selectedResult.product?.size_cc || "—"} cc</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-[#00AEEF] mb-2 tracking-widest">Impedance</p>
                      <p className="text-base font-black text-black">{selectedResult.product?.impedance || "High (12-14Ω)"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-[#00AEEF] mb-2 tracking-widest">Brand</p>
                      <p className="text-base font-black text-black">{selectedResult.product?.brand || selectedResult.product?.manufacturer || "FiveO"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-[#00AEEF] mb-2 tracking-widest">Connector</p>
                      <p className="text-base font-black text-black">{selectedResult.product?.connector_type || "Standard"}</p>
                    </div>
                  </div>
                </div>

                {/* Final CTA */}
                <div className="flex flex-col md:flex-row gap-6 px-1 sm:px-8">
                  {selectedResult.product?.product_url && (
                    <a 
                      href={selectedResult.product.product_url} 
                      target="_blank" 
                      className="oracle-cta-primary flex-1 text-center py-6 text-xs font-black tracking-widest"
                    >
                      Browse In Full FiveO Catalog
                    </a>
                  )}
                  <button 
                    onClick={() => setSelectedResult(null)}
                    className="border border-gray-200 px-10 py-6 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-colors text-gray-400 hover:text-black"
                  >
                    Back to Results
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
