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

      const vehicleLabel = [profile.year, profile.make, profile.model].filter(Boolean).join(" ") || "your vehicle";

      const prompt = `You are a senior fuel injection consultant at FiveO Motorsport. You've been helping enthusiasts find the perfect injectors for over 20 years. You're warm, approachable, knowledgeable — like the best salesperson a customer has ever talked to. You explain things simply but you clearly know your stuff.

A customer just walked you through their build. Here's what they told you:

THEIR VEHICLE: ${vehicleLabel}
THEIR GOAL: ${profile.goal || "general upgrade"}
HOW THEY DRIVE: ${profile.usage || "not specified"} ${profile.engineStatus ? `(engine: ${profile.engineStatus})` : ""}
TARGET HP: ${profile.targetHP || "not specified"}
FUEL TYPE: ${profile.fuelType || "pump gas"}
BUDGET: ${profile.budget || "flexible"}
WHAT MATTERS MOST: ${(profile.priorities || []).join(", ") || "not specified"}
INJECTOR PREFERENCE: ${profile.injectorPref || "best match"}
BRAND PREFERENCE: ${profile.brandPref || "no preference"}

ENGINEERING MATH:
- Their build needs approximately ${requiredCC || "unknown"} cc/min of fuel flow
- We found ${fitmentProductIds.length} injectors confirmed to fit their exact model
- We found ${makeFitmentProductIds.length} injectors compatible with their make

Here are ${shortList.length} candidates our system pre-selected:
${JSON.stringify(candidateData, null, 2)}

YOUR JOB: Pick the best 8-10 injectors for this customer and explain your choices like you're having a conversation with them.

RULES FOR YOUR RESPONSE:

1. TONE: Talk like a helpful human, not a robot. Say "you" and "your." Be direct. No corporate jargon. No phrases like "as the Oracle" or "my primary directive." Just be a knowledgeable person helping someone.

2. "selectionStrategy" (60-80 words max): A brief, warm overview of how you approached finding injectors for THEIR specific build. Reference their vehicle by name, their goals, and what drove your top picks. Think of it as the opening paragraph of a personal email to the customer.

3. For each injector, provide:
   - "matchStrategy": A short, friendly label (3-5 words) for the results card. Examples: "Best All-Around Pick", "Premium Upgrade Path", "Great Value Option".
   - "aiHeadline": A punchy, expert headline for the detail view (3-6 words). Example: "The Gold Standard for J32A2 Builds".
   - "preferenceSummary": ONE conversational sentence (max 20 words) about why this fits THEIR build. Start with "This" or "These" — not "We chose." Example: "This injector nails your flow needs while keeping your daily driving smooth."
   - "technicalNarrative": 80-120 words. Explain why you're recommending this in plain English. Mention the flow rate and how it compares to what they need. If it has vehicle fitment, say so clearly. Mention one or two technical strengths. Keep it readable — short sentences, no walls of text.
   - "proTip": ONE practical, specific sentence of advice for this particular injector. Something a tuner friend would tell them. 15-25 words max. Example: "Ask your tuner to set base fuel pressure to 43.5 PSI — these Bosch units respond really well at that setting."

4. "score": Your honest assessment 0-100. Top pick should be 95-100. Every score must be different — no ties. Space them out naturally.

5. You MUST return results. If nothing is perfect, be honest about trade-offs.

OUTPUT FORMAT — Return strictly valid JSON:
{
  "selectionStrategy": "...",
  "refinement": [
    {
      "id": 123,
      "score": 97,
      "matchStrategy": "...",
      "aiHeadline": "...",
      "preferenceSummary": "...",
      "technicalNarrative": "...",
      "proTip": "..."
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
              aiHeadline: r.aiHeadline,
              preferenceSummary: r.preferenceSummary,
              technicalNarrative: r.technicalNarrative,
              proTip: r.proTip,
            };
          })
          .filter(Boolean);
      }
    } catch (aiError: any) {
      console.error("[Oracle] AI refinement failed, using heuristic results:", aiError.message);
      // Fallback: use heuristic scores directly, rescaled to 100
      selectionStrategy = "I've carefully analyzed your build specs, and while my advanced advisor is taking a quick breather, our engineering core has identified these as your absolute best matches. We've prioritized proven vehicle fitment and the flow rates you'll need to hit your performance goals safely.";
    }

    // ═══════════════════════════════════════
    // STAGE 4: FINALIZE & RESPOND
    // ═══════════════════════════════════════

    // If AI provided scores, use them directly. Otherwise rescale heuristic scores.
    let outputResults = finalResults.slice(0, rules.poolSize.aiMaxResults);

    // Check if AI assigned its own scores (they'll be 0-100 range)
    const hasAiScores = outputResults.some((r: any) => r.matchStrategy);
    if (!hasAiScores && outputResults.length > 0) {
      // Rescale heuristic scores (Marquis pattern: top = 100%)
      const maxScore = Math.max(...outputResults.map((r) => r.score || 0));
      outputResults = outputResults.map((r) => ({
        ...r,
        score: maxScore > 0 ? Math.round(((r.score || 0) / maxScore) * 100) : 50,
        matchStrategy: r.hasFitment ? "Expert Fitment Match" : "Technical Compatibility",
        preferenceSummary: r.reasons?.[0] || "This injector aligns perfectly with your fuel flow requirements.",
        proTip: "Make sure to verify your connector type matches your harness before installation.",
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
      vehicleLabel,
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
