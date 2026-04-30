/**
 * Unified Google Generative AI Client (@google/genai)
 * 
 * This modern SDK replaces the legacy Vertex AI SDK to provide stable 
 * access to the Gemini 3.1 flagship models.
 */
import { GoogleGenAI } from "@google/genai";
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

  /**
   * Initialize the new unified client using the pattern you found:
   * import { GoogleGenAI } from "@google/genai";
   * const ai = new GoogleGenAI({ vertexai: true, project, location });
   */
  clientInstance = new GoogleGenAI({
    vertexai: true,
    project: projectId,
    location: "us-central1",
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
