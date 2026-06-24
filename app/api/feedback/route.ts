import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/app/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate required fields
    if (!body.version_active || !body.notes) {
      return NextResponse.json(
        { error: "Missing required fields (version_active, notes)" },
        { status: 400 }
      );
    }

    const supabase = getServerSupabase();
    
    // We are using the Server Client (Service Role) which bypasses RLS,
    // so we can insert even if RLS is strict on the public anon key.
    const { data, error } = await supabase
      .from("client_feedback")
      .insert([
        {
          version_active: body.version_active,
          current_step: body.current_step || "unknown",
          vehicle_profile: body.vehicle_profile || {},
          active_results: body.active_results || [],
          notes: body.notes,
          reviewer_name: body.reviewer_name || "Anonymous",
        }
      ])
      .select();

    if (error) {
      console.error("[Feedback API] Supabase Insert Error:", error);
      return NextResponse.json(
        { error: "Database error", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Internal Server Error";
    console.error("[Feedback API] Fatal Error:", errorMessage);
    return NextResponse.json(
      { error: "Fatal Server Error", message: errorMessage },
      { status: 500 }
    );
  }
}
