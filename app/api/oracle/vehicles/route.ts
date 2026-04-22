import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/app/lib/supabase";

/**
 * GET /api/oracle/vehicles
 * 
 * Provides cascading vehicle data from Supabase for the Oracle wizard.
 * Query Parameters:
 *  - type: 'makes' | 'models' | 'years' | 'engines'
 *  - makeId, modelId, yearId: numeric filters for cascading logic
 */
export async function GET(req: NextRequest) {
  const supabase = getServerSupabase();
  const { searchParams } = new URL(req.url);
  
  const type = searchParams.get("type");
  const makeId = searchParams.get("makeId");
  const modelId = searchParams.get("modelId");
  const yearId = searchParams.get("yearId");

  try {
    // 1. Fetch all Makes
    if (type === "makes") {
      const { data, error } = await supabase
        .from("makes")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return NextResponse.json({ data: data || [] });
    }

    // 2. Fetch Models for a specific Make
    if (type === "models" && makeId) {
      const { data, error } = await supabase
        .from("models")
        .select("id, name")
        .eq("make_id", parseInt(makeId))
        .order("name");
      if (error) throw error;
      return NextResponse.json({ data: data || [] });
    }

    // 3. Fetch Years for a specific Model
    if (type === "years" && modelId) {
      const { data, error } = await supabase
        .from("years")
        .select("id, year")
        .eq("model_id", parseInt(modelId))
        .order("year", { ascending: false });
      if (error) throw error;
      return NextResponse.json({ data: data || [] });
    }

    // 4. Fetch Engines for a specific Year
    if (type === "engines" && yearId) {
      const { data, error } = await supabase
        .from("engines")
        .select("id, label, displacement, config, fuel_type, engine_code")
        .eq("year_id", parseInt(yearId))
        .order("label");
      if (error) throw error;
      return NextResponse.json({ data: data || [] });
    }

    return NextResponse.json({ error: "Invalid or missing parameters" }, { status: 400 });
  } catch (err: unknown) {
    console.error("[Vehicle API Error]:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Failed to fetch vehicle data", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
