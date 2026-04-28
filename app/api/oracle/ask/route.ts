import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/app/lib/supabase";
import { getVertexModel } from "@/app/lib/gemini";
import { Product } from "@/app/lib/types";

/**
 * POST /api/oracle/ask
 * 
 * "Ask the Oracle" — Grounded AI Q&A for fuel injector products.
 * Answers customer questions using the full product catalog,
 * the specific product being viewed, and the user's build profile.
 */
export async function POST(req: NextRequest) {
  try {
    const { question, productId, buildProfile } = await req.json();

    if (!question?.trim()) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    const supabase = getServerSupabase();

    // ─── GROUNDING: Fetch product + catalog context ───

    const [productResult, catalogResult] = await Promise.all([
      // The specific product being viewed (if provided)
      productId
        ? supabase.from("products").select("*").eq("id", Number(productId)).single()
        : Promise.resolve({ data: null, error: null }),
      // Catalog summary for cross-referencing
      supabase.from("products").select(
        "id, name, sku, flow_rate_cc, impedance, connector_type, manufacturer, fuel_types, price, url_key"
      ),
    ]);

    const product = productResult.data as Product | null;
    const allProducts = (catalogResult.data || []) as Product[];

    // Build a compact catalog summary grouped by flow rate range
    const catalogByRange: Record<string, { count: number; brands: string[]; range: string }> = {};
    for (const p of allProducts) {
      const cc = Number(p.flow_rate_cc) || 0;
      if (cc <= 0) continue;
      const bucket = cc < 300 ? "OEM (< 300cc)" 
        : cc < 500 ? "Street (300-500cc)"
        : cc < 800 ? "Performance (500-800cc)"
        : cc < 1200 ? "Racing (800-1200cc)"
        : "Extreme (1200cc+)";
      if (!catalogByRange[bucket]) catalogByRange[bucket] = { count: 0, brands: [], range: bucket };
      catalogByRange[bucket].count++;
      const brand = (p.manufacturer || "").toLowerCase();
      if (brand && !catalogByRange[bucket].brands.includes(brand)) {
        catalogByRange[bucket].brands.push(brand);
      }
    }

    // Build the knowledge base
    const knowledgeBase = {
      currentProduct: product ? {
        name: product.name,
        sku: product.sku,
        flowRate: product.flow_rate_cc ? `${product.flow_rate_cc} cc/min` : "Not specified",
        impedance: product.impedance || "Not specified",
        connector: product.connector_type || "Not specified",
        manufacturer: product.manufacturer || "FiveO",
        fuelTypes: product.fuel_types || [],
        price: product.price ? `$${product.price}` : "Contact for pricing",
        description: (product.description || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 1500),
      } : "No specific product selected.",
      
      customerBuild: buildProfile ? {
        vehicle: [buildProfile.year, buildProfile.make, buildProfile.model].filter(Boolean).join(" ") || "Not specified",
        goal: buildProfile.goal || "Not specified",
        usage: buildProfile.usage || "Not specified",
        targetHP: buildProfile.targetHP || "Not specified",
        fuelType: buildProfile.fuelType || "Not specified",
        priorities: buildProfile.priorities || [],
      } : "No build profile available.",

      catalogOverview: {
        totalProducts: allProducts.length,
        byFlowRange: catalogByRange,
      },
    };

    // ─── AI PROMPT ───

    const model = getVertexModel("gemini-2.5-flash");
    if (!model) {
      return NextResponse.json({ 
        answer: "Our AI service is temporarily unavailable. Please try again in a moment.",
        citedSpecs: [] 
      });
    }

    const prompt = `You are the FiveO Fuel Injector Oracle — a senior fuel injector specialist with 20+ years of hands-on experience.

A customer is viewing a product in our buying assistant and has a question. Answer it using ONLY the knowledge base provided below.

PERSONA:
- You sound like a seasoned parts counter expert: warm, patient, practical, honest.
- Be helpful and solve their specific question.
- DO NOT refer to yourself as an "AI" or "Oracle." Just answer the question naturally.
- Use a professional but approachable tone — like a knowledgeable friend at a speed shop.

KNOWLEDGE BASE:
${JSON.stringify(knowledgeBase, null, 2)}

CUSTOMER'S QUESTION:
"${question}"

RULES:
1. FACT-BASED ONLY: Only answer based on the provided knowledge base. If asked about something not in the data, say "I don't have specific data on that, but..." and offer general fuel injector guidance.
2. TECHNICAL ACCURACY: Use correct terminology (cc/min, impedance, EV14, USCAR, etc.) but explain benefits simply.
3. CONCISE: Keep answers direct. 2-4 sentences for simple questions, up to 6 for complex ones.
4. STAY ON TOPIC: Only discuss fuel injectors, tuning, flow rates, horsepower calculations, vehicle compatibility, fuel systems, and related automotive performance topics. For anything else, politely redirect: "That's outside my wheelhouse — I'm here to help with fuel injector questions."
5. NEVER invent specifications, flow rates, or compatibility claims not supported by the data.
6. If the customer asks about a different product or comparison, use the catalog overview to guide them.
7. When referencing flow rate math: 1 lb/hr ≈ 10.5 cc/min. The general rule is HP × 5-6 cc/min per cylinder for naturally aspirated, HP × 7-8 for forced induction.

Output strictly valid JSON:
{
  "answer": "Your helpful, expert answer here.",
  "citedSpecs": ["Spec or fact you referenced", "Another cited detail"]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(
      jsonMatch ? jsonMatch[0] : `{"answer": "${text.replace(/"/g, "'")}", "citedSpecs": []}`
    );

    return NextResponse.json(parsed);

  } catch (error: unknown) {
    console.error("[Oracle/Ask] Error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { answer: "I'm having trouble connecting to my knowledge base right now. Please try again in a moment.", citedSpecs: [] },
      { status: 500 }
    );
  }
}
