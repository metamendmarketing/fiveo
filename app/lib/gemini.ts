/**
 * Unified Google Generative AI Client (@google/genai)
 * 
 * Hardened for 2026 Production Environments using ADC (Application Default Credentials).
 */
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import os from "os";

let clientInstance: any = null;

export function getAIClient() {
  if (clientInstance) return clientInstance;

  let credentials;
  try {
    // 1. Resolve Credentials
    if (process.env.VERTEX_CREDENTIALS_JSON) {
      credentials = JSON.parse(process.env.VERTEX_CREDENTIALS_JSON);
    } else {
      const filePath = path.join(process.cwd(), "vertex-key.json");
      if (fs.existsSync(filePath)) {
        credentials = JSON.parse(fs.readFileSync(filePath, "utf8"));
      }
    }

    // 2. Set up Application Default Credentials (ADC) for the SDK to find
    if (credentials) {
      const tempCredPath = path.join(os.tmpdir(), "vertex-service-account.json");
      fs.writeFileSync(tempCredPath, JSON.stringify(credentials));
      process.env.GOOGLE_APPLICATION_CREDENTIALS = tempCredPath;
    }
  } catch (err) {
    console.error("[AI] 🚨 Credential setup failed:", err);
  }

  const projectId = credentials?.project_id || process.env.VERTEX_PROJECT_ID;
  if (!projectId) {
    console.warn("[AI] ⚠️ Project ID missing.");
    return null;
  }

  /**
   * Final SDK Initialization:
   * By setting GOOGLE_APPLICATION_CREDENTIALS above, the SDK will 
   * automatically find and use the service account.
   */
  try {
    clientInstance = new GoogleGenAI({
      vertexai: true,
      project: projectId,
      location: "us-central1"
    });
    console.log(`[AI] ✅ Client initialized with ADC for project: ${projectId}`);
  } catch (initErr) {
    console.error("[AI] 🚨 Initialization failed:", initErr);
  }

  return clientInstance;
}

export function getVertexModel(modelName: string = "gemini-3.1-flash-lite") {
  const client = getAIClient();
  return { client, modelName };
}
