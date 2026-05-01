/**
 * FiveO Oracle — Central Type Definitions
 * 
 * This file contains all shared interfaces and types for the 
 * Fuel Injector Oracle engine, components, and API routes.
 */

/**
 * Raw Product interface representing a record from the 'products' table.
 */
export interface Product {
  id: number;
  sku: string;
  name: string;
  manufacturer?: string;
  brand?: string;
  flow_rate_cc?: number;
  size_cc?: number;
  impedance?: string;
  connector_type?: string;
  price?: number;
  fuel_types?: string[];
  description?: string;
  hero_image_url?: string;
  product_url?: string;
  url_key?: string;
  visibility?: string;
  raw_categories?: string[];
  notes?: string[];
}

/**
 * Scored product metadata from the heuristic engine.
 */
export interface ScoredProduct {
  product: Product;
  score: number;
  reasons: string[];
  hasFitment: boolean;
  matchType: "fitment_confirmed" | "make_match" | "flow_match" | "heuristic";
  confidenceLevel: "Verified Fit" | "Potential Platform Match" | "Likely Fit" | "Custom / Verify Fitment" | "Unverified";

  
  // AI-enriched fields (optional, added during AI refinement stage)
  matchStrategy?: string;
  aiHeadline?: string;
  preferenceSummary?: string;
  technicalNarrative?: string;
  proTip?: string;
}

/**
 * Fitment record from the 'product_fitment' table.
 */
export interface FitmentRecord {
  product_id: number;
  make_id?: number;
  model_id?: number;
  year_id?: number;
  engine_id?: number;
  year_start?: number;
  year_end?: number;
  engine_pattern?: string;
}

/**
 * API Response from /api/oracle
 */
export interface OracleApiResponse {
  results: ScoredProduct[];
  selectionStrategy: string;
  vehicleLabel: string;
  calculatedCC: number | null;
  fitmentMatches: number;
  makeFitmentMatches: number;
  candidatePoolSize: number;
  noVerifiedMatches: boolean;
  timing?: {
    total: number;
    acquisition: number;
    scoring: number;
    enrichment: number;
    ai: number;
    ai_error?: string | null;
  };
  error?: string;
  reason?: string;
}

/**
 * Vehicle cascading data types
 */
export interface VehicleMake {
  id: number;
  name: string;
}

export interface VehicleModel {
  id: number;
  name: string;
}

export interface VehicleYear {
  id: number;
  year: number;
}

export interface VehicleEngine {
  id: number;
  label: string;
  displacement?: string;
}
