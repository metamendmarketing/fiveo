/**
 * Unified Google Generative AI Client (@google/genai)
 * 
 * Optimized for the Agent Platform API (2026 standard).
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
    if (process.env.VERTEX_CREDENTIALS_JSON) {
      credentials = JSON.parse(process.env.VERTEX_CREDENTIALS_JSON);
    } else {
      const filePath = path.join(process.cwd(), "vertex-key.json");
      if (fs.existsSync(filePath)) {
        credentials = JSON.parse(fs.readFileSync(filePath, "utf8"));
      }
    }

    if (credentials) {
      const tempCredPath = path.join(os.tmpdir(), "vertex-service-account.json");
      fs.writeFileSync(tempCredPath, JSON.stringify(credentials));
      process.env.GOOGLE_APPLICATION_CREDENTIALS = tempCredPath;
    }
  } catch (err) {
    console.error("[AI] 🚨 Credential error:", err);
  }

  const projectId = credentials?.project_id || process.env.VERTEX_PROJECT_ID;
  if (!projectId) {
    console.warn("[AI] ⚠️ Project ID missing.");
    return null;
  }

  /**
   * Agent Platform Initialization:
   * Using the 'global' location as required by the Agent Platform API.
   */
  try {
    clientInstance = new GoogleGenAI({
      vertexai: true,
      project: projectId,
      location: "global", // Required by Agent Platform
    });
    console.log(`[AI] ✅ Agent Platform Client initialized (Global) for project: ${projectId}`);
  } catch (initErr) {
    console.error("[AI] 🚨 Initialization failed:", initErr);
  }

  return clientInstance;
}

/**
 * Returns the client and the specific preview model ID required by Agent Platform.
 */
export function getVertexModel(modelName: string = "gemini-3.1-flash-lite-preview") {
  const client = getAIClient();
  return { client, modelName };
}
