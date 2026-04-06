import { cosineSimilarity } from "@/lib/embedding";
import { generateMatchExplanation } from "@/lib/match-explanation";
import type { InvestorProfile, StartupProfile } from "@/lib/types";

export function computeHybridScore(
  startup: StartupProfile,
  investor: InvestorProfile
): { score: number; explanation: string[] } {
  let embeddingScore = 0;

  const stEmb = startup.embedding;
  const invEmb = investor.embedding;

  if (
    Array.isArray(stEmb) &&
    Array.isArray(invEmb) &&
    stEmb.length > 0 &&
    invEmb.length > 0
  ) {
    embeddingScore = cosineSimilarity(stEmb, invEmb) * 100;
  }

  let ruleScore = 0;
  const maxRuleScore = 80;

  // Sector match
  if (investor.sectorFocus?.some?.((sector) => sector === startup.sector)) {
    ruleScore += 25;
  }

  // Stage match
  if (investor.stageFocus?.includes?.(startup.stage)) {
    ruleScore += 20;
  }

  // Geography overlap
  const startupRegions = startup.regions ?? [];
  const investorRegions = investor.regions ?? [];
  const hasGeoOverlap =
    startupRegions.includes("Remote/Global") ||
    investorRegions.includes("Remote/Global") ||
    startupRegions.some((r) => investorRegions.includes(r));
  if (hasGeoOverlap) {
    ruleScore += 15;
  }

  // Check size match
  const askMin = startup.fundingAskUsdMin ?? 0;
  const askMax = startup.fundingAskUsdMax ?? 0;
  const checkMin = investor.checkSizeUsdMin ?? 0;
  const checkMax = investor.checkSizeUsdMax ?? 0;
  const fundingWithin =
    askMax >= checkMin && askMin <= checkMax && (askMax > 0 || askMin > 0);
  if (fundingWithin) {
    ruleScore += 20;
  }

  const normalizedRule =
    maxRuleScore > 0 ? (ruleScore / maxRuleScore) * 100 : 0;

  let finalScore: number;

  if (embeddingScore > 0) {
    finalScore = 0.7 * embeddingScore + 0.3 * normalizedRule;
  } else {
    finalScore = normalizedRule;
  }

  const explanation = generateMatchExplanation(startup, investor);

  const rounded = Math.round(finalScore);
  const clamped = Math.max(0, Math.min(100, rounded));

  return { score: clamped, explanation };
}

