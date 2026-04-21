/**
 * POST /api/oracle — FiveO Fuel Injector Oracle Engine
 *
 * Architecture mirrors the Marquis Buying Assistant:
 * 1. Heuristic Scoring: Multi-vector engine ranks ALL products
 * 2. Inclusive Pool Expansion: Force-inject edge cases, cap at 20
 * 3. AI Final Decision: Gemini acts as "Senior Fuel Systems Engineer"
 *    and selects the Top 10 with match strategies + technical narratives
 * 4. Deterministic Fallback: If AI fails, return heuristic top 10
 */
import { NextRequest } from "next/server";
import { getServerSupabase } from "@/app/lib/supabase";
import { getVertexModel } from "@/app/lib/gemini";
import {
  type BuildProfile,
  calculateRequiredCC,
  FUEL_BSFC,
} from "@/app/lib/constants";
import { scoreProducts, deduplicateResults } from "@/app/lib/scoring";
import rules from "@/app/lib/scoring-rules.json";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const profile: BuildProfile = body.profile;

    if (!profile) {
      return Response.json({ error: "Profile is required" }, { status: 400 });
    }

    console.log("[Oracle] Received profile:", JSON.stringify(profile, null, 2));

    const supabase = getServerSupabase();

    // ═══════════════════════════════════════
    // STAGE 1: FETCH DATA & HEURISTIC SCORING
    // ═══════════════════════════════════════

    // 1a. Fetch fitment-matched product IDs (FIXED: correct table name)
    let fitmentProductIds: number[] = [];
    let makeFitmentProductIds: number[] = [];

    if (profile.modelId) {
      const { data: fitment, error: fitErr } = await supabase
        .from("product_fitment")
        .select("product_id")
        .eq("model_id", Number(profile.modelId));

      if (fitErr) console.error("[Oracle] Fitment query error:", fitErr.message);
      fitmentProductIds = (fitment || []).map((f: any) => f.product_id);
      console.log(`[Oracle] Model fitment: ${fitmentProductIds.length} products for model ${profile.modelId}`);
    }

    if (profile.makeId) {
      const { data: makeFitment, error: makeErr } = await supabase
        .from("product_fitment")
        .select("product_id")
        .eq("make_id", Number(profile.makeId));

      if (makeErr) console.error("[Oracle] Make fitment query error:", makeErr.message);
      makeFitmentProductIds = (makeFitment || []).map((f: any) => f.product_id);
      console.log(`[Oracle] Make fitment: ${makeFitmentProductIds.length} products for make ${profile.makeId}`);
    }

    // 1b. Fetch ALL products
    const { data: allProducts, error: prodErr } = await supabase
      .from("products")
      .select("*");
    if (prodErr) throw prodErr;

    console.log(`[Oracle] Catalog: ${allProducts?.length || 0} total products`);

    // 1c. Calculate required flow rate
    const requiredCC = profile.targetHP
      ? calculateRequiredCC(profile.targetHP, profile.fuelType || "pump")
      : profile.desiredSizeCC || null;

    // 1d. Score ALL products using the heuristic engine
    const heuristicResults = scoreProducts(
      allProducts || [],
      profile,
      fitmentProductIds,
      makeFitmentProductIds
    );

    // 1e. Deduplicate
    const deduped = deduplicateResults(heuristicResults);

    console.log(`[Oracle] Heuristic: ${deduped.length} unique candidates (top: ${deduped[0]?.product?.name || "none"} @ ${deduped[0]?.score}pts)`);

    // ═══════════════════════════════════════
    // STAGE 2: INCLUSIVE POOL EXPANSION
    // ═══════════════════════════════════════

    // Start with top 12
    let shortList = deduped.slice(0, rules.poolSize.heuristicTop);

    // Force-inject fitment-confirmed products that didn't make top 12
    const fitmentMissing = deduped.filter(
      (r) => r.hasFitment && !shortList.find((s) => s.product.id === r.product.id)
    );
    if (fitmentMissing.length > 0) {
      shortList = [...shortList, ...fitmentMissing].slice(0, rules.poolSize.maxCandidates);
      console.log(`[Oracle] Pool expansion: +${fitmentMissing.length} fitment-confirmed products injected`);
    }

    // Force-inject high-flow products for max-power builds
    if (profile.goal === "max-power") {
      const highFlow = deduped.filter((r) => {
        const cc = Number(r.product.flow_rate_cc) || 0;
        return cc >= (rules.goalBoosts["max-power"]?.minCC || 550) &&
          !shortList.find((s) => s.product.id === r.product.id);
      }).slice(0, 4);
      shortList = [...shortList, ...highFlow].slice(0, rules.poolSize.maxCandidates);
    }

    // Force-inject E85-compatible products
    if (profile.fuelType === "e85") {
      const e85Products = deduped.filter((r) => {
        const desc = `${r.product.description || ""} ${r.product.name || ""}`.toLowerCase();
        return (rules.fuelBoosts.e85.keywords.some((kw: string) => desc.includes(kw))) &&
          !shortList.find((s) => s.product.id === r.product.id);
      }).slice(0, 4);
      shortList = [...shortList, ...e85Products].slice(0, rules.poolSize.maxCandidates);
    }

    console.log(`[Oracle] Final pool: ${shortList.length} candidates → ${shortList.map((c) => c.product.name?.slice(0, 30)).join(", ")}`);

    // ═══════════════════════════════════════
    // STAGE 3: AI FINAL DECISION MAKER
    // ═══════════════════════════════════════

    let finalResults = shortList.slice(0, rules.poolSize.aiMaxResults);
    let selectionStrategy = "";

    try {
      const model = getVertexModel("gemini-2.5-flash");
      if (!model) throw new Error("AI services unavailable");

      // Fetch knowledge base for grounding
      const { data: kbData } = await supabase
        .from("knowledge_base")
        .select("category, title, content");

      const candidateData = shortList.map((c) => ({
        id: c.product.id,
        name: c.product.name,
        sku: c.product.sku,
        cc: Number(c.product.flow_rate_cc) || null,
        price: c.product.price,
        impedance: c.product.impedance,
        connector: c.product.connector_type,
        brand: c.product.manufacturer || c.product.brand,
        fuelTypes: c.product.fuel_types,
        categories: c.product.raw_categories,
        description: c.product.description?.slice(0, 200),
        heuristicScore: c.score,
        heuristicReasons: c.reasons,
        hasFitment: c.hasFitment,
        matchType: c.matchType,
      }));

      const prompt = `You are the FiveO Motorsport Fuel Injector Oracle — a Senior Fuel Systems Engineer with 25+ years of experience in fuel injection sizing, fitment engineering, and forced-induction tuning.

You are the FINAL DECISION MAKER. Our engineering pre-filter has narrowed the catalog to ${shortList.length} viable candidates. Your job: evaluate every candidate against this customer's build profile, then select and rank the TOP 10 that best fit their specific application.

═══ CUSTOMER BUILD PROFILE ═══
${JSON.stringify(profile, null, 2)}

═══ ENGINEERING CALCULATIONS ═══
- Required flow rate: ${requiredCC || "Not specified"} cc/min
- BSFC factor: ${FUEL_BSFC[profile.fuelType || "pump"]} lb/hp/hr
- Vehicle fitment matches found: ${fitmentProductIds.length} (model-level), ${makeFitmentProductIds.length} (make-level)

═══ CANDIDATE POOL (${shortList.length} products from heuristic engine) ═══
${JSON.stringify(candidateData, null, 2)}

═══ KNOWLEDGE BASE ═══
${JSON.stringify((kbData || []).slice(0, 8), null, 2)}

═══ YOUR INSTRUCTIONS ═══

1. THE ORACLE PERSONA: You are the all-knowing fuel injection expert. Warm but authoritative. Grounded in engineering facts, not marketing fluff.

2. EVALUATION CRITERIA — Weigh each factor:
   - Flow rate fit (is the cc/min right for their HP target and fuel type?)
   - Vehicle fitment (is this confirmed for their vehicle, or a generic/universal fit?)
   - Impedance compatibility (high-Z preferred for modern ECUs)
   - Fuel type compatibility (E85 requires specific materials)
   - Price-to-performance value
   - Brand engineering quality
   - Connector type match
   - Use case suitability (daily driver vs track vs mixed)

3. SELECTION: Pick the TOP 10 products, ranked by overall build suitability. Products with confirmed vehicle fitment should be strongly preferred, but a better-fitting flow rate can override fitment if the technical case is compelling.

4. FOR EACH SELECTION, provide:
   - "matchStrategy": A 2-5 word technical badge (e.g., "Precision OEM Replacement", "High-Flow Track Weapon")
   - "preferenceSummary": ONE sentence starting with "We chose this because..." that directly references their specific build profile. Max 30 words.
   - "technicalNarrative": 150-250 words of deep technical analysis. COMPARE this injector against other candidates in the pool. Explain WHY this specific SKU was chosen over alternatives. Reference specific specs (flow rate, impedance, spray pattern). Include a "Pro-Tip" for tuning. Each narrative MUST be unique — do not reuse phrasing across products.

5. Write a "selectionStrategy" paragraph (100-150 words) explaining your overall reasoning process — how you weighed fitment vs flow rate vs budget, and why the top pick is #1.

6. SCORING: Assign each product a "score" from 0-100 based on YOUR holistic assessment. The #1 pick should be 95-100. Scores MUST be meaningfully different (minimum 2-point gaps). Do not cluster scores.

7. You MUST return results. If no perfect match exists, recommend the closest options with honest trade-off analysis.

═══ OUTPUT FORMAT ═══
Return strictly valid JSON:
{
  "selectionStrategy": "Your overall reasoning paragraph...",
  "refinement": [
    {
      "id": 123,
      "score": 97,
      "matchStrategy": "...",
      "preferenceSummary": "...",
      "technicalNarrative": "..."
    }
  ]
}`;

      const result = await model.generateContent(prompt);
      const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

      // Robust JSON extraction
      let cleanJson = text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) cleanJson = jsonMatch[0];

      const refined = JSON.parse(cleanJson);
      selectionStrategy = refined.selectionStrategy || "";
      const refinedList = refined.refinement || [];

      console.log(`[Oracle] AI selected ${refinedList.length} products from pool.`);

      if (refinedList.length > 0) {
        finalResults = refinedList
          .map((r: any) => {
            const original = shortList.find((c) => String(c.product.id) === String(r.id));
            if (!original) return null;
            return {
              ...original,
              score: r.score || original.score,
              matchStrategy: r.matchStrategy,
              preferenceSummary: r.preferenceSummary,
              technicalNarrative: r.technicalNarrative,
            };
          })
          .filter(Boolean);
      }
    } catch (aiError: any) {
      console.error("[Oracle] AI refinement failed, using heuristic results:", aiError.message);
      // Fallback: use heuristic scores directly, rescaled to 100
      selectionStrategy = "Our engineering analysis has identified these injectors as the strongest technical matches based on flow rate compatibility, vehicle fitment data, and your specified build parameters. While our AI advisor is temporarily unavailable, these recommendations are grounded in verified engineering calculations.";
    }

    // ═══════════════════════════════════════
    // STAGE 4: FINALIZE & RESPOND
    // ═══════════════════════════════════════

    // If AI provided scores, use them directly. Otherwise rescale heuristic scores.
    let outputResults = finalResults.slice(0, rules.poolSize.aiMaxResults);

    // Check if AI assigned its own scores (they'll be 0-100 range)
    const hasAiScores = outputResults.some((r) => r.matchStrategy);
    if (!hasAiScores && outputResults.length > 0) {
      // Rescale heuristic scores (Marquis pattern: top = 100%)
      const maxScore = Math.max(...outputResults.map((r) => r.score || 0));
      outputResults = outputResults.map((r) => ({
        ...r,
        score: maxScore > 0 ? Math.round(((r.score || 0) / maxScore) * 100) : 50,
        matchStrategy: r.hasFitment ? "Fitment Verified" : "Technical Match",
        preferenceSummary: r.reasons?.[0] || "Selected based on engineering compatibility.",
      }));
    }

    // Sort by score descending
    outputResults.sort((a, b) => (b.score || 0) - (a.score || 0));

    // Map hero images for frontend
    const finalWithImages = outputResults.map((r) => ({
      ...r,
      product: {
        ...r.product,
        heroImageUrl: r.product?.hero_image_url,
      },
    }));

    console.log(`[Oracle] Final: ${finalWithImages.length} results, top: ${finalWithImages[0]?.product?.name} @ ${finalWithImages[0]?.score}%`);

    return Response.json({
      results: finalWithImages,
      selectionStrategy,
      calculatedCC: requiredCC,
      fitmentMatches: fitmentProductIds.length,
      makeFitmentMatches: makeFitmentProductIds.length,
      candidatePoolSize: shortList.length,
    });
  } catch (error: any) {
    console.error("[Oracle] Fatal error:", error);
    return Response.json(
      {
        results: [],
        error: error.message || "Internal Server Error",
        reason: "The Oracle encountered an unexpected error processing your build profile. Please try again or adjust your criteria.",
      },
      { status: 500 }
    );
  }
}
