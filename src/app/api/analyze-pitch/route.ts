import { NextResponse } from "next/server";
import { extractJsonObject, getModel, isQuotaOrRateLimitError } from "@/lib/gemini";

type AnalyzePitchBody = {
  text?: string;
};

type AnalyzePitchResult = {
  clarity_score: number; // 1-10
  market_opportunity_score: number; // 1-10
  traction_strength_score: number; // 1-10
  business_model_clarity_score: number; // 1-10
  key_strengths: string[];
  key_weaknesses: string[];
  suggestions_to_improve: string[];
  note?: string;
};

function isQuotaError(error: unknown) {
  return isQuotaOrRateLimitError(error);
}

function clampInt(n: unknown, min: number, max: number, fallback: number) {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.max(min, Math.min(max, Math.round(v)));
}

function asStringArray(v: unknown) {
  if (!Array.isArray(v)) return [];
  return v.filter((x) => typeof x === "string" && x.trim().length > 0).map((s) => s.trim());
}

function buildAnalyzerFallback(): AnalyzePitchResult {
  return {
    clarity_score: 6,
    market_opportunity_score: 6,
    traction_strength_score: 6,
    business_model_clarity_score: 6,
    key_strengths: ["Basic structure present"],
    key_weaknesses: ["Needs clearer differentiation"],
    suggestions_to_improve: ["Improve clarity", "Add traction metrics"],
    note: "⚠️ AI analysis unavailable due to quota limits."
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AnalyzePitchBody;
    const text = (body.text ?? "").trim();

    if (!text) {
      return NextResponse.json(
        { error: "Missing pitch deck text." },
        { status: 400 }
      );
    }

    const model = getModel();

    const prompt = `You are a VC analyst. Analyze this startup pitch deck and give:

1. Clarity score (1-10)
2. Market opportunity score (1-10)
3. Traction strength (1-10)
4. Business model clarity (1-10)
5. Key strengths (bullets)
6. Key weaknesses (bullets)
7. Suggestions to improve (bullets)

Return ONLY valid JSON with keys:
- clarity_score
- market_opportunity_score
- traction_strength_score
- business_model_clarity_score
- key_strengths
- key_weaknesses
- suggestions_to_improve

Pitch deck text:
"""${text}"""`;

    let raw = "";
    try {
      const system = "You are a VC analyst providing structured, actionable feedback.";
      const result = await model.generateContent([system, prompt].join("\n\n"));
      raw = result?.response?.text?.() ?? "";
    } catch (e) {
      if (isQuotaError(e)) {
        const fallback = buildAnalyzerFallback();
        return NextResponse.json(
          {
            ok: true,
            warning: { type: "quota", message: "⚠️ AI response limited. Showing basic output." },
            result: fallback,
            // Extra compatibility shape (as requested in the ticket)
            fallback_summary: {
              score: 60,
              strengths: fallback.key_strengths,
              weaknesses: fallback.key_weaknesses,
              suggestions: fallback.suggestions_to_improve,
              note: fallback.note
            }
          },
          { status: 200 }
        );
      }
      throw e;
    }

    const parsed: any = extractJsonObject(raw);
    if (!parsed) {
      console.error("[analyze-pitch] non-json model output:", raw);
      const fallback = buildAnalyzerFallback();
      return NextResponse.json(
        {
          ok: true,
          warning: { type: "parse", message: "⚠️ AI response limited. Showing basic output." },
          result: fallback
        },
        { status: 200 }
      );
    }

    const result: AnalyzePitchResult = {
      clarity_score: clampInt(parsed.clarity_score, 1, 10, 5),
      market_opportunity_score: clampInt(parsed.market_opportunity_score, 1, 10, 5),
      traction_strength_score: clampInt(parsed.traction_strength_score, 1, 10, 5),
      business_model_clarity_score: clampInt(parsed.business_model_clarity_score, 1, 10, 5),
      key_strengths: asStringArray(parsed.key_strengths),
      key_weaknesses: asStringArray(parsed.key_weaknesses),
      suggestions_to_improve: asStringArray(parsed.suggestions_to_improve)
    };

    return NextResponse.json({ ok: true, result }, { status: 200 });
  } catch (error) {
    console.error("GEMINI ERROR:", error);
    if (isQuotaError(error)) {
      const fallback = buildAnalyzerFallback();
      return NextResponse.json(
        {
          ok: true,
          warning: { type: "quota", message: "⚠️ AI response limited. Showing basic output." },
          result: fallback,
          fallback_summary: {
            score: 60,
            strengths: fallback.key_strengths,
            weaknesses: fallback.key_weaknesses,
            suggestions: fallback.suggestions_to_improve,
            note: fallback.note
          }
        },
        { status: 200 }
      );
    }
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? { name: error.name, message: error.message, stack: error.stack }
            : { message: "Pitch analysis failed." }
      },
      { status: 500 }
    );
  }
}

