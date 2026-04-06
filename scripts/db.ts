import * as fs from "fs/promises";
import { createClient } from "@supabase/supabase-js";

// Load environment variables if run independently
try {
  require("dotenv").config({ path: ".env.local" });
} catch (e) {
  // Ignore
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Use service role key if available for inserts, otherwise fallback to anon (RLS might block anon)
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials. Ensure NEXT_PUBLIC_SUPABASE_URL and either SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY are set.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const INPUT_FILE = "vc_structured_data.json";

async function insertData() {
  let rawData;
  try {
    const rawContent = await fs.readFile(INPUT_FILE, "utf-8");
    rawData = JSON.parse(rawContent);
  } catch (e) {
    console.error(`Failed to read ${INPUT_FILE}.`, e);
    return;
  }

  if (!Array.isArray(rawData)) {
    console.error("Structured data is not an array.");
    return;
  }

  let inserted = 0;
  let skipped = 0;
  let failed = 0;

  console.log(`Starting Supabase insertion for ${rawData.length} VC profiles...`);

  for (const item of rawData) {
    const targetWebsite = item.website || item.url;
    
    // 1. Check if website already exists
    const { data: existingData, error: searchError } = await supabase
      .from("investors")
      .select("id, website")
      .eq("website", targetWebsite);

    if (searchError) {
      console.error(`❌ DB Error checking ${targetWebsite}:`, searchError.message);
      failed++;
      continue;
    }

    if (existingData && existingData.length > 0) {
      console.log(`⏭️  Skipped (Already exists): ${item.fund_name} (${targetWebsite})`);
      skipped++;
      continue;
    }

    // 2. Map fields and Insert
    // The columns follow what the user requested and what the app's mapping expects.
    const rowToInsert = {
      fund_name: item.fund_name || "Unknown VC",
      website: targetWebsite,
      focus_industry: Array.isArray(item.sectors) ? item.sectors.join(", ") : "",
      stage: Array.isArray(item.stages) ? item.stages.join(", ") : "",
      geography: Array.isArray(item.regions) ? item.regions.join(", ") : "",
      ticket_min: item.ticket_min || 0,
      ticket_max: item.ticket_max || 0,
      thesis: item.thesis || "",
      investor_type: item.investor_type || "VC"
    };

    const { error: insertError } = await supabase
      .from("investors")
      .insert([rowToInsert]);

    if (insertError) {
      console.error(`❌ Failed (Insert Error): ${item.fund_name} ->`, insertError.message);
      failed++;
    } else {
      console.log(`✅ Inserted: ${item.fund_name}`);
      inserted++;
    }
  }

  console.log("\n--- Insertion Summary ---");
  console.log(`Inserted: ${inserted}`);
  console.log(`Skipped:  ${skipped}`);
  console.log(`Failed:   ${failed}`);
}

insertData();
