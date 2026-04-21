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
      <div className="oracle-bg-results min-h-[60vh] px-4 py-12 flex items-center justify-center">
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
    <div className="oracle-bg-results min-h-[60vh] px-4 py-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black uppercase italic text-black mb-2">
            Your <span className="text-[#00AEEF]">Oracle Selection</span>
          </h2>
          <div className="h-1 w-20 bg-[#00AEEF] mx-auto mb-6"></div>
          <p className="text-sm text-gray-500 uppercase tracking-[0.2em] font-bold">
            {results.length} Precision-Matched Component{results.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* AI Selection Strategy */}
        {apiData?.selectionStrategy && (
          <div className="oracle-strategy-card p-8 mb-12 text-white shadow-2xl">
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#00AEEF] mb-4">
              Advisor Strategy & Methodology
            </h3>
            <p className="text-base text-white/80 leading-loose italic">
              "{apiData.selectionStrategy}"
            </p>
          </div>
        )}

        {/* Results Container */}
        <div className="flex flex-col gap-8">
          
          {/* 1. TOP PICK (Featured) */}
          {topPick && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="oracle-result-card ring-4 ring-[#00AEEF]/20 rounded-xl overflow-hidden bg-white shadow-2xl relative"
            >
              <div className="absolute top-0 right-0 p-4">
                <div className="oracle-expert-pick inline-block bg-black text-white px-4 py-1 text-[10px] uppercase font-black tracking-widest italic">
                  ★ Ultimate Match
                </div>
              </div>

              <div className="md:flex items-stretch min-h-[320px]">
                {/* Image Section */}
                <div className="md:w-2/5 bg-gray-50 flex items-center justify-center p-8 border-r border-gray-100">
                  <img 
                    src={topPick.product?.heroImageUrl || topPick.product?.hero_image_url} 
                    alt={topPick.product?.name}
                    className="w-full h-full object-contain max-h-64"
                  />
                </div>
                
                {/* Content Section */}
                <div className="md:w-3/5 p-8 flex flex-col justify-center">
                   <div className="mb-4">
                      <span className="oracle-tag-performance text-[10px] px-3 py-1 font-black bg-[#E10600] text-white uppercase italic">
                        {topPick.matchStrategy || "Primary Recommendation"}
                      </span>
                   </div>
                   <h3 className="text-3xl font-black uppercase italic text-black leading-none mb-2">
                     {topPick.product?.name}
                   </h3>
                   <p className="text-[#00AEEF] text-sm font-bold uppercase tracking-widest mb-6">
                     {topPick.product?.manufacturer || topPick.product?.brand || "FiveO"} Precision Core | {topPick.product?.size_cc || topPick.product?.flow_rate_cc || "—"} cc/min
                   </p>

                   {/* Score */}
                   <div className="flex items-center gap-4 mb-8">
                      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${topPick.score || 0}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                          className="h-full bg-[#00AEEF]"
                        />
                      </div>
                      <span className="text-xl font-black text-[#00AEEF]">{topPick.score || 0}% Match</span>
                   </div>

                   <div className="flex flex-wrap gap-4 items-center">
                      <button 
                        onClick={() => setSelectedResult(topPick)}
                        className="oracle-cta-primary px-8 py-4 text-sm"
                      >
                        Explore Match Details
                      </button>
                      {topPick.product?.product_url && (
                        <a 
                          href={topPick.product.product_url} 
                          target="_blank" 
                          className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
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
            <div className="oracle-grid-centered w-full">
              {others.map((result: any, i: number) => (
                <motion.div
                  key={result.product?.id || i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * (i + 1) }}
                  onClick={() => setSelectedResult(result)}
                  className="oracle-result-card oracle-card-clickable bg-white rounded-lg border border-gray-100 overflow-hidden flex flex-col group"
                >
                  {/* Image Container - Fixed height, centered */}
                  <div className="h-56 bg-gray-50 flex items-center justify-center p-6 border-b border-gray-50 group-hover:bg-white transition-colors">
                    <img 
                      src={result.product?.heroImageUrl || result.product?.hero_image_url} 
                      alt={result.product?.name}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Content */}
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="mb-3">
                      <span className="text-[9px] font-black uppercase tracking-tighter text-[#00AEEF] border border-[#00AEEF] px-2 py-0.5 rounded">
                        {result.matchStrategy || "Optimal Selection"}
                      </span>
                    </div>

                    <h4 className="text-lg font-black uppercase italic text-black leading-tight mb-2 line-clamp-2">
                       {result.product?.name}
                    </h4>

                    {/* Compact Score */}
                    <div className="mt-auto pt-4 border-t border-gray-50">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Oracle Score</span>
                        <span className="text-sm font-black text-[#00AEEF]">{result.score}%</span>
                      </div>
                      
                      <button 
                        className="w-full bg-black text-white text-[11px] font-black uppercase py-3 tracking-widest hover:bg-[#00AEEF] transition-colors rounded-sm"
                      >
                        Explore Tech Breakdown
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Global Restart */}
        <div className="text-center mt-20">
          <button onClick={onRestart} className="oracle-cta-secondary px-10 py-4 opacity-50 hover:opacity-100 transition-opacity">
            Reset Advisor and Start New Build
          </button>
        </div>
      </div>

      {/* THE ORACLE DEEP-DIVE MODAL */}
      <AnimatePresence>
        {selectedResult && (
          <div className="oracle-modal-overlay" onClick={() => setSelectedResult(null)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="oracle-modal-content"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex justify-between items-center z-10">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.3em] text-[#00AEEF] mb-1">Expert Technical Analysis</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Direct from the FiveO Oracle</p>
                </div>
                <button 
                  onClick={() => setSelectedResult(null)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-8 md:p-12">
                <div className="md:flex gap-10 mb-12">
                   <div className="md:w-1/3 mb-6 md:mb-0">
                      <div className="bg-gray-50 rounded-xl p-6 aspect-square flex items-center justify-center">
                        <img 
                          src={selectedResult.product?.heroImageUrl || selectedResult.product?.hero_image_url} 
                          alt={selectedResult.product?.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                   </div>
                   <div className="md:w-2/3">
                      <h2 className="text-3xl font-black uppercase italic text-black leading-tight mb-4">
                        {selectedResult.product?.name}
                      </h2>
                      <div className="flex flex-wrap gap-3 mb-6">
                        <span className="bg-black text-white text-[10px] font-black px-3 py-1 uppercase italic">{selectedResult.matchStrategy}</span>
                        <span className="bg-[#00AEEF] text-white text-[10px] font-black px-3 py-1 uppercase italic">{selectedResult.score}% Compatibility</span>
                      </div>
                      <p className="text-lg text-gray-600 font-medium leading-relaxed">
                        {selectedResult.preferenceSummary}
                      </p>
                   </div>
                </div>

                <div className="h-px w-full bg-gray-100 mb-12"></div>

                {/* The Technical Narrative */}
                <div className="mb-12">
                  <h4 className="text-xs font-black uppercase tracking-[0.3em] text-black mb-6">Oracle technical Narrative</h4>
                  <div className="oracle-narrative-text whitespace-pre-wrap">
                    {selectedResult.technicalNarrative || "Analyzing detailed motor-sports data for this specific injector... This model offers precise fuel metering and robust internals designed for high-performance duty cycles. Contact FiveO Support for customized dead-time data specifically for your ECU."}
                  </div>
                  
                  <div className="oracle-pro-tip">
                    <p className="text-sm font-black uppercase tracking-widest text-[#00AEEF] mb-2 font-not-italic">Expert Tuning Advice</p>
                    <p className="text-gray-700 not-italic">
                      Ensure your ECU is calibrated for the specific impedance and flow rate of this {selectedResult.product?.brand || "FiveO"} injector. High-impedance injectors like these are plug-and-play for most modern engine management systems, but always verify fuel rail pressure for optimal atomization.
                    </p>
                  </div>
                </div>

                {/* Specs Grid */}
                <div className="bg-gray-50 rounded-xl p-8 mb-12">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6">Technical Specifications</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                      <p className="text-[9px] font-black uppercase text-[#00AEEF] mb-1">Flow Rate</p>
                      <p className="text-sm font-black text-black">{selectedResult.product?.flow_rate_cc || selectedResult.product?.size_cc || "—"} cc</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase text-[#00AEEF] mb-1">Impedance</p>
                      <p className="text-sm font-black text-black">{selectedResult.product?.impedance || "High (12-14Ω)"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase text-[#00AEEF] mb-1">Brand</p>
                      <p className="text-sm font-black text-black">{selectedResult.product?.brand || selectedResult.product?.manufacturer || "FiveO"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase text-[#00AEEF] mb-1">Connector</p>
                      <p className="text-sm font-black text-black">{selectedResult.product?.connector_type || "Standard"}</p>
                    </div>
                  </div>
                </div>

                {/* Final CTA */}
                <div className="flex flex-col md:flex-row gap-4">
                  {selectedResult.product?.product_url && (
                    <a 
                      href={selectedResult.product.product_url} 
                      target="_blank" 
                      className="oracle-cta-primary flex-1 text-center py-5 text-sm"
                    >
                      View & Add to Cart on FiveO Store
                    </a>
                  )}
                  <button 
                    onClick={() => setSelectedResult(null)}
                    className="border border-gray-200 px-8 py-5 text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-colors"
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
