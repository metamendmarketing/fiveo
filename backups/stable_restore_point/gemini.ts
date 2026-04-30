/**
 * @file gemini.ts
 * @description Unified Google Generative AI Client (@google/genai) for the FiveO Fuel Injector Oracle.
 * 
 * DESIGN RATIONALE:
 * This module utilizes the 2026 unified Google GenAI SDK. It is specifically configured 
 * for the "Agent Platform API" which requires a 'global' location setting and 
 * '-preview' model identifiers. 
 * 
 * AUTHENTICATION PATTERN:
 * Implements Application Default Credentials (ADC) via a temporary identity file. 
 * This ensures compatibility with both local development (ADC) and Vercel (JSON secret).
 * 
 * @module lib/gemini
 */

import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import os from "os";

/** 
 * Singleton instance of the AI client to prevent redundant memory allocation 
 * across the serverless request lifecycle.
 */
let clientInstance: any = null;

/**
 * Resolves and initializes the Google GenAI client.
 * 
 * @returns {GoogleGenAI | null} A configured client instance or null if credentials are missing.
 * @throws {Error} Logs initialization failures to the server console for rapid debugging.
 */
export function getAIClient() {
  if (clientInstance) return clientInstance;

  let credentials;
  try {
    // 1. Primary Resolution: Encrypted Vercel Environment Variable
    if (process.env.VERTEX_CREDENTIALS_JSON) {
      credentials = JSON.parse(process.env.VERTEX_CREDENTIALS_JSON);
    } 
    // 2. Secondary Resolution: Local Secure JSON Fallback
    else {
      const filePath = path.join(process.cwd(), "vertex-key.json");
      if (fs.existsSync(filePath)) {
        credentials = JSON.parse(fs.readFileSync(filePath, "utf8"));
      }
    }

    /**
     * ADC BOOTSTRAP:
     * The @google/genai SDK natively searches for GOOGLE_APPLICATION_CREDENTIALS.
     * We dynamically write the secret to the OS temp directory to satisfy this handshake.
     */
    if (credentials) {
      const tempCredPath = path.join(os.tmpdir(), "vertex-service-account.json");
      fs.writeFileSync(tempCredPath, JSON.stringify(credentials));
      process.env.GOOGLE_APPLICATION_CREDENTIALS = tempCredPath;
    }
  } catch (err) {
    console.error("[Oracle AI] 🚨 Credential resolution failed. Verify VERTEX_CREDENTIALS_JSON format.");
  }

  const projectId = credentials?.project_id || process.env.VERTEX_PROJECT_ID;
  if (!projectId) {
    console.warn("[Oracle AI] ⚠️ Authentication identity missing. AI features are currently disabled.");
    return null;
  }

  try {
    /**
     * AGENT PLATFORM CONFIGURATION:
     * - location: 'global' is mandatory for the Agentic fleet of Gemini 3.1 models.
     * - vertexai: true enables the high-performance Enterprise endpoint.
     */
    clientInstance = new GoogleGenAI({
      vertexai: true,
      project: projectId,
      location: "global",
    });
    
    // High-visibility log for auditing AI connectivity in production logs
    console.log(`[Oracle AI] ✅ Client successfully initialized for Project ID: ${projectId}`);
  } catch (initErr) {
    console.error("[Oracle AI] 🚨 Initialization fatal error:", initErr instanceof Error ? initErr.message : "Unknown Bridge Failure");
  }

  return clientInstance;
}

/**
 * Convenience wrapper for the Oracle generation stage.
 * 
 * @param {string} modelName - The target Gemini model ID (defaults to the stable 3.1 Flash-Lite preview).
 * @returns {Object} { client, modelName } - Ready-to-use generation context.
 */
export function getVertexModel(modelName: string = "gemini-3.1-flash-lite-preview") {
  const client = getAIClient();
  return { client, modelName };
}
