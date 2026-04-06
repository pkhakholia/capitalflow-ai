import "server-only";

import { GoogleGenerativeAI } from "@google/generative-ai";

export function requireGeminiApiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("Missing GEMINI_API_KEY environment variable on server.");
  }
  return key;
}

export const genAI = new GoogleGenerativeAI(requireGeminiApiKey());

export function getModel() {
  return genAI.getGenerativeModel({
    model: "gemini-flash-latest"
  });
}

export function getEmbeddingModel() {
  // Text embedding model name used by Google AI Studio / Generative AI API.
  // If your account/project doesn't support it, our callers will fall back safely.
  return null;

}

export function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function extractJsonObject(text: string) {
  // Gemini sometimes wraps JSON in prose or code fences. Try to recover.
  const trimmed = (text ?? "").trim();
  if (!trimmed) return null;

  const direct = safeJsonParse(trimmed);
  if (direct) return direct;

  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) return null;

  const slice = trimmed.slice(first, last + 1);
  return safeJsonParse(slice);
}

export function isQuotaOrRateLimitError(error: unknown) {
  const e = error as any;
  const status = e?.status ?? e?.response?.status ?? e?.cause?.status;
  const code = e?.code ?? e?.error?.code;
  const message = String(e?.message ?? e?.error?.message ?? "");
  return (
    status === 429 ||
    code === "insufficient_quota" ||
    message.toLowerCase().includes("insufficient_quota") ||
    message.toLowerCase().includes("quota") ||
    message.toLowerCase().includes("rate limit") ||
    message.toLowerCase().includes("resource exhausted")
  );
}

