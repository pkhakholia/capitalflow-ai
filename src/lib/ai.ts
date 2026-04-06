import "server-only";

import type { InvestorProfile, StartupProfile } from "@/lib/types";
import {
  extractJsonObject,
  getEmbeddingModel,
  getModel,
  isQuotaOrRateLimitError
} from "@/lib/gemini";

const embeddingCache = new Map<string, number[]>();
const DEFAULT_EMBEDDING_DIM = 768;

function generateFakeEmbedding(dim = DEFAULT_EMBEDDING_DIM): number[] {
  return Array.from({ length: dim }, () => Math.random());
}

function scaleCosineTo0to100(cosine: number) {
  // cosine similarity is in [-1, 1]
  return Math.round(((cosine + 1) / 2) * 100);
}

export function cosineSimilarity(a: number[], b: number[]) {
  if (a.length !== b.length) {
    throw new Error(`Embedding dimension mismatch: ${a.length} vs ${b.length}`);
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function buildStartupText(startup: StartupProfile) {
  // Keep text compact but information-rich for semantic matching.
  const funding = (startup.fundingAskUsdMin + startup.fundingAskUsdMax) / 2;
  return [
    `Industry: ${startup.sector}`,
    `Stage: ${startup.stage}`,
    `Regions: ${startup.regions.join(", ")}`,
    `Funding required (USD): ${Math.round(funding)}`,
    `Description: ${startup.productSummary}`,
    `Traction: ${startup.tractionSummary}`
  ].join("\n");
}

export function buildInvestorText(investor: InvestorProfile) {
  return [
    `Focus industries: ${investor.sectorFocus.join(", ")}`,
    `Stage focus: ${investor.stageFocus.join(", ")}`,
    `Regions: ${investor.regions.join(", ")}`,
    `Thesis: ${investor.thesisSummary}`,
    investor.valueAddSummary ? `Value add: ${investor.valueAddSummary}` : ""
  ]
    .filter(Boolean)
    .join("\n");
}

export async function getEmbedding(text: string): Promise<number[]> {
  const key = (text ?? "").trim();
  if (!key) throw new Error("Cannot create embedding from empty text.");

  const cached = embeddingCache.get(key);
  if (cached) return cached;

  try {
    const model = getEmbeddingModel() as any;
    // SDK shape: model.embedContent(text) -> { embedding: { values: number[] } }
    const res = await model.embedContent(key);
    const embedding = res?.embedding?.values as number[] | undefined;
    if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
      throw new Error("Gemini embedding response missing embedding vector.");
    }
    embeddingCache.set(key, embedding);
    return embedding;
  } catch (error) {
    // If Gemini embeddings fail (quota/model access/etc), return a fake embedding.
    // This keeps the app functional (matching will be less accurate).
    console.error("GEMINI EMBEDDING ERROR (fallback to fake embedding):", error);
    const fake = generateFakeEmbedding();
    embeddingCache.set(key, fake);
    return fake;
  }
}

function buildChatPrompt(startup: StartupProfile, investor: InvestorProfile) {
  return [
    "Score the investor-startup fit from 0 to 100.",
    "Return ONLY valid JSON with keys: score (number), rationale (string).",
    "",
    "Startup:",
    buildStartupText(startup),
    "",
    "Investor:",
    buildInvestorText(investor)
  ].join("\n");
}

export async function calculateChatAIMatch(
  startup: StartupProfile,
  investor: InvestorProfile
): Promise<{ score: number; rationale: string }> {
  const prompt = buildChatPrompt(startup, investor).trim();
  if (!prompt) throw new Error("Chat prompt is empty.");

  try {
    const model = getModel();
    const system = "You are a VC analyst ranking startup-investor fit.";
    const instruction =
      "Score the investor-startup fit from 0 to 100. Return ONLY valid JSON with keys: score (number), rationale (string).";
    const result = await model.generateContent([system, instruction, prompt].join("\n\n"));
    const text = result?.response?.text?.() ?? "";
    const parsed = (extractJsonObject(text) ?? {}) as { score?: unknown; rationale?: unknown };
    const score = typeof parsed.score === "number" ? parsed.score : Number(parsed.score);
    const rationale = typeof parsed.rationale === "string" ? parsed.rationale : "";

    if (!Number.isFinite(score)) {
      throw new Error(`Gemini response missing numeric score. Raw: ${text}`);
    }

    return { score: Math.max(0, Math.min(100, Math.round(score))), rationale };
  } catch (error) {
    if (isQuotaOrRateLimitError(error)) {
      return { score: 50, rationale: "AI temporarily unavailable (quota/rate limit). Using neutral score." };
    }
    console.error("GEMINI ERROR:", error);
    throw error instanceof Error ? error : new Error("Gemini chat scoring call failed.");
  }
}

export async function calculateAIMatch(
  startup: StartupProfile,
  investor: InvestorProfile
): Promise<number> {
  // Validate text inputs early so errors are easier to debug.
  const startupText = buildStartupText(startup);
  const investorText = buildInvestorText(investor);
  if (!startupText.trim()) throw new Error("buildStartupText returned empty text.");
  if (!investorText.trim()) throw new Error("buildInvestorText returned empty text.");

  try {
    const [startupEmbedding, investorEmbedding] = await Promise.all([
      getEmbedding(startupText),
      getEmbedding(investorText)
    ]);

    const cosine = cosineSimilarity(startupEmbedding, investorEmbedding);
    return scaleCosineTo0to100(cosine);
  } catch (e) {
    console.error("calculateAIMatch error:", e, {
      startupSector: startup.sector,
      investorFocus: investor.sectorFocus,
      startupStage: startup.stage,
      investorStages: investor.stageFocus
    });
    throw e instanceof Error ? e : new Error("AI matching failed due to an unknown error.");
  }
}

