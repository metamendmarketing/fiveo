import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/app/lib/supabase";
import { getVertexModel } from "@/app/lib/gemini";
import { Product, FitmentRecord } from "@/app/lib/types";

/**
 * POST /api/oracle/ask
 * 
 * "Ask the Oracle" — Grounded AI Q&A for fuel injector products.
 * 
 * Two-tier knowledge system:
 *   1. PRIMARY (FiveO database) — product specs, pricing, fitment, SKUs
 *   2. SECONDARY (Gemini's general knowledge) — universal automotive/tuning concepts
 */
export async function POST(req: NextRequest) {
  try {
    const { question, productId, buildProfile } = await req.json();

    if (!question?.trim()) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    const supabase = getServerSupabase();

    // ─── STAGE 1: GROUNDING DATA ACQUISITION ───

    // 1a. Fetch the specific product being viewed
    const productResult = productId
      ? await supabase.from("products").select("*").eq("id", Number(productId)).single()
      : { data: null, error: null };

    const product = productResult.data as Product | null;

    // 1b. Fetch fitment-relevant products (same make/model as customer's vehicle)
    let fitmentProducts: Product[] = [];
    if (buildProfile?.makeId) {
      const fitmentQuery = supabase
        .from("product_fitment")
        .select("product_id");

      // Prefer model-level fitment, fall back to make-level
      if (buildProfile.modelId) {
        fitmentQuery.eq("model_id", Number(buildProfile.modelId));
      } else {
        fitmentQuery.eq("make_id", Number(buildProfile.makeId));
      }

      const { data: fitmentData } = await fitmentQuery;
      const fitmentIds = (fitmentData as FitmentRecord[] || []).map(f => f.product_id);

      if (fitmentIds.length > 0) {
        const { data: fitProducts } = await supabase
          .from("products")
          .select("id, name, sku, flow_rate_cc, impedance, connector_type, manufacturer, fuel_types, price, url_key, description")
          .in("id", fitmentIds);
        fitmentProducts = (fitProducts || []) as Product[];
      }
    }

    // 1c. Fetch full catalog summary (lightweight — just key fields, paginated)
    let allProducts: Product[] = [];
    let catOffset = 0;
    const CAT_PAGE_SIZE = 1000;
    
    while (true) {
      const { data: batch, error: catErr } = await supabase
        .from("products")
        .select("id, name, flow_rate_cc, impedance, connector_type, manufacturer, fuel_types, price")
        .range(catOffset, catOffset + CAT_PAGE_SIZE - 1);
      
      if (catErr) {
        console.error("[Oracle/Ask] Catalog Fetch Error:", catErr);
        break; 
      }
      if (!batch || batch.length === 0) break;
      allProducts = [...allProducts, ...(batch as Product[])];
      if (batch.length < CAT_PAGE_SIZE) break;
      catOffset += CAT_PAGE_SIZE;
    }

    // ─── STAGE 2: BUILD KNOWLEDGE BASE ───

    // Format the product being viewed (full detail)
    const currentProductData = product ? {
      name: product.name,
      sku: product.sku,
      flowRate: product.flow_rate_cc ? `${product.flow_rate_cc} cc/min` : "Not specified",
      impedance: product.impedance || "Not specified",
      connector: product.connector_type || "Not specified",
      manufacturer: product.manufacturer || "FiveO",
      fuelTypes: product.fuel_types || [],
      price: product.price ? `$${product.price}` : "Contact for pricing",
      description: (product.description || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 2000),
    } : "No specific product selected.";

    // Format fitment-compatible products (detailed — these are the most relevant)
    const fitmentCatalog = fitmentProducts.map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      cc: Number(p.flow_rate_cc) || null,
      impedance: p.impedance,
      connector: p.connector_type,
      brand: p.manufacturer,
      price: p.price ? `$${p.price}` : null,
      fuels: p.fuel_types,
      desc: (p.description || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 300),
    }));

    // Catalog overview (high-level stats)
    const catalogByRange: Record<string, { count: number; brands: string[] }> = {};
    for (const p of allProducts) {
      const cc = Number(p.flow_rate_cc) || 0;
      if (cc <= 0) continue;
      const bucket = cc < 300 ? "OEM (< 300cc)"
        : cc < 500 ? "Street (300-500cc)"
        : cc < 800 ? "Performance (500-800cc)"
        : cc < 1200 ? "Racing (800-1200cc)"
        : "Extreme (1200cc+)";
      if (!catalogByRange[bucket]) catalogByRange[bucket] = { count: 0, brands: [] };
      catalogByRange[bucket].count++;
      const brand = (p.manufacturer || "").toLowerCase();
      if (brand && !catalogByRange[bucket].brands.includes(brand)) {
        catalogByRange[bucket].brands.push(brand);
      }
    }

    // Customer build context
    const vehicleLabel = buildProfile
      ? [buildProfile.year, buildProfile.make, buildProfile.model].filter(Boolean).join(" ") || "Not specified"
      : "Not specified";

    const customerBuild = buildProfile ? {
      vehicle: vehicleLabel,
      goal: buildProfile.goal || "Not specified",
      usage: buildProfile.usage || "Not specified",
      targetHP: buildProfile.targetHP || "Not specified",
      fuelType: buildProfile.fuelType || "Not specified",
      priorities: buildProfile.priorities || [],
      mods: buildProfile.mods || [],
    } : "No build profile available.";

    // ─── STAGE 3: AI PROMPT ───

    const model = getVertexModel("gemini-1.5-flash");
    if (!model) {
      return NextResponse.json({
        answer: "Our AI service is temporarily unavailable. Please try again in a moment.",
        citedSpecs: []
      });
    }

    const prompt = `You are the FiveO Fuel Injector Oracle — a seasoned fuel injector specialist with decades of hands-on experience at a high-performance speed shop.

A customer is viewing a product in our buying assistant and has asked a question.

PERSONA:
- You sound like a seasoned parts counter expert: practical, honest, direct, and warm.
- NO SALUTATIONS: Do not start any response with greetings like "Hey there!", "Alright", "Great question!", "Sure!", "Hi!", etc. Just answer the question immediately.
- Start your response directly with the expert facts or technical answer.
- DO NOT refer to yourself as an AI. Just answer naturally as a senior specialist.

═══════════════════════════════════════
KNOWLEDGE SYSTEM (TWO-TIER)
═══════════════════════════════════════

TIER 1 — FIVEO DATABASE (PRIMARY SOURCE — always cite when referencing products):

PRODUCT BEING VIEWED:
${JSON.stringify(currentProductData, null, 2)}

PRODUCTS COMPATIBLE WITH CUSTOMER'S VEHICLE (${fitmentCatalog.length} confirmed fits for ${vehicleLabel}):
${JSON.stringify(fitmentCatalog, null, 2)}

FULL CATALOG OVERVIEW (${allProducts.length} total products):
${JSON.stringify(catalogByRange, null, 2)}

CUSTOMER'S BUILD PROFILE:
${JSON.stringify(customerBuild, null, 2)}

TIER 2 — YOUR GENERAL AUTOMOTIVE KNOWLEDGE (SECONDARY SOURCE):
You may freely use your general knowledge about:
- Fuel injector engineering principles (flow dynamics, duty cycle, dead time, latency)
- Engine tuning concepts (AFR, stoichiometry, fuel maps, injector scaling)
- Horsepower and flow rate calculations
- Fuel types (E85, methanol, race gas chemistry and stoich ratios)
- Impedance types (high vs low, peak-and-hold vs saturated)
- Connector standards (EV1, EV6/USCAR, Denso, Keihin, Bosch)
- Vehicle platform knowledge (common engines, OEM injector specs)
- Installation practices, adapter requirements, wiring
- General automotive performance and modification guidance

═══════════════════════════════════════
CUSTOMER'S QUESTION:
"${question}"
═══════════════════════════════════════

RULES:
1. For PRODUCT-SPECIFIC claims (specs, pricing, fitment, SKUs): ONLY use Tier 1 data. Never invent product specs.
2. For GENERAL KNOWLEDGE (how injectors work, tuning theory, HP math, fuel chemistry): freely use your Tier 2 expertise.
3. If the customer asks about a specific FiveO product not in the data, say "I don't have that specific product's details right now" and suggest they check the store.
4. CONCISE: 2-4 sentences for simple questions, up to 8 for complex technical explanations.
5. STAY ON TOPIC: Fuel injectors, tuning, flow rates, HP, vehicle compatibility, fuel systems, and related automotive performance. For anything unrelated, redirect: "That's outside my area — I specialize in fuel injection and engine performance."
6. Flow rate math reference: 1 lb/hr ≈ 10.5 cc/min. NA engines: HP × 5-6 cc/min per cylinder. Forced induction: HP × 7-8 cc/min per cylinder. E85: multiply by 1.4x vs gasoline.
7. When you know a compatible product from the fitment list, mention it by name so the customer knows their options.

Output strictly valid JSON:
{
  "answer": "Your direct, expert answer here.",
  "citedSpecs": ["Spec or fact you referenced"]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    let parsed;
    try {
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch (e) {
      console.error("[Oracle/Ask] JSON Parse Error. Raw text:", text);
      parsed = { 
        answer: text.replace(/[{}"]/g, ""), 
        citedSpecs: [],
        error: "Synthesized response was malformed" 
      };
    }

    return NextResponse.json(parsed);

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[Oracle/Ask] Critical Error:", msg);
    return NextResponse.json(
      { 
        error: "Synthesis Failed",
        details: msg,
        answer: "I'm having trouble connecting to my knowledge base right now. Please try again in a moment." 
      },
      { status: 500 }
    );
  }
}
