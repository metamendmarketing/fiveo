import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function test() {
  const profile = {
    year: 2010,
    makeId: 1, // Generic testing
    modelId: 1,
    goal: "performance",
    targetHP: 300,
    fuelType: "pump"
  };

  console.log("Testing Oracle logic with profile...");
  
  // 1. Check if we find any products at all
  const { data: allProducts, error } = await supabase.from("products").select("*").limit(5);
  if (error) console.error("DB Error:", error);
  console.log("Sample products found:", allProducts?.length || 0);

  // 2. Check fitment for a common model
  const { data: fitment } = await supabase.from("fitment").select("product_id").limit(10);
  console.log("Sample fitment rows found:", fitment?.length || 0);
}

test();
