import type { InvestorProfile, StartupProfile } from "@/lib/types";

export function generateMatchExplanation(
  startup: StartupProfile,
  investor: InvestorProfile
): string[] {
  const explanation: string[] = [];

  if (investor.sectorFocus.some((sector) => sector === startup.sector)) {
    explanation.push("Strong sector alignment");
  }

  if (investor.stageFocus.includes(startup.stage) || investor.stageFocus.includes("Any")) {
    explanation.push("Stage match");
  }

  const hasRegionOverlap =
    startup.regions.includes("Remote/Global") ||
    investor.regions.includes("Remote/Global") ||
    startup.regions.some((r) => investor.regions.includes(r));
  if (hasRegionOverlap) {
    explanation.push("Geography overlap");
  }

  const fundingWithinCheck =
    startup.fundingAskUsdMax >= investor.checkSizeUsdMin &&
    startup.fundingAskUsdMin <= investor.checkSizeUsdMax;
  if (fundingWithinCheck) {
    explanation.push("Check size compatibility");
  }

  if (explanation.length === 0) {
    explanation.push("Limited alignment");
  }

  return explanation;
}

