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

let modelInstance: any = null;

/**
 * Returns a configured Gemini GenerativeModel instance.
 * Memoizes the instance to avoid re-initializing the Vertex client on every call.
 */
export function getVertexModel(modelName: string = "gemini-1.5-flash"): any {
  if (modelInstance) return modelInstance;

  let credentials;

  try {
    // Priority 1: Environment Variable (Production)
    if (process.env.VERTEX_CREDENTIALS_JSON) {
      credentials = JSON.parse(process.env.VERTEX_CREDENTIALS_JSON);
    } 
    // Priority 2: Local JSON File (Development)
    else {
      const filePath = path.join(process.cwd(), "vertex-key.json");
      if (fs.existsSync(filePath)) {
        credentials = JSON.parse(fs.readFileSync(filePath, "utf8"));
      }
    }
  } catch (err) {
    console.error("[VertexAI] Failed to load credentials:", err);
  }

  const projectId = credentials?.project_id || process.env.VERTEX_PROJECT_ID;
  if (!projectId) {
    console.warn("[VertexAI] Project ID missing. AI functionality disabled.");
    return null;
  }

  const vertex = new VertexAI({
    project: projectId,
    location: "us-central1",
    googleAuthOptions: credentials ? { credentials } : undefined,
  });

  modelInstance = vertex.preview.getGenerativeModel({
    model: modelName,
    generationConfig: { 
      responseMimeType: "application/json",
      temperature: 0.2, // Lower temperature for more deterministic technical advice
    },
  });

  return modelInstance;
}
