import { NextResponse } from "next/server";

import { getEmbedding } from "@/lib/ai";
import { StartupProfileInputSchema, StartupProfileSchema } from "@/lib/schemas";
import { supabase } from "@/lib/supabase";
import type { StartupProfile } from "@/lib/types";

function nowIso() {
  return new Date().toISOString();
}

function buildStartupEmbeddingText(profile: StartupProfile) {
  // As requested: combine industry, description, funding_required.
  return [
    `Industry: ${profile.sector}`,
    `Description: ${profile.productSummary}`,
    `Funding required (USD): ${profile.fundingAskUsdMax}`
  ].join("\n");
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as unknown;
    const parsed = StartupProfileInputSchema.parse(body);

    const profile: StartupProfile = StartupProfileSchema.parse({
      ...parsed,
      id: crypto.randomUUID(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
      fundingAskUsdMin: Math.min(parsed.fundingAskUsdMin, parsed.fundingAskUsdMax),
      fundingAskUsdMax: Math.max(parsed.fundingAskUsdMin, parsed.fundingAskUsdMax)
    });

    const embeddingText = buildStartupEmbeddingText(profile).trim();
    const embedding = embeddingText ? await getEmbedding(embeddingText) : null;

    const { error } = await supabase.from("Startups").insert([
      {
        startup_name: profile.companyName,
        founder_name: profile.contactEmail,
        industry: profile.sector,
        funding_required: profile.fundingAskUsdMax,
        revenue: 0,
        growth_rate: 0,
        description: `${profile.productSummary}\n\nTraction: ${profile.tractionSummary}`,
        pitch_deck_url: profile.pitchDeckUrl ?? null,
        embedding
      }
    ]);

    if (error) {
      console.error("SUPABASE ERROR (startup insert):", error);
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ profile }, { status: 200 });
  } catch (error) {
    console.error("STARTUP PROFILE API ERROR:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? { name: error.name, message: error.message, stack: error.stack }
            : { message: "Failed to save startup profile." }
      },
      { status: 400 }
    );
  }
}

