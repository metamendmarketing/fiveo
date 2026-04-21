/**
 * GET /api/oracle/vehicles — Cascading vehicle data from Supabase
 *
 * Schema: makes → models → years → engines
 *
 * Query params:
 *   ?type=makes                             → all makes
 *   ?type=models&makeId=123                 → models for a make
 *   ?type=years&modelId=456                 → years for a model
 *   ?type=engines&yearId=789                → engines for a year entry
 */
import { NextRequest } from "next/server";
import { getServerSupabase } from "@/app/lib/supabase";

export async function GET(req: NextRequest) {
  const supabase = getServerSupabase();
  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const makeId = url.searchParams.get("makeId");
  const modelId = url.searchParams.get("modelId");
  const yearId = url.searchParams.get("yearId");

  try {
    if (type === "makes") {
      const { data, error } = await supabase
        .from("makes")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return Response.json({ data: data || [] });
    }

    if (type === "models" && makeId) {
      const { data, error } = await supabase
        .from("models")
        .select("id, name")
        .eq("make_id", parseInt(makeId))
        .order("name");
      if (error) throw error;
      return Response.json({ data: data || [] });
    }

    if (type === "years" && modelId) {
      const { data, error } = await supabase
        .from("years")
        .select("id, year")
        .eq("model_id", parseInt(modelId))
        .order("year", { ascending: false });
      if (error) throw error;
      return Response.json({ data: data || [] });
    }

    if (type === "engines" && yearId) {
      const { data, error } = await supabase
        .from("engines")
        .select("id, label, displacement, config, fuel_type, engine_code")
        .eq("year_id", parseInt(yearId))
        .order("label");
      if (error) throw error;
      return Response.json({ data: data || [] });
    }

    return Response.json({ error: "Invalid type parameter" }, { status: 400 });
  } catch (err: any) {
    console.error("[API/vehicles]", err);
    return Response.json(
      { error: err.message || "Database error", data: [] },
      { status: 500 }
    );
  }
}
