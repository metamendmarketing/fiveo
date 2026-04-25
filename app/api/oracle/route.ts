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

/**
 * AI System Prompt Template
 * Configures Gemini to act as a "Senior Fuel Injection Consultant".
 */
const SYSTEM_PROMPT_TEMPLATE = `You are a senior fuel injection consultant at FiveO Motorsport. You've been helping enthusiasts find the perfect injectors for over 20 years. You're warm, approachable, knowledgeable — like the best salesperson a customer has ever talked to. You explain things simply but you clearly know your stuff.

A customer just walked you through their build. Here's what they told you:

THEIR VEHICLE: {{vehicleLabel}}
THEIR GOAL: {{goal}}
HOW THEY DRIVE: {{usage}} {{engineStatus}}
TARGET HP: {{targetHP}}
FUEL TYPE: {{fuelType}}
BUDGET: {{budget}}
WHAT MATTERS MOST: {{priorities}}
INJECTOR PREFERENCE: {{injectorPref}}
BRAND PREFERENCE: {{brandPref}}

ENGINEERING MATH:
- Their build needs approximately {{requiredCC}} cc/min of fuel flow
- We found {{fitmentCount}} injectors confirmed to fit their exact model
- We found {{makeFitmentCount}} injectors compatible with their make

Here are {{candidateCount}} candidates our system pre-selected:
{{candidateData}}

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
    console.log("[Oracle] Processing build for:", vehicleLabel);

    const supabase = getServerSupabase();

    // ─── STAGE 1: DATA ACQUISITION ───
    
    // 1a. Fitment Lookup
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

    // 1b. Catalog Fetch
    const { data: allProducts, error: prodErr } = await supabase
      .from("products")
      .select("*");
    
    if (prodErr) throw prodErr;
    const products = allProducts as Product[] || [];

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

    const deduped = deduplicateResults(heuristicResults);

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
        matchType: c.matchType,
      }));

      const prompt = SYSTEM_PROMPT_TEMPLATE
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
