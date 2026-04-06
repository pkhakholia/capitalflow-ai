"use client";

import * as React from "react";

import type { MatchResult } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function scoreLabel(score: number) {
  if (score >= 80) return "🔥 Strong Match";
  if (score >= 50) return "👍 Good Match";
  return "⚠️ Weak";
}

export function MatchList({
  matches,
  mode
}: {
  matches: MatchResult[];
  mode: "startup" | "investor";
}) {
  const [expanded, setExpanded] = React.useState<string | null>(null);

  if (matches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No matches yet</CardTitle>
          <CardDescription>
            Create a profile (or broaden your focus) to see matches.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {matches.slice(0, 20).map((m) => {
        const title = mode === "startup" ? m.investor.firmName : m.startup.companyName;
        const subtitle =
          mode === "startup"
            ? `${m.investor.stageFocus.join(", ")} • ${m.investor.regions.join(", ")}`
            : `${m.startup.stage} • ${m.startup.regions.join(", ")}`;

        return (
          <Card key={m.id}>
            <CardHeader className="flex items-start justify-between gap-4 sm:flex-row">
              <div className="min-w-0">
                <CardTitle className="truncate">{title}</CardTitle>
                <CardDescription className="truncate">{subtitle}</CardDescription>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge className="bg-background">
                    AI score {m.score}/100 • {scoreLabel(m.score)}
                  </Badge>
                  {mode === "startup" ? (
                    <>
                      {m.investor.sectorFocus.slice(0, 3).map((s) => (
                        <Badge key={s}>{s}</Badge>
                      ))}
                    </>
                  ) : (
                    <>
                      <Badge>{m.startup.sector}</Badge>
                      <Badge>{m.startup.stage}</Badge>
                    </>
                  )}
                </div>
                {m.explanation.length ? (
                  <ul className="mt-3 list-disc pl-5 text-xs text-mutedForeground">
                    {m.explanation.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
              <button
                className={buttonClasses({ variant: "secondary" })}
                onClick={() => setExpanded((cur) => (cur === m.id ? null : m.id))}
              >
                {expanded === m.id ? "Hide details" : "Why this match?"}
              </button>
            </CardHeader>
            {expanded === m.id ? (
              <CardContent className="grid gap-3 pt-0">
                <div className="grid gap-2">
                  {m.reasons.map((r) => (
                    <div
                      key={r.label}
                      className="flex items-start justify-between gap-4 rounded-lg border bg-background px-3 py-2 text-sm"
                    >
                      <div className="grid gap-0.5">
                        <div className="font-medium">{r.label}</div>
                        <div className="text-mutedForeground">{r.detail}</div>
                      </div>
                      <Badge className="bg-background">+{r.weight}</Badge>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg border bg-muted p-3 text-sm text-mutedForeground">
                  Tip: tune sector/stage/regions and check-size/ask to see scores change.
                </div>
              </CardContent>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}

