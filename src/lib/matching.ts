import type { InvestorProfile, MatchReason, MatchResult, StartupProfile } from "@/lib/types";
import { generateMatchExplanation } from "@/lib/match-explanation";
import { stages } from "@/lib/types";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function usd(n: number) {
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  });
}

function tokenSet(s: string) {
  const tokens = s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
  return new Set(tokens);
}

function jaccardSimilarity(a: string, b: string) {
  const A = tokenSet(a);
  const B = tokenSet(b);
  if (A.size === 0 || B.size === 0) return 0;
  let intersection = 0;
  for (const t of A) {
    if (B.has(t)) intersection += 1;
  }
  const union = A.size + B.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function overlapLen(aMin: number, aMax: number, bMin: number, bMax: number) {
  const lo = Math.max(aMin, bMin);
  const hi = Math.min(aMax, bMax);
  return Math.max(0, hi - lo);
}

function mid(aMin: number, aMax: number) {
  return (aMin + aMax) / 2;
}

function setIntersectionCount<T>(a: readonly T[], b: readonly T[]) {
  const setA = new Set(a);
  let c = 0;
  for (const x of b) {
    if (setA.has(x)) c += 1;
  }
  return c;
}

export function scoreStartupInvestorPair(
  startup: StartupProfile,
  investor: InvestorProfile
): { score: number; reasons: MatchReason[] } {
  const reasons: MatchReason[] = [];

  // Keep weights explicit and normalize final score to 0..100.
  const WEIGHTS = {
    sector: 0.35,
    stage: 0.2,
    geography: 0.15,
    checkSize: 0.2,
    thesis: 0.1
  } as const;

  // 1) Sector fit (supports partial match via token similarity)
  const sectorSimilarityExact = investor.sectorFocus.some((sector) => sector === startup.sector) ? 1 : 0;
  const generalistBoost = investor.sectorFocus.includes("Others") ? 0.35 : 0;

  let bestIndustrySim = 0;
  let bestFocus: string | null = null;
  for (const focus of investor.sectorFocus) {
    if (focus === "Others") continue;
    const sim = focus === startup.sector ? 1 : jaccardSimilarity(focus, startup.sector);
    if (sim > bestIndustrySim) {
      bestIndustrySim = sim;
      bestFocus = focus;
    }
  }

  // If startup is "Other", treat it as unknown but allow generalist overlap.
  const startupIsOther = startup.sector === "Other";
  const sectorSubScore = clamp(
    Math.max(sectorSimilarityExact, bestIndustrySim, startupIsOther ? 0.15 : 0) * (1 + generalistBoost),
    0,
    1
  );
  const sectorScorePoints = Math.round(WEIGHTS.sector * sectorSubScore * 100);
  reasons.push({
    label: "Sector fit",
    detail:
      sectorSimilarityExact === 1
        ? `Exact match: ${startup.sector}.`
        : bestFocus
          ? `Best overlap: ${bestFocus} ~${Math.round(sectorSubScore * 100)}%.`
          : investor.sectorFocus.includes("Others")
            ? "Generalist overlap (Others)."
            : `Investor focuses on ${investor.sectorFocus.join(", ")}.`,
    weight: sectorScorePoints
  });

  // 2) Stage fit (use proximity across ordered stages)
  const stageOrder = stages.filter((s) => s !== "Any");
  const stageIndex = new Map(stageOrder.map((s, i) => [s, i]));
  const startupStageIdx = stageIndex.get(startup.stage as typeof stageOrder[number]) ?? 0;

  let stageSubScore = 0;
  if (investor.stageFocus.includes("Any")) {
    stageSubScore = 1;
  } else {
    for (const invStage of investor.stageFocus) {
      const idx = stageIndex.get(invStage as typeof stageOrder[number]);
      if (idx == null) continue;
      const dist = Math.abs(idx - startupStageIdx);
      const maxDist = Math.max(1, stageOrder.length - 1);
      const sim = 1 - dist / maxDist;
      stageSubScore = Math.max(stageSubScore, sim);
    }
  }
  const stageScorePoints = Math.round(WEIGHTS.stage * stageSubScore * 100);
  reasons.push({
    label: "Stage fit",
    detail:
      investor.stageFocus.includes("Any")
        ? `Investor is flexible (Any stage).`
        : stageSubScore >= 0.9
          ? `Strong stage alignment at ${startup.stage}.`
          : stageSubScore >= 0.6
            ? `Partial stage alignment (target: ${startup.stage}).`
            : `Stage mismatch (startup: ${startup.stage}, investor: ${investor.stageFocus.join(", ")}).`,
    weight: stageScorePoints
  });

  // 3) Geography match (graded overlap + Remote/Global allowance)
  const REMOTE = "Remote/Global";
  const stpRegions = startup.regions;
  const invRegions = investor.regions;

  const invHasRemote = invRegions.includes(REMOTE);
  const stpHasRemote = stpRegions.includes(REMOTE);

  const stpSpecific = stpRegions.filter((r) => r !== REMOTE);
  const invSpecific = invRegions.filter((r) => r !== REMOTE);

  const specificUnion = new Set([...stpSpecific, ...invSpecific]).size;
  const specificIntersection = setIntersectionCount(stpSpecific, invSpecific);
  const specificJaccard = specificUnion ? specificIntersection / specificUnion : 0;

  let geographySubScore = 0;
  if (invHasRemote || stpHasRemote) {
    geographySubScore = clamp(0.55 + 0.45 * specificJaccard, 0, 1);
  } else {
    if (specificIntersection === 0) geographySubScore = 0;
    else geographySubScore = clamp(specificJaccard * 1.2, 0, 1);
  }

  const geographyScorePoints = Math.round(WEIGHTS.geography * geographySubScore * 100);
  reasons.push({
    label: "Geography",
    detail:
      geographySubScore >= 0.75
        ? `Regions align${invHasRemote || stpHasRemote ? " (Remote/Global supported)" : ""}.`
        : geographySubScore >= 0.35
          ? `Some regional overlap.`
          : `Low regional alignment.`,
    weight: geographyScorePoints
  });

  // 4) Check size vs ask (continuous proximity + overlap bonus)
  const askMin = startup.fundingAskUsdMin;
  const askMax = startup.fundingAskUsdMax;
  const checkMin = investor.checkSizeUsdMin;
  const checkMax = investor.checkSizeUsdMax;

  const overlap = overlapLen(askMin, askMax, checkMin, checkMax);
  const askLen = Math.max(0, askMax - askMin);
  const checkLen = Math.max(0, checkMax - checkMin);
  const denom = Math.max(askLen, checkLen, 1);

  const overlapRatio = overlap > 0 ? overlap / denom : 0;

  let checkSubScore = 0;
  if (overlapRatio > 0) {
    checkSubScore = clamp(0.65 + 0.35 * overlapRatio, 0, 1);
  } else {
    const gap =
      askMax < checkMin ? checkMin - askMax : checkMax < askMin ? askMin - checkMax : 0;
    const askMid = mid(askMin, askMax);
    const checkMid = mid(checkMin, checkMax);
    const scale = Math.max(askMid, checkMid, 1) * 0.25 + Math.max(askLen, checkLen, 1) * 0.75;
    const gapRatio = scale ? gap / scale : 1;
    const closeness = clamp(1 - gapRatio, 0, 1);
    checkSubScore = clamp(closeness * 0.6, 0, 1);
  }

  const checkScorePoints = Math.round(WEIGHTS.checkSize * checkSubScore * 100);
  reasons.push({
    label: "Check size",
    detail:
      overlap > 0
        ? `Ask ${usd(askMin)}–${usd(askMax)} overlaps check ${usd(checkMin)}–${usd(checkMax)}.`
        : `Ask ${usd(askMin)}–${usd(askMax)} vs check ${usd(checkMin)}–${usd(checkMax)} (proximity match).`,
    weight: checkScorePoints
  });

  // 5) Thesis alignment (partial keyword overlap via token similarity)
  const thesisSimilarity = jaccardSimilarity(investor.thesisSummary, `${startup.productSummary} ${startup.tractionSummary}`);
  const thesisSubScore = clamp(thesisSimilarity * 1.5, 0, 1);
  const thesisScorePoints = Math.round(WEIGHTS.thesis * thesisSubScore * 100);
  reasons.push({
    label: "Thesis alignment",
    detail:
      thesisSubScore >= 0.75
        ? "Strong thematic overlap."
        : thesisSubScore >= 0.45
          ? "Moderate thematic overlap."
          : thesisSubScore >= 0.2
            ? "Some thematic overlap."
            : "Limited thematic overlap.",
    weight: thesisScorePoints
  });

  const finalScore = clamp(
    Math.round(
      WEIGHTS.sector * sectorSubScore * 100 +
        WEIGHTS.stage * stageSubScore * 100 +
        WEIGHTS.geography * geographySubScore * 100 +
        WEIGHTS.checkSize * checkSubScore * 100 +
        WEIGHTS.thesis * thesisSubScore * 100
    ),
    0,
    100
  );

  // Ensure reasons have consistent UX ordering even when some subscores are small.
  const orderedReasons = reasons
    .map((r) => ({ ...r, weight: clamp(r.weight, 0, 100) }))
    .sort((a, b) => b.weight - a.weight);

  // Keep up to 4 top reasons to avoid overloading.
  const topReasons = orderedReasons.slice(0, 4);

  return { score: finalScore, reasons: topReasons };
}

export function matchStartupToInvestors(
  startup: StartupProfile,
  investors: InvestorProfile[]
): MatchResult[] {
  return investors
    .map((inv) => {
      const { score, reasons } = scoreStartupInvestorPair(startup, inv);
      const explanation = generateMatchExplanation(startup, inv);
      return {
        id: `${startup.id}__${inv.id}`,
        score,
        startup,
        investor: inv,
        explanation,
        reasons
      } satisfies MatchResult;
    })
    .sort((a, b) => b.score - a.score);
}

export function matchInvestorToStartups(
  investor: InvestorProfile,
  startups: StartupProfile[]
): MatchResult[] {
  return startups
    .map((stp) => {
      const { score, reasons } = scoreStartupInvestorPair(stp, investor);
      const explanation = generateMatchExplanation(stp, investor);
      return {
        id: `${stp.id}__${investor.id}`,
        score,
        startup: stp,
        investor,
        explanation,
        reasons
      } satisfies MatchResult;
    })
    .sort((a, b) => b.score - a.score);
}

