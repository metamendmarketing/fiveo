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
    const tier = body.tier; // "top3" or "remaining"

    if (!profile) {
      return NextResponse.json({ error: "Profile is required" }, { status: 400 });
    }

    const vehicleLabel = [profile.year, profile.make, profile.model].filter(Boolean).join(" ") || "your vehicle";
    console.log(`[Oracle] Processing ${tier || "full"} build for:`, vehicleLabel);

    const supabase = getServerSupabase();

    // ─── STAGE 1: DATA ACQUISITION ───
    
    let fitmentProductIds: number[] = [];
    let makeFitmentProductIds: number[] = [];

    if (profile.modelId) {
      const { data: fitment, error: fitErr } = await supabase
        .from("product_fitment")
        .select("product_id")
        .eq("model_id", Number(profile.modelId));
      if (fitErr) console.error("[Oracle] Model fitment query error:", fitErr.message);
      fitmentProductIds = (fitment as FitmentRecord[] || []).map(f => f.product_id);
    }

    if (profile.makeId) {
      const { data: makeFitment, error: makeErr } = await supabase
        .from("product_fitment")
        .select("product_id")
        .eq("make_id", Number(profile.makeId));
      if (makeErr) console.error("[Oracle] Make fitment query error:", makeErr.message);
      makeFitmentProductIds = (makeFitment as FitmentRecord[] || []).map(f => f.product_id);
    }

    let allProducts: Product[] = [];
    let offset = 0;
    const PAGE_SIZE = 1000;
    while (true) {
      const { data: batch, error: prodErr } = await supabase
        .from("products")
        .select("*")
        .range(offset, offset + PAGE_SIZE - 1);
      if (prodErr) throw prodErr;
      if (!batch || batch.length === 0) break;
      allProducts = [...allProducts, ...(batch as Product[])];
      if (batch.length < PAGE_SIZE) break;
      offset += PAGE_SIZE;
    }
    const products = allProducts;

    // ─── STAGE 2: HEURISTIC SCORING & POOLING ───
    
    const requiredCC = (profile.hpMode === "custom" && profile.targetHP)
      ? calculateRequiredCC(profile.targetHP, profile.fuelType || "pump")
      : profile.desiredSizeCC || null;

    const heuristicResults = scoreProducts(products, profile, fitmentProductIds, makeFitmentProductIds);

    // URL Resolution & Deduplication
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
          if (allUrlKeys.has(candidate)) { resolved = candidate; break; }
        }
      }
      if (resolved !== r.product.url_key) return { ...r, product: { ...r.product, url_key: resolved } };
      return r;
    });

    const deduped = deduplicateResults(resolvedHeuristicResults);
    let candidatePool = deduped.slice(0, rules.poolSize.heuristicTop);

    const fitmentMissing = deduped.filter(r => r.hasFitment && !candidatePool.find(s => s.product.id === r.product.id));
    if (fitmentMissing.length > 0) candidatePool = [...candidatePool, ...fitmentMissing].slice(0, rules.poolSize.maxCandidates);

    if (profile.goal === "max-power") {
      const highFlow = deduped.filter(r => {
        const cc = Number(r.product.flow_rate_cc || r.product.size_cc) || 0;
        return cc >= (rules.goalBoosts["max-power"]?.minCC || 550) && !candidatePool.find(s => s.product.id === r.product.id);
      }).slice(0, 4);
      candidatePool = [...candidatePool, ...highFlow].slice(0, rules.poolSize.maxCandidates);
    }

    // ─── STAGE 3: AI REFINEMENT (Simple Split) ───
    
    let aiCandidates: ScoredProduct[];
    if (tier === "top3") {
      aiCandidates = candidatePool.slice(0, 3);
    } else if (tier === "remaining") {
      aiCandidates = candidatePool.slice(3, rules.poolSize.aiMaxResults);
    } else {
      aiCandidates = candidatePool.slice(0, rules.poolSize.aiMaxResults);
    }

    let finalResults = aiCandidates;
    let selectionStrategy = "";

    if (aiCandidates.length > 0) {
      try {
        const model = getVertexModel("gemini-2.5-flash");
        if (!model) throw new Error("AI services unavailable");

        const candidateData = aiCandidates.map(c => ({
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
          .replace("{{candidateCount}}", aiCandidates.length.toString())
          .replace("{{candidateData}}", JSON.stringify(candidateData, null, 2))
          + "\n\nIMPORTANT: Provide a detailed engineering narrative for EVERY single product ID listed above. Do not skip any.";

        const result = await model.generateContent(prompt);
        const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const cleanJson = jsonMatch ? jsonMatch[0] : "{}";
        const refined = JSON.parse(cleanJson);
        
        selectionStrategy = refined.selectionStrategy || "";
        const refinedList = refined.refinement || [];

        if (refinedList.length > 0) {
          finalResults = refinedList
            .map((r: any) => {
              const original = aiCandidates.find(c => String(c.product.id) === String(r.id));
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
            .filter((res: any): res is ScoredProduct => res !== null);
        }
      } catch (err: unknown) {
        console.error("[Oracle] AI refinement failed:", err);
      }
    }

    // ─── STAGE 4: FINALIZATION (Merge Tiered Results) ───
    
    // Start with the full heuristic pool
    let outputResults = candidatePool.slice(0, rules.poolSize.aiMaxResults);
    
    // Overlay AI narratives if we have them
    if (finalResults.length > 0) {
      finalResults.forEach(aiItem => {
        const idx = outputResults.findIndex(p => String(p.product.id) === String(aiItem.product.id));
        if (idx !== -1) {
          outputResults[idx] = { ...outputResults[idx], ...aiItem };
        }
      });
    }

    // Ensure all items have necessary display fields (AI or Fallback)
    outputResults = outputResults.map(r => {
      if (!r.matchStrategy) {
        return {
          ...r,
          matchStrategy: r.hasFitment ? "Expert Fitment Match" : "Technical Compatibility",
          preferenceSummary: r.reasons?.[0] || "Aligned with your flow requirements.",
          proTip: "Verify your connector type before ordering.",
        };
      }
      return r;
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

    return NextResponse.json(response);
  } catch (err: unknown) {
    console.error("[Oracle] Fatal API Error:", err);
    return NextResponse.json({ results: [], error: "Internal Server Error" }, { status: 500 });
  }
}
