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
  const vehicleType = searchParams.get("vehicleType") || "car";
  const makeId = searchParams.get("makeId");
  const modelId = searchParams.get("modelId");
  const yearId = searchParams.get("yearId");

  // Helper for powersports/marine filtering (since DB column is deferred)
  const MOTO_MAKES = ["KAWASAKI", "YAMAHA", "HONDA", "SUZUKI", "DUCATI", "HARLEY-DAVIDSON", "POLARIS", "TRIUMPH", "KTM"];
  const MARINE_MAKES = ["DELPHI MARINE", "MERCURY MARINE", "YAMAHA", "HONDA", "SUZUKI"];
  const CAR_ONLY_MAKES = ["ACURA", "ALFA ROMEO", "AUDI", "BMW", "BUICK", "CADILLAC", "CHEVROLET", "CHRYSLER", "DODGE", "FORD", "GMC", "JEEP", "LEXUS", "LINCOLN", "MAZDA", "MERCEDES-BENZ", "NISSAN", "PORSCHE", "RAM", "SUBARU", "TOYOTA", "VOLKSWAGEN", "VOLVO"];


  try {
    // 1. Fetch all Makes
    if (type === "makes") {
      let query = supabase.from("makes").select("id, name");
      
      if (vehicleType === "motorcycle") {
        query = query.in("name", MOTO_MAKES);
      } else if (vehicleType === "marine") {
        query = query.in("name", MARINE_MAKES);
      } else {
        // For cars, we exclude pure powersports brands
        query = query.filter("name", "not.in", '("KAWASAKI","DUCATI","POLARIS","DELPHI MARINE","MERCURY MARINE")');
      }

      const { data, error } = await query.order("name");
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
