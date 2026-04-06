import * as fs from "fs/promises";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Load env variables if dotenv is available, otherwise assume they are loaded
try {
  require("dotenv").config({ path: ".env.local" });
} catch (e) {
  // Ignore if dotenv is not installed
}

const RAW_FILE = "vc_raw_data.json";
const OUT_FILE = "vc_structured_data.json";

function getApiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.error("Please set GEMINI_API_KEY in your environment or .env.local file.");
    process.exit(1);
  }
  return key;
}

const genAI = new GoogleGenerativeAI(getApiKey());

// Standard helper to normalize string extraction
function extractJsonObject(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first === -1 || last === -1 || last < first) return null;
  try {
    return JSON.parse(trimmed.slice(first, last + 1));
  } catch (e) {
    return null;
  }
}

async function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

async function parseVCData() {
  let rawData;
  try {
    const rawContent = await fs.readFile(RAW_FILE, "utf-8");
    rawData = JSON.parse(rawContent);
  } catch (e) {
    console.error(`Failed to read ${RAW_FILE}. Have you run the scraper?`, e);
    return;
  }

  if (!Array.isArray(rawData)) {
    console.error(`Data in ${RAW_FILE} should be an array.`);
    return;
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Using a fast, standard model
  const structuredData = [];

  console.log(`Starting parsing for ${rawData.length} VC profiles...`);

  for (let i = 0; i < rawData.length; i++) {
    const vc = rawData[i];
    console.log(`\n[${i + 1}/${rawData.length}] Parsing: ${vc.url}`);

    const prompt = `
Extract structured investor data from this VC website text.

Normalize:
- sectors (e.g., SaaS, Fintech, AI, DeepTech, Consumer, HealthTech, Climate, etc.)
- stages (e.g., Pre-seed, Seed, Series A, Series B, Series C, Growth, Late Stage, Any)

Return JSON ONLY in exactly this format:
{
  "fund_name": "string",
  "website": "string",
  "sectors": ["string"],
  "stages": ["string"],
  "regions": ["string"],
  "ticket_min": number,
  "ticket_max": number,
  "thesis": "string",
  "investor_type": "string"
}

If any continuous numbers for ticket size are missing, use 0. If you cannot decipher an array, return empty array [].

Website Title: ${vc.title}
Website URL: ${vc.url}
Text content:
${vc.text.substring(0, 30000)} // Truncate text to avoid massive token usage
    `.trim();

    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const parsed = extractJsonObject(responseText);

      if (parsed && typeof parsed === "object" && parsed.fund_name) {
        console.log(`✅ Success: Parsed data for ${parsed.fund_name}`);
        structuredData.push({
          url: vc.url,
          ...parsed
        });
      } else {
        console.log(`❌ Failed: AI could not extract valid JSON. Returning partial data.`, responseText);
        structuredData.push({
          url: vc.url,
          fund_name: vc.title || "Unknown VC",
          website: vc.url,
          sectors: [],
          stages: [],
          regions: [],
          ticket_min: 0,
          ticket_max: 0,
          thesis: "Failed to parse data via AI.",
          investor_type: "Unknown",
          raw_title: vc.title
        });
      }
    } catch (e: any) {
      console.error(`❌ Error parsing ${vc.url}: ${e.message}`);
      // Fallback
      structuredData.push({
        url: vc.url,
        fund_name: vc.title || "Unknown VC",
        website: vc.url,
        sectors: [],
        stages: [],
        regions: [],
        ticket_min: 0,
        ticket_max: 0,
        thesis: "Failed to parse data -> Error.",
        investor_type: "Unknown",
        raw_title: vc.title
      });
    }

    // Delay to respect API rate limits
    await delay(3000);
  }

  try {
    await fs.writeFile(OUT_FILE, JSON.stringify(structuredData, null, 2), "utf-8");
    console.log(`\n🎉 Successfully wrote ${structuredData.length} records to ${OUT_FILE}`);
  } catch (e: any) {
    console.error(`Failed to write to file ${OUT_FILE}: ${e.message}`);
  }
}

parseVCData();
