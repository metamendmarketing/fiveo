/**
 * FiveO Oracle — Heuristic Scoring Engine
 *
 * Multi-vector weighted scoring modeled after the Marquis Buying Assistant.
 * Ranks ALL products against user preference vectors to produce a candidate pool.
 * The AI layer then acts as the "Final Decision Maker" on this pre-filtered pool.
 *
 * Total possible score: 100 points (raw score IS the percentage).
 */

import type { BuildProfile } from "@/app/lib/constants";
import { calculateRequiredCC } from "@/app/lib/constants";
import { Product, ScoredProduct } from "@/app/lib/types";
import rules from "@/app/lib/scoring-rules.json";

/**
 * Weights and rules defined in scoring-rules.json
 */
interface ScoringRules {
  weights: {
    fitment: number;
    flowRate: number;
    impedance: number;
    fuelCompat: number;
    budget: number;
    brand: number;
    connectorMatch: number;
    useCaseAlignment: number;
  };
  flowRate: {
    perfectRange: number;
    acceptableRange: number;
    maxRange: number;
  };
  budgets: Record<string, [number, number]>;
  brandPrestige: Record<string, number>;
  useCaseTags: Record<string, string[]>;
  fuelBoosts: Record<string, { keywords: string[]; boost: number }>;
}

const typedRules = rules as unknown as ScoringRules;

/**
 * Core heuristic engine for the Fuel Injector Oracle.
 * 
 * Ranks products based on multiple dimensions:
 * 1. Vehicle Fitment (Primary)
 * 2. Flow Rate Accuracy (based on HP goals)
 * 3. Impedance Compatibility
 * 4. Fuel Type Compatibility (E85/Race)
 * 5. Budget Alignment
 * 6. Brand Preferences
 * 
 * @param products - The full catalog of products to score
 * @param profile - The user's build profile and preferences
 * @param fitmentProductIds - IDs of products confirmed to fit the specific model
 * @param makeFitmentProductIds - IDs of products compatible with the vehicle make
 * @returns Sorted list of ScoredProduct objects
 */
export function scoreProducts(
  products: Product[],
  profile: BuildProfile,
  fitmentProductIds: number[],
  makeFitmentProductIds: number[]
): ScoredProduct[] {
  const requiredCC = profile.targetHP
    ? calculateRequiredCC(profile.targetHP, profile.fuelType || "pump")
    : profile.desiredSizeCC || null;

  const weights = typedRules.weights;

  const scored: ScoredProduct[] = products.map((product) => {
    let score = 0;
    const reasons: string[] = [];
    const productCC = Number(product.flow_rate_cc || product.size_cc) || 0;

    // ── 1. Fitment Confidence (Max 30 pts) ──────────────
    const hasModelFitment = fitmentProductIds.includes(product.id);
    const hasMakeFitment = makeFitmentProductIds.includes(product.id);

    let matchType: ScoredProduct["matchType"] = "heuristic";

    if (hasModelFitment) {
      score += weights.fitment;
      reasons.push("Direct vehicle fitment confirmed — this injector is verified for your exact model.");
      matchType = "fitment_confirmed";
    } else if (hasMakeFitment) {
      score += Math.round(weights.fitment * 0.5);
      reasons.push("Compatible with your vehicle make — fitment confirmed at brand level.");
      matchType = "make_match";
    }

    // ── 2. Flow Rate Match (Max 25 pts) ─────────────────
    if (requiredCC && productCC) {
      const ratio = productCC / requiredCC;
      const deviance = Math.abs(1.0 - ratio);

      if (deviance <= typedRules.flowRate.perfectRange) {
        // Within ±10% — perfect match
        score += weights.flowRate;
        reasons.push(`Flow rate ${productCC}cc is an exceptional match for your ${requiredCC}cc requirement (${Math.round(ratio * 100)}% of target).`);
        if (matchType === "heuristic") matchType = "flow_match";
      } else if (deviance <= typedRules.flowRate.acceptableRange) {
        // Within ±30% — good match
        const factor = 1.0 - ((deviance - typedRules.flowRate.perfectRange) / (typedRules.flowRate.acceptableRange - typedRules.flowRate.perfectRange));
        score += Math.round(weights.flowRate * (0.5 + 0.5 * factor));
        reasons.push(`Flow rate ${productCC}cc falls within acceptable range for your ${requiredCC}cc requirement.`);
        if (matchType === "heuristic") matchType = "flow_match";
      } else if (deviance <= typedRules.flowRate.maxRange) {
        // Within ±50% — marginal match
        const factor = 1.0 - ((deviance - typedRules.flowRate.acceptableRange) / (typedRules.flowRate.maxRange - typedRules.flowRate.acceptableRange));
        score += Math.round(weights.flowRate * 0.3 * factor);
        reasons.push(`Flow rate ${productCC}cc is outside your ideal range but technically viable.`);
      }
    }

    // ── 3. Impedance Compatibility (Max 10 pts) ─────────
    const impedanceStr = String(product.impedance || "");
    const impedanceMatch = impedanceStr.match(/(\d+(\.\d+)?)/);
    const impedance = impedanceMatch ? parseFloat(impedanceMatch[0]) : 0;

    if (impedance >= 10) {
      score += weights.impedance;
      reasons.push("High-impedance (saturated) design — universal ECU compatibility, no resistor pack needed.");
    } else if (impedance > 0 && impedance < 10) {
      score += Math.round(weights.impedance * 0.5);
      reasons.push("Low-impedance (peak-and-hold) — requires compatible ECU driver or resistor pack.");
    }

    // ── 4. Fuel Compatibility (Max 10 pts) ──────────────
    const productFuels = (product.fuel_types || []).map((f: string) => f.toLowerCase());
    const productDesc = (product.description || "").toLowerCase();
    const productName = (product.name || "").toLowerCase();
    const combinedText = `${productDesc} ${productName}`;

    if (profile.fuelType && profile.fuelType !== "unsure") {
      const fuelBoost = typedRules.fuelBoosts[profile.fuelType];
      if (fuelBoost) {
        const hasMatch = fuelBoost.keywords.some((kw: string) =>
          productFuels.includes(kw) || combinedText.includes(kw)
        );
        if (hasMatch) {
          score += weights.fuelCompat;
          reasons.push(`Verified compatible with ${profile.fuelType.toUpperCase()} fuel systems.`);
        }
      } else if (profile.fuelType === "pump") {
        if (productFuels.includes("gasoline") || productFuels.length === 0) {
          score += weights.fuelCompat;
        }
      }
    }

    // ── 5. Budget Alignment (Max 10 pts) ────────────────
    const price = Number(product.price) || 0;
    if (profile.budget && price > 0) {
      const range = typedRules.budgets[profile.budget];
      if (range && price >= range[0] && price <= range[1]) {
        score += weights.budget;
        reasons.push(`Price $${price} falls within your ${profile.budget} budget range.`);
      } else if (range && price < range[1] * 1.5 && price > range[0] * 0.5) {
        // Close to range — partial credit
        score += Math.round(weights.budget * 0.4);
      }
    }

    // ── 6. Brand Preference (Max 5 pts) ─────────────────
    const productBrand = (product.manufacturer || product.brand || "").toLowerCase();
    if (profile.brandPref && profile.brandPref !== "no-preference") {
      if (productBrand.includes(profile.brandPref.toLowerCase())) {
        score += weights.brand;
        reasons.push(`Matches your ${profile.brandPref} brand preference.`);
      }
    }
    // Prestige micro-weight (tie-breaker)
    for (const [brand, bonus] of Object.entries(typedRules.brandPrestige)) {
      if (productBrand.includes(brand.toLowerCase())) {
        score += bonus;
        break; 
      }
    }

    // ── 7. Connector Match (Max 5 pts) ──────────────────
    if (profile.connectorType && product.connector_type) {
      if (product.connector_type.toLowerCase().includes(profile.connectorType.toLowerCase())) {
        score += weights.connectorMatch;
        reasons.push(`${product.connector_type} connector is a direct match.`);
      }
    }

    // ── 8. Use-Case Alignment (Max 5 pts) ───────────────
    const categories = (product.raw_categories || []).join(" ").toLowerCase();
    if (profile.usage) {
      const tags = typedRules.useCaseTags[profile.usage] || [];
      const hasTag = tags.some((tag: string) =>
        categories.includes(tag) || combinedText.includes(tag)
      );
      if (hasTag) {
        score += weights.useCaseAlignment;
        reasons.push(`Product aligns with your ${profile.usage} driving use case.`);
      }
    }

    return {
      product,
      score,
      reasons,
      hasFitment: hasModelFitment || hasMakeFitment,
      matchType,
    };
  });

  return scored.sort((a, b) => b.score - a.score);
}

/**
 * Deduplicate products with the same flow rate and very similar names.
 * Keeps the first (highest-scored) instance.
 * 
 * @param results - Scored products to deduplicate
 */
export function deduplicateResults(results: ScoredProduct[]): ScoredProduct[] {
  const seen = new Set<string>();
  return results.filter((r) => {
    const cc = Number(r.product.flow_rate_cc || r.product.size_cc) || 0;
    const nameKey = (r.product.name || "").toLowerCase().replace(/\s+/g, " ").trim().slice(0, 40);
    const key = `${cc}-${nameKey}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
