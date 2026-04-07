"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Globe, Loader2, Send, SendHorizontal } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { investorRowToProfile, startupRowToProfile } from "@/lib/supabase-mapping";
import type { InvestorProfile, MatchResult, StartupProfile } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { ContactModal } from "@/components/matches/ContactModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function parseCsv(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
  }
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function toText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function pickActiveByTimestamp<T extends Record<string, unknown>>(rows: T[]): T | null {
  if (!rows.length) return null;
  const keys = ["updated_at", "updatedAt", "created_at", "createdAt"];
  let best = rows[0];
  let bestTs = -Infinity;
  for (const row of rows) {
    let ts = -Infinity;
    for (const key of keys) {
      const value = row[key];
      if (typeof value === "string" && value) {
        const parsed = Date.parse(value);
        if (Number.isFinite(parsed)) ts = Math.max(ts, parsed);
      }
    }
    if (ts > bestTs) {
      best = row;
      bestTs = ts;
    }
  }
  return best;
}

function toCurrency(value: number): string {
  if (value <= 0) return "$0";
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${Math.round(value)}`;
}

type ValueAddItem = {
  title: string;
  description?: string;
};

function parseValueAdd(value: string): ValueAddItem[] {
  return value
    .split(/[\n,;]+/)
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => {
      const colonIndex = segment.indexOf(":");
      if (colonIndex > 0) {
        const title = segment.slice(0, colonIndex).trim();
        const description = segment.slice(colonIndex + 1).trim();
        return { title, description: description || undefined };
      }

      const dashIndex = segment.indexOf(" - ");
      if (dashIndex > 0) {
        const title = segment.slice(0, dashIndex).trim();
        const description = segment.slice(dashIndex + 3).trim();
        return { title, description: description || undefined };
      }

      return { title: segment };
    });
}

export default function InvestorDetailsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const params = useParams<{ id: string }>();
  const investorId = typeof params?.id === "string" ? params.id : "";

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [investorProfile, setInvestorProfile] = React.useState<InvestorProfile | null>(null);
  const [investorRaw, setInvestorRaw] = React.useState<Record<string, unknown> | null>(null);
  const [activeStartup, setActiveStartup] = React.useState<StartupProfile | null>(null);
  const [selectedMatch, setSelectedMatch] = React.useState<MatchResult | null>(null);
  const [defaultMethod, setDefaultMethod] = React.useState<"email" | "pitchDeck">("pitchDeck");

  React.useEffect(() => {
    if (!investorId) return;

    let isMounted = true;
    async function fetchInvestor() {
      try {
        setLoading(true);

        const investorQuery = supabase
          .from("investors")
          .select("*")
          .eq("id", investorId)
          .single();

        const startupQuery = user?.id
          ? supabase.from("Startups").select("*").eq("user_id", user.id)
          : Promise.resolve({ data: [], error: null } as { data: never[]; error: null });

        const [investorRes, startupRes] = await Promise.all([investorQuery, startupQuery]);

        if (investorRes.error) throw new Error(investorRes.error.message);
        if (!investorRes.data) throw new Error("Investor not found.");

        const investorRecord = investorRes.data as Record<string, unknown>;
        const investorMapped = investorRowToProfile(investorRecord, `inv_${investorId}`);

        const startupRows = (startupRes.data ?? []) as Record<string, unknown>[];
        const activeStartupRow = pickActiveByTimestamp(startupRows);
        const startupMapped = activeStartupRow
          ? startupRowToProfile(activeStartupRow, `stp_${String(activeStartupRow.id ?? "active")}`)
          : null;

        if (isMounted) {
          setInvestorRaw(investorRecord);
          setInvestorProfile(investorMapped);
          setActiveStartup(startupMapped);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load investor.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchInvestor();
    return () => {
      isMounted = false;
    };
  }, [investorId, user?.id]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--vm-surface)]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--vm-indigo)]" />
      </div>
    );
  }

  if (error || !investorProfile || !investorRaw) {
    return (
      <div className="min-h-screen bg-[var(--vm-surface)] p-6">
        <div className="mx-auto max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>Unable to load investor</CardTitle>
              <CardDescription>{error ?? "This investor record is unavailable."}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/investor" className="text-sm font-medium text-[var(--vm-indigo)] hover:underline">
                Back to Investor View
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const fundName = toText(investorRaw.fund_name) || investorProfile.firmName;
  const investorType = toText(investorRaw.investor_type) || investorProfile.investorType;
  const stages = parseCsv(investorRaw.stage).length ? parseCsv(investorRaw.stage) : investorProfile.stageFocus;
  const geography = parseCsv(investorRaw.geography).length ? parseCsv(investorRaw.geography) : investorProfile.regions;
  const focusIndustry =
    parseCsv(investorRaw.focus_industry).length
      ? parseCsv(investorRaw.focus_industry)
      : parseCsv(investorRaw.sectors).length
        ? parseCsv(investorRaw.sectors)
        : investorProfile.sectorFocus;
  const thesis = toText(investorRaw.thesis) || investorProfile.thesisSummary;
  const valueAddRaw = toText(investorRaw.value_add) || toText(investorRaw.value_add_summary) || investorProfile.valueAddSummary || "";
  const valueAddItems = parseValueAdd(valueAddRaw);
  const website = toText(investorRaw.website) || investorProfile.website || "";

  const emailRaw = toText(investorRaw.contact_email) || investorProfile.contactEmail;
  const email = emailRaw === "unknown@example.com" ? "" : emailRaw;

  const rawMin = toNumber(investorRaw.ticket_min);
  const rawMax = toNumber(investorRaw.ticket_max);
  const ticketMin = Math.min(rawMin || investorProfile.checkSizeUsdMin, rawMax || investorProfile.checkSizeUsdMax);
  const ticketMax = Math.max(rawMin || investorProfile.checkSizeUsdMin, rawMax || investorProfile.checkSizeUsdMax);
  const ticketRange = `${toCurrency(ticketMin)} - ${toCurrency(ticketMax)}`;

  const mailtoHref = email
    ? `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent("Pitch Deck")}&body=${encodeURIComponent(`Hi ${fundName},`)}` 
    : "#";

  const focusBlocks = [
    { label: "Focus Industries", values: focusIndustry },
    { label: "Stage", values: stages },
    { label: "Geography", values: geography },
    { label: "Investor Type", values: investorType ? [investorType] : [] }
  ].filter((block) => block.values.length > 0);

  const openContactModal = (method: "email" | "pitchDeck") => {
    if (!activeStartup) {
      alert("You need a startup profile to contact investors. Please create one on the dashboard.");
      return;
    }

    const match: MatchResult = {
      id: `${activeStartup.id}__${investorProfile.id}`,
      score: 100,
      startup: activeStartup,
      investor: investorProfile,
      explanation: [],
      reasons: []
    };
    setDefaultMethod(method);
    setSelectedMatch(match);
  };

  return (
    <div className="min-h-screen bg-[var(--vm-surface)] pb-8">
      <div className="border-b border-[var(--vm-slate-5)] bg-[var(--vm-emerald-light)]/60 px-6 py-8 md:px-8 md:py-10">
        <div className="mx-auto max-w-6xl">
          <Link href="/investor" className="mb-3 inline-block text-xs font-medium text-[var(--vm-indigo)] hover:underline">
            Back to Investor View
          </Link>
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold text-[var(--vm-slate)]">{fundName}</h1>
            <div className="flex flex-wrap items-center gap-2">
              {investorType && <Badge className="border-[var(--vm-emerald)] bg-white text-[var(--vm-emerald)]">{investorType}</Badge>}
              {stages.map((item) => (
                <Badge key={item} className="border-[var(--vm-indigo)] bg-white text-[var(--vm-indigo)]">
                  {item}
                </Badge>
              ))}
              {geography.map((item) => (
                <Badge key={item} className="border-[var(--vm-slate-5)] bg-white text-[var(--vm-slate-2)]">
                  {item}
                </Badge>
              ))}
            </div>
            {website && (
              <a
                href={website.startsWith("http") ? website : `https://${website}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-[var(--vm-emerald)] hover:underline"
              >
                <Globe className="h-4 w-4" />
                {website}
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 pt-6 md:px-8 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <div className="space-y-6">
          {thesis && (
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>Investment Thesis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-7 text-[var(--vm-slate-2)]">{thesis}</p>
              </CardContent>
            </Card>
          )}

          {valueAddItems.length > 0 && (
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>Value Add</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {valueAddItems.map((item, index) => (
                    <div key={`${item.title}-${index}`} className="rounded-lg border border-[var(--vm-slate-6)] bg-[var(--vm-surface)] p-3">
                      <p className="text-sm font-semibold text-[var(--vm-slate)]">{item.title}</p>
                      {item.description && <p className="mt-1 text-sm text-[var(--vm-slate-3)]">{item.description}</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {focusBlocks.length > 0 && (
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>Investment Focus</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {focusBlocks.map((block) => (
                  <div key={block.label}>
                    <p className="mb-2 text-sm font-medium text-[var(--vm-slate-3)]">{block.label}</p>
                    <div className="flex flex-wrap gap-2">
                      {block.values.map((value) => (
                        <Badge key={`${block.label}-${value}`} className="border-[var(--vm-slate-5)] bg-white text-[var(--vm-slate-2)]">
                          {value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <Card className="overflow-hidden border-none bg-[var(--vm-emerald)] text-white shadow-lg">
            <CardContent className="space-y-5 p-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-100">Target Range</p>
                <p className="mt-2 text-3xl font-semibold">{ticketRange}</p>
              </div>

              <div className="space-y-3 border-t border-white/25 pt-4 text-sm">
                {email && (
                  <div>
                    <p className="text-emerald-100">Email</p>
                    <a href={`mailto:${email}`} className="font-medium text-white hover:underline">
                      {email}
                    </a>
                  </div>
                )}
                {website && (
                  <div>
                    <p className="text-emerald-100">Website</p>
                    <a
                      href={website.startsWith("http") ? website : `https://${website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-white hover:underline"
                    >
                      {website}
                    </a>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <a href={mailtoHref} className={email ? "" : "pointer-events-none"} aria-disabled={!email}>
                  <Button
                    className="w-full bg-white text-[var(--vm-slate)] hover:bg-white/90"
                    disabled={!email}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Send Pitch
                  </Button>
                </a>
                <Button
                  className="w-full border border-white/40 bg-transparent text-white hover:bg-white/10"
                  disabled={!email}
                  onClick={() => openContactModal("pitchDeck")}
                >
                  <SendHorizontal className="mr-2 h-4 w-4" />
                  Send Pitch Deck
                </Button>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      {selectedMatch && (
        <ContactModal
          isOpen={!!selectedMatch}
          onClose={() => setSelectedMatch(null)}
          match={selectedMatch}
          mode="startup"
          defaultMethod={defaultMethod}
        />
      )}
    </div>
  );
}
