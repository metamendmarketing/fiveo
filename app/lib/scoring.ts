/**
 * FiveO Oracle — Heuristic Scoring Engine
 *
 * Multi-vector weighted scoring.
 * Ranks ALL products against user preference vectors to produce a candidate pool.
 * The AI layer then acts as the "Final Decision Maker" on this pre-filtered pool.
 *
 * Total possible score: 100 points (raw score IS the percentage).
 */

import type { BuildProfile } from "@/app/lib/constants";
import { calculateRequiredCC, parseCylinders, parseProductSetSize, isDirectInjectionVehicle, isProductDI } from "@/app/lib/constants";
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
  // ── 0. Engine Accuracy Detection ────────────────────
  const cylinders = profile.desiredSizeCC ? 1 : parseCylinders(profile.engineLabel || "", "");
  
  const requiredCC = (profile.hpMode === "custom" && profile.targetHP)
    ? calculateRequiredCC(profile.targetHP, profile.fuelType || "pump", cylinders, profile.headroomPref)
    : profile.desiredSizeCC || null;

  // Dynamic Weights: Boost spec-specific weights if user is in 'specs' mode
  const isExpert = profile.entryMode === "specs";
  const weights = { ...typedRules.weights };
  if (isExpert) {
    weights.connectorMatch *= 2;
    weights.impedance = (weights.impedance || 10) * 2;
  }

  const isVehicleDI = isDirectInjectionVehicle(profile.engineLabel || "");

  const scored: ScoredProduct[] = products.map((product) => {
    let score = 0;
    const reasons: string[] = [];
    const productCC = Number(product.flow_rate_cc || product.size_cc) || 0;

    const hasModelFitment = fitmentProductIds.includes(product.id);
    const hasMakeFitment = makeFitmentProductIds.includes(product.id);

    // ── 0. HARDWARE COMPATIBILITY GATES (Pass/Fail) ──────
    let isHardReject = false;

    // Gate A: Cylinder Count vs Set Size
    const setSize = parseProductSetSize(product.name || "", product.description || "");
    if (setSize !== null && setSize > 1 && setSize !== cylinders) {
      score -= 1000;
      reasons.push(`🚨 HARD FAIL: Cylinder count mismatch. Vehicle requires ${cylinders} injectors, but this is a set of ${setSize}.`);
      isHardReject = true;
    }

    // Gate B: Direct Injection (DI) vs Port Injection (PI)
    const productDIStatus = isProductDI(product);
    if (productDIStatus !== null) {
      if (isVehicleDI && !productDIStatus) {
        score -= 1000;
        reasons.push("🚨 HARD FAIL: Injection type mismatch. Vehicle is Direct Injection (DI), but product is Port Injection.");
        isHardReject = true;
      } else if (!isVehicleDI && productDIStatus) {
        score -= 1000;
        reasons.push("🚨 HARD FAIL: Injection type mismatch. Vehicle is Port Injection, but product is Direct Injection.");
        isHardReject = true;
      }
    } else {
      // Product DI status is unknown
      if (isVehicleDI) {
        score = Math.min(score, 50);
        reasons.push("⚠️ SCORE CAP: Product injection type is unknown. Capped at 50 to prevent false positives for DI vehicle.");
      }
    }

    // Gate C: Platform Conflict Penalty
    const isCustomBuild = profile.entryMode === "specs";
    const hasVehicleSelected = !!profile.make;
    const combinedProductText = `${product.raw_categories?.join(" ") || ""} ${product.notes?.join(" ") || ""} ${product.name}`.toLowerCase();

    if (!isCustomBuild && hasVehicleSelected) {
      const vehicleMake = (profile.make || "").toLowerCase();
      // List of major OEMs to check for conflicts
      const competitorMakes = ["jeep", "ford", "chevy", "chevrolet", "subaru", "honda", "toyota", "nissan", "dodge", "chrysler", "bmw", "audi", "vw", "volkswagen", "porsche", "mazda", "mitsubishi"].filter(m => m !== vehicleMake);
      
      const hasConflict = competitorMakes.some(m => combinedProductText.includes(m));
      const mentionsOwnMake = combinedProductText.includes(vehicleMake);
      
      if (hasConflict && !mentionsOwnMake) {
        score -= 1000;
        reasons.push(`🚨 HARD FAIL: Product application appears to conflict with selected vehicle platform (${profile.make}).`);
        isHardReject = true;
      } else if (!hasConflict && !mentionsOwnMake && !hasMakeFitment && !hasModelFitment) {
        // Soft Platform Ambiguity: No fitment evidence, no specific platform mentioned, and not explicitly universal
        const isUniversal = combinedProductText.includes("universal");
        if (!isUniversal) {
          score -= 15;
          reasons.push("⚠️ SOFT PENALTY (-15): Unknown platform origin (ambiguous fitment).");
        }
      }
    }

    // If hard rejected, skip adding further positive heuristic points
    if (isHardReject) {
      return {
        product,
        score,
        reasons,
        hasFitment: false,
        matchType: "heuristic" as const,
        confidenceLevel: "Unverified",
      };
    }

    // ── 1. Fitment Confidence (Max 30 pts) ──────────────
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

    // ── 9. URL Stability & Condition (Quality Control) ──
    const slug = (product.url_key || "").toLowerCase();
    const isBoschPattern = /^\d{10}/.test(slug) || slug.includes("-0280");
    const isNew = productName.includes("new") || productDesc.includes("brand new");
    const isReman = productName.includes("reman") || productName.includes("reconditioned");

    // Penalty for raw part-number slugs (high 404 risk)
    if (isBoschPattern) {
      score -= 5;
    } else if (slug && slug.length > 10 && !slug.includes("auto-")) {
      // Bonus for descriptive SEO slugs
      score += 5;
    }

    // Tie-breaker: Prefer "NEW" over "Reman" if everything else is equal
    if (isNew) score += 3;
    if (isReman) score -= 2;

    // Gate D: Fitment Evidence Cap
    if (!isCustomBuild && hasVehicleSelected && !hasModelFitment && !hasMakeFitment) {
      const isUniversal = combinedProductText.includes("universal") || combinedText.includes("universal");
      if (!isUniversal) {
        score = Math.min(score, 45);
        reasons.push("Requires manual verification: no confirmed vehicle fitment evidence.");
      }
    }

    // Assign Confidence Tier
    let confidenceLevel: ScoredProduct["confidenceLevel"] = "Unverified";
    if (hasModelFitment) {
      confidenceLevel = "Verified Fit";
    } else if (hasMakeFitment) {
      confidenceLevel = "Likely Fit";
    } else if (isCustomBuild) {
      confidenceLevel = "Custom / Verify Fitment";
    }

    return {
      product,
      score,
      reasons,
      hasFitment: hasModelFitment || hasMakeFitment,
      matchType,
      confidenceLevel,
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
  const seenByName = new Set<string>();
  const seenByUrl = new Set<string>();
  return results.filter((r) => {
    // Strategy 1: Deduplicate by flow rate + name prefix (original logic)
    const cc = Number(r.product.flow_rate_cc || r.product.size_cc) || 0;
    const nameKey = (r.product.name || "").toLowerCase().replace(/\s+/g, " ").trim().slice(0, 40);
    const nameDedup = `${cc}-${nameKey}`;

    // Strategy 2: Deduplicate by resolved url_key (same store page = same product)
    let urlKey = (r.product.url_key || "").toLowerCase();
    if (urlKey.endsWith("-each")) urlKey = urlKey.slice(0, -5);
    const urlDedup = urlKey || null;

    // Reject if either dedup key has been seen before
    if (seenByName.has(nameDedup)) return false;
    if (urlDedup && seenByUrl.has(urlDedup)) return false;

    seenByName.add(nameDedup);
    if (urlDedup) seenByUrl.add(urlDedup);
    return true;
  });
}
