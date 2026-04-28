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
    const tier = body.tier; // "top3" or "patch"
    const providedResults: ScoredProduct[] = body.results || []; // Data provided for patching

    if (!profile) {
      return NextResponse.json({ error: "Profile is required" }, { status: 400 });
    }

    const vehicleLabel = [profile.year, profile.make, profile.model].filter(Boolean).join(" ") || "your vehicle";
    const supabase = getServerSupabase();

    let candidatePool: ScoredProduct[] = [];
    let requiredCC = profile.hpMode === "custom" && profile.targetHP
      ? calculateRequiredCC(profile.targetHP, profile.fuelType || "pump")
      : profile.desiredSizeCC || null;

    let fitmentProductIds: number[] = [];
    let makeFitmentProductIds: number[] = [];

    // ─── STAGE 1: DATA ACQUISITION ───
    
    if (tier === "patch" && providedResults.length > 0) {
      // OPTIMIZATION: Bypass DB and Heuristics for background patching
      console.log(`[Oracle] Patching ${providedResults.length} narratives (DB Bypass Active)`);
      candidatePool = providedResults;
    } else {
      // Standard flow for initial "top3" or full request
      console.log(`[Oracle] Processing ${tier || "full"} build for:`, vehicleLabel);

      if (profile.modelId) {
        const { data: fitment } = await supabase.from("product_fitment").select("product_id").eq("model_id", Number(profile.modelId));
        fitmentProductIds = (fitment as FitmentRecord[] || []).map(f => f.product_id);
      }
      if (profile.makeId) {
        const { data: makeFitment } = await supabase.from("product_fitment").select("product_id").eq("make_id", Number(profile.makeId));
        makeFitmentProductIds = (makeFitment as FitmentRecord[] || []).map(f => f.product_id);
      }

      let allProducts: Product[] = [];
      let offset = 0;
      const PAGE_SIZE = 1000;
      while (true) {
        const { data: batch, error: prodErr } = await supabase.from("products").select("*").range(offset, offset + PAGE_SIZE - 1);
        if (prodErr) throw prodErr;
        if (!batch || batch.length === 0) break;
        allProducts = [...allProducts, ...(batch as Product[])];
        if (batch.length < PAGE_SIZE) break;
        offset += PAGE_SIZE;
      }

      const heuristicResults = scoreProducts(allProducts, profile, fitmentProductIds, makeFitmentProductIds);
      
      // Resolve variant url_keys
      const allUrlKeys = new Set(allProducts.map(p => (p.url_key || "").toLowerCase()));
      const resolved = heuristicResults.map(r => {
        let slug = (r.product.url_key || "").toLowerCase();
        if (slug.endsWith("-each")) slug = slug.slice(0, -5);
        if (slug.includes("-each-")) slug = slug.split("-each-")[0];
        let found = slug;
        let parts = slug.split("-");
        if (parts.length > 3) {
          for (let i = 3; i < parts.length; i++) {
            const cand = parts.slice(0, i).join("-");
            if (allUrlKeys.has(cand)) { found = cand; break; }
          }
        }
        return { ...r, product: { ...r.product, url_key: found } };
      });

      const deduped = deduplicateResults(resolved);
      candidatePool = deduped.slice(0, rules.poolSize.aiMaxResults);
    }

    // ─── STAGE 2: AI REFINEMENT (Tiered) ───
    
    let aiCandidates = tier === "top3" ? candidatePool.slice(0, 3) : candidatePool;
    let finalResults = aiCandidates;
    let selectionStrategy = "";

    if (aiCandidates.length > 0) {
      try {
        const model = getVertexModel("gemini-2.5-flash");
        const candidateData = aiCandidates.map(c => ({
          id: c.product.id,
          name: c.product.name,
          cc: Number(c.product.flow_rate_cc || c.product.size_cc) || null,
          price: c.product.price,
          brand: c.product.manufacturer || c.product.brand,
          description: c.product.description?.slice(0, 150),
          heuristicScore: c.score,
          hasFitment: c.hasFitment,
        }));

        const prompt = ACTIVE_PERSONA
          .replace("{{vehicleLabel}}", vehicleLabel)
          .replace("{{goal}}", profile.goal || "general upgrade")
          .replace("{{usage}}", profile.usage || "not specified")
          .replace("{{targetHP}}", profile.hpMode === "custom" ? `${profile.targetHP} HP` : (profile.hpMode || "not specified"))
          .replace("{{fuelType}}", profile.fuelType || "pump gas")
          .replace("{{budget}}", profile.budget || "flexible")
          .replace("{{requiredCC}}", requiredCC?.toString() || "unknown")
          .replace("{{candidateCount}}", aiCandidates.length.toString())
          .replace("{{candidateData}}", JSON.stringify(candidateData))
          + "\n\nIMPORTANT: You MUST return a refinement entry for EVERY product ID provided. Do not skip any.";

        const result = await model.generateContent(prompt);
        const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const refined = JSON.parse(jsonMatch ? jsonMatch[0] : "{}");
        
        selectionStrategy = refined.selectionStrategy || "";
        const refinedList = refined.refinement || [];

        if (refinedList.length > 0) {
          finalResults = aiCandidates.map(orig => {
            const r = refinedList.find((item: any) => String(item.id) === String(orig.product.id));
            if (!r) return orig;
            return {
              ...orig,
              score: r.score || orig.score,
              matchStrategy: r.matchStrategy,
              aiHeadline: r.aiHeadline,
              preferenceSummary: r.preferenceSummary,
              technicalNarrative: r.technicalNarrative,
              proTip: r.proTip,
            };
          });
        }
      } catch (err) {
        console.error("[Oracle] AI failed:", err);
      }
    }

    // ─── STAGE 3: FINALIZATION ───
    
    // Merge AI results back into the candidate pool
    let outputResults = candidatePool.map(p => {
      const ai = finalResults.find(a => a.product.id === p.product.id);
      if (ai) return ai;
      return {
        ...p,
        matchStrategy: p.hasFitment ? "Expert Fitment Match" : "Technical Compatibility",
        preferenceSummary: p.reasons?.[0] || "Aligned with your flow requirements.",
        proTip: "Verify your connector type before ordering.",
      };
    });

    // Final sorting and Confidence Mapping
    const REAL_THRESHOLD = 50;
    const UI_FLOOR = 70;
    
    outputResults = outputResults
      .filter(r => (r.score || 0) >= (tier === "patch" ? 0 : REAL_THRESHOLD)) // Don't filter out things we are already patching
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .map(r => {
        const real = r.score || 0;
        const mapped = real < REAL_THRESHOLD ? real : UI_FLOOR + (real - REAL_THRESHOLD) * (100 - UI_FLOOR) / (100 - REAL_THRESHOLD);
        return { ...r, score: Math.min(Math.round(mapped), 99) };
      });

    return NextResponse.json({
      results: outputResults,
      selectionStrategy,
      vehicleLabel,
      calculatedCC: requiredCC,
      fitmentMatches: fitmentProductIds.length,
      candidatePoolSize: candidatePool.length,
    });
  } catch (err) {
    console.error("[Oracle] Fatal Error:", err);
    return NextResponse.json({ results: [], error: "Internal Server Error" }, { status: 500 });
  }
}
