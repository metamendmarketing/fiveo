/**
 * Vertex AI Client — Gemini 2.5 Flash
 *
 * Dual-path credential loading:
 * - Production (Vercel): VERTEX_CREDENTIALS_JSON env var (minified JSON)
 * - Local Dev: vertex-key.json file in project root
 *
 * Pattern borrowed from the Marquis Buying Assistant.
 */
import { VertexAI } from "@google-cloud/vertexai";
import fs from "fs";
import path from "path";

export function getVertexModel(modelName: string = "gemini-2.5-flash") {
  let credentials;

  // 1. Production (Vercel) — env var containing minified service account JSON
  if (process.env.VERTEX_CREDENTIALS_JSON) {
    try {
      credentials = JSON.parse(process.env.VERTEX_CREDENTIALS_JSON);
    } catch (e) {
      console.error("[VERTEX] Failed to parse credentials from env", e);
    }
  }
  // 2. Local dev — read from file (gitignored)
  else {
    try {
      const filePath = path.join(process.cwd(), "vertex-key.json");
      const fileContents = fs.readFileSync(filePath, "utf8");
      credentials = JSON.parse(fileContents);
    } catch (e) {
      console.error("[VERTEX] No vertex-key.json found. AI features will fail.", e);
    }
  }

  const projectId = credentials?.project_id || process.env.VERTEX_PROJECT_ID || "gen-lang-client-0736948026";

  const vertex = new VertexAI({
    project: projectId,
    location: "us-central1",
    googleAuthOptions: credentials ? { credentials } : undefined,
  });

  return vertex.preview.getGenerativeModel({
    model: modelName,
    generationConfig: { responseMimeType: "application/json" },
  });
}
