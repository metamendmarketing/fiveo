/**
 * Unified Google Generative AI Client (@google/genai)
 * 
 * This modern SDK replaces the legacy Vertex AI SDK to provide stable 
 * access to the Gemini 3.1 flagship models.
 */
import { createClient } from "@google/genai";
import fs from "fs";
import path from "path";

let clientInstance: any = null;

/**
 * Returns a configured GoogleGenAI client instance.
 * Supports Service Account authentication for both Vercel and local dev.
 */
export function getAIClient() {
  if (clientInstance) return clientInstance;

  let credentials;
  try {
    // 1. Production Path: Environment Variable
    if (process.env.VERTEX_CREDENTIALS_JSON) {
      credentials = JSON.parse(process.env.VERTEX_CREDENTIALS_JSON);
    } 
    // 2. Development Path: Local JSON Fallback
    else {
      const filePath = path.join(process.cwd(), "vertex-key.json");
      if (fs.existsSync(filePath)) {
        credentials = JSON.parse(fs.readFileSync(filePath, "utf8"));
      }
    }
  } catch (err) {
    console.error("[AI Client] 🚨 Failed to resolve credentials:", err);
  }

  const projectId = credentials?.project_id || process.env.VERTEX_PROJECT_ID;
  if (!projectId) {
    console.warn("[AI Client] ⚠️ Project ID missing. AI features disabled.");
    return null;
  }

  // Initialize the new unified client
  clientInstance = createClient({
    vertexai: true,
    project: projectId,
    location: "us-central1",
    // Pass the service account credentials directly to the new SDK
    auth: credentials ? {
      credentials: {
        type: "service_account",
        project_id: credentials.project_id,
        private_key: credentials.private_key,
        client_email: credentials.client_email,
        universe_domain: credentials.universe_domain || "googleapis.com"
      }
    } : undefined
  });

  return clientInstance;
}

/**
 * Legacy compatibility wrapper for the Oracle's generation stage.
 * Returns the client and the model name for use in route.ts.
 */
export function getVertexModel(modelName: string = "gemini-3.1-flash-lite") {
  const client = getAIClient();
  return { client, modelName };
}
