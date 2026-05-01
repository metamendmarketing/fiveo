import React, { useState } from "react";
import { type BuildProfile, IMAGES, getStoreUrl } from "@/app/lib/constants";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb } from "lucide-react";
import { OracleApiResponse, ScoredProduct } from "@/app/lib/types";
import Image from "next/image";
import AskOracle from "./AskOracle";

/**
 * ProductCard — Individual injector display component
 */
function ProductCard({ result, onClick }: { result: ScoredProduct; onClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={`bg-white/5 backdrop-blur-md rounded-2xl border overflow-hidden flex flex-col group shadow-lg transition-all duration-300 hover:-translate-y-[4px] hover:shadow-[0_20px_40px_rgba(0,174,239,0.15)] hover:border-white/40 cursor-pointer ${
        result.tier === 1 ? "border-green-600/30" : (result.tier === 2 ? "border-[#00AEEF]/30" : "border-[#E10600]/30")
      }`}
    >
      <div className="h-52 bg-white/5 flex items-center justify-center p-6 border-b border-white/10 group-hover:bg-white/10 transition-colors relative overflow-hidden">
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity ${
          result.tier === 1 ? "bg-gradient-to-br from-green-600/5 to-transparent" : (result.tier === 2 ? "bg-gradient-to-br from-[#00AEEF]/5 to-transparent" : "bg-gradient-to-br from-[#E10600]/5 to-transparent")
        }`} />
        
        {/* Tier Badge */}
        <div className="absolute top-3 right-3 z-20">
          <span className={`text-[8px] font-black uppercase italic tracking-widest px-2 py-1 rounded-sm shadow-md ${
            result.tier === 1 ? "bg-green-600 text-white" : (result.tier === 2 ? "bg-[#00AEEF] text-white" : "bg-[#E10600] text-white")
          }`}>
            {result.fitmentBadge || (result.tier === 1 ? "Verified Direct Fit" : "Requires Verification")}
          </span>
        </div>

        <Image 
          src={result.product.hero_image_url || "/fiveo/demo/oracle/placeholder.png"} 
          alt={result.product.name}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-contain drop-shadow-md p-4"
        />
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="text-[8px] font-black uppercase tracking-widest text-white/40 border border-white/10 px-2 py-0.5 rounded-sm">
            {result.matchStrategy || "Expert Pick"}
          </span>
        </div>

        <h4 className="text-sm font-black uppercase italic text-white leading-tight mb-3 min-h-[2rem] line-clamp-2 group-hover:text-[#00AEEF] transition-colors">
           {result.product.name}
        </h4>

        <p className="text-[11px] text-white/50 mb-3">
          {result.product.flow_rate_cc || result.product.size_cc || "—"} cc/min · {result.product.manufacturer || result.product.brand || "FiveO"}
        </p>

        <div className="mt-auto pt-4 border-t border-white/10">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Compatibility</span>
            <span className={`text-lg font-black ${result.tier === 1 ? "text-green-500" : "text-[#00AEEF]"}`}>{result.score}%</span>
          </div>
          
          <button 
            className="w-full bg-black text-white text-[9px] font-black uppercase py-3 tracking-[0.15em] hover:bg-[#00AEEF] transition-colors rounded"
          >
            Explore Fitment
          </button>
        </div>
      </div>
    </motion.div>
  );
}

interface Props {
  profile: BuildProfile;
  results: ScoredProduct[];
  apiData: OracleApiResponse | null;
  onRestart: () => void;
  onEdit: () => void;
}

/**
 * ResultsPresentation — Final matched component display
 * 
 * Renders the top recommended injector as a featured card, followed by
 * a grid of alternative matches. Includes an interactive modal for
 * viewing the AI-generated technical narrative and engineering specs.
 */
/**
 * ResultsPresentation Component
 * 
 * Final cinematic display for the Oracle recommendation engine.
 * 
 * Features:
 * - Featured "Primary Match" spotlighting the top-scored injector.
 * - Alternative Candidates grid for lower-scored but compatible matches.
 * - Glassmorphic design language with backdrop blurs and subtle gradients.
 * - Deep Dive Modal for AI-generated engineering analysis and persona-based consultation.
 * - Optimized image delivery using next/image with intelligent resizing.
 */
export const ResultsPresentation = React.memo(function ResultsPresentation({ 
  profile,
  results, 
  apiData, 
  onRestart, 
  onEdit 
}: Props) {
  const [selectedResult, setSelectedResult] = useState<ScoredProduct | null>(null);

  // Hard "No Match" state: Only show if we don't even have AI guidance or heuristic pool
  if ((!results || results.length === 0) && (!apiData || !apiData.selectionStrategy)) {
    return (
      <div 
      className="relative min-h-[60dvh] px-6 py-20 flex items-center justify-center overflow-hidden"
      style={{
        backgroundImage: `url(${IMAGES.carbonFiber})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/80 to-black/90" />
      <div className="relative z-10 max-w-3xl mx-auto text-center">
        
          <h2 className="text-2xl font-black uppercase italic text-white drop-shadow-md mb-4">
            No Matches Found
          </h2>
          <p className="text-white/60 drop-shadow-sm mb-8">
            {apiData?.reason || "We couldn't find injectors matching your exact specifications. Try adjusting your criteria."}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button onClick={onRestart} className="bg-[#E10600] text-white font-black italic uppercase tracking-[0.2em] px-8 py-3 rounded-sm transition-all hover:bg-[#c70500]">
              Start Over
            </button>
            <button onClick={onEdit} className="bg-[#00AEEF] text-white font-black italic uppercase tracking-[0.2em] px-8 py-3 rounded-sm transition-all hover:bg-[#0088cc]">
              Edit Build
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tiers = {
    1: results.filter(r => r.tier === 1),
    2: results.filter(r => r.tier === 2),
    3: results.filter(r => r.tier === 3),
  };

  const hasAnyResults = results.length > 0;

  return (
    <div className="w-full flex flex-col">
      <div className="w-full max-w-7xl mx-auto flex flex-col gap-6">
      
        
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-4xl font-black uppercase italic text-white drop-shadow-md mb-1">
            Oracle <span className={apiData?.noVerifiedMatches ? "text-[#E10600]" : "text-[#00AEEF]"}>
              {apiData?.noVerifiedMatches ? "Expert Guidance" : "Selection"}
            </span>
          </h2>
          {apiData?.vehicleLabel && (
            <p className="text-sm font-black uppercase tracking-[0.2em] text-white/50 drop-shadow-sm mb-6">
              Project: <span className="text-white">{apiData.vehicleLabel}</span>
            </p>
          )}

          <div className="flex flex-col items-center gap-1">
            <p className="text-[10px] text-white/60 uppercase tracking-[0.3em] font-black drop-shadow-sm">
              {results.length > 0 ? (
                `${results.length} Precision-Matched Candidate${results.length !== 1 ? "s" : ""}`
              ) : (
                "No Verified Direct-Fit Injectors Found"
              )}
            </p>
            {apiData && !apiData.noVerifiedMatches && apiData.fitmentMatches > 0 && (
              <p className="text-[10px] text-green-600 font-bold uppercase tracking-widest">
                ✓ {apiData.fitmentMatches} Vehicle-Specific Fitment Match{apiData.fitmentMatches !== 1 ? "es" : ""} Found
              </p>
            )}
            {apiData?.noVerifiedMatches && (
              <p className="text-[10px] text-yellow-500 font-bold uppercase tracking-widest px-4 py-1 border border-yellow-500/30 bg-yellow-500/10 rounded-full mt-2">
                Displaying Advanced / Custom Build Options Only
              </p>
            )}
          </div>
        </div>

        {/* AI Selection Strategy Overview */}
        {apiData?.selectionStrategy && (
          <div className={`bg-white/5 backdrop-blur-md rounded-2xl border border-white/20 border-t-[3px] p-8 md:p-12 text-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] ${
            apiData.noVerifiedMatches ? "border-t-yellow-500" : "border-t-[#00AEEF]"
          }`}>
            <h3 className={`text-[10px] font-black uppercase tracking-[0.5em] mb-6 ${
              apiData.noVerifiedMatches ? "text-yellow-500" : "text-[#00AEEF]"
            }`}>
              {apiData.noVerifiedMatches ? "Recommended Expert Performance Path" : "Fuel Injector Selection Methodology"}
            </h3>
            <p className={`text-base md:text-lg text-white/90 leading-relaxed italic font-medium border-l-4 pl-8 ${
              apiData.noVerifiedMatches ? "border-yellow-500" : "border-[#00AEEF]"
            }`}>
              &quot;{apiData.selectionStrategy}&quot;
            </p>
          </div>
        )}

        {/* Tiered Results Sections */}
        <div className="flex flex-col gap-16 pb-20">
          
          {/* TIER 1: DIRECT FIT */}
          {tiers[1].length > 0 && (
            <div className="flex flex-col gap-8">
              <div className="flex items-center gap-4">
                <h3 className="text-xl font-black uppercase italic text-white flex items-center gap-3">
                  Verified Direct Fit
                </h3>
                <div className="flex-1 h-px bg-green-600/30" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tiers[1].map((result, i) => (
                  <ProductCard key={result.product.id || i} result={result} onClick={() => setSelectedResult(result)} />
                ))}
              </div>
            </div>
          )}

          {/* TIER 2: CLOSEST COMPATIBLE CANDIDATES */}
          {tiers[2].length > 0 && (
            <div className="flex flex-col gap-8">
              <div className="flex items-center gap-4">
                <h3 className="text-xl font-black uppercase italic text-white flex items-center gap-3">
                  Closest Compatible Candidates
                </h3>
                <div className="flex-1 h-px bg-[#00AEEF]/30" />
              </div>
              <p className="text-white/60 text-sm italic -mt-4 border-l-2 border-[#00AEEF] pl-4">
                These options are technically close but require manual verification of connectors, dimensions, or tuning before installation.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tiers[2].map((result, i) => (
                  <ProductCard key={result.product.id || i} result={result} onClick={() => setSelectedResult(result)} />
                ))}
              </div>
            </div>
          )}

          {/* TIER 3: ADVANCED CUSTOM BUILD OPTIONS */}
          {tiers[3].length > 0 && (
            <div className="flex flex-col gap-8">
              <div className="flex items-center gap-4">
                <h3 className="text-xl font-black uppercase italic text-white flex items-center gap-3">
                  Advanced Custom Build Options
                </h3>
                <div className="flex-1 h-px bg-[#E10600]/30" />
              </div>
              <p className="text-white/60 text-sm italic -mt-4 border-l-2 border-[#E10600] pl-4">
                Specialty injectors intended for high-output, non-factory fuel systems. Require professional custom tuning and potential physical modifications.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tiers[3].map((result, i) => (
                  <ProductCard key={result.product.id || i} result={result} onClick={() => setSelectedResult(result)} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Reset Flow Actions */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-6 pb-20">
          <button 
            onClick={onRestart} 
            className="bg-[#E10600] text-white font-black uppercase tracking-[0.2em] border border-transparent rounded-xl px-12 py-5 hover:bg-[#c70500] transition-all text-xs shadow-lg"
          >
            Start over
          </button>
          <button 
            onClick={onEdit} 
            className="bg-[#00AEEF] text-white font-black uppercase tracking-[0.2em] border border-transparent rounded-xl px-12 py-5 hover:bg-[#0088cc] transition-all text-xs shadow-lg"
          >
            Edit your build
          </button>
        </div>
      </div>

      {/* THE ORACLE DEEP-DIVE MODAL */}
      <AnimatePresence>
        {selectedResult && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[1000] flex items-center justify-center p-4 sm:p-6 md:p-8" onClick={() => setSelectedResult(null)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90dvh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div>
                  <h2 className="text-xl font-black uppercase italic text-[#00AEEF] drop-shadow-md">
                    Oracle Technical <span className="text-white">Deep-Dive</span>
                  </h2>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-bold mt-1">
                    Authentic FiveO Expert Knowledge
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedResult(null)}
                  className="text-white/50 hover:text-white transition-colors p-2"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-6 custom-scrollbar">
                
                {/* Hero Section */}
                <div className="flex flex-col md:flex-row gap-8 items-start">
                   {/* Product Image */}
                   <div className="w-full md:w-1/3 shrink-0">
                      <div className="bg-white/5 border border-white/10 rounded-xl p-8 aspect-square flex items-center justify-center shadow-inner relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#00AEEF]/10 to-transparent" />
                        <Image 
                          src={selectedResult.product.hero_image_url || "/fiveo/demo/oracle/placeholder.png"} 
                          alt={selectedResult.product.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-contain relative z-10 p-6 drop-shadow-lg"
                        />
                      </div>
                   </div>
                   
                   {/* Core Details */}
                   <div className="w-full md:w-2/3 flex flex-col justify-center">
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="bg-white/10 border border-white/20 text-white text-[9px] font-black px-3 py-1 uppercase italic tracking-widest rounded-sm">
                          {selectedResult.matchStrategy || "Technical Recommendation"}
                        </span>
                        <span className="bg-[#00AEEF]/10 text-[#00AEEF] text-[9px] font-black px-3 py-1 uppercase italic tracking-widest border border-[#00AEEF]/20 rounded-sm">
                          {selectedResult.score}% Compatibility
                        </span>
                      </div>
                      
                      {selectedResult.aiHeadline && (
                        <h3 className="text-2xl md:text-3xl font-black uppercase italic text-[#00AEEF] leading-tight mb-2">
                          {selectedResult.aiHeadline}
                        </h3>
                      )}
                      
                      <h4 className={`text-lg md:text-xl font-black uppercase italic leading-tight mb-4 ${selectedResult.aiHeadline ? 'text-white/70' : 'text-white'}`}>
                        {selectedResult.product.name}
                      </h4>
                      
                      <p className="text-sm md:text-base text-white/80 font-medium leading-relaxed italic border-l-2 border-[#00AEEF] pl-4">
                        &quot;{selectedResult.preferenceSummary}&quot;
                      </p>
                   </div>
                </div>

                {/* The Expert's Rationale */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 md:p-8">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#00AEEF] mb-4">The Expert&apos;s Rationale</h4>
                  <div className="text-sm md:text-base text-white/80 leading-relaxed whitespace-pre-wrap mb-6">
                    {selectedResult.technicalNarrative || "I've hand-selected this injector because its flow characteristics and modern internals are a perfect match for your power goals. Its high-impedance design ensures clean communication with your factory ECU, while the optimized spray pattern maintains smooth drivability even at high loads."}
                  </div>
                  
                  {selectedResult.proTip && (
                    <div className="bg-[#00AEEF]/5 border-l-4 border-[#00AEEF] p-5 rounded-r-xl relative backdrop-blur-sm mt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="w-4 h-4 text-[#00AEEF] fill-[#00AEEF]/20" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00AEEF] m-0">Expert Consultant Pro-Tip</p>
                      </div>
                      <p className="text-white/90 text-sm leading-relaxed italic pl-6">
                        &quot;{selectedResult.proTip}&quot;
                      </p>
                    </div>
                  )}
                </div>

                {/* What to Verify Before Purchase (Tier 2/3 Only) */}
                {(selectedResult.tier === 2 || selectedResult.tier === 3) && (
                  <div className={`rounded-xl border p-6 md:p-8 ${
                    selectedResult.tier === 3 ? "bg-[#E10600]/5 border-[#E10600]/30" : "bg-[#00AEEF]/5 border-[#00AEEF]/30"
                  }`}>
                    <h4 className={`text-[10px] font-black uppercase tracking-[0.4em] mb-4 ${
                      selectedResult.tier === 3 ? "text-[#E10600]" : "text-[#00AEEF]"
                    }`}>What to Verify Before Purchase</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(selectedResult.whatToVerify && selectedResult.whatToVerify.length > 0) ? (
                        selectedResult.whatToVerify.map((check, idx) => (
                          <div key={idx} className="flex items-center gap-3 text-sm text-white/70">
                            <div className={`w-1.5 h-1.5 rounded-full ${selectedResult.tier === 3 ? "bg-[#E10600]" : "bg-[#00AEEF]"}`} />
                            {check}
                          </div>
                        ))
                      ) : (
                        ["injector type (DI vs Port)", "connector compatibility", "impedance", "physical dimensions", "tuning requirements"].map((check, idx) => (
                          <div key={idx} className="flex items-center gap-3 text-sm text-white/70">
                            <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                            {check}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Engineering Specifications */}
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/50 mb-4 border-b border-white/10 pb-2">Engineering Specifications</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <p className="text-[9px] font-black uppercase text-[#00AEEF] mb-1 tracking-widest">Flow Rate</p>
                      <p className="text-sm font-black text-white">{selectedResult.product.flow_rate_cc || selectedResult.product.size_cc || "—"} cc</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <p className="text-[9px] font-black uppercase text-[#00AEEF] mb-1 tracking-widest">Impedance</p>
                      <p className="text-sm font-black text-white">{selectedResult.product.impedance || "High (12-14Ω)"}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <p className="text-[9px] font-black uppercase text-[#00AEEF] mb-1 tracking-widest">Brand</p>
                      <p className="text-sm font-black text-white">{selectedResult.product.brand || selectedResult.product.manufacturer || "FiveO"}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <p className="text-[9px] font-black uppercase text-[#00AEEF] mb-1 tracking-widest">Connector</p>
                      <p className="text-sm font-black text-white">{selectedResult.product.connector_type || "Standard"}</p>
                    </div>
                  </div>
                </div>

                {/* Ask the Oracle — Collapsible Q&A */}
                <AskOracle
                  productId={selectedResult.product.id}
                  productName={selectedResult.product.name}
                  buildProfile={profile}
                />

              </div>

              {/* Fixed Footer Actions */}
              <div className="p-6 border-t border-white/10 bg-black/40 backdrop-blur-md flex flex-col md:flex-row justify-end gap-4">
                <button 
                  onClick={() => setSelectedResult(null)}
                  className="px-6 py-3 text-xs font-black uppercase tracking-widest text-white/70 hover:text-white transition-colors border border-transparent rounded-lg hover:bg-white/5"
                >
                  Back to Results
                </button>
                  <a 
                    href={getStoreUrl(selectedResult.product)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-[#E10600] text-white text-xs font-black uppercase tracking-[0.2em] px-8 py-3 rounded-lg shadow-[0_4px_16px_rgba(225,6,0,0.25)] hover:bg-[#c70500] hover:-translate-y-[1px] hover:shadow-[0_6px_24px_rgba(225,6,0,0.35)] transition-all flex items-center justify-center"
                  >
                    View in Store
                  </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
});
// Force Deploy: Explore Fitment Update
