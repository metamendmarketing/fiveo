import React, { useState } from "react";
import { type BuildProfile, IMAGES } from "@/app/lib/constants";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb } from "lucide-react";
import { OracleApiResponse, ScoredProduct } from "@/app/lib/types";

interface Props {
  profile: BuildProfile;
  results: ScoredProduct[];
  apiData: OracleApiResponse | null;
  onRestart: () => void;
}

/**
 * ResultsPresentation — Final matched component display
 * 
 * Renders the top recommended injector as a featured card, followed by
 * a grid of alternative matches. Includes an interactive modal for
 * viewing the AI-generated technical narrative and engineering specs.
 */
export function ResultsPresentation({ results, apiData, onRestart }: Props) {
  const [selectedResult, setSelectedResult] = useState<ScoredProduct | null>(null);

  // Handle empty state
  if (!results || results.length === 0) {
    return (
      <div 
      className="relative min-h-[60vh] px-6 py-20 flex items-center justify-center overflow-hidden"
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
          <button onClick={onRestart} className="bg-[#E10600] text-white font-black italic uppercase tracking-[0.2em] rounded-sm transition-all duration-200 shadow-[0_4px_16px_rgba(225,6,0,0.25)] hover:bg-[#c70500] hover:-translate-y-[1px] hover:shadow-[0_6px_24px_rgba(225,6,0,0.35)]">
            Start Over
          </button>
        </div>
      </div>
    );
  }

  const topPick = results[0];
  const others = results.slice(1);

  return (
    <div className="w-full h-full flex flex-col justify-center">
      <div className="w-full max-w-7xl mx-auto">
      
        
        {/* Results Header */}
        <div className="text-center mb-14">
          <h2 className="text-2xl md:text-4xl font-black uppercase italic text-white drop-shadow-md mb-1">
            Oracle <span className="text-[#00AEEF]">Selection</span>
          </h2>
          {apiData?.vehicleLabel && (
            <p className="text-sm font-black uppercase tracking-[0.2em] text-white/50 drop-shadow-sm mb-6">
              Project: <span className="text-white">{apiData.vehicleLabel}</span>
            </p>
          )}
          <div className="h-0.5 w-16 bg-[#00AEEF] mx-auto mb-4"></div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-[10px] text-white/60 uppercase tracking-[0.3em] font-black drop-shadow-sm">
              {results.length} Precision-Matched Component{results.length !== 1 ? "s" : ""}
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
          <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/20 border-t-[3px] border-t-[#00AEEF] p-8 md:p-12 mb-10 text-white shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
            <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-[#00AEEF] mb-6">
              Fuel Injector Selection Methodology
            </h3>
            <p className="text-base md:text-lg text-white/90 leading-relaxed italic font-medium border-l-4 border-[#00AEEF] pl-8">
              &quot;{apiData.selectionStrategy}&quot;
            </p>
          </div>
        )}

        {/* Results Grid/List */}
        <div className="flex flex-col gap-10">
          
          {/* 1. Primary Recommendation (Featured) */}
          {topPick && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_12px_40px_rgba(0,174,239,0.15)] shadow-xl relative"
            >
              <div className="absolute top-0 right-0 p-6">
                <div className="bg-gradient-to-br from-[#00AEEF] to-[#0088cc] text-white text-[10px] font-extrabold uppercase tracking-[0.15em] px-3 py-1 rounded-sm inline-block bg-black text-white px-5 py-1.5 text-[9px] uppercase font-black tracking-widest italic">
                  ★ Primary Match
                </div>
              </div>

              <div className="md:flex items-stretch min-h-[340px]">
                {/* Product Image */}
                <div className="md:w-2/5 bg-white/5 flex items-center justify-center p-10 md:p-14 border-r border-white/10 relative"><div className="absolute inset-0 bg-gradient-to-br from-[#00AEEF]/5 to-transparent" />
                  <img 
                    src={topPick.product.hero_image_url || "/fiveo/demo/oracle/placeholder.png"} 
                    alt={topPick.product.name}
                    className="w-full h-full object-contain max-h-64"
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
                      {topPick.product.product_url && (
                        <a 
                          href={topPick.product.product_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
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

          {/* 2. Alternative Candidates Grid */}
          {others.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full mt-4">
              {others.map((result, i) => (
                <motion.div
                  key={result.product.id || i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * (i + 1) }}
                  onClick={() => setSelectedResult(result)}
                  className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden flex flex-col group shadow-lg transition-all duration-300 hover:-translate-y-[4px] hover:shadow-[0_20px_40px_rgba(0,174,239,0.15)] hover:border-white/40 cursor-pointer"
                >
                  <div className="h-52 bg-white/5 flex items-center justify-center p-6 border-b border-white/10 group-hover:bg-white/10 transition-colors relative"><div className="absolute inset-0 bg-gradient-to-br from-[#00AEEF]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <img 
                      src={result.product.hero_image_url || "/fiveo/demo/oracle/placeholder.png"} 
                      alt={result.product.name}
                      className="w-full h-full object-contain"
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
                        Explore Analysis
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Reset Flow */}
        <div className="text-center mt-24">
          <button onClick={onRestart} className="bg-white/5 backdrop-blur-sm text-white/50 font-bold uppercase tracking-wider border border-white/20 rounded-xl px-12 py-4 hover:text-white hover:border-white/50 hover:bg-white/10 transition-all text-[10px]">
            Return to Advisor and Start New Build
          </button>
        </div>
      </div>

      {/* THE ORACLE DEEP-DIVE MODAL */}
      <AnimatePresence>
        {selectedResult && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-lg z-[1000] flex items-center justify-center p-4 sm:p-6" onClick={() => setSelectedResult(null)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black/90 backdrop-blur-2xl w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-y-auto relative shadow-[0_0_80px_rgba(0,174,239,0.15)] border border-white/20"
            >
              <div className="sticky top-0 bg-[#0a0a0a] border-b border-white/10 px-4 sm:px-6 lg:px-8 py-8 flex justify-between items-center z-50 rounded-t-3xl shadow-xl">
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#00AEEF] mb-1">Oracle Technical Deep-Dive</h3>
                  <p className="text-[9px] text-gray-300 font-bold uppercase tracking-widest italic">Authentic FiveO Expert Knowledge</p>
                </div>
                <button 
                  onClick={() => setSelectedResult(null)}
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-colors text-white text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="px-4 sm:px-6 lg:px-12 py-16 md:py-24">
                {/* Hero Section */}
                <div className="md:flex gap-16 mb-24">
                   <div className="md:w-1/3 mb-10 md:mb-0">
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-10 aspect-square flex items-center justify-center shadow-inner relative"><div className="absolute inset-0 bg-gradient-to-br from-[#00AEEF]/10 to-transparent" />
                        <img 
                          src={selectedResult.product.hero_image_url || "/fiveo/demo/oracle/placeholder.png"} 
                          alt={selectedResult.product.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                   </div>
                    <div className="md:w-2/3 flex flex-col justify-center">
                      {selectedResult.aiHeadline && (
                        <h2 className="text-3xl md:text-5xl font-black uppercase italic text-[#00AEEF] leading-tight mb-4">
                          {selectedResult.aiHeadline}
                        </h2>
                      )}
                      <h3 className={`text-xl font-black uppercase italic text-white leading-tight ${selectedResult.aiHeadline ? 'mb-6 text-white/50' : 'mb-6 text-3xl'}`}>
                        {selectedResult.product.name}
                      </h3>
                      <div className="flex flex-wrap gap-4 mb-10 mt-2">
                        <span className="bg-white/10 border border-white/20 text-white text-[9px] font-black px-4 py-1.5 uppercase italic tracking-widest rounded-sm">{selectedResult.matchStrategy || "Technical Recommendation"}</span>
                        <span className="bg-[#00AEEF]/10 text-[#00AEEF] text-[9px] font-black px-4 py-1.5 uppercase italic tracking-widest border border-[#00AEEF]/20">{selectedResult.score}% Compatibility</span>
                      </div>
                      <p className="text-xl text-white/80 font-medium leading-relaxed italic border-l-4 border-white/20 pl-8">
                        &quot;{selectedResult.preferenceSummary}&quot;
                      </p>
                   </div>
                </div>

                <div className="h-px w-full bg-white/10 mb-24"></div>

                <div className="mb-24 pt-8">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-300 mb-12 text-center underline underline-offset-8 decoration-[#00AEEF]/30">The Expert&apos;s Rationale</h4>
                  <div className="text-lg md:text-xl text-white/80 leading-relaxed whitespace-pre-wrap mb-16">
                    {selectedResult.technicalNarrative || "I&apos;ve selected this injector because it offers a perfect balance of reliability and performance for your specific setup. Its modern architecture ensures smooth idle quality while providing the extra headroom you&apos;re looking for."}
                  </div>
                  
                  {selectedResult.proTip && (
                    <div className="bg-[#00AEEF]/5 border-l-4 border-[#00AEEF] p-8 md:p-10 rounded-r-2xl relative backdrop-blur-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <Lightbulb className="w-6 h-6 text-[#00AEEF] fill-[#00AEEF]/20" />
                        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#00AEEF] m-0">Expert Consultant Pro-Tip</p>
                      </div>
                      <p className="text-white/90 text-xl leading-relaxed italic font-medium pl-9">
                        &quot;{selectedResult.proTip}&quot;
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-white/5 rounded-2xl p-12 mb-24 border border-white/10 mt-16">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 mb-10">Engineering Specifications</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
                    <div>
                      <p className="text-[10px] font-black uppercase text-[#00AEEF] mb-2 tracking-widest">Flow Rate</p>
                      <p className="text-base font-black text-white">{selectedResult.product.flow_rate_cc || selectedResult.product.size_cc || "—"} cc</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-[#00AEEF] mb-2 tracking-widest">Impedance</p>
                      <p className="text-base font-black text-white">{selectedResult.product.impedance || "High (12-14Ω)"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-[#00AEEF] mb-2 tracking-widest">Brand</p>
                      <p className="text-base font-black text-white">{selectedResult.product.brand || selectedResult.product.manufacturer || "FiveO"}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase text-[#00AEEF] mb-3 tracking-widest">Connector</p>
                      <p className="text-lg font-black text-white">{selectedResult.product.connector_type || "Standard"}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col md:flex-row gap-8">
                  {selectedResult.product.product_url && (
                    <a 
                      href={selectedResult.product.product_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-[#E10600] text-white font-black italic uppercase tracking-[0.2em] rounded-sm transition-all duration-200 shadow-[0_4px_16px_rgba(225,6,0,0.25)] hover:bg-[#c70500] hover:-translate-y-[1px] hover:shadow-[0_6px_24px_rgba(225,6,0,0.35)] flex-1 text-center py-6 text-xs font-black tracking-widest"
                    >
                      Browse In Full FiveO Catalog
                    </a>
                  )}
                  <button 
                    onClick={() => setSelectedResult(null)}
                    className="border border-white/20 bg-white/5 rounded-sm px-10 py-6 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors text-white/50 hover:text-white"
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
