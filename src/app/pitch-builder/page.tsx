"use client";

import * as React from "react";
import { Loader2, Zap, Check, AlertTriangle, ArrowUpRight, BookOpen } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { usePlan } from "@/hooks/usePlan";
import UpgradePrompt from "@/components/paywall/UpgradePrompt";

type PitchDeckOutput = {
  elevator_pitch: string;
  investor_readiness_score: number;
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

export default function PitchBuilderPage() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="animate-spin text-[#4F46E5]" size={32} />
      </div>
    );
  }

  return <PitchBuilderContent />;
}

function PitchBuilderContent() {
  const { limits } = usePlan();

  if (!limits.pitchBuilder) {
    return (
      <div className="min-h-screen bg-[var(--vm-surface)] px-4 py-5 sm:px-6 sm:py-6 lg:px-7">
        <UpgradePrompt feature="Pitch Builder" />
      </div>
    );
  }

  const [startupName, setStartupName] = React.useState("");
  const [industry, setIndustry] = React.useState("");
  const [stage, setStage] = React.useState("");
  const [problem, setProblem] = React.useState("");
  const [solution, setSolution] = React.useState("");
  const [targetMarket, setTargetMarket] = React.useState("");
  const [businessModel, setBusinessModel] = React.useState("");
  const [traction, setTraction] = React.useState("");
  const [fundingAsk, setFundingAsk] = React.useState("");
  const [teamBackground, setTeamBackground] = React.useState("");

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<PitchDeckOutput | null>(null);
  const [warning, setWarning] = React.useState<string | null>(null);

  const canSubmit =
    startupName.trim() &&
    industry.trim() &&
    stage.trim() &&
    problem.trim() &&
    solution.trim() &&
    targetMarket.trim();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setWarning(null);
    setLoading(true);

    try {
      const res = await fetch("/api/generate-pitch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startupName,
          industry,
          stage,
          problem,
          solution,
          targetMarket,
          businessModel,
          traction,
          fundingAsk,
          teamBackground
        })
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          typeof data?.error === "string"
            ? data.error
            : data?.error?.message
              ? data.error.message
              : "Pitch generation failed."
        );
      }

      const nextWarning =
        typeof data?.warning?.message === "string"
          ? data.warning.message
          : typeof data?.result?.note === "string"
            ? "AI response was limited. Showing the simplified output."
            : null;

      setWarning(nextWarning);
      setResult((data?.result ?? null) as PitchDeckOutput | null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pitch generation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--vm-surface)] px-4 py-5 sm:px-6 sm:py-6 lg:px-7">
      <div className="mb-6">
        <h1 className="m-0 font-[family-name:var(--font-fraunces)] text-[clamp(1.75rem,3vw,2.125rem)] font-semibold tracking-[-0.5px] text-[var(--vm-slate)]">
          Pitch Builder
        </h1>
        <p className="mt-1 text-sm text-[var(--vm-slate-3)] sm:text-[15px]">
          Generate your startup story using AI.
        </p>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-2">
        <div className="rounded-[var(--radius-lg)] border border-[var(--vm-slate-5)] bg-[var(--vm-white)] p-4 sm:p-6">
          <div className="mb-6 flex items-center gap-2">
            <BookOpen size={16} color="var(--vm-indigo)" />
            <span className="text-base font-semibold text-[var(--vm-slate)]">Your Startup Story</span>
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            {error ? (
              <div className="rounded-[var(--radius-sm)] bg-[var(--vm-rose-light)] p-2.5 text-[13px] text-[var(--vm-rose)]">
                {error}
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Company Name *">
                <input value={startupName} onChange={(e) => setStartupName(e.target.value)} required />
              </FormField>
              <FormField label="Industry *">
                <input value={industry} onChange={(e) => setIndustry(e.target.value)} required />
              </FormField>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Stage *">
                <input value={stage} onChange={(e) => setStage(e.target.value)} required />
              </FormField>
              <FormField label="Funding Ask">
                <input value={fundingAsk} onChange={(e) => setFundingAsk(e.target.value)} />
              </FormField>
            </div>

            <FormField label="Problem *">
              <textarea value={problem} onChange={(e) => setProblem(e.target.value)} style={{ minHeight: "80px", resize: "vertical" }} required />
            </FormField>
            <FormField label="Solution *">
              <textarea value={solution} onChange={(e) => setSolution(e.target.value)} style={{ minHeight: "80px", resize: "vertical" }} required />
            </FormField>
            <FormField label="Target Market *">
              <textarea value={targetMarket} onChange={(e) => setTargetMarket(e.target.value)} style={{ minHeight: "80px", resize: "vertical" }} required />
            </FormField>
            <FormField label="Business Model">
              <textarea value={businessModel} onChange={(e) => setBusinessModel(e.target.value)} style={{ minHeight: "80px", resize: "vertical" }} />
            </FormField>
            <FormField label="Traction">
              <textarea value={traction} onChange={(e) => setTraction(e.target.value)} style={{ minHeight: "80px", resize: "vertical" }} />
            </FormField>
            <FormField label="Team Background">
              <textarea value={teamBackground} onChange={(e) => setTeamBackground(e.target.value)} style={{ minHeight: "80px", resize: "vertical" }} />
            </FormField>

            <button
              type="submit"
              disabled={!canSubmit || loading}
              style={{
                width: "100%",
                background: "var(--vm-indigo)",
                color: "white",
                padding: "12px",
                borderRadius: "var(--radius-sm)",
                border: "none",
                fontSize: "14px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                cursor: canSubmit ? "pointer" : "not-allowed",
                opacity: canSubmit ? 1 : 0.7,
                marginTop: "8px",
                minHeight: "44px"
              }}
            >
              <Zap size={16} fill="currentColor" />
              {loading ? "Generating..." : "Generate Pitch"}
            </button>
          </form>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--vm-slate-5)] bg-[var(--vm-white)] p-4 sm:p-6 xl:sticky xl:top-6">
          <div className="mb-6">
            <span className="text-base font-semibold text-[var(--vm-slate)]">Generated Pitch</span>
            {warning ? (
              <div className="mt-3 rounded-[var(--radius-sm)] border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-700">
                {warning}
              </div>
            ) : null}
            {result ? (
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[13px] text-[var(--vm-slate-3)]">Investor Readiness</span>
                  <span className="text-[13px] font-semibold text-[var(--vm-indigo)]">
                    {result.investor_readiness_score}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--vm-slate-6)]">
                  <div
                    className="h-full"
                    style={{
                      width: `${result.investor_readiness_score || 0}%`,
                      background: "linear-gradient(90deg, var(--vm-indigo), var(--vm-indigo-mid))"
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="mt-4 text-[13px] text-[var(--vm-slate-3)]">
                Fill out the form and hit Generate to see your AI-crafted pitch deck slides here.
              </div>
            )}
          </div>

          {result ? (
            <div className="flex flex-col">
              {[
                { n: "01", t: "Elevator Pitch", c: result.elevator_pitch },
                { n: "02", t: "Problem Statement", c: result.sections?.problem },
                { n: "03", t: "Solution", c: result.sections?.solution },
                { n: "04", t: "Market Opportunity", c: result.sections?.market_opportunity },
                { n: "05", t: "Business Model", c: result.sections?.business_model },
                { n: "06", t: "Traction", c: result.sections?.traction },
                { n: "07", t: "Team", c: teamBackground || "Information not provided yet." },
                { n: "08", t: "The Ask", c: result.sections?.funding_ask }
              ].map((slide, i) => (
                <div
                  key={slide.n}
                  className={i < 7 ? "mb-4 border-b border-[var(--vm-slate-6)] pb-4" : ""}
                >
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.8px] text-[var(--vm-indigo)]">
                      {slide.n}
                    </span>
                    <span className="text-[13.5px] font-semibold text-[var(--vm-slate)]">
                      {slide.t}
                    </span>
                  </div>
                  <div className="text-[13px] leading-6 text-[var(--vm-slate-2)]">
                    {slide.c || "-"}
                  </div>
                </div>
              ))}

              <div className="mt-4 flex flex-col gap-5">
                <PitchList title="Key Strengths" icon={<Check size={14} color="var(--vm-emerald)" />} items={result.key_strengths} />
                <PitchList title="Key Risks" icon={<AlertTriangle size={14} color="var(--vm-amber)" />} items={result.key_risks} />
                <PitchList title="Top 3 Improvements" icon={<ArrowUpRight size={14} color="var(--vm-indigo)" />} items={result.top_3_improvements} />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function FormField({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 text-[13px] font-medium text-[var(--vm-slate)]">{label}</div>
      {children}
    </div>
  );
}

function PitchList({
  title,
  icon,
  items
}: {
  title: string;
  icon: React.ReactNode;
  items: string[];
}) {
  return (
    <div>
      <div className="mb-2 text-[13px] font-semibold text-[var(--vm-slate)]">{title}</div>
      <div className="flex flex-col gap-2">
        {items?.map((item, i) => (
          <div key={`${title}-${i}`} className="flex items-start gap-2">
            <span className="mt-0.5 flex-shrink-0">{icon}</span>
            <span className="text-[13px] text-[var(--vm-slate-2)]">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
