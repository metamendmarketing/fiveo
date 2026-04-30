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
  const startTime = performance.now();
  try {
    const body = await req.json();
    const profile: BuildProfile = body.profile;

    if (!profile) {
      return NextResponse.json({ 
        error: "Invalid Request", 
        message: "A valid build profile is required to generate recommendations." 
      }, { status: 400 });
    }

    const vehicleLabel = [profile.year, profile.make, profile.model].filter(Boolean).join(" ") || "your vehicle";
    console.log(`[Oracle] ⚡ Starting recommendation engine for: ${vehicleLabel}`);

    const supabase = getServerSupabase();

    // ─── STAGE 1: DATA ACQUISITION ───
    const stage1Start = performance.now();
    
    // 1a. Fitment Lookup
    let fitmentProductIds: number[] = [];
    let makeFitmentProductIds: number[] = [];

    const fitmentPromises = [];
    if (profile.modelId) {
      fitmentPromises.push(
        supabase.from("product_fitment").select("product_id").eq("model_id", Number(profile.modelId))
      );
    }
    if (profile.makeId) {
      fitmentPromises.push(
        supabase.from("product_fitment").select("product_id").eq("make_id", Number(profile.makeId))
      );
    }

    const fitmentResults = await Promise.all(fitmentPromises);
    if (profile.modelId && fitmentResults[0]) {
      fitmentProductIds = (fitmentResults[0].data as FitmentRecord[] || []).map(f => f.product_id);
    }
    if (profile.makeId && fitmentResults[fitmentResults.length - 1]) {
      makeFitmentProductIds = (fitmentResults[fitmentResults.length - 1].data as FitmentRecord[] || []).map(f => f.product_id);
    }

    // 1b. Catalog Fetch (Paginated to get all products)
    let allProducts: Product[] = [];
    let offset = 0;
    const PAGE_SIZE = 1000;
    
    while (true) {
      const { data: batch, error: prodErr } = await supabase
        .from("products")
        .select("id, name, sku, url_key, flow_rate_cc, size_cc, price, impedance, connector_type, manufacturer, brand, fuel_types, raw_categories")
        .range(offset, offset + PAGE_SIZE - 1);
      
      if (prodErr) throw prodErr;
      if (!batch || batch.length === 0) break;
      
      allProducts = [...allProducts, ...(batch as Product[])];
      if (batch.length < PAGE_SIZE) break;
      offset += PAGE_SIZE;
    }
    console.log(`[Oracle] 📦 Data Acquisition Complete: ${allProducts.length} products loaded in ${Math.round(performance.now() - stage1Start)}ms`);

    // ─── STAGE 2: HEURISTIC SCORING & POOLING ───
    const stage2Start = performance.now();
    
    // Accuracy Fix: Use parseCylinders here to ensure initial requiredCC is correct
    const { parseCylinders } = require("@/app/lib/constants");
    const cylinders = profile.desiredSizeCC ? 1 : parseCylinders(profile.engineLabel || "", "");
    
    const requiredCC = (profile.hpMode === "custom" && profile.targetHP)
      ? calculateRequiredCC(profile.targetHP, profile.fuelType || "pump", cylinders, profile.headroomPref)
      : profile.desiredSizeCC || null;

    const heuristicResults = scoreProducts(
      allProducts,
      profile,
      fitmentProductIds,
      makeFitmentProductIds
    );

    // ─── STAGE 2b: URL RESOLUTION & DEDUPLICATION ───
    
    const allUrlKeys = new Set<string>();
    for (const p of allProducts) {
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
    console.log(`[Oracle] ⚖️ Heuristic Scoring & Dedup Complete: ${deduped.length} candidates in ${Math.round(performance.now() - stage2Start)}ms`);

    // Initial pool selection (Stage 2 Expansion)
    let candidatePool = deduped.slice(0, rules.poolSize.heuristicTop);

    const fitmentMissing = deduped.filter(
      r => r.hasFitment && !candidatePool.find(s => s.product.id === r.product.id)
    );
    if (fitmentMissing.length > 0) {
      candidatePool = [...candidatePool, ...fitmentMissing].slice(0, rules.poolSize.maxCandidates);
    }

    if (profile.goal === "max-power") {
      const highFlow = deduped.filter(r => {
        const cc = Number(r.product.flow_rate_cc || r.product.size_cc) || 0;
        return cc >= (rules.goalBoosts["max-power"]?.minCC || 550) &&
               !candidatePool.find(s => s.product.id === r.product.id);
      }).slice(0, 4);
      candidatePool = [...candidatePool, ...highFlow].slice(0, rules.poolSize.maxCandidates);
    }

    // ─── STAGE 2.5: ENRICHMENT (Fetch missing details for top candidates) ───
    const enrichmentStart = performance.now();
    const candidateIds = candidatePool.map(c => c.product.id);
    const { data: enrichedProducts } = await supabase
      .from("products")
      .select("id, description, hero_image_url")
      .in("id", candidateIds);
    
    if (enrichedProducts) {
      const enrichedMap = new Map(enrichedProducts.map(p => [p.id, p]));
      candidatePool = candidatePool.map(c => ({
        ...c,
        product: {
          ...c.product,
          ...enrichedMap.get(c.product.id)
        }
      }));
    }
    console.log(`[Oracle] 🧪 Enrichment Complete: ${candidatePool.length} products detailed in ${Math.round(performance.now() - enrichmentStart)}ms`);

    // ─── STAGE 3: AI REFINEMENT ───
    const stage3Start = performance.now();
    
    let finalResults = candidatePool.slice(0, rules.poolSize.aiMaxResults);
    let selectionStrategy = "";

    try {
      const model = getVertexModel("gemini-2.5-flash");
      if (!model) throw new Error("AI services unavailable");

      const candidateData = candidatePool.map(c => ({
        id: c.product.id,
        name: c.product.name,
        cc: Number(c.product.flow_rate_cc || c.product.size_cc) || null,
        price: c.product.price,
        impedance: c.product.impedance,
        connector: c.product.connector_type,
        brand: c.product.manufacturer || c.product.brand,
        description: c.product.description?.slice(0, 200),
        heuristicScore: c.score,
        hasFitment: c.hasFitment,
        matchType: c.matchType === "fitment_confirmed" ? "Direct Factory Fit" : 
                   c.matchType === "make_match" ? "Verified Brand Match" : "Heuristic Recommendation",
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
      console.log(`[Oracle] 🤖 AI Refinement Complete in ${Math.round(performance.now() - stage3Start)}ms`);
    } catch (err: unknown) {
      console.error("[Oracle] AI refinement failed, falling back to heuristic:", err instanceof Error ? err.message : err);
      selectionStrategy = "I've analyzed your build specs against our precision engineering matrix. We've prioritized proven vehicle fitment and the flow rates you'll need to hit your performance goals safely.";
    }

    // ─── STAGE 5: FILTERING, SORTING & CONFIDENCE MAPPING ───
    
    const REAL_THRESHOLD = 50; 
    const UI_FLOOR = 70;       
    
    let filteredResults = finalResults.filter(r => (r.score || 0) >= REAL_THRESHOLD);
    filteredResults.sort((a, b) => (b.score || 0) - (a.score || 0));

    const outputResults = filteredResults.slice(0, 7).map(r => {
      const real = r.score || 0;
      const mapped = UI_FLOOR + (real - REAL_THRESHOLD) * (100 - UI_FLOOR) / (100 - REAL_THRESHOLD);
      return {
        ...r,
        score: Math.min(Math.round(mapped), 99)
      };
    });

    const response: OracleApiResponse = {
      results: outputResults,
      selectionStrategy,
      vehicleLabel,
      calculatedCC: requiredCC,
      fitmentMatches: fitmentProductIds.length,
      makeFitmentMatches: makeFitmentProductIds.length,
      candidatePoolSize: candidatePool.length,
    };

    console.log(`[Oracle] ✅ Total Execution Time: ${Math.round(performance.now() - startTime)}ms`);
    return NextResponse.json(response);
  } catch (err: unknown) {
    console.error("[Oracle] Fatal API Error:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      {
        results: [],
        error: "Service Interruption",
        message: "The Oracle encountered an unexpected error while processing your build profile. Please refine your inputs and try again.",
        details: err instanceof Error ? err.message : "Internal Server Error"
      },
      { status: 500 }
    );
  }
}
// Triggering fresh deployment after revert
