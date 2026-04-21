/**
 * POST /api/oracle — Main Oracle Engine (3-Layer Recommendation)
 *
 * Layer 1: Deterministic scoring (fitment + flow rate math)
 * Layer 2: Strategic overrides (intent-based injection)
 * Layer 3: AI refinement via Gemini 2.5 Flash
 */
import { NextRequest } from "next/server";
import { getServerSupabase } from "@/app/lib/supabase";
import { getVertexModel } from "@/app/lib/gemini";
import {
  type BuildProfile,
  calculateRequiredCC,
  SCORING_WEIGHTS,
  OVERRIDE_TRIGGERS,
  FUEL_BSFC,
} from "@/app/lib/constants";

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
    // LAYER 1: DETERMINISTIC SCORING
    // ═══════════════════════════════════════

    // 1a. Fetch candidate products
    let query = supabase.from("products").select("*");

    // If we have a vehicle, get fitment-matched products first
    let fitmentProductIds: number[] = [];
    if (profile.modelId && profile.year) {
      const { data: fitment } = await supabase
        .from("fitment")
        .select("product_id")
        .eq("model_id", profile.modelId)
        .lte("year_start", profile.year)
        .gte("year_end", profile.year);

      fitmentProductIds = (fitment || []).map((f: any) => f.product_id);
    }

    const { data: allProducts, error: prodErr } = await query;
    if (prodErr) throw prodErr;

    console.log(`[Oracle] ${allProducts?.length || 0} products in catalog, ${fitmentProductIds.length} fitment matches`);

    // 1b. Calculate required flow rate
    const requiredCC = profile.targetHP
      ? calculateRequiredCC(profile.targetHP, profile.fuelType || "pump")
      : null;

    // 1c. Score all products
    const scored = (allProducts || []).map((product: any) => {
      let score = 0;
      const reasons: string[] = [];
      const productCC = product.size_cc || product.flow_rate_cc || 0;

      // Fitment confidence (25%)
      const hasFitment = fitmentProductIds.includes(product.id);
      if (hasFitment) {
        score += SCORING_WEIGHTS.fitmentConfidence * 100;
        reasons.push("Direct vehicle fitment confirmed.");
      }

      // Flow rate match (25%)
      if (requiredCC && productCC) {
        const ratio = productCC / requiredCC;
        if (ratio >= 0.9 && ratio <= 1.3) {
          score += SCORING_WEIGHTS.flowRateMatch * 100;
          reasons.push(`Flow rate ${productCC}cc optimally matches your ${requiredCC}cc requirement.`);
        } else if (ratio >= 0.7 && ratio <= 1.6) {
          score += SCORING_WEIGHTS.flowRateMatch * 60;
          reasons.push(`Flow rate ${productCC}cc is within acceptable range of your ${requiredCC}cc target.`);
        }
      }

      // Impedance compatibility (15%)
      const impedance = product.impedance || product.ohms;
      if (impedance) {
        // High impedance is universally compatible
        if (impedance >= 10) {
          score += SCORING_WEIGHTS.impedanceCompat * 100;
          reasons.push("High-impedance design for universal ECU compatibility.");
        }
      }

      // Connector match (10%)
      if (profile.connectorType && product.connector_type) {
        if (product.connector_type.toLowerCase().includes(profile.connectorType.toLowerCase())) {
          score += SCORING_WEIGHTS.connectorMatch * 100;
          reasons.push(`${product.connector_type} connector is a direct match.`);
        }
      }

      // Price alignment (10%)
      if (profile.budget && product.price) {
        const priceMap: Record<string, [number, number]> = {
          budget: [0, 200],
          mid: [150, 400],
          premium: [350, 1000],
        };
        const range = priceMap[profile.budget];
        if (range && product.price >= range[0] && product.price <= range[1]) {
          score += SCORING_WEIGHTS.priceAlignment * 100;
          reasons.push("Price falls within your specified budget range.");
        }
      }

      // Brand preference (5%)
      if (profile.brandPref && profile.brandPref !== "no-preference") {
        const productBrand = (product.brand || product.manufacturer || "").toLowerCase();
        if (productBrand.includes(profile.brandPref.toLowerCase())) {
          score += SCORING_WEIGHTS.brandPreference * 100;
        }
      }

      // Injector type match (10%)
      if (profile.injectorPref) {
        const isPerformance = (product.category || "").toLowerCase().includes("performance");
        if (profile.injectorPref === "performance" && isPerformance) {
          score += SCORING_WEIGHTS.injectorTypeMatch * 100;
        } else if (profile.injectorPref === "oem" && !isPerformance) {
          score += SCORING_WEIGHTS.injectorTypeMatch * 100;
        } else if (profile.injectorPref === "best-of-both") {
          score += SCORING_WEIGHTS.injectorTypeMatch * 50;
        }
      }

      return { product, score: Math.round(score), reasons };
    });

    // ═══════════════════════════════════════
    // LAYER 2: STRATEGIC OVERRIDES
    // ═══════════════════════════════════════

    let candidates = scored.sort((a, b) => b.score - a.score).slice(0, 16);

    // Force-inject high-flow products for max-power goals
    if (profile.goal === "max-power") {
      const highFlow = scored
        .filter((s) => {
          const cc = s.product.size_cc || 0;
          return cc >= 550 && !candidates.find((c) => c.product.id === s.product.id);
        })
        .slice(0, 4);
      candidates = [...candidates, ...highFlow].slice(0, 16);
    }

    // Boost turbo-compatible products
    if (profile.mods.includes("turbo")) {
      candidates = candidates.map((c) => {
        const tags = (c.product.tags || c.product.usage_tags || "").toLowerCase();
        if (tags.includes("turbo") || tags.includes("forced-induction")) {
          return { ...c, score: Math.min(c.score + 15, 100), reasons: [...c.reasons, "Turbo/FI-optimized design."] };
        }
        return c;
      });
    }

    // Boost E85-compatible products
    if (profile.fuelType === "e85") {
      candidates = candidates.map((c) => {
        const tags = (c.product.tags || c.product.description || "").toLowerCase();
        if (tags.includes("e85") || tags.includes("flex")) {
          return { ...c, score: Math.min(c.score + 10, 100), reasons: [...c.reasons, "E85/Flex fuel compatible."] };
        }
        return c;
      });
    }

    // Re-sort after overrides
    candidates.sort((a, b) => b.score - a.score);

    console.log(`[Oracle] Layer 2 complete: ${candidates.length} candidates, top: ${candidates[0]?.product?.name || "none"}`);

    // ═══════════════════════════════════════
    // LAYER 3: AI REFINEMENT (GEMINI)
    // ═══════════════════════════════════════

    let finalResults = candidates.slice(0, 10);
    let selectionStrategy = "";

    try {
      const model = getVertexModel("gemini-2.5-flash");

      // Fetch knowledge base context
      const { data: kbData } = await supabase
        .from("knowledge_base")
        .select("category, title, content");

      const prompt = `You are the FiveO Motorsport Fuel Injector Oracle — a senior technical advisor with 25+ years of fuel system engineering expertise.

USER BUILD PROFILE:
${JSON.stringify(profile, null, 2)}

CALCULATED REQUIREMENTS:
- Required flow: ${requiredCC || "Unknown"}cc/min
- BSFC factor: ${FUEL_BSFC[profile.fuelType || "pump"]} lb/hp/hr
- Fitment matches: ${fitmentProductIds.length}

CANDIDATE PRODUCTS (${candidates.length} from heuristic engine):
${JSON.stringify(
  candidates.slice(0, 12).map((c) => ({
    id: c.product.id,
    name: c.product.name || c.product.title,
    cc: c.product.size_cc || c.product.flow_rate_cc,
    score: c.score,
    category: c.product.category,
    impedance: c.product.impedance || c.product.ohms,
    connector: c.product.connector_type,
    brand: c.product.brand || c.product.manufacturer,
    price: c.product.price,
    reasons: c.reasons,
  })),
  null,
  2
)}

KNOWLEDGE BASE:
${JSON.stringify((kbData || []).slice(0, 10), null, 2)}

INSTRUCTIONS:
1. Select up to 10 products from candidates, ranked by build fit.
2. For each, write a "matchStrategy" (2-4 word technical badge) and "preferenceSummary" (one sentence explaining WHY this injector fits their build).
3. Write a "selectionStrategy" paragraph explaining overall selection reasoning.
4. You MUST provide results. If no perfect match exists, recommend the closest options with honest reasoning.

Return valid JSON:
{
  "selectionStrategy": "...",
  "refinement": [
    { "id": "...", "matchStrategy": "...", "preferenceSummary": "...", "rank": 1 }
  ]
}`;

      const result = await model.generateContent(prompt);
      const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

      let cleanJson = text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) cleanJson = jsonMatch[0];

      const refined = JSON.parse(cleanJson);
      selectionStrategy = refined.selectionStrategy || "";
      const refinedList = refined.refinement || [];

      if (refinedList.length > 0) {
        finalResults = refinedList
          .map((r: any) => {
            const original = candidates.find((c) => String(c.product.id) === String(r.id));
            if (!original) return null;
            return {
              ...original,
              matchStrategy: r.matchStrategy,
              preferenceSummary: r.preferenceSummary,
            };
          })
          .filter(Boolean);
      }
    } catch (aiError: any) {
      console.error("[Oracle] AI refinement failed, using heuristic results:", aiError.message);
    }

    // Relative rescaling (top match = 100%)
    const maxScore = Math.max(...finalResults.map((r) => r.score || 0));
    const anchored = finalResults.map((r) => ({
      ...r,
      score: maxScore > 0 ? Math.round(((r.score || 0) / maxScore) * 100) : 100,
    }));

    anchored.sort((a, b) => (b.score || 0) - (a.score || 0));

    console.log(`[Oracle] Final: ${anchored.length} results`);

    return Response.json({
      results: anchored.slice(0, 10),
      selectionStrategy,
      calculatedCC: requiredCC,
      fitmentMatches: fitmentProductIds.length,
    });
  } catch (error: any) {
    console.error("[Oracle] Fatal error:", error);
    return Response.json(
      { results: [], error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
