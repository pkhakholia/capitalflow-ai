import { NextResponse } from "next/server";

import { getEmbedding } from "@/lib/ai";
import { InvestorProfileInputSchema, InvestorProfileSchema } from "@/lib/schemas";
import { supabase } from "@/lib/supabase";
import type { InvestorProfile } from "@/lib/types";

function nowIso() {
  return new Date().toISOString();
}

function buildInvestorEmbeddingText(profile: InvestorProfile) {
  // As requested: combine focus_industry, stage, thesis.
  return [
    `Focus industries: ${profile.sectorFocus.join(", ")}`,
    `Stage: ${profile.stageFocus.join(", ")}`,
    `Thesis: ${profile.thesisSummary}`
  ].join("\n");
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as unknown;
    const raw = (body ?? {}) as Record<string, unknown>;
    const parsed = InvestorProfileInputSchema.parse({
      ...raw,
      firstName: raw.firstName ?? raw.first_name,
      lastName: raw.lastName ?? raw.last_name,
      investorType: raw.investorType ?? raw.investor_type,
      sectorFocus: raw.sectorFocus ?? raw.sector_focus
    });

    const profile: InvestorProfile = InvestorProfileSchema.parse({
      ...parsed,
      id: crypto.randomUUID(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
      checkSizeUsdMin: Math.min(parsed.checkSizeUsdMin, parsed.checkSizeUsdMax),
      checkSizeUsdMax: Math.max(parsed.checkSizeUsdMin, parsed.checkSizeUsdMax)
    });

    const embeddingText = buildInvestorEmbeddingText(profile).trim();
    const embedding = embeddingText ? await getEmbedding(embeddingText) : null;

    const focusIndustries = profile.sectorFocus.join(", ");
    const stageValue = profile.stageFocus.join(", ");
    const geographyValue = profile.regions.join(", ");

    const { error } = await supabase.from("investors").insert([
      {
        first_name: profile.firstName,
        last_name: profile.lastName,
        investor_type: profile.investorType,
        role: profile.role,
        sector_focus: profile.sectorFocus,
        fund_name: profile.firmName,
        website: profile.website ?? null,
        contact_email: profile.contactEmail,
        focus_industry: focusIndustries,
        stage: stageValue,
        ticket_min: profile.checkSizeUsdMin ?? 0,
        ticket_max: profile.checkSizeUsdMax ?? 0,
        geography: geographyValue,
        thesis: profile.thesisSummary,
        value_add_summary: profile.valueAddSummary ?? null,
        embedding
      }
    ]);

    if (error) {
      console.error("SUPABASE ERROR (investor insert):", error);
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ profile }, { status: 200 });
  } catch (error) {
    console.error("INVESTOR PROFILE API ERROR:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? { name: error.name, message: error.message, stack: error.stack }
            : { message: "Failed to save investor profile." }
      },
      { status: 400 }
    );
  }
}

