import type { InvestorProfile, StartupProfile } from "@/lib/types";
import { investorRoles, investorSectorOptions, investorTypes, regions, sectors, stages } from "@/lib/types";

function parseCsv(input: unknown): string[] {
  if (typeof input !== "string") return [];
  return input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function pickMostRecentLike(row: Record<string, unknown>): string | null {
  const keys = ["updated_at", "updatedAt", "created_at", "createdAt"];
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "string" && v) return v;
  }
  return null;
}

function asISOOrNow(value: unknown): string {
  if (typeof value === "string" && value) return value;
  return new Date().toISOString();
}

function filterToEnum<T extends readonly string[]>(
  values: string[],
  allowed: T
): Array<T[number]> {
  return values.filter((v) => (allowed as readonly string[]).includes(v)) as Array<T[number]>;
}

function uniquePreserveOrder<T extends string>(values: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const value of values) {
    if (seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }
  return out;
}

function parseStartupDescription(description: string | null | undefined): {
  productSummary: string;
  tractionSummary: string;
} {
  const text = (description ?? "").trim();
  if (!text) return { productSummary: "", tractionSummary: "" };

  // storage.ts stores: "<product>\n\nTraction: <traction>"
  const parts = text.split(/Traction\s*:/i);
  if (parts.length >= 2) {
    return {
      productSummary: parts[0].trim(),
      tractionSummary: parts.slice(1).join("Traction:").trim()
    };
  }

  return { productSummary: text, tractionSummary: "" };
}

export function startupRowToProfile(row: Record<string, unknown>, fallbackId: string): StartupProfile {
  const { productSummary, tractionSummary } = parseStartupDescription(
    (row.description as string | undefined) ?? undefined
  );

  const stageRaw = typeof row.stage === "string" ? row.stage : undefined;
  const stageVal = stageRaw && stages.includes(stageRaw as never) ? (stageRaw as (typeof stages)[number]) : "Seed";

  const geographyRaw = row.geography ?? row.regions ?? row.region;
  const geographyList = parseCsv(geographyRaw);
  const regionVals = geographyList.length
    ? filterToEnum(geographyList, regions)
    : (["Remote/Global"] as unknown as typeof regions[number][]);

  const sectorRaw = typeof row.industry === "string" ? row.industry : undefined;
  const sectorVals = sectorRaw && sectors.includes(sectorRaw as never)
    ? ([sectorRaw] as Array<(typeof sectors)[number]>)
    : (["Other"] as Array<(typeof sectors)[number]>);

  const funding = typeof row.funding_required === "number" ? row.funding_required : Number(row.funding_required);
  const fundingMax = Number.isFinite(funding) ? Math.max(0, funding) : 0;
  const fundingMin = Math.round(fundingMax * 0.85);

  const founderOrEmail =
    (row.founder_name as string | undefined) ??
    (row.founnder_name as string | undefined) ??
    "unknown@example.com";

  return {
    id: typeof row.id === "string" ? row.id : fallbackId,
    createdAt: asISOOrNow(row.created_at ?? row.createdAt),
    updatedAt: asISOOrNow(row.updated_at ?? row.updatedAt),

    companyName: (row.startup_name as string | undefined) ?? "Unnamed startup",
    website: undefined,
    contactEmail: founderOrEmail,
    pitchDeckUrl: typeof row.pitch_deck_url === "string" ? row.pitch_deck_url : undefined,

    sector: sectorVals[0],
    stage: stageVal === "Any" ? "Seed" : (stageVal as never), // StartupProfile requires stage != Any.
    regions: regionVals.length ? regionVals : (["Remote/Global"] as unknown as typeof regions[number][]),

    fundingAskUsdMin: fundingMin,
    fundingAskUsdMax: fundingMax,

    tractionSummary: tractionSummary || "N/A",
    productSummary: productSummary || "N/A",
    embedding:
      Array.isArray(row.embedding) && row.embedding.every((x) => typeof x === "number")
        ? (row.embedding as number[])
        : undefined
  };
}

export function investorRowToProfile(
  row: Record<string, unknown>,
  fallbackId: string
): InvestorProfile {
  const rawSectorFocus = Array.isArray(row.sector_focus)
    ? row.sector_focus.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
  const focusList = rawSectorFocus.length ? rawSectorFocus : parseCsv(row.focus_industry);
  const focus = uniquePreserveOrder(filterToEnum(focusList, investorSectorOptions));
  const focusSafe = focus.length ? focus : (["Others"] as Array<(typeof investorSectorOptions)[number]>);

  const stageList = parseCsv(row.stage);
  const stage = uniquePreserveOrder(filterToEnum(stageList, stages));
  const stageSafe = stage.length ? stage : (["Any"] as Array<(typeof stages)[number]>);

  const geographyList = parseCsv(row.geography);
  const region = geographyList.length
    ? uniquePreserveOrder(filterToEnum(geographyList, regions))
    : (["Remote/Global"] as unknown as typeof regions[number][]);

  const ticketMinRaw = row.ticket_min;
  const ticketMaxRaw = row.ticket_max;
  const ticketMin = typeof ticketMinRaw === "number" ? ticketMinRaw : Number(ticketMinRaw);
  const ticketMax = typeof ticketMaxRaw === "number" ? ticketMaxRaw : Number(ticketMaxRaw);

  const min = Number.isFinite(ticketMin) ? Math.max(0, ticketMin) : 0;
  const max = Number.isFinite(ticketMax) ? Math.max(0, ticketMax) : 0;

  const thesisSummary = typeof row.thesis === "string" ? row.thesis : "";
  const contactEmail =
    (typeof row.contact_email === "string" && row.contact_email) ||
    (typeof row.contactEmail === "string" && row.contactEmail) ||
    (typeof row.email === "string" && row.email) ||
    "unknown@example.com";
  const firstName = typeof row.first_name === "string" && row.first_name.trim() ? row.first_name.trim() : "Unknown";
  const lastName = typeof row.last_name === "string" && row.last_name.trim() ? row.last_name.trim() : "Investor";

  const investorTypeRaw = typeof row.investor_type === "string" ? row.investor_type : "";
  const investorType = investorTypes.includes(investorTypeRaw as never)
    ? (investorTypeRaw as (typeof investorTypes)[number])
    : "VC";

  const roleRaw = typeof row.role === "string" ? row.role : "";
  const role = investorRoles.includes(roleRaw as never)
    ? (roleRaw as (typeof investorRoles)[number])
    : "Partner";

  return {
    id: typeof row.id === "string" ? row.id : fallbackId,
    createdAt: asISOOrNow(row.created_at ?? row.createdAt),
    updatedAt: asISOOrNow(row.updated_at ?? row.updatedAt),

    firstName,
    lastName,
    investorType,
    role,

    firmName: (row.fund_name as string | undefined) ?? "Unnamed investor",
    website: typeof row.website === "string" ? row.website : undefined,
    contactEmail,

    sectorFocus: focusSafe,
    stageFocus: stageSafe,
    regions: region.length ? region : (["Remote/Global"] as unknown as typeof regions[number][]),

    checkSizeUsdMin: Math.min(min, max),
    checkSizeUsdMax: Math.max(min, max),

    thesisSummary: thesisSummary || "N/A",
    valueAddSummary: typeof row.value_add_summary === "string" ? row.value_add_summary : undefined,
    embedding:
      Array.isArray(row.embedding) && row.embedding.every((x) => typeof x === "number")
        ? (row.embedding as number[])
        : undefined
  };
}

