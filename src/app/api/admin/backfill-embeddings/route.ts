import { NextResponse } from "next/server";

import { getEmbedding } from "@/lib/ai";
import { supabase } from "@/lib/supabase";

type BackfillBody = {
  limitStartups?: number;
  limitInvestors?: number;
  batchSize?: number;
  dryRun?: boolean;
};

function requireAdminToken(bodyToken: unknown) {
  const expected = process.env.ADMIN_EMBEDDINGS_TOKEN;
  if (!expected) {
    throw new Error("Missing ADMIN_EMBEDDINGS_TOKEN env var on the server.");
  }
  if (typeof bodyToken !== "string" || !bodyToken) {
    throw new Error("Missing admin token.");
  }
  if (bodyToken !== expected) {
    throw new Error("Invalid admin token.");
  }
}

function buildStartupEmbeddingText(row: Record<string, unknown>) {
  const industry = typeof row.industry === "string" ? row.industry : "";
  const funding = row.funding_required;
  const fundingNum = typeof funding === "number" ? funding : Number(funding);
  const fundingVal = Number.isFinite(fundingNum) ? Math.round(fundingNum) : 0;
  const description = typeof row.description === "string" ? row.description : "";
  return [`Industry: ${industry}`, `Description: ${description}`, `Funding required (USD): ${fundingVal}`].join(
    "\n"
  );
}

function buildInvestorEmbeddingText(row: Record<string, unknown>) {
  const focus = typeof row.focus_industry === "string" ? row.focus_industry : "";
  const stage = typeof row.stage === "string" ? row.stage : "";
  const thesis = typeof row.thesis === "string" ? row.thesis : "";
  return [`Focus industries: ${focus}`, `Stage: ${stage}`, `Thesis: ${thesis}`].join("\n");
}

function jsonbLooksEmpty(embedding: unknown) {
  if (embedding == null) return true;
  if (!Array.isArray(embedding)) return true;
  if (embedding.length === 0) return true;
  return !embedding.every((x) => typeof x === "number");
}

async function fetchRowsWithNullEmbedding<T extends Record<string, unknown>>(
  table: "Startups" | "investors",
  batchSize: number,
  limit: number
): Promise<T[]> {
  // Supabase JSONB "is null" is typically supported; keep it simple.
  // If your schema differs, we can adjust filters.
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .is("embedding", null)
    .limit(Math.max(1, Math.min(batchSize, limit)));

  if (error) {
    throw new Error(`Supabase read failed for ${table}: ${error.message}`);
  }

  return (data ?? []) as T[];
}

async function updateRowEmbedding(
  table: "Startups" | "investors",
  row: Record<string, unknown>,
  embedding: number[],
  dryRun: boolean
) {
  if (dryRun) return { ok: true };

  // Prefer primary key `id` if present, else fall back to known unique-ish fields.
  if (typeof row.id === "string") {
    const { error } = await supabase.from(table).update({ embedding }).eq("id", row.id);
    if (error) throw new Error(`Supabase update failed for ${table}: ${error.message}`);
    return { ok: true };
  }

  if (table === "Startups" && typeof row.startup_name === "string") {
    const { error } = await supabase.from(table).update({ embedding }).eq("startup_name", row.startup_name);
    if (error) throw new Error(`Supabase update failed for ${table}: ${error.message}`);
    return { ok: true };
  }

  if (table === "investors" && typeof row.fund_name === "string") {
    const { error } = await supabase.from(table).update({ embedding }).eq("fund_name", row.fund_name);
    if (error) throw new Error(`Supabase update failed for ${table}: ${error.message}`);
    return { ok: true };
  }

  throw new Error(`Cannot determine update key for ${table} row.`);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as BackfillBody & { adminToken?: string };
    const {
      limitStartups = 50,
      limitInvestors = 50,
      batchSize = 25,
      dryRun = true,
      adminToken
    } = body;

    requireAdminToken(adminToken);

    const startupsToBackfill: Record<string, unknown>[] = [];
    const investorsToBackfill: Record<string, unknown>[] = [];

    // Keep it simple: one pass per table with limit.
    const stpRows = await fetchRowsWithNullEmbedding<Record<string, unknown>>(
      "Startups",
      batchSize,
      limitStartups
    );
    startupsToBackfill.push(...stpRows);

    const invRows = await fetchRowsWithNullEmbedding<Record<string, unknown>>(
      "investors",
      batchSize,
      limitInvestors
    );
    investorsToBackfill.push(...invRows);

    let startupsUpdated = 0;
    let investorsUpdated = 0;

    // Sequential by default to avoid rate limiting spikes.
    for (const row of startupsToBackfill) {
      if (jsonbLooksEmpty(row.embedding)) {
        const embeddingText = buildStartupEmbeddingText(row);
        if (!embeddingText.trim()) continue;
        const embedding = await getEmbedding(embeddingText);
        await updateRowEmbedding("Startups", row, embedding, dryRun);
        startupsUpdated += 1;
      }
    }

    for (const row of investorsToBackfill) {
      if (jsonbLooksEmpty(row.embedding)) {
        const embeddingText = buildInvestorEmbeddingText(row);
        if (!embeddingText.trim()) continue;
        const embedding = await getEmbedding(embeddingText);
        await updateRowEmbedding("investors", row, embedding, dryRun);
        investorsUpdated += 1;
      }
    }

    return NextResponse.json({
      ok: true,
      dryRun,
      fetched: {
        startups: startupsToBackfill.length,
        investors: investorsToBackfill.length
      },
      updated: {
        startups: dryRun ? 0 : startupsUpdated,
        investors: dryRun ? 0 : investorsUpdated
      }
    });
  } catch (e) {
    console.error("backfill-embeddings error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? { name: e.name, message: e.message, stack: e.stack } : e },
      { status: 500 }
    );
  }
}

