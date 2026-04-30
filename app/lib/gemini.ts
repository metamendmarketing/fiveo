/**
 * Unified Google Generative AI Client (@google/genai)
 * 
 * Hardened for 2026 Production Environments.
 */
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

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
  } catch (err) {
    console.error("[AI] 🚨 Credential error:", err);
  }

  const projectId = credentials?.project_id || process.env.VERTEX_PROJECT_ID;
  if (!projectId) {
    console.warn("[AI] ⚠️ Project ID missing.");
    return null;
  }

  /**
   * Hardened Initialization:
   * Explicitly passing the Service Account into the vertexai configuration block.
   */
  try {
    clientInstance = new GoogleGenAI({
      vertexai: {
        project: projectId,
        location: "us-central1",
        // The new SDK often expects 'auth' or 'credentials' inside the vertexai block
        credentials: credentials ? {
          type: "service_account",
          project_id: credentials.project_id,
          private_key: credentials.private_key,
          client_email: credentials.client_email,
        } : undefined
      }
    });
    console.log(`[AI] ✅ Client initialized for project: ${projectId}`);
  } catch (initErr) {
    console.error("[AI] 🚨 Initialization failed:", initErr);
  }

  return clientInstance;
}

export function getVertexModel(modelName: string = "gemini-3.1-flash-lite") {
  const client = getAIClient();
  return { client, modelName };
}
