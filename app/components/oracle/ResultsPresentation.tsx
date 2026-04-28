import React, { useState, useEffect } from "react";
import { type BuildProfile, IMAGES, getStoreUrl } from "@/app/lib/constants";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb } from "lucide-react";
import { OracleApiResponse, ScoredProduct } from "@/app/lib/types";
import Image from "next/image";
import AskOracle from "./AskOracle";

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
  const [localResults, setLocalResults] = useState<ScoredProduct[]>(results);

  // Synchronize local results when prop changes (on initial load)
  useEffect(() => {
    setLocalResults(results);
  }, [results]);

  useEffect(() => {
    // Detect which results actually have high-quality AI narratives vs heuristic fallbacks
    const resultsWithAi = results.filter(r => r.technicalNarrative && !r.matchStrategy?.includes("Expert Fitment Match"));
    
    console.log(`[ResultsPresentation] Total results: ${results.length}, Quality AI results: ${resultsWithAi.length}`);

    // Trigger background fetch if we have some AI results but not all, OR if we have at least 2
    // We relax the condition "resultsWithAi.length <= 3" because sometimes AI might only return 2
    if (results.length > resultsWithAi.length && resultsWithAi.length >= 1) {
      console.log(`[ResultsPresentation] Triggering background fetch for remaining ${results.length - resultsWithAi.length} narratives...`);
      
      (async () => {
        try {
          const skipIds = resultsWithAi.map(r => r.product.id);
          const res = await fetch("/fiveo/demo/api/oracle", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ profile, tier: "remaining", skipIds }),
          });
          if (!res.ok) throw new Error(`Background API error: ${res.status}`);
          const data: OracleApiResponse = await res.json();
          const newAiResults = data.results;
          
          console.log(`[ResultsPresentation] Background fetch success! Received ${newAiResults.length} new narratives.`);

          setLocalResults(prev => prev.map(p => {
            const match = newAiResults.find(n => n.product.id === p.product.id);
            if (match) {
              console.log(`[ResultsPresentation] Swapping narrative for product: ${p.product.name}`);
              return { ...p, ...match };
            }
            return p;
          }));
        } catch (err) {
          console.error("[ResultsPresentation] Background AI fetch failed:", err);
        }
      })();
    }
  }, [profile, results]);

  if (!results || results.length === 0) {
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

  const topPick = localResults[0];
  const others = localResults.slice(1);

  return (
    <div className="w-full flex flex-col">
      <div className="w-full max-w-7xl mx-auto flex flex-col gap-6">
      
        
        {/* Results Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-4xl font-black uppercase italic text-white drop-shadow-md mb-1">
            Oracle <span className="text-[#00AEEF]">Selection</span>
          </h2>
          {apiData?.vehicleLabel && (
            <p className="text-sm font-black uppercase tracking-[0.2em] text-white/50 drop-shadow-sm mb-6">
              Project: <span className="text-white">{apiData.vehicleLabel}</span>
            </p>
          )}

          <div className="flex flex-col items-center gap-1">
            <p className="text-[10px] text-white/60 uppercase tracking-[0.3em] font-black drop-shadow-sm">
              {localResults.length} Precision-Matched Injector{localResults.length !== 1 ? "s" : ""}
            </p>
            {apiData && apiData.fitmentMatches > 0 && (
              <p className="text-[10px] text-green-600 font-bold uppercase tracking-widest">
                ✓ {apiData.fitmentMatches} Vehicle-Specific Fitment Match{apiData.fitmentMatches !== 1 ? "es" : ""} Found
              </p>
            )}
          </div>
        </div>

        {/* AI Selection Strategy Overview */}
        {apiData?.selectionStrategy && (
          <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/20 border-t-[3px] border-t-[#00AEEF] p-8 md:p-12 text-white shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
            <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-[#00AEEF] mb-6">
              Fuel Injector Selection Methodology
            </h3>
            <p className="text-base md:text-lg text-white/90 leading-relaxed italic font-medium border-l-4 border-[#00AEEF] pl-8">
              &quot;{apiData.selectionStrategy}&quot;
            </p>
          </div>
        )}

        {/* Results Grid/List */}
        <div className="flex flex-col gap-6">
          
          {/* 1. Primary Recommendation (Featured) */}
          {topPick && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_12px_40px_rgba(0,174,239,0.15)] shadow-xl relative"
            >
              <div className="absolute top-0 right-0 p-6 z-20">
                <div className="bg-gradient-to-br from-[#00AEEF] to-[#0088cc] text-white text-[10px] font-extrabold uppercase tracking-[0.15em] px-3 py-1 rounded-sm inline-block bg-black text-white px-5 py-1.5 text-[9px] uppercase font-black tracking-widest italic">
                  ★ Primary Match
                </div>
              </div>

              <div className="md:flex items-stretch min-h-[340px]">
                <div className="h-64 md:h-auto md:w-2/5 bg-white/5 flex items-center justify-center p-6 md:p-14 border-b md:border-b-0 md:border-r border-white/10 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#00AEEF]/5 to-transparent" />
                  <Image 
                    src={topPick.product.hero_image_url || "/fiveo/demo/oracle/placeholder.png"} 
                    alt={topPick.product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 40vw"
                    className="object-contain drop-shadow-2xl p-6 md:p-8"
                  />
                </div>
                
                {/* Essential Details */}
                <div className="md:w-3/5 p-8 md:p-12 flex flex-col justify-center">
                   <div className="flex flex-wrap gap-2 mb-4">
                      <span className="text-[9px] px-3 py-1 font-black bg-[#E10600] text-white uppercase italic tracking-widest rounded-sm">
                        {topPick.matchStrategy || "Top Recommendation"}
                      </span>
                      {topPick.hasFitment && (
                        <span className="text-[9px] px-3 py-1 font-black bg-green-600 text-white uppercase tracking-widest rounded-sm">✓ Fitment Confirmed</span>
                      )}
                   </div>
                   <h3 className="text-xl md:text-2xl font-black uppercase italic text-white leading-tight mb-2 line-clamp-2">
                     {topPick.product.name}
                   </h3>
                   <p className="text-[#00AEEF] text-xs font-bold uppercase tracking-[0.15em] mb-6">
                     {topPick.product.manufacturer || topPick.product.brand || "FiveO"} | {topPick.product.flow_rate_cc || topPick.product.size_cc || "—"} cc/min
                   </p>

                   {topPick.preferenceSummary && (
                     <p className="text-sm text-white/70 italic mb-6 leading-relaxed">&quot;{topPick.preferenceSummary}&quot;</p>
                   )}

                   {/* Compatibility Score */}
                   <div className="flex items-center gap-4 mb-8">
                      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden border border-white/5">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${topPick.score || 0}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                          className="h-full bg-[#00AEEF]"
                        />
                      </div>
                      <span className="text-xl font-black text-[#00AEEF] tracking-tighter whitespace-nowrap">{topPick.score || 0}%</span>
                   </div>

                   <div className="flex flex-wrap gap-6 items-center">
                      <button 
                        onClick={() => setSelectedResult(topPick)}
                        className="bg-[#E10600] text-white font-black italic uppercase tracking-[0.2em] rounded-sm transition-all duration-200 shadow-[0_4px_16px_rgba(225,6,0,0.25)] hover:bg-[#c70500] hover:-translate-y-[1px] hover:shadow-[0_6px_24px_rgba(225,6,0,0.35)] px-10 py-4 text-xs font-black tracking-[0.2em]"
                      >
                        Explore Tech Deep-Dive
                      </button>
                      {topPick.product && (
                        <a 
                          href={getStoreUrl(topPick.product)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-300 hover:text-white transition-colors border-b border-gray-600 hover:border-white pb-1"
                        >
                          View in Store →
                        </a>
                      )}
                   </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 2. Alternative Candidates Grid */}
          {others.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
              {others.map((result, i) => (
                <motion.div
                  key={result.product.id || i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * (i + 1) }}
                  onClick={() => setSelectedResult(result)}
                  className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden flex flex-col group shadow-lg transition-all duration-300 hover:-translate-y-[4px] hover:shadow-[0_20px_40px_rgba(0,174,239,0.15)] hover:border-white/40 cursor-pointer"
                >
                  <div className="h-52 bg-white/5 flex items-center justify-center p-6 border-b border-white/10 group-hover:bg-white/10 transition-colors relative overflow-hidden"><div className="absolute inset-0 bg-gradient-to-br from-[#00AEEF]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
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
                      <span className="text-[8px] font-black uppercase tracking-widest text-[#00AEEF] border border-[#00AEEF]/30 px-2 py-0.5 rounded-sm">
                        {result.matchStrategy || "Expert Alternative"}
                      </span>
                      {result.hasFitment && (
                        <span className="text-[8px] font-black uppercase tracking-widest text-green-600 border border-green-200 px-2 py-0.5 rounded-sm">✓ Fitment</span>
                      )}
                    </div>

                    <h4 className="text-sm font-black uppercase italic text-white leading-tight mb-3 min-h-[2rem] line-clamp-2">
                       {result.product.name}
                    </h4>

                    <p className="text-[11px] text-white/50 mb-3">
                      {result.product.flow_rate_cc || result.product.size_cc || "—"} cc/min · {result.product.manufacturer || result.product.brand || "FiveO"}
                    </p>

                    <div className="mt-auto pt-4 border-t border-white/10">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Compatibility</span>
                        <span className="text-lg font-black text-[#00AEEF]">{result.score}%</span>
                      </div>
                      
                      <button 
                        className="w-full bg-black text-white text-[9px] font-black uppercase py-3 tracking-[0.15em] hover:bg-[#00AEEF] transition-colors rounded"
                      >
                        Explore Fitment
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
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
                    {selectedResult.technicalNarrative || "I've selected this injector because it offers a perfect balance of reliability and performance for your specific setup. Its modern architecture ensures smooth idle quality while providing the extra headroom you're looking for."}
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
