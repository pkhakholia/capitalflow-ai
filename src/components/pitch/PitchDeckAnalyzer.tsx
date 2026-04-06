"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type AnalyzePitchResult = {
  clarity_score: number;
  market_opportunity_score: number;
  traction_strength_score: number;
  business_model_clarity_score: number;
  key_strengths: string[];
  key_weaknesses: string[];
  suggestions_to_improve: string[];
  note?: string;
};

function ScoreRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-background px-3 py-2 text-sm">
      <span className="text-mutedForeground">{label}</span>
      <span className="font-semibold">{value}/10</span>
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

export function PitchDeckAnalyzer({ defaultText = "" }: { defaultText?: string }) {
  const [text, setText] = React.useState(defaultText);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<AnalyzePitchResult | null>(null);
  const [warning, setWarning] = React.useState<string | null>(null);

  const analyze = async () => {
    setError(null);
    setResult(null);
    setWarning(null);
    setLoading(true);

    try {
      const res = await fetch("/api/analyze-pitch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          typeof data?.error === "string"
            ? data.error
            : data?.error?.message
              ? data.error.message
              : "Analysis failed."
        );
      }

      const w =
        typeof data?.warning?.message === "string"
          ? data.warning.message
          : typeof data?.result?.note === "string"
            ? "⚠️ AI response limited. Showing basic output."
            : null;
      setWarning(w);
      setResult((data?.result ?? null) as AnalyzePitchResult | null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI pitch deck feedback</CardTitle>
        <CardDescription>
          Paste pitch text to get instant VC-style feedback (no PDF parsing yet).
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your pitch deck text here…"
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-mutedForeground">
              Tip: include problem, solution, market, traction, business model, and ask.
            </div>
            <Button
              onClick={analyze}
              disabled={loading || text.trim().length < 30}
            >
              {loading ? "Analyzing..." : "Analyze pitch"}
            </Button>
          </div>
        </div>

        {warning ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            {warning}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {result ? (
          <div className="grid gap-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <ScoreRow label="Clarity" value={result.clarity_score} />
              <ScoreRow label="Market opportunity" value={result.market_opportunity_score} />
              <ScoreRow label="Traction strength" value={result.traction_strength_score} />
              <ScoreRow label="Business model clarity" value={result.business_model_clarity_score} />
            </div>

            <div className="grid gap-4">
              <BulletList title="Key strengths" items={result.key_strengths} />
              <BulletList title="Key weaknesses" items={result.key_weaknesses} />
              <BulletList title="Suggestions to improve" items={result.suggestions_to_improve} />
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

