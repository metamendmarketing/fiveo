/**
 * ResultsPresentation — Final results page showing matched products
 */
"use client";

import type { BuildProfile } from "@/app/lib/constants";

interface Props {
  profile: BuildProfile;
  results: any[];
  apiData: any;
  onRestart: () => void;
}

export function ResultsPresentation({ profile, results, apiData, onRestart }: Props) {
  if (!results || results.length === 0) {
    return (
      <div className="oracle-bg-results min-h-[60vh] px-4 py-12">
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

  return (
    <div className="oracle-bg-results min-h-[60vh] px-4 py-10">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black uppercase italic text-black mb-2">
            Your <span className="text-[#00AEEF]">Results</span>
          </h2>
          <p className="text-sm text-gray-500 uppercase tracking-widest font-bold">
            {results.length} injector{results.length !== 1 ? "s" : ""} matched to your build
          </p>
          {profile.make && profile.model && (
            <p className="text-xs text-gray-400 mt-1">
              {profile.year} {profile.make} {profile.model}
              {profile.engineLabel ? ` — ${profile.engineLabel}` : ""}
            </p>
          )}
        </div>

        {/* AI Selection Strategy (if available) */}
        {apiData?.selectionStrategy && (
          <div className="oracle-strategy-card p-6 mb-8 text-white">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00AEEF] mb-2">
              Selection Strategy
            </h3>
            <p className="text-sm text-white/70 leading-relaxed">
              {apiData.selectionStrategy}
            </p>
          </div>
        )}

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {results.map((result: any, i: number) => (
            <div
              key={result.product?.id || i}
              className={`oracle-result-card ${
                i === 0 ? "ring-2 ring-[#00AEEF]/30 md:col-span-2" : ""
              }`}
            >
              {/* Expert Pick badge */}
              {i === 0 && (
                <div className="oracle-expert-pick inline-block mx-4 mt-4">
                  ★ Expert Pick
                </div>
              )}

              <div className={`p-6 ${i === 0 ? "md:flex md:gap-8" : ""}`}>
                {/* Product Image placeholder */}
                <div className={`bg-gray-100 rounded flex items-center justify-center mb-4 ${
                  i === 0 ? "md:w-64 md:h-48 md:mb-0 md:shrink-0" : "h-40"
                }`}>
                  {result.product?.heroImageUrl ? (
                    <img
                      src={result.product.heroImageUrl}
                      alt={result.product?.name || "Product"}
                      className="w-full h-full object-contain p-4"
                    />
                  ) : (
                    <div className="text-gray-300 text-xs font-bold uppercase">
                      Product Image
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="flex-1">
                  {/* Match Strategy */}
                  {result.matchStrategy && (
                    <span className={`inline-block text-[10px] font-black uppercase tracking-[0.1em] px-2 py-1 rounded mb-2 ${
                      result.product?.category === "performance"
                        ? "oracle-tag-performance"
                        : "oracle-tag-oem"
                    }`}>
                      {result.matchStrategy}
                    </span>
                  )}

                  <h3 className="text-xl font-black uppercase italic text-black leading-tight mb-1">
                    {result.product?.name || result.product?.title || "Fuel Injector"}
                  </h3>
                  <p className="text-[#00AEEF] text-xs font-bold uppercase tracking-widest mb-3">
                    {result.product?.brand || "FiveO"} | {result.product?.size_cc || "—"} cc/min
                  </p>

                  {/* Score bar */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#00AEEF] rounded-full transition-all"
                        style={{ width: `${result.score || 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-black text-[#00AEEF]">{result.score || 0}%</span>
                  </div>

                  {/* AI Preference Summary */}
                  {result.preferenceSummary && (
                    <p className="text-sm text-gray-600 leading-relaxed mb-4">
                      {result.preferenceSummary}
                    </p>
                  )}

                  {/* Reasons */}
                  {result.reasons && result.reasons.length > 0 && (
                    <ul className="text-xs text-gray-500 space-y-1">
                      {result.reasons.slice(0, 3).map((reason: string, j: number) => (
                        <li key={j} className="flex items-start gap-2">
                          <span className="text-[#00AEEF] mt-0.5">✓</span>
                          {reason}
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* CTA */}
                  {result.product?.url && (
                    <a
                      href={result.product.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="oracle-cta-view mt-4 inline-flex"
                    >
                      View on FiveO →
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Restart */}
        <div className="text-center mt-10">
          <button onClick={onRestart} className="oracle-cta-secondary">
            Start New Search
          </button>
        </div>
      </div>
    </div>
  );
}
