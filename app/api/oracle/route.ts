import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/app/lib/supabase";
import { getVertexModel } from "@/app/lib/gemini";
import {
  type BuildProfile,
  calculateRequiredCC,
} from "@/app/lib/constants";
import { scoreProducts, deduplicateResults } from "@/app/lib/scoring";
import { Product, ScoredProduct, FitmentRecord, OracleApiResponse } from "@/app/lib/types";
import rules from "@/app/lib/scoring-rules.json";
import { ACTIVE_PERSONA } from "@/app/lib/ai-config";

/**
 * POST /api/oracle
 * 
 * The core engine of the FiveO Fuel Injector Oracle.
 * Orchestrates fitment lookup, heuristic scoring, pool expansion, 
 * and AI-driven refinement.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const profile: BuildProfile = body.profile;

    if (!profile) {
      return NextResponse.json({ error: "Profile is required" }, { status: 400 });
    }

    const vehicleLabel = [profile.year, profile.make, profile.model].filter(Boolean).join(" ") || "your vehicle";
    console.time("[Oracle] Total Request");
    console.log("[Oracle] Processing build for:", vehicleLabel);

    const supabase = getServerSupabase();

    // ─── STAGE 1: DATA ACQUISITION (Parallelized) ───

    // Helper: paginated catalog fetch with only scoring-relevant fields
    async function fetchCatalog(): Promise<Product[]> {
      const SCORING_FIELDS = "id, name, sku, flow_rate_cc, size_cc, impedance, connector_type, manufacturer, brand, fuel_types, price, url_key, raw_categories";
      let all: Product[] = [];
      let offset = 0;
      const PAGE_SIZE = 1000;
      
      while (true) {
        const { data: batch, error: prodErr } = await supabase
          .from("products")
          .select(SCORING_FIELDS)
          .range(offset, offset + PAGE_SIZE - 1);
        
        if (prodErr) throw prodErr;
        if (!batch || batch.length === 0) break;
        all = [...all, ...(batch as Product[])];
        if (batch.length < PAGE_SIZE) break;
        offset += PAGE_SIZE;
      }
      return all;
    }

    // Run all three queries in parallel
    const [fitmentResult, makeFitmentResult, products] = await Promise.all([
      // 1a. Model fitment
      profile.modelId
        ? supabase.from("product_fitment").select("product_id").eq("model_id", Number(profile.modelId))
        : Promise.resolve({ data: null, error: null }),
      // 1b. Make fitment
      profile.makeId
        ? supabase.from("product_fitment").select("product_id").eq("make_id", Number(profile.makeId))
        : Promise.resolve({ data: null, error: null }),
      // 1c. Full catalog (selective fields only)
      fetchCatalog(),
    ]);

    if (fitmentResult.error) console.error("[Oracle] Model fitment query error:", fitmentResult.error.message);
    if (makeFitmentResult.error) console.error("[Oracle] Make fitment query error:", makeFitmentResult.error.message);

    const fitmentProductIds = (fitmentResult.data as FitmentRecord[] || []).map(f => f.product_id);
    const makeFitmentProductIds = (makeFitmentResult.data as FitmentRecord[] || []).map(f => f.product_id);

    console.log(`[Oracle] Data acquired: ${products.length} products, ${fitmentProductIds.length} model fits, ${makeFitmentProductIds.length} make fits`);


    // ─── STAGE 2: HEURISTIC SCORING & POOLING ───
    
    const requiredCC = (profile.hpMode === "custom" && profile.targetHP)
      ? calculateRequiredCC(profile.targetHP, profile.fuelType || "pump")
      : profile.desiredSizeCC || null;

    const heuristicResults = scoreProducts(
      products,
      profile,
      fitmentProductIds,
      makeFitmentProductIds
    );

    // ─── STAGE 2b: URL RESOLUTION & DEDUPLICATION ───
    
    // Resolve variant url_keys to canonical parent product pages BEFORE deduplication.
    // This ensures that physical products listed multiple times under different variant slugs
    // are treated as the same canonical entity.
    const allUrlKeys = new Set<string>();
    for (const p of products) {
      let key = (p.url_key || "").toLowerCase();
      if (key.endsWith("-each")) key = key.slice(0, -5);
      if (key.includes("-each-")) key = key.split("-each-")[0];
      if (key) allUrlKeys.add(key);
    }

    const resolvedHeuristicResults = heuristicResults.map(r => {
      let slug = (r.product.url_key || "").toLowerCase();
      if (slug.endsWith("-each")) slug = slug.slice(0, -5);
      if (slug.includes("-each-")) slug = slug.split("-each-")[0];
      
      let resolved = slug;
      let parts = slug.split("-");
      
      if (parts.length > 3) {
        for (let i = 3; i < parts.length; i++) {
          const candidate = parts.slice(0, i).join("-");
          if (allUrlKeys.has(candidate)) {
            resolved = candidate;
            break; 
          }
        }
      }

      if (resolved !== r.product.url_key) {
        return { ...r, product: { ...r.product, url_key: resolved } };
      }
      return r;
    });

    const deduped = deduplicateResults(resolvedHeuristicResults);

    // Initial pool selection (Stage 2 Expansion)
    let candidatePool = deduped.slice(0, rules.poolSize.heuristicTop);

    // Inject fitment-confirmed products if they were missed by the top heuristic slice
    const fitmentMissing = deduped.filter(
      r => r.hasFitment && !candidatePool.find(s => s.product.id === r.product.id)
    );
    if (fitmentMissing.length > 0) {
      candidatePool = [...candidatePool, ...fitmentMissing].slice(0, rules.poolSize.maxCandidates);
    }

    // Goal-specific injections
    if (profile.goal === "max-power") {
      const highFlow = deduped.filter(r => {
        const cc = Number(r.product.flow_rate_cc || r.product.size_cc) || 0;
        return cc >= (rules.goalBoosts["max-power"]?.minCC || 550) &&
               !candidatePool.find(s => s.product.id === r.product.id);
      }).slice(0, 4);
      candidatePool = [...candidatePool, ...highFlow].slice(0, rules.poolSize.maxCandidates);
    }

    // ─── STAGE 3: AI REFINEMENT ───
    
    let finalResults = candidatePool.slice(0, rules.poolSize.aiMaxResults);
    let selectionStrategy = "";

    try {
      const model = getVertexModel("gemini-2.5-flash");
      if (!model) throw new Error("AI services unavailable");

      // Fetch descriptions ONLY for the ~20 candidates (not all 4,000)
      const candidateIds = candidatePool.map(c => c.product.id);
      const { data: descData } = await supabase
        .from("products")
        .select("id, description")
        .in("id", candidateIds);
      const descMap = new Map((descData || []).map((d: { id: number; description: string }) => [d.id, d.description]));

      const candidateData = candidatePool.map(c => ({
        id: c.product.id,
        name: c.product.name,
        cc: Number(c.product.flow_rate_cc || c.product.size_cc) || null,
        price: c.product.price,
        impedance: c.product.impedance,
        connector: c.product.connector_type,
        brand: c.product.manufacturer || c.product.brand,
        description: (descMap.get(c.product.id) || "")?.slice(0, 200),
        heuristicScore: c.score,
        hasFitment: c.hasFitment,
        matchType: c.matchType,
      }));

      const prompt = ACTIVE_PERSONA
        .replace("{{vehicleLabel}}", vehicleLabel)
        .replace("{{goal}}", profile.goal || "general upgrade")
        .replace("{{usage}}", profile.usage || "not specified")
        .replace("{{engineStatus}}", profile.engineStatus ? `(engine: ${profile.engineStatus})` : "")
        .replace("{{targetHP}}", profile.hpMode === "custom" ? `${profile.targetHP} HP (Total)` : (profile.hpMode !== "unsure" && profile.hpMode ? profile.hpMode : "not specified"))
        .replace("{{fuelType}}", profile.fuelType || "pump gas")
        .replace("{{budget}}", profile.budget || "flexible")
        .replace("{{priorities}}", (profile.priorities || []).join(", ") || "not specified")
        .replace("{{injectorPref}}", profile.injectorPref || "best match")
        .replace("{{brandPref}}", profile.brandPref || "no preference")
        .replace("{{requiredCC}}", requiredCC?.toString() || "unknown")
        .replace("{{fitmentCount}}", fitmentProductIds.length.toString())
        .replace("{{makeFitmentCount}}", makeFitmentProductIds.length.toString())
        .replace("{{candidateCount}}", candidatePool.length.toString())
        .replace("{{candidateData}}", JSON.stringify(candidateData, null, 2));

      const result = await model.generateContent(prompt);
      const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const cleanJson = jsonMatch ? jsonMatch[0] : "{}";
      const refined = JSON.parse(cleanJson);
      
      selectionStrategy = refined.selectionStrategy || "";
      const refinedList = refined.refinement || [];

      if (refinedList.length > 0) {
        finalResults = refinedList
          .map((r: { id: number; score: number; matchStrategy: string; aiHeadline: string; preferenceSummary: string; technicalNarrative: string; proTip: string }) => {
            const original = candidatePool.find(c => String(c.product.id) === String(r.id));
            if (!original) return null;
            return {
              ...original,
              score: r.score || original.score,
              matchStrategy: r.matchStrategy,
              aiHeadline: r.aiHeadline,
              preferenceSummary: r.preferenceSummary,
              technicalNarrative: r.technicalNarrative,
              proTip: r.proTip,
            } as ScoredProduct;
          })
          .filter((res: ScoredProduct | null): res is ScoredProduct => res !== null);
      }
    } catch (err: unknown) {
      console.error("[Oracle] AI refinement failed, falling back to heuristic:", err instanceof Error ? err.message : err);
      selectionStrategy = "I've analyzed your build specs against our precision engineering matrix. We've prioritized proven vehicle fitment and the flow rates you'll need to hit your performance goals safely.";
    }

    // ─── STAGE 4: FINALIZATION ───
    
    // Rescale scores and add fallbacks if AI didn't provide them
    // (URL Resolution was moved to Stage 2b for better deduplication)
    let outputResults = finalResults.slice(0, rules.poolSize.aiMaxResults);
    const hasAiData = outputResults.some(r => r.matchStrategy);

    if (!hasAiData) {
      const maxHeuristic = Math.max(...outputResults.map(r => r.score || 0));
      outputResults = outputResults.map(r => ({
        ...r,
        score: maxHeuristic > 0 ? Math.round(((r.score || 0) / maxHeuristic) * 100) : 50,
        matchStrategy: r.hasFitment ? "Expert Fitment Match" : "Technical Compatibility",
        preferenceSummary: r.reasons?.[0] || "Aligned with your flow requirements.",
        proTip: "Verify your connector type before ordering.",
      }));
    }

    outputResults.sort((a, b) => (b.score || 0) - (a.score || 0));

    const response: OracleApiResponse = {
      results: outputResults,
      selectionStrategy,
      vehicleLabel,
      calculatedCC: requiredCC,
      fitmentMatches: fitmentProductIds.length,
      makeFitmentMatches: makeFitmentProductIds.length,
      candidatePoolSize: candidatePool.length,
    };

    console.timeEnd("[Oracle] Total Request");
    return NextResponse.json(response);
  } catch (err: unknown) {
    console.error("[Oracle] Fatal API Error:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      {
        results: [],
        error: err instanceof Error ? err.message : "Internal Server Error",
        reason: "The Oracle encountered an unexpected error. Please try again or adjust your criteria.",
      },
      { status: 500 }
    );
  }
}
