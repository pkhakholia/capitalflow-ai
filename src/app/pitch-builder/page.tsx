"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { usePlan } from "@/hooks/usePlan";
import UpgradePrompt from "@/components/paywall/UpgradePrompt";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Zap, Check, AlertTriangle, ArrowUpRight, BookOpen } from "lucide-react";

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

function ScoreBar({ score }: { score: number }) {
  const s = Math.max(0, Math.min(100, Math.round(score)));
  return (
    <div className="grid gap-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-mutedForeground">Investor readiness</span>
        <span className="font-semibold">{s}/100</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-2 rounded-full bg-primary"
          style={{ width: `${s}%` }}
        />
      </div>
    </div>
  );
}

function BulletList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="grid gap-2">
      <div className="text-sm font-semibold">{title}</div>
      <ul className="list-disc pl-5 text-sm text-mutedForeground">
        {items.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
    </div>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border bg-background p-4">
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-2 whitespace-pre-wrap text-sm text-mutedForeground">
        {body || "—"}
      </div>
    </div>
  );
}

export default function PitchBuilderPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
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
      <div style={{ padding: "28px", minHeight: "100vh", background: "var(--vm-surface)" }}>
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

      const w =
        typeof data?.warning?.message === "string"
          ? data.warning.message
          : typeof data?.result?.note === "string"
            ? "⚠️ AI response limited. Showing basic output."
            : null;
      setWarning(w);
      setResult((data?.result ?? null) as PitchDeckOutput | null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pitch generation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "28px", minHeight: "100vh", background: "var(--vm-surface)" }}>
      {/* Page Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontFamily: "var(--font-fraunces), serif", fontSize: "26px", fontWeight: 600, color: "var(--vm-slate)", letterSpacing: "-0.5px", margin: "0 0 4px 0" }}>
          Pitch Builder
        </h1>
        <p style={{ fontSize: "14px", color: "var(--vm-slate-3)", margin: 0 }}>
          Generate your startup story using AI.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" }}>
        {/* LEFT CARD */}
        <div style={{ background: "var(--vm-white)", border: "1px solid var(--vm-slate-5)", borderRadius: "var(--radius-lg)", padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px" }}>
            <BookOpen size={16} color="var(--vm-indigo)" />
            <span style={{ fontSize: "16px", fontWeight: 600, color: "var(--vm-slate)" }}>Your Startup Story</span>
          </div>

          <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {error && <div style={{ color: "var(--vm-rose)", fontSize: "13px", padding: "10px", background: "var(--vm-rose-light)", borderRadius: "var(--radius-sm)" }}>{error}</div>}
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--vm-slate)", marginBottom: "6px" }}>Company Name *</div>
                <input value={startupName} onChange={(e) => setStartupName(e.target.value)} required />
              </div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--vm-slate)", marginBottom: "6px" }}>Industry *</div>
                <input value={industry} onChange={(e) => setIndustry(e.target.value)} required />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--vm-slate)", marginBottom: "6px" }}>Stage *</div>
                <input value={stage} onChange={(e) => setStage(e.target.value)} required />
              </div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--vm-slate)", marginBottom: "6px" }}>Funding Ask</div>
                <input value={fundingAsk} onChange={(e) => setFundingAsk(e.target.value)} />
              </div>
            </div>

            <div>
              <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--vm-slate)", marginBottom: "6px" }}>Problem *</div>
              <textarea value={problem} onChange={(e) => setProblem(e.target.value)} style={{ minHeight: "80px", resize: "vertical" }} required />
            </div>

            <div>
              <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--vm-slate)", marginBottom: "6px" }}>Solution *</div>
              <textarea value={solution} onChange={(e) => setSolution(e.target.value)} style={{ minHeight: "80px", resize: "vertical" }} required />
            </div>

            <div>
              <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--vm-slate)", marginBottom: "6px" }}>Target Market *</div>
              <textarea value={targetMarket} onChange={(e) => setTargetMarket(e.target.value)} style={{ minHeight: "80px", resize: "vertical" }} required />
            </div>

            <div>
              <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--vm-slate)", marginBottom: "6px" }}>Business Model</div>
              <textarea value={businessModel} onChange={(e) => setBusinessModel(e.target.value)} style={{ minHeight: "80px", resize: "vertical" }} />
            </div>

            <div>
              <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--vm-slate)", marginBottom: "6px" }}>Traction</div>
              <textarea value={traction} onChange={(e) => setTraction(e.target.value)} style={{ minHeight: "80px", resize: "vertical" }} />
            </div>

            <div>
              <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--vm-slate)", marginBottom: "6px" }}>Team Background</div>
              <textarea value={teamBackground} onChange={(e) => setTeamBackground(e.target.value)} style={{ minHeight: "80px", resize: "vertical" }} />
            </div>

            <button type="submit" disabled={!canSubmit || loading} style={{ width: "100%", background: "var(--vm-indigo)", color: "white", padding: "12px", borderRadius: "var(--radius-sm)", border: "none", fontSize: "14px", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", cursor: canSubmit ? "pointer" : "not-allowed", opacity: canSubmit ? 1 : 0.7, marginTop: "8px" }}>
              <Zap size={16} fill="currentColor" />
              {loading ? "Generating..." : "Generate Pitch"}
            </button>
          </form>
        </div>

        {/* RIGHT CARD */}
        <div style={{ background: "var(--vm-white)", border: "1px solid var(--vm-slate-5)", borderRadius: "var(--radius-lg)", padding: "24px", position: "sticky", top: "24px" }}>
          <div style={{ marginBottom: "24px" }}>
            <span style={{ fontSize: "16px", fontWeight: 600, color: "var(--vm-slate)" }}>Generated Pitch</span>
            {result ? (
              <div style={{ marginTop: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "13px", color: "var(--vm-slate-3)" }}>Investor Readiness</span>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--vm-indigo)" }}>{result.investor_readiness_score}%</span>
                </div>
                <div style={{ width: "100%", height: "8px", background: "var(--vm-slate-6)", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ width: `${result.investor_readiness_score || 0}%`, height: "100%", background: "linear-gradient(90deg, var(--vm-indigo), var(--vm-indigo-mid))" }} />
                </div>
              </div>
            ) : (
              <div style={{ marginTop: "16px", fontSize: "13px", color: "var(--vm-slate-3)" }}>Fill out the form and hit Generate to see your AI-crafted pitch deck slides here.</div>
            )}
          </div>

          {result && (
            <div style={{ display: "flex", flexDirection: "column" }}>
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
                <div key={i} style={{ paddingBottom: "16px", marginBottom: "16px", borderBottom: i < 7 ? "1px solid var(--vm-slate-6)" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                    <span style={{ fontSize: "10px", textTransform: "uppercase", color: "var(--vm-indigo)", letterSpacing: "0.8px", fontWeight: 600 }}>{slide.n}</span>
                    <span style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--vm-slate)" }}>{slide.t}</span>
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--vm-slate-2)", lineHeight: 1.6 }}>{slide.c || "—"}</div>
                </div>
              ))}

              <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--vm-slate)", marginBottom: "8px" }}>Key Strengths</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {result.key_strengths?.map((item, i) => (
                      <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}><Check size={14} color="var(--vm-emerald)" style={{ marginTop: "2px", flexShrink: 0 }} /><span style={{ fontSize: "13px", color: "var(--vm-slate-2)" }}>{item}</span></div>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--vm-slate)", marginBottom: "8px" }}>Key Risks</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {result.key_risks?.map((item, i) => (
                      <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}><AlertTriangle size={14} color="var(--vm-amber)" style={{ marginTop: "2px", flexShrink: 0 }} /><span style={{ fontSize: "13px", color: "var(--vm-slate-2)" }}>{item}</span></div>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--vm-slate)", marginBottom: "8px" }}>Top 3 Improvements</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {result.top_3_improvements?.map((item, i) => (
                      <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}><ArrowUpRight size={14} color="var(--vm-indigo)" style={{ marginTop: "2px", flexShrink: 0 }} /><span style={{ fontSize: "13px", color: "var(--vm-slate-2)" }}>{item}</span></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

