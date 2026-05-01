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
 * @function POST
 * @description Main recommendation engine for the Fuel Injector Oracle.
 * 
 * THE ORACLE PIPELINE:
 * 1. DATA ACQUISITION: Parallel selective catalog fetch from Supabase.
 * 2. HEURISTIC SCORING: Initial relevance scoring based on flow and fitment.
 * 3. POOL ENRICHMENT: Expansion of candidates if the verified pool is too shallow.
 * 4. AI REFINEMENT: Expert narrative generation via Gemini 3.1 Flash-Lite.
 * 5. CONFIDENCE MAPPING: Linear scaling of raw scores for professional UI display.
 * 
 * @param {NextRequest} req - The user's vehicle profile and power goals.
 * @returns {NextResponse} Scored recommendations with expert technical analysis.
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
    let partialFitmentProductIds: number[] = [];
    let makeFitmentProductIds: number[] = [];

    const fitmentPromises = [];
    if (profile.modelId) {
      fitmentPromises.push(
        supabase.from("product_fitment").select("product_id, year_start, year_end, engine_pattern").eq("model_id", Number(profile.modelId))
      );
    }
    if (profile.makeId) {
      fitmentPromises.push(
        supabase.from("product_fitment").select("product_id").eq("make_id", Number(profile.makeId))
      );
    }

    const fitmentResults = await Promise.all(fitmentPromises);
    if (profile.modelId && fitmentResults[0]) {
      const records = fitmentResults[0].data as FitmentRecord[] || [];
      const userYear = profile.year ? parseInt(profile.year.toString(), 10) : null;
      const userEngine = (profile.engineLabel || "").toLowerCase();

      records.forEach(f => {
        let isPerfectMatch = true;

        // ABSOLUTE VERIFICATION: Year and Engine data MUST be present in the database to qualify as "Verified Fit".
        if (!f.year_start || !f.year_end || !f.engine_pattern) {
          isPerfectMatch = false;
        }

        // Year Validation
        if (isPerfectMatch && userYear) {
          if (userYear < (f.year_start || 0) || userYear > (f.year_end || 9999)) {
            isPerfectMatch = false;
          }
        }

        // Engine Validation
        if (isPerfectMatch && userEngine && f.engine_pattern) {
          const pattern = f.engine_pattern.toLowerCase();
          if (!userEngine.includes(pattern)) {
            isPerfectMatch = false;
          }
        }

        if (isPerfectMatch) {
          fitmentProductIds.push(f.product_id);
        } else {
          partialFitmentProductIds.push(f.product_id);
        }
      });
    }

    if (profile.makeId && fitmentResults[fitmentResults.length - 1]) {
      makeFitmentProductIds = (fitmentResults[fitmentResults.length - 1].data as FitmentRecord[] || []).map(f => f.product_id);
    }

    // 1b. Parallel Selective Catalog Fetch (High-Velocity Visibility Filter)
    let allProducts: Product[] = [];
    const PAGE_SIZE = 1000;
    
    // Filter out "Not Visible Individually" but KEEP NULLS (important for current data state)
    const { count, error: countErr } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .or('visibility.is.null,visibility.neq."Not Visible Individually"');
    
    if (countErr) throw countErr;
    
    const total = count || 1800; 
    const pages = Math.ceil(total / PAGE_SIZE);
    
    const fetchPromises = Array.from({ length: pages }).map((_, i) => {
      return supabase.from("products")
        .select("id, sku, name, price, url_key, flow_rate_cc, impedance, connector_type, fuel_types, manufacturer, raw_categories, year_start, year_end, parsed_displacement, parsed_engine_code, parsed_config")
        .or('visibility.is.null,visibility.neq."Not Visible Individually"')
        .range(i * PAGE_SIZE, (i + 1) * PAGE_SIZE - 1);
    });
    
    const batchResults = await Promise.all(fetchPromises);
    allProducts = batchResults.flatMap(r => {
      if (r.error) throw r.error;
      return (r.data as Product[]) || [];
    });
    
    console.log(`[Oracle] ⚡ High-Velocity Acquisition: ${allProducts.length} visible products loaded in ${Math.round(performance.now() - stage1Start)}ms`);

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
      partialFitmentProductIds,
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
    
    // ─── STAGE 2c: UPSTREAM FITMENT ENFORCEMENT ───
    const isVehicleMode = profile.entryMode !== "specs" && !!profile.make;
    let safeCandidateResults = deduped;
    let noVerifiedMatches = false;

    if (isVehicleMode) {
      // MANDATORY: Only send products to the AI that have explicit Year/Make/Model/Engine confirmation.
      const verifiedOnly = deduped.filter(r => r.confidenceLevel === "Verified Fit");
      
      if (verifiedOnly.length > 0) {
        safeCandidateResults = verifiedOnly;
        console.log(`[Oracle] 🛡️ Upstream Enforcement: Found ${verifiedOnly.length} verified products.`);
      } else {
        // SMART FALLBACK: No verified fits. Allow heuristic matches but flag for AI.
        noVerifiedMatches = true;
        safeCandidateResults = deduped;
        console.log(`[Oracle] ⚠️ Smart Fallback: No verified matches found. Passing ${deduped.length} heuristic candidates to AI for custom guidance.`);
      }
    }

    // Initial pool selection from filtered results
    let candidatePool = safeCandidateResults.slice(0, rules.poolSize.heuristicTop);

    // If the pool is empty in vehicle mode, we do NOT attempt to find unverified "fitmentMissing" products.
    if (!isVehicleMode) {
      const fitmentMissing = safeCandidateResults.filter(
        r => r.hasFitment && !candidatePool.find(s => s.product.id === r.product.id)
      );
      if (fitmentMissing.length > 0) {
        candidatePool = [...candidatePool, ...fitmentMissing].slice(0, rules.poolSize.maxCandidates);
      }
    }

    if (profile.goal === "max-power") {
      const highFlow = safeCandidateResults.filter(r => {
        const cc = Number(r.product.flow_rate_cc || r.product.size_cc) || 0;
        return cc >= (rules.goalBoosts["max-power"]?.minCC || 550) &&
               !candidatePool.find(s => s.product.id === r.product.id);
      });
      if (highFlow.length > 0) {
        candidatePool = [...candidatePool, ...highFlow].slice(0, rules.poolSize.maxCandidates);
      }
    } // ─── STAGE 2.5: ENRICHMENT (Fetch missing details for top candidates) ───
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
    let aiError = null;
    try {
      const { client, modelName } = getVertexModel("gemini-3.1-flash-lite-preview");
      if (!client) throw new Error("AI services unavailable");

      const candidateData = candidatePool.map(c => {
        const cleanDescription = c.product.description
          ? c.product.description.replace(/<[^>]*>?/gm, "").slice(0, 500)
          : "";

        return {
          id: String(c.product.id),
          name: c.product.name,
          cc: Number(c.product.flow_rate_cc) || null,
          brand: c.product.manufacturer,
          confidenceLevel: c.confidenceLevel,
          description: cleanDescription,
        };
      });

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
        .replace("{{fallbackStatus}}", noVerifiedMatches ? "🚨 NO VERIFIED MATCHES FOUND. TRIGGER SMART FALLBACK UX." : "✅ VERIFIED MATCHES FOUND.")
        .replace("{{candidateData}}", JSON.stringify(candidateData, null, 2));

      console.log(`[Oracle] 🤖 Sending AI Request (${prompt.length} chars) via @google/genai...`);
      
      const response = await client.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          response_mime_type: "application/json",
          temperature: 0.2
        }
      });

      const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const cleanJson = jsonMatch ? jsonMatch[0] : "{}";
      const refined = JSON.parse(cleanJson);
      
      selectionStrategy = refined.selectionStrategy || "";
      const refinedList = refined.refinement || [];

      if (refinedList.length > 0) {
        finalResults = refinedList.map((r: any) => {
          const original = candidatePool.find(c => String(c.product.id) === String(r.id));
          if (!original) return null;
          return {
            ...original,
            score: r.score || original.score,
            matchStrategy: r.matchStrategy || original.matchType,
            aiHeadline: r.aiHeadline || "",
            preferenceSummary: r.preferenceSummary || "",
            technicalNarrative: r.technicalNarrative || "",
            proTip: r.proTip || ""
          } as ScoredProduct;
        }).filter((res: ScoredProduct | null): res is ScoredProduct => res !== null);
      }
      console.log(`[Oracle] 🤖 AI Refinement Complete in ${Math.round(performance.now() - stage3Start)}ms`);
    } catch (err: unknown) { 
      aiError = err instanceof Error ? err.message : String(err);
      console.error("[Oracle] 🚨 AI Pipeline Failure:", aiError);
      selectionStrategy = "Oracle offline. Using heuristic matches.";
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
      timing: {
        total: Math.round(performance.now() - startTime),
        acquisition: Math.round(stage2Start - stage1Start),
        scoring: Math.round(enrichmentStart - stage2Start),
        enrichment: Math.round(stage3Start - enrichmentStart),
        ai: Math.round(performance.now() - stage3Start),
        ai_error: aiError
      }
    };

    console.log(`[Oracle] ✅ Total Execution Time: ${response.timing?.total}ms`);
    return NextResponse.json(response);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Internal Server Error";
    console.error("[Oracle] ❌ Fatal API Error:", errorMessage);
    return NextResponse.json(
      {
        results: [],
        error: "Fatal Engine Error",
        message: errorMessage,
        details: err instanceof Error ? err.stack : "Raw object thrown"
      },
      { status: 500 }
    );
  }
}
// Force build trigger: 2026-04-30 22:59:15
