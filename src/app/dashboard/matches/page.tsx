"use client";

import Link from "next/link";
import * as React from "react";
import { Loader2 } from "lucide-react";

import { MatchCard } from "@/components/matches/MatchCard";
import { ContactModal } from "@/components/matches/ContactModal";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { scoreStartupInvestorPair } from "@/lib/matching";
import { calculateMatchScore } from "@/app/actions/match";
import { startupRowToProfile, investorRowToProfile } from "@/lib/supabase-mapping";
import type { InvestorProfile, StartupProfile, MatchResult } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { usePlan } from "@/hooks/usePlan";
import UpgradePrompt from "@/components/paywall/UpgradePrompt";

type Mode = "startup" | "investor";

function pickActiveByTimestamp<T extends Record<string, unknown>>(rows: T[]): T | null {
  if (!rows.length) return null;

  const keys = ["updated_at", "updatedAt", "created_at", "createdAt"];
  let best = rows[0];
  let bestTs = -Infinity;

  for (const r of rows) {
    let ts = -Infinity;
    for (const k of keys) {
      const v = r[k];
      if (typeof v === "string" && v) {
        const t = Date.parse(v);
        if (Number.isFinite(t)) ts = Math.max(ts, t);
      }
    }
    if (ts > bestTs) {
      best = r;
      bestTs = ts;
    }
  }

  // If no timestamps exist, fall back to last row (best-effort "newest").
  if (bestTs === -Infinity) return rows[rows.length - 1];
  return best;
}

export default function MatchesPage() {
  const { user, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#4F46E5]" size={32} />
      </div>
    );
  }

  return <MatchesContent />;
}

function MatchesContent() {
  const { limits } = usePlan();
  // Paywall temporarily disabled for testing.
  const [hasPaid] = React.useState(true);
  const [checkedPayment] = React.useState(true);

  const [startups, setStartups] = React.useState<StartupProfile[]>([]);
  const [investors, setInvestors] = React.useState<InvestorProfile[]>([]);
  const [activeStartup, setActiveStartup] = React.useState<StartupProfile | null>(null);
  const [activeInvestor, setActiveInvestor] = React.useState<InvestorProfile | null>(null);
  const [mode, setMode] = React.useState<Mode>("startup");
  const [selectedMatch, setSelectedMatch] = React.useState<MatchResult | null>(null);

  const [loading, setLoading] = React.useState(true);
  const [dataVersion, setDataVersion] = React.useState(0);
  const [matches, setMatches] = React.useState<MatchResult[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const aiScoreCache = React.useRef<Record<string, {score: number, explanation: string[]}>>({});

  // (Paywall temporarily disabled) Skip paywall status check.

  React.useEffect(() => {
    if (!hasPaid) return;
    const fetchAndScore = async () => {
      try {
        setLoading(true);
        setError(null);

        const [startupRes, investorRes] = await Promise.all([
          supabase.from("Startups").select("*"),
          supabase.from("investors").select("*")
        ]);

        const startupRows = (startupRes.data ?? []) as Record<string, unknown>[];
        const investorRows = (investorRes.data ?? []) as Record<string, unknown>[];

        const mappedStartups = startupRows.map((row, idx) =>
          startupRowToProfile(row, `stp_${idx}_${String(row.startup_name ?? "unknown")}`)
        );
        const mappedInvestors = investorRows.map((row, idx) =>
          investorRowToProfile(row, `inv_${idx}_${String(row.fund_name ?? "unknown")}`)
        );

        const activeStartupRow = pickActiveByTimestamp(startupRows);
        const activeInvestorRow = pickActiveByTimestamp(investorRows);

        const activeStartupMapped = activeStartupRow
          ? startupRowToProfile(activeStartupRow, `stp_active_${String(activeStartupRow.startup_name ?? "active")}`)
          : null;
        const activeInvestorMapped = activeInvestorRow
          ? investorRowToProfile(activeInvestorRow, `inv_active_${String(activeInvestorRow.fund_name ?? "active")}`)
          : null;

        setStartups(mappedStartups);
        setInvestors(mappedInvestors);
        setActiveStartup(activeStartupMapped);
        setActiveInvestor(activeInvestorMapped);

        if (!activeStartupMapped && activeInvestorMapped) setMode("investor");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to fetch from Supabase.");
      } finally {
        setLoading(false);
        setDataVersion((v) => v + 1);
      }
    };

    fetchAndScore();
  }, [hasPaid]);

  React.useEffect(() => {
    if (!hasPaid) return;
    if (loading || error) return;
    let isActive = true;

    const computeMatches = async () => {
      const topN = 4;
      let initialScored: MatchResult[] = [];

      if (mode === "startup" && activeStartup) {
        initialScored = investors.map((inv) => {
          const id = `${activeStartup.id}__${inv.id}`;
          const ruleRes = scoreStartupInvestorPair(activeStartup, inv);
          return {
            id,
            score: ruleRes.score,
            startup: activeStartup,
            investor: inv,
            explanation: [ruleRes.reasons[0]?.detail || "Strong sector/stage alignment"],
            reasons: ruleRes.reasons
          };
        }).sort((a, b) => b.score - a.score).slice(0, topN);
      } else if (mode === "investor" && activeInvestor) {
        initialScored = startups.map((stp) => {
          const id = `${stp.id}__${activeInvestor.id}`;
          const ruleRes = scoreStartupInvestorPair(stp, activeInvestor);
          return {
            id,
            score: ruleRes.score,
            startup: stp,
            investor: activeInvestor,
            explanation: [ruleRes.reasons[0]?.detail || "Strong sector/stage alignment"],
            reasons: ruleRes.reasons
          };
        }).sort((a, b) => b.score - a.score).slice(0, topN);
      }

      if (initialScored.length === 0) {
        if (isActive) setMatches([]);
        return;
      }

      // Show rule-scored matches immediately
      if (isActive) setMatches(initialScored);
      
      let updated = false;
      const aiBudget = Math.max(0, Math.floor(limits.aiMatches));
      const updatedScored = await Promise.all(
        initialScored.map(async (m, index) => {
          if (index >= aiBudget) return m;
          if (aiScoreCache.current[m.id]) {
            return { ...m, ...aiScoreCache.current[m.id] };
          }
          try {
            const aiRes = await calculateMatchScore(m.startup, m.investor);
            const entry = { score: aiRes.score, explanation: [aiRes.reason] };
            aiScoreCache.current[m.id] = entry;
            updated = true;
            return { ...m, ...entry };
          } catch (e) {
            return m; // fallback to rule score
          }
        })
      );
      
      if (isActive && updated) {
        updatedScored.sort((a, b) => b.score - a.score);
        setMatches(updatedScored);
      }
    };
    
    computeMatches();
    
    return () => {
      isActive = false;
    };
  }, [mode, dataVersion, loading, error, activeStartup, activeInvestor, startups, investors, limits.aiMatches]);

  if (!checkedPayment) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto flex min-h-screen max-w-2xl items-center justify-center px-4 py-10">
          <div className="text-sm text-mutedForeground">Loading…</div>
        </div>
      </div>
    );
  }

  // Paywall temporarily disabled.

  return (
    <div style={{ padding: "28px", minHeight: "100vh", background: "var(--vm-surface)" }}>
      {limits.aiMatches === 0 ? (
        <div style={{ marginBottom: "16px" }}>
          <UpgradePrompt feature="AI Matching" />
        </div>
      ) : null}

      {loading ? (
        <Card>
          <CardHeader>
            <CardTitle>Loading matches</CardTitle>
            <CardDescription>Fetching profiles from Supabase.</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {!loading && error ? (
        <Card>
          <CardHeader>
            <CardTitle>Could not load profiles</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {!loading && !activeStartup && !activeInvestor ? (
        <Card>
          <CardHeader>
            <CardTitle>Create a profile to see matches</CardTitle>
            <CardDescription>
              Create at least one startup and/or investor profile in Supabase.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Link className={buttonClasses({ variant: "primary" })} href="/startup">
              Create startup profile
            </Link>
            <Link className={buttonClasses({ variant: "secondary" })} href="/investor-signup">
              Create investor profile
            </Link>
          </CardContent>
        </Card>
      ) : null}

      {!loading && (activeStartup || activeInvestor) ? (
        <Card>
          <CardHeader>
            <CardTitle>Active context</CardTitle>
            <CardDescription>
              The selected active profile, scored against all profiles in Supabase.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {activeStartup ? (
              <>
                <Badge>Startup: {activeStartup.companyName}</Badge>
                <Badge>{activeStartup.sector}</Badge>
                <Badge>{activeStartup.stage}</Badge>
              </>
            ) : null}
            {activeInvestor ? (
              <>
                <Badge>Investor: {activeInvestor.firmName}</Badge>
                {activeInvestor.sectorFocus.slice(0, 2).map((s) => (
                  <Badge key={s}>{s}</Badge>
                ))}
              </>
            ) : null}
            <Badge className="bg-background">
              Supabase profiles: {startups.length} startups, {investors.length} investors
            </Badge>
          </CardContent>
        </Card>
      ) : null}

      {!loading && mode === "startup" && !activeStartup ? (
        <Card>
          <CardHeader>
            <CardTitle>No startup profile found</CardTitle>
            <CardDescription>
              Create a startup profile to generate investor matches.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link className={buttonClasses({ variant: "primary" })} href="/startup">
              Create startup profile
            </Link>
          </CardContent>
        </Card>
      ) : null}

      {!loading && mode === "investor" && !activeInvestor ? (
        <Card>
          <CardHeader>
            <CardTitle>No investor profile found</CardTitle>
            <CardDescription>
              Create an investor profile to generate startup matches.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link className={buttonClasses({ variant: "primary" })} href="/investor-signup">
              Create investor profile
            </Link>
          </CardContent>
        </Card>
      ) : null}

      {/* MATCH CARDS GRID */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "24px", marginTop: "24px" }}>
        {matches.map((match) => {
          const isStartupMode = mode === "startup";
          const name = isStartupMode ? match.investor.firmName : match.startup.companyName;
          const subtitle = isStartupMode ? match.investor.regions.join(", ") : match.startup.regions.join(", ");
          const avatarText = name.substring(0, 2).toUpperCase();

          const formatMoney = (val: number) => `$${(val / 1000000).toFixed(1)}M`;

          const tags = {
            sector: isStartupMode ? match.investor.sectorFocus[0] : match.startup.sector,
            stage: isStartupMode ? match.investor.stageFocus[0] : match.startup.stage,
            checkSize: isStartupMode ? `${formatMoney(match.investor.checkSizeUsdMin)}+` : undefined,
          };
          const strengths = match.explanation?.length > 0 ? match.explanation.slice(0, 3) : ["Strong mutual fit based on profile data"];
          
          return (
            <MatchCard
              key={match.id}
              name={name}
              subtitle={subtitle || "Unknown location"}
              avatarText={avatarText}
              score={match.score}
              tags={tags}
              strengths={strengths.filter((s: string) => s.trim().length > 0)}
              onContactClick={() => setSelectedMatch(match)}
            />
          );
        })}
      </div>

      <ContactModal 
        isOpen={!!selectedMatch} 
        onClose={() => setSelectedMatch(null)} 
        match={selectedMatch} 
        mode={mode} 
      />
    </div>
  );
}

