import { NextResponse } from "next/server";
import { extractJsonObject, getModel, isQuotaOrRateLimitError } from "@/lib/gemini";

type GeneratePitchBody = {
  startupName?: string;
  industry?: string;
  stage?: string;
  problem?: string;
  solution?: string;
  targetMarket?: string;
  businessModel?: string;
  traction?: string;
  fundingAsk?: string;
};

type PitchDeckOutput = {
  elevator_pitch: string;
  investor_readiness_score: number; // 0-100
  note?: string;
  sections: {
    problem: string;
    solution: string;
    market_opportunity: string;
    product: string;
    business_model: string;
    traction: string;
    go_to_market_strategy: string;
    competition: string;
    why_now: string;
    funding_ask: string;
  };
  key_strengths: string[];
  key_risks: string[];
  top_3_improvements: string[];
};

function isQuotaError(error: unknown) {
  return isQuotaOrRateLimitError(error);
}

function clampInt(n: unknown, min: number, max: number, fallback: number) {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.max(min, Math.min(max, Math.round(v)));
}

function ensureString(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function asStringArray(v: unknown) {
  if (!Array.isArray(v)) return [];
  return v.filter((x) => typeof x === "string" && x.trim().length > 0).map((s) => s.trim());
}

function buildFallbackPitchTemplate(): PitchDeckOutput {
  return {
    elevator_pitch: "One-line: Describe what you do + for whom + the measurable outcome.",
    investor_readiness_score: 60,
    note: "⚠️ AI generation unavailable (quota exceeded). Showing template instead.",
    sections: {
      problem: "Clearly define the problem your startup is solving.",
      solution: "Describe your solution in a simple and compelling way.",
      market_opportunity: "Explain your target market size and opportunity.",
      product: "Describe the product, how it works, and the core differentiator.",
      business_model: "Outline how you will make money.",
      traction: "Add any early traction or validation.",
      go_to_market_strategy: "Explain how you will acquire customers.",
      competition: "List competitors and your advantage.",
      why_now: "Explain why this opportunity is timely.",
      funding_ask: "Specify how much funding you need and how it will be used."
    },
    key_strengths: ["Basic structure present"],
    key_risks: ["Needs clearer differentiation"],
    top_3_improvements: ["Improve clarity", "Add traction metrics", "Sharpen differentiation vs competitors"]
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as GeneratePitchBody;

    const startupName = (body.startupName ?? "").trim();
    const industry = (body.industry ?? "").trim();
    const stage = (body.stage ?? "").trim();
    const problem = (body.problem ?? "").trim();
    const solution = (body.solution ?? "").trim();
    const targetMarket = (body.targetMarket ?? "").trim();

    if (!startupName || !industry || !stage || !problem || !solution || !targetMarket) {
      return NextResponse.json(
        { error: "Missing required fields. Please fill Startup Name, Industry, Stage, Problem, Solution, Target Market." },
        { status: 400 }
      );
    }

    const model = getModel();

    const prompt = `You are a top VC helping a founder create a pitch deck.

Generate a complete pitch deck with the following sections:

1. Problem
2. Solution
3. Market Opportunity
4. Product
5. Business Model
6. Traction
7. Go-To-Market Strategy
8. Competition
9. Why Now
10. Funding Ask

Make it concise, persuasive, and investor-ready.

Also, make it feel like a tool with VC feedback (not just text). Include:
- One-line elevator pitch
- Investor readiness score (0-100)
- Key strengths (bullets)
- Key risks (bullets)
- Top 3 improvements (bullets)

Return ONLY valid JSON with this exact shape:
{
  "elevator_pitch": string,
  "investor_readiness_score": number,
  "sections": {
    "problem": string,
    "solution": string,
    "market_opportunity": string,
    "product": string,
    "business_model": string,
    "traction": string,
    "go_to_market_strategy": string,
    "competition": string,
    "why_now": string,
    "funding_ask": string
  },
  "key_strengths": string[],
  "key_risks": string[],
  "top_3_improvements": string[]
}

Founder inputs:
- Startup Name: ${startupName}
- Industry: ${industry}
- Stage: ${stage}
- Problem statement: ${problem}
- Solution: ${solution}
- Target market: ${targetMarket}
- Business model (optional): ${(body.businessModel ?? "").trim() || "N/A"}
- Traction (optional): ${(body.traction ?? "").trim() || "N/A"}
- Funding ask (optional): ${(body.fundingAsk ?? "").trim() || "N/A"}
`;

    let raw = "";
    try {
      const system = "You are a top-tier VC and pitch coach. Be specific, crisp, and investor-grade.";
      const result = await model.generateContent([system, prompt].join("\n\n"));
      raw = result?.response?.text?.() ?? "";
    } catch (e) {
      if (isQuotaError(e)) {
        const fallback = buildFallbackPitchTemplate();
        return NextResponse.json(
          {
            ok: true,
            warning: { type: "quota", message: "⚠️ AI response limited. Showing basic output." },
            result: fallback,
            // Extra compatibility shape (as requested in the ticket)
            fallback_template: {
              problem: fallback.sections.problem,
              solution: fallback.sections.solution,
              market: fallback.sections.market_opportunity,
              businessModel: fallback.sections.business_model,
              traction: fallback.sections.traction,
              goToMarket: fallback.sections.go_to_market_strategy,
              competition: fallback.sections.competition,
              whyNow: fallback.sections.why_now,
              ask: fallback.sections.funding_ask,
              note: fallback.note
            }
          },
          { status: 200 }
        );
      }
      throw e;
    }

    const parsed = extractJsonObject(raw);
    if (!parsed) {
      console.error("[generate-pitch] non-json model output:", raw);
      const fallback = buildFallbackPitchTemplate();
      return NextResponse.json(
        {
          ok: true,
          warning: { type: "parse", message: "⚠️ AI response limited. Showing basic output." },
          result: fallback
        },
        { status: 200 }
      );
    }

    const sectionsIn = parsed?.sections ?? {};
    const output: PitchDeckOutput = {
      elevator_pitch: ensureString(parsed?.elevator_pitch) || `${startupName} — ${industry} (${stage}).`,
      investor_readiness_score: clampInt(parsed?.investor_readiness_score, 0, 100, 50),
      sections: {
        problem: ensureString(sectionsIn.problem) || problem,
        solution: ensureString(sectionsIn.solution) || solution,
        market_opportunity: ensureString(sectionsIn.market_opportunity) || "",
        product: ensureString(sectionsIn.product) || "",
        business_model: ensureString(sectionsIn.business_model) || ensureString(body.businessModel) || "",
        traction: ensureString(sectionsIn.traction) || ensureString(body.traction) || "",
        go_to_market_strategy: ensureString(sectionsIn.go_to_market_strategy) || "",
        competition: ensureString(sectionsIn.competition) || "",
        why_now: ensureString(sectionsIn.why_now) || "",
        funding_ask: ensureString(sectionsIn.funding_ask) || ensureString(body.fundingAsk) || ""
      },
      key_strengths: asStringArray(parsed?.key_strengths).slice(0, 8),
      key_risks: asStringArray(parsed?.key_risks).slice(0, 8),
      top_3_improvements: asStringArray(parsed?.top_3_improvements).slice(0, 3)
    };

    return NextResponse.json({ ok: true, result: output }, { status: 200 });
  } catch (error) {
    console.error("GEMINI ERROR:", error);
    if (isQuotaError(error)) {
      const fallback = buildFallbackPitchTemplate();
      return NextResponse.json(
        {
          ok: true,
          warning: { type: "quota", message: "⚠️ AI response limited. Showing basic output." },
          result: fallback,
          fallback_template: {
            problem: fallback.sections.problem,
            solution: fallback.sections.solution,
            market: fallback.sections.market_opportunity,
            businessModel: fallback.sections.business_model,
            traction: fallback.sections.traction,
            goToMarket: fallback.sections.go_to_market_strategy,
            competition: fallback.sections.competition,
            whyNow: fallback.sections.why_now,
            ask: fallback.sections.funding_ask,
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
            : { message: "Pitch generation failed." }
      },
      { status: 500 }
    );
  }
}

