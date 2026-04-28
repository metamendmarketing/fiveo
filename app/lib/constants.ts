/**
 * Fuel Injector Oracle — Constants, Types & Formulas
 *
 * Central source of truth for the wizard state machine, scoring engine,
 * and brand design tokens. Every component and API route imports from here.
 */

// ═══════════════════════════════════════
// 1. WIZARD STEP DEFINITIONS
// ═══════════════════════════════════════

export type WizardStep =
  | "entry"
  | "vehicle-type"
  | "vehicle-details"
  | "engine-status"
  | "goal"
  | "usage"
  | "priorities"
  | "performance"
  | "preferences"
  | "expert-specs"
  | "processing"
  | "results";

/** Step sequences per entry mode */
export const STEP_SEQUENCES: Record<string, WizardStep[]> = {
  guide: [
    "entry",
    "vehicle-details", // Consolidated vehicle type + details + engine status
    "goal",
    "usage",
    "priorities",
    "performance",
    "preferences",
    "processing",
    "results",
  ],
  setup: [
    "entry",
    "vehicle-details",
    "goal",
    "performance",
    "preferences",
    "processing",
    "results",
  ],
  specs: [
    "entry",
    "expert-specs",
    "vehicle-details",
    "processing",
    "results",
  ],
  oem: [
    "entry",
    "vehicle-details",
    "processing",
    "results",
  ],
};

// ═══════════════════════════════════════
// 2. BUILD PROFILE (user answers)
// ═══════════════════════════════════════

export interface BuildProfile {
  // Entry
  entryMode: "guide" | "setup" | "specs" | "oem" | null;

  // Vehicle (Phase 1)
  vehicleType: "car" | "motorcycle" | "marine" | null;
  year: number | null;
  make: string | null;
  makeId: number | null;
  model: string | null;
  modelId: number | null;
  engineCode: string | null;
  engineLabel: string | null;

  // Intent (Phase 2)
  engineStatus: "stock" | "light-mods" | "heavily-modified" | null;
  goal: "replace" | "improve" | "max-power" | "fix-issues" | null;
  usage: "daily" | "street" | "track" | "mixed" | null;
  priorities: string[];

  // Performance (Phase 3)
  targetHP: number | null;
  hpMode: "stock" | "+50" | "+100" | "+150" | "custom" | "unsure";
  fuelType: "pump" | "e85" | "race" | "unsure" | null;
  mods: string[];

  // Preferences (Phase 4)
  injectorPref: "oem" | "performance" | "best-of-both" | null;
  budget: "budget" | "mid" | "premium" | null;
  brandPref: "fiveo" | "bosch" | "no-preference" | null;

  // Expert overrides
  desiredSizeCC: number | null;
  fuelPressurePSI: number | null;
  headroomPref: "conservative" | "balanced" | "aggressive" | null;
  connectorType: string | null;
}

export const INITIAL_PROFILE: BuildProfile = {
  entryMode: null,
  vehicleType: "car",
  year: null,
  make: null,
  makeId: null,
  model: null,
  modelId: null,
  engineCode: null,
  engineLabel: null,
  engineStatus: null,
  goal: null,
  usage: null,
  priorities: [],
  targetHP: null,
  hpMode: "unsure",
  fuelType: null,
  mods: [],
  injectorPref: null,
  budget: null,
  brandPref: null,
  desiredSizeCC: null,
  fuelPressurePSI: null,
  headroomPref: null,
  connectorType: null,
};

// ═══════════════════════════════════════
// 3. INJECTOR SIZING FORMULAS
// ═══════════════════════════════════════

/** Brake-Specific Fuel Consumption by fuel type (lb/hp/hr) */
export const FUEL_BSFC: Record<string, number> = {
  pump: 0.55,
  e85: 0.72,
  race: 0.60,
  unsure: 0.55,
};

/** Max duty cycle (industry standard = 80%) */
export const MAX_DUTY_CYCLE = 0.80;

/** Convert cc/min to lb/hr and vice versa */
export const CC_TO_LBHR = (cc: number) => cc / 10.5;
export const LBHR_TO_CC = (lbhr: number) => lbhr * 10.5;

/**
 * Calculate required injector size in cc/min
 * Formula: Required CC = (Target HP × BSFC) / (Cylinders × Max Duty Cycle) × 10.5
 */
export function calculateRequiredCC(
  targetHP: number,
  fuelType: string,
  cylinders: number = 4
): number {
  const bsfc = FUEL_BSFC[fuelType] || FUEL_BSFC.pump;
  const requiredLBHR = (targetHP * bsfc) / (cylinders * MAX_DUTY_CYCLE);
  return Math.round(requiredLBHR * 10.5);
}

/**
 * Standardizes product store URLs to the current FiveO Motorsport structure.
 * 1. Prioritizes the clean SEO 'url_key' slug.
 * 2. Removes legacy '.html' extensions.
 * 3. Ensures a trailing slash for root-collapsed products.
 */
export function getStoreUrl(product: { url_key?: string; product_url?: string }): string {
  const BASE_STORE = "https://www.fiveomotorsport.com";
  
  // Strategy A: Use the clean SEO slug (url_key) if available
  if (product.url_key) {
    let slug = product.url_key;
    // Strip "-each" suffix — these are single-unit Magento variants that 404 on the live site
    if (slug.endsWith("-each")) slug = slug.slice(0, -5);
    if (slug.startsWith("http")) return slug; // Already full URL
    if (slug.startsWith("/")) slug = slug.slice(1);
    if (!slug.endsWith("/")) slug += "/";
    return `${BASE_STORE}/${slug}`;
  }

  // Strategy B: Clean up legacy product_url
  if (product.product_url) {
    let clean = product.product_url.replace(/\.html$/, "");
    if (!clean.endsWith("/")) clean += "/";
    return clean;
  }

  return "#";
}

// ═══════════════════════════════════════
// 4. SCORING WEIGHTS (Layer 1)
// ═══════════════════════════════════════

export const SCORING_WEIGHTS = {
  fitmentConfidence: 0.25,
  flowRateMatch: 0.25,
  impedanceCompat: 0.15,
  connectorMatch: 0.10,
  priceAlignment: 0.10,
  brandPreference: 0.05,
  injectorTypeMatch: 0.10,
} as const;

// ═══════════════════════════════════════
// 5. LAYER 2 OVERRIDE TRIGGERS
// ═══════════════════════════════════════

export const OVERRIDE_TRIGGERS = {
  forceHighFlow: ["max-power"],
  forceTurboProducts: ["turbo", "supercharger"],
  boostPerformanceType: ["heavily-modified"],
  forceE85Compatible: ["e85"],
  boostTrackProducts: ["track"],
} as const;

// ═══════════════════════════════════════
// 6. BRAND DESIGN TOKENS
// ═══════════════════════════════════════

export const BRAND = {
  blue: "#00AEEF",
  red: "#E10600",
  dark: "#09090b",
  lightGray: "#f0f2f5",
} as const;

// ═══════════════════════════════════════
// 7. PROCESSING STATUS MESSAGES
// ═══════════════════════════════════════

export const PROCESSING_MESSAGES = [
  { threshold: 0, text: "Scanning compatibility database..." },
  { threshold: 15, text: "Cross-referencing fitment matrix..." },
  { threshold: 35, text: "Calculating flow requirements..." },
  { threshold: 55, text: "Applying performance overrides..." },
  { threshold: 75, text: "Generating expert analysis..." },
  { threshold: 90, text: "Finalizing matches..." },
  { threshold: 100, text: "Analysis Complete!" },
] as const;

// ═══════════════════════════════════════
// 8. IMAGE ASSET PATHS
// ═══════════════════════════════════════

const BASE = "/fiveo/demo/oracle";

export const IMAGES = {
  engineBayHero: `${BASE}/engine-bay-hero.png`,
  sunsetHighway: `${BASE}/daily-driver-v4.png`,
  trackDrift: `${BASE}/track-racing-v4.png`,
  nightStreet: `${BASE}/street-performance-v4.png`,
  dynoFlames: `${BASE}/dyno-flames.png`,
  carbonFiber: `${BASE}/carbon-v6.png`,
  darkWeave: `${BASE}/carbon-v6.png`,
  fuelE85: `${BASE}/fuel-e85.png`,
  raceFuel: `${BASE}/race-fuel.png`,
  pumpGas: `${BASE}/pump-gas.png`,
  diagnosticBay: `${BASE}/diagnostic-bay.png`,
  mixedUse: `${BASE}/mixed-use-v4.png`,
  improveStreet: `${BASE}/improve-street.png`,
} as const;

// ═══════════════════════════════════════
// 9. PRIORITY OPTIONS
// ═══════════════════════════════════════

export const PRIORITY_OPTIONS = [
  "Reliability",
  "Horsepower",
  "Smooth Drivability",
  "Fuel Efficiency",
  "Plug-and-Play Install",
] as const;

// ═══════════════════════════════════════
// 10. MOD OPTIONS
// ═══════════════════════════════════════

export const MOD_OPTIONS = [
  { value: "intake", label: "Intake", icon: "wind" },
  { value: "exhaust", label: "Exhaust", icon: "flame" },
  { value: "turbo", label: "Turbo / Supercharger", icon: "turbo" },
  { value: "ecu", label: "ECU Tune", icon: "chip" },
  { value: "none", label: "None", icon: "minus" },
] as const;
// EOF
