# FiveO Fuel Injector Oracle — Engineering Handoff

Welcome to the FiveO Oracle. This application is a high-performance recommendation engine designed to bridge the gap between complex automotive fitment data and AI-driven expert advice.

## 🚀 Architectural Overview

The Oracle operates as a multi-stage pipeline within a Next.js 16 (App Router) environment:

1.  **Data Layer (Supabase)**: High-velocity selective fetching from the `products` and `product_fitment` tables.
2.  **Heuristic Engine (`scoring.ts`)**: A deterministic ranking system that filters thousands of candidates based on flow-rate math and confirmed vehicle fitment.
3.  **AI Engine (Gemini 3.1 Flash-Lite)**: A cutting-edge LLM stage that transforms raw product data into "Seasoned Shop Guy" narratives.
4.  **Telemetry Dashboard**: Built-in timing diagnostics that track latency across every stage of the pipeline.

## 🧠 AI Connectivity (Critical)

The Oracle uses the modern **`@google/genai`** SDK and connects via the **Agent Platform API**.

*   **Location**: Must be set to `global`.
*   **Model ID**: `gemini-3.1-flash-lite-preview`.
*   **Authentication**: Implements **Application Default Credentials (ADC)**. It dynamically writes the `VERTEX_CREDENTIALS_JSON` secret to a temporary identity file at runtime to satisfy the Google handshake.

## 🛠 Core Files

-   `app/lib/gemini.ts`: The AI client factory and authentication bridge.
-   `app/api/oracle/route.ts`: The main pipeline orchestrator (Fetch → Score → Refine).
-   `app/lib/ai-config.ts`: The "Expert Persona" prompt engineering and narrative constraints.
-   `app/lib/types.ts`: Central TypeScript interfaces for the entire pipeline.

## 🔒 Security & Privacy

-   **Secrets**: All Google Cloud and Supabase keys are managed via environment variables.
-   **Credential Sanitization**: The ADC temporary file is managed within the OS temp directory and is never exposed to the client.
-   **Data Privacy**: No PII (Personally Identifiable Information) is sent to the AI; only vehicle specs and power goals are transmitted for analysis.

## ⚡ Performance Optimization

-   **Parallel Fetching**: Catalog data is fetched in parallel batches to bypass single-request latency.
-   **Singleton Clients**: AI and Database clients are instantiated as singletons to prevent socket exhaustion in serverless environments.
-   **Turbopack**: The build is optimized for Turbopack, ensuring rapid deployment and high-fidelity type checking.

---

**Current Status**: Production Ready. All AI handshakes are stable in the `us-east4` flagship region via the Global Agent Platform endpoint.
