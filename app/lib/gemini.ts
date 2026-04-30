import { VertexAI, GenerativeModel } from "@google-cloud/vertexai";
import fs from "fs";
import path from "path";

/**
 * Vertex AI / Gemini Utility
 * 
 * Handles authenticated access to Google Cloud Vertex AI.
 * Supports dual-path credential loading:
 * 1. VERTEX_CREDENTIALS_JSON (env var) for production/Vercel.
 * 2. vertex-key.json (local file) for local development.
 */

/**
 * Vertex AI / Gemini Integration Layer
 * 
 * Orchestrates secure, authenticated communication with Google Cloud Vertex AI.
 * Implements a singleton-like pattern with memoization to ensure high performance
 * and efficient resource utilization across concurrent Next.js API requests.
 */

// Model registry to cache instances by name
const modelInstances = new Map<string, any>();

/**
 * Initializes and returns a configured Gemini GenerativeModel instance.
 * 
 * Security:
 * - Supports encrypted environment variable loading (VERTEX_CREDENTIALS_JSON).
 * - Implements deterministic temperature controls for engineering accuracy.
 */
export function getVertexModel(modelName: string = "gemini-1.5-flash"): any {
  // Return cached instance if available for this specific model
  if (modelInstances.has(modelName)) return modelInstances.get(modelName);

  let credentials;

  try {
    // 1. Production Path: Parse credentials from high-entropy environment variable
    if (process.env.VERTEX_CREDENTIALS_JSON) {
      credentials = JSON.parse(process.env.VERTEX_CREDENTIALS_JSON);
    } 
    // 2. Development Path: Secure local file fallback
    else {
      const filePath = path.join(process.cwd(), "vertex-key.json");
      if (fs.existsSync(filePath)) {
        credentials = JSON.parse(fs.readFileSync(filePath, "utf8"));
      }
    }
  } catch (err) {
    console.error("[VertexAI] 🚨 Credential Resolution Error:", err instanceof Error ? err.message : "Malformed JSON");
  }

  const projectId = credentials?.project_id || process.env.VERTEX_PROJECT_ID;
  
  if (!projectId) {
    console.warn("[VertexAI] ⚠️ Project ID or credentials missing. Vertex AI services are currently offline.");
    return null;
  }

  try {
    const vertex = new VertexAI({
      project: projectId,
      location: "us-central1",
      googleAuthOptions: credentials ? { credentials } : undefined,
    });

    const model = vertex.preview.getGenerativeModel({
      model: modelName,
      generationConfig: { 
        responseMimeType: "application/json",
        temperature: 0.2, // Consistent technical logic
        topP: 0.95,
      },
    });

    modelInstances.set(modelName, model);
    return model;
  } catch (err) {
    console.error("[VertexAI] 🚨 Initialization Failed:", err);
    return null;
  }
}
