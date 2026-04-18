"use client";

import Link from "next/link";
import * as React from "react";
import { Linkedin, Sparkles, Users, TrendingUp, ArrowRight, LogOut, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";
import { fetchInvestorOutreach } from "@/lib/outreach";
import { RoundTracker } from "@/components/crm/RoundTracker";
import { CRMBoard } from "@/components/crm/CRMBoard";
import { PitchDeckAnalyzer } from "@/components/pitch/PitchDeckAnalyzer";
import { useRequireRole } from "@/hooks/useAuth";
import { useAuth } from "@/components/auth/auth-provider";
import { usePlan } from "@/hooks/usePlan";
import UpgradePrompt from "@/components/paywall/UpgradePrompt";
import type { Founder } from "@/types/founder";
import type { InvestorOutreach } from "@/types/outreach";

type StartupRow = {
  id: string;
  startup_name?: string;
  founder_name?: string;
  pitch_deck_url?: string;
  industry?: string;
  stage?: string;
  funding_required?: number;
  geography?: string;
  country?: string;
  city?: string;
  company_type?: string;
  monthly_revenue?: number;
  pre_money_valuation?: number;
  linkedin_url?: string;
  incorporation_month?: number;
  incorporation_year?: number;
  traction_stage?: string;
  moat?: string;
  prior_exit?: boolean;
  revenue_growth_mom?: number;
  [key: string]: unknown;
};

type InvestorRow = {
  id: string;
  fund_name?: string;
  focus_industry?: string;
  stage?: string;
  geography?: string;
  ticket_min?: number;
  ticket_max?: number;
  [key: string]: unknown;
};

type ScoredInvestor = InvestorRow & {
  score: number;
  reasons: string[];
};

type ScoredStartup = {
  startup: StartupRow;
  matches: ScoredInvestor[];
};

function getFounderInitials(name: string, founderOrder: number) {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  return initials || `F${founderOrder}`;
}

function formatFounderEducation(founder: Founder) {
  if (founder.degree && founder.university) {
    return `${founder.degree} @ ${founder.university}`;
  }
  return founder.degree || founder.university || "Education details not added";
}

function formatInr(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return "TBD";
  return `₹ ${value.toLocaleString("en-IN")}`;
}

function getTractionBadgeStyle(stage?: string) {
  switch (stage) {
    case "Idea":
      return { background: "#F1F5F9", color: "#64748B" };
    case "Proof of Concept":
      return { background: "#FFFBEB", color: "#D97706" };
    case "Beta Launched":
      return { background: "#EEF2FF", color: "#4F46E5" };
    case "Early Traction":
      return { background: "#EFF6FF", color: "#2563EB" };
    case "Steady Revenues":
      return { background: "#ECFDF5", color: "#059669" };
    case "Growth":
      return { background: "#F0FDF4", color: "#16A34A" };
    default:
      return { background: "#F8FAFC", color: "var(--vm-slate-3)" };
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(n, max));
}

function normalize(s: string | undefined) {
  return (s ?? "").toLowerCase().trim();
}

function rangeOverlapOrProximityScore({
  askMin,
  askMax,
  checkMin,
  checkMax
}: {
  askMin: number;
  askMax: number;
  checkMin: number;
  checkMax: number;
}) {
  const lo = Math.max(askMin, checkMin);
  const hi = Math.min(askMax, checkMax);
  if (hi > lo) {
    return { score: 25, overlap: true };
  }
  const askMid = (askMin + askMax) / 2;
  const checkMid = (checkMin + checkMax) / 2;
  if (askMid <= 0 || checkMid <= 0) return { score: 0, overlap: false };
  const ratio = Math.min(askMid, checkMid) / Math.max(askMid, checkMid);
  if (ratio >= 0.8) return { score: 10, overlap: false };
  if (ratio >= 0.6) return { score: 5, overlap: false };
  return { score: 0, overlap: false };
}

function calculateAIInvestorScore(startup: StartupRow, investor: InvestorRow): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;
  const startupIndustry = normalize(startup.industry);
  const investorFocus = normalize(investor.focus_industry);

  if (startupIndustry && investorFocus) {
    if (
      investorFocus === startupIndustry ||
      investorFocus.includes(startupIndustry) ||
      startupIndustry.includes(investorFocus)
    ) {
      score += 45;
      reasons.push(`Industry fit: ${startup.industry} ↔ ${investor.focus_industry}.`);
    } else {
      const a = new Set(startupIndustry.split(/[\s/,-]+/g).filter((x) => x.length >= 3));
      const b = new Set(investorFocus.split(/[\s/,-]+/g).filter((x) => x.length >= 3));
      const overlap = [...a].filter((x) => b.has(x)).length;
      if (overlap > 0) {
        const add = clamp(overlap * 10, 10, 25);
        score += add;
        reasons.push(`Industry partial overlap (${overlap} token${overlap === 1 ? "" : "s"}).`);
      } else {
        reasons.push(`Industry mismatch (startup: ${startup.industry}, investor: ${investor.focus_industry}).`);
      }
    }
  }

  const stStage = normalize(startup.stage);
  const invStage = normalize(investor.stage);
  if (stStage && invStage) {
    if (invStage === stStage || invStage.includes(stStage)) {
      score += 25;
      reasons.push(`Stage match: ${startup.stage}.`);
    } else if (invStage.includes("any") || stStage.includes("any")) {
      score += 10;
      reasons.push("Stage match: one side is flexible.");
    } else {
      reasons.push(`Stage mismatch (startup: ${startup.stage}, investor: ${investor.stage}).`);
    }
  }

  const funding = typeof startup.funding_required === "number" ? startup.funding_required : undefined;
  const ticketMin = typeof investor.ticket_min === "number" ? investor.ticket_min : undefined;
  const ticketMax = typeof investor.ticket_max === "number" ? investor.ticket_max : undefined;

  if (funding != null && ticketMin != null && ticketMax != null) {
    const askMin = funding * 0.85;
    const askMax = funding * 1.15;
    const { score: add, overlap } = rangeOverlapOrProximityScore({
      askMin,
      askMax,
      checkMin: ticketMin,
      checkMax: ticketMax
    });
    if (add > 0) {
      score += add;
      reasons.push(`Funding fit: ${overlap ? "overlap" : "proximity"} between ask and check range.`);
    } else {
      reasons.push("Funding fit: no meaningful overlap with check size.");
    }
  }

  const final = clamp(score, 0, 100);
  return {
    score: final,
    reasons: reasons.length ? reasons.slice(0, 3) : ["Scoring computed using available profile signals."]
  };
}

async function safeFetchTableRows<T>(tableLower: string, tableUpper?: string): Promise<T[]> {
  const res1 = await supabase.from(tableLower).select("*");
  if (!res1.error) return (res1.data as T[]) ?? [];
  const res2 = await supabase.from(tableUpper ?? tableLower).select("*");
  return (res2.data as T[]) ?? [];
}

async function safeFetchFirstRow<T>(tableLower: string, tableUpper?: string): Promise<T | null> {
  const res1 = await supabase.from(tableLower).select("*").limit(1).maybeSingle();
  if (!res1.error) return (res1.data as T) ?? null;
  const res2 = await supabase.from(tableUpper ?? tableLower).select("*").limit(1).maybeSingle();
  return (res2.data as T) ?? null;
}

export default function DashboardPage() {
  const { user, isLoading } = useRequireRole(["startup"]);
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#4F46E5]" size={32} />
      </div>
    );
  }

  return <DashboardContent user={user!} />;
}

function DashboardContent({ user }: { user: { id: string; email: string; created_at: string } }) {
  const router = useRouter();
  const { signOut } = useAuth();
  const { limits } = usePlan();
  const [hasPaid] = React.useState(true);
  const [checkedPayment] = React.useState(true);
  const [startup, setStartup] = React.useState<StartupRow | null>(null);
  const [matches, setMatches] = React.useState<ScoredStartup[]>([]);
  const [founders, setFounders] = React.useState<Founder[]>([]);
  const [outreachData, setOutreachData] = React.useState<InvestorOutreach[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  const refreshOutreach = React.useCallback(async () => {
    if (startup?.id) {
      const data = await fetchInvestorOutreach(startup.id);
      setOutreachData(data);
    }
  }, [startup?.id]);

  React.useEffect(() => {
    if (!hasPaid) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [startupFirstRes, startupsRes, investorsRes] = await Promise.all([
          safeFetchFirstRow<StartupRow>("Startups"),
          safeFetchTableRows<StartupRow>("Startups"),
          safeFetchTableRows<InvestorRow>("investors")
        ]);
        setStartup(startupFirstRes);
        const sessionToken = typeof window !== "undefined" ? window.localStorage.getItem("vm_session_token") : null;
        if (startupFirstRes?.id || sessionToken) {
          let foundersQuery = supabase.from("founders").select("*").order("founder_order");
          if (startupFirstRes?.id) {
            foundersQuery = foundersQuery.eq("startup_id", startupFirstRes.id);
          } else if (sessionToken) {
            foundersQuery = foundersQuery.eq("session_token", sessionToken);
          }
          const { data: founderRows, error: foundersError } = await foundersQuery;
          if (foundersError) {
            console.error("FOUNDERS FETCH ERROR:", foundersError);
            setFounders([]);
          } else {
            setFounders((founderRows as Founder[] | null) ?? []);
          }
          if (startupFirstRes?.id) {
            const outreach = await fetchInvestorOutreach(startupFirstRes.id);
            setOutreachData(outreach);
          }
        } else {
          setFounders([]);
        }
        const scored = (startupsRes ?? []).map((stp) => {
          const ranked = (investorsRes ?? [])
            .map((inv) => {
              const { score, reasons } = calculateAIInvestorScore(stp, inv);
              return { ...inv, score, reasons } satisfies ScoredInvestor;
            })
            .sort((a, b) => b.score - a.score);
          return {
            startup: stp,
            matches: ranked.slice(0, 5)
          } satisfies ScoredStartup;
        });
        setMatches(scored);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load from Supabase.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [hasPaid]);

  if (!checkedPayment) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div />

          <div className="flex items-center gap-4">
            <span className="text-sm text-[#64748B]">
              {user?.email}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#64748B] hover:text-rose-600 transition"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
            Good morning, {startup?.founder_name?.split(" ")[0] || "Founder"}
          </h1>
          <p className="text-gray-500 mt-2">
            Manage your fundraising pipeline and track investor conversations.
          </p>
        </div>
        {loading ? (
          <div className="text-gray-500">Loading profiles...</div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <Sparkles size={20} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Investor Matches</p>
                    <p className="text-2xl font-semibold text-gray-900">{matches.length > 0 ? (matches[0]?.matches.length || 0).toString() : "0"}</p>
                  </div>
                </div>
                <p className="text-xs text-emerald-600 mt-2">Updated today</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <TrendingUp size={20} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Committed</p>
                    <p className="text-2xl font-semibold text-gray-900">{outreachData.filter(o => o.outreach_stage === "committed").length}</p>
                  </div>
                </div>
                <p className="text-xs text-emerald-600 mt-2">Investors committed</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                    <Users size={20} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">In Progress</p>
                    <p className="text-2xl font-semibold text-gray-900">{outreachData.filter(o => o.outreach_stage === "in_progress").length}</p>
                  </div>
                </div>
                <p className="text-xs text-amber-600 mt-2">Active conversations</p>
              </div>
            </div>
            <RoundTracker outreachData={outreachData} />
            <CRMBoard outreachData={outreachData} onOutreachUpdated={refreshOutreach} />
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Founding Team</h2>
                <Link href="/founder-profile" className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Edit Team<ArrowRight size={16} /></Link>
              </div>
              {founders.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {founders.map((founder) => (
                    <div key={founder.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">{getFounderInitials(founder.full_name, founder.founder_order)}</div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{founder.full_name}</h3>
                          <p className="text-sm text-gray-500 mt-0.5">{formatFounderEducation(founder)}</p>
                          {founder.linkedin_url ? <a href={founder.linkedin_url} rel="noreferrer" target="_blank" className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 mt-2"><Linkedin size={14} />LinkedIn</a> : null}
                        </div>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">{founder.gender}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
                  <p className="text-gray-500">No founders have been added yet.</p>
                  <Link href="/founder-profile" className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-700">Add founders<ArrowRight size={16} /></Link>
                </div>
              )}
            </div>
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Configuration</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Startup Profile</h3>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">Active</span>
                  </div>
                  {startup ? (
                    <div className="space-y-3">
                      <div className="flex justify-between"><span className="text-sm text-gray-500">Name</span><span className="text-sm font-medium text-gray-900">{startup.startup_name || "TBD"}</span></div>
                      <div className="flex justify-between"><span className="text-sm text-gray-500">Industry</span><span className="text-sm font-medium text-gray-900">{startup.industry || "TBD"}</span></div>
                      <div className="flex justify-between"><span className="text-sm text-gray-500">Stage</span><span className="text-sm font-medium text-gray-900">{startup.stage || "TBD"}</span></div>
                      <div className="flex justify-between items-center"><span className="text-sm text-gray-500">Traction</span><span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={getTractionBadgeStyle(startup.traction_stage)}>{startup.traction_stage || "TBD"}</span></div>
                      <div className="flex justify-between"><span className="text-sm text-gray-500">Monthly Revenue</span><span className="text-sm font-medium text-gray-900">{formatInr(startup.monthly_revenue)}</span></div>
                      <div className="flex justify-between"><span className="text-sm text-gray-500">Location</span><span className="text-sm font-medium text-gray-900">{startup.city && startup.country ? `${startup.city}, ${startup.country}` : startup.city || startup.country || "TBD"}</span></div>
                    </div>
                  ) : <p className="text-sm text-gray-500">No startup profile found.</p>}
                  <Link href="/startup" className="inline-flex items-center justify-center w-full mt-4 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">{startup ? "Edit Profile" : "Create Profile"}</Link>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <Link href="/dashboard/matches" className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center"><Sparkles size={18} className="text-indigo-600" /></div>
                        <div><p className="text-sm font-medium text-gray-900">View Matches</p><p className="text-xs text-gray-500">Find investors for your startup</p></div>
                      </div>
                      <ArrowRight size={18} className="text-gray-400" />
                    </Link>
                    <Link href="/pitch-builder" className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center"><TrendingUp size={18} className="text-emerald-600" /></div>
                        <div><p className="text-sm font-medium text-gray-900">Pitch Builder</p><p className="text-xs text-gray-500">Create and analyze your pitch deck</p></div>
                      </div>
                      <ArrowRight size={18} className="text-gray-400" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-8">
              {limits.pitchAnalyzer ? (
                <PitchDeckAnalyzer />
              ) : (
                <UpgradePrompt feature="AI Pitch Analyzer" />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
