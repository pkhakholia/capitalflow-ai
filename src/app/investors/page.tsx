"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { investorRowToProfile, startupRowToProfile } from "@/lib/supabase-mapping";
import type { InvestorProfile, StartupProfile, MatchResult } from "@/lib/types";
import { InvestorCard } from "@/components/investors/InvestorCard";
import { ContactModal } from "@/components/matches/ContactModal";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { usePlan } from "@/hooks/usePlan";
import UpgradePrompt from "@/components/paywall/UpgradePrompt";

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
  if (bestTs === -Infinity) return rows[rows.length - 1];
  return best;
}

export default function InvestorsPage() {
  const { isLoading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#4F46E5]" size={32} />
      </div>
    );
  }

  return <InvestorsContent />;
}

function InvestorsContent() {
  const router = useRouter();
  const { limits } = usePlan();
  const [investors, setInvestors] = React.useState<InvestorProfile[]>([]);
  const [activeStartup, setActiveStartup] = React.useState<StartupProfile | null>(null);
  
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedSector, setSelectedSector] = React.useState("All");
  const [selectedStage, setSelectedStage] = React.useState("All");
  const [selectedRegion, setSelectedRegion] = React.useState("All");

  const [selectedMatch, setSelectedMatch] = React.useState<MatchResult | null>(null);
  const [defaultMethod, setDefaultMethod] = React.useState<"email" | "pitchDeck">("email");
  const [filterLimitError, setFilterLimitError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    const fetchProfiles = async () => {
      try {
        setLoading(true);
        const [invRes, stpRes] = await Promise.all([
          supabase.from("investors").select("*"),
          supabase.from("Startups").select("*")
        ]);

        if (invRes.error) throw new Error(invRes.error.message);
        
        const invRows = (invRes.data ?? []) as Record<string, unknown>[];
        const stpRows = (stpRes.data ?? []) as Record<string, unknown>[];

        const mappedInvestors = invRows.map((row, idx) => 
          investorRowToProfile(row, `inv_${idx}_${String(row.fund_name ?? "unknown")}`)
        );

        const activeStpRow = pickActiveByTimestamp(stpRows);
        const mappedActiveStp = activeStpRow ? startupRowToProfile(activeStpRow, `stp_active`) : null;

        if (isMounted) {
          setInvestors(mappedInvestors);
          setActiveStartup(mappedActiveStp);
          setError(null);
        }
      } catch (err) {
        if (isMounted) setError(err instanceof Error ? err.message : "Failed to fetch top investors.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchProfiles();
    return () => { isMounted = false; };
  }, []);

  // Filter Logic
  const filteredInvestors = investors.filter((inv) => {
    const matchesSearch = inv.firmName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = selectedSector === "All" || inv.sectorFocus.includes(selectedSector as any);
    const matchesStage = selectedStage === "All" || inv.stageFocus.includes(selectedStage as any) || inv.stageFocus.includes("Any");
    const matchesRegion = selectedRegion === "All" || inv.regions.includes(selectedRegion as any) || inv.regions.includes("Remote/Global");
    return matchesSearch && matchesSector && matchesStage && matchesRegion;
  });

  const uniqueSectors = Array.from(new Set(investors.flatMap(i => i.sectorFocus))).sort();
  const uniqueStages = Array.from(new Set(investors.flatMap(i => i.stageFocus))).sort();
  const uniqueRegions = Array.from(new Set(investors.flatMap(i => i.regions))).sort();

  const activeFiltersCount = [selectedSector, selectedStage, selectedRegion].filter((value) => value !== "All").length;
  const maxFilters = limits.filters;

  const applyFilterChange = (
    nextValues: { sector?: string; stage?: string; region?: string },
    commit: () => void
  ) => {
    const nextSector = nextValues.sector ?? selectedSector;
    const nextStage = nextValues.stage ?? selectedStage;
    const nextRegion = nextValues.region ?? selectedRegion;
    const nextCount = [nextSector, nextStage, nextRegion].filter((value) => value !== "All").length;

    if (Number.isFinite(maxFilters) && nextCount > maxFilters) {
      setFilterLimitError(`Your ${String(maxFilters)}-filter limit is reached on this plan.`);
      return;
    }

    setFilterLimitError(null);
    commit();
  };

  const handleContactClick = (investor: InvestorProfile, method: "email" | "pitchDeck") => {
    if (!activeStartup) {
      alert("You need a startup profile to contact investors. Please create one on the dashboard.");
      return;
    }
    const dummyMatch: MatchResult = {
      id: `${activeStartup.id}__${investor.id}`,
      score: 100,
      startup: activeStartup,
      investor: investor,
      explanation: [],
      reasons: []
    };
    setSelectedMatch(dummyMatch);
    setDefaultMethod(method);
  };

  return (
    <div style={{ padding: "28px", minHeight: "100vh", background: "var(--vm-surface)" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontFamily: "var(--font-fraunces), serif", fontSize: "26px", fontWeight: 600, color: "var(--vm-slate)", letterSpacing: "-0.5px", margin: "0 0 4px 0" }}>
          Investor Directory
        </h1>
        <p style={{ fontSize: "14px", color: "var(--vm-slate-3)", margin: 0 }}>
          Find and connect with top venture capital funds and angel investors.
        </p>
      </div>

      {loading ? (
        <Card><CardHeader><CardTitle>Loading directory</CardTitle><CardDescription>Fetching investors from Supabase.</CardDescription></CardHeader></Card>
      ) : error ? (
        <Card><CardHeader><CardTitle>Could not load directory</CardTitle><CardDescription>{error}</CardDescription></CardHeader></Card>
      ) : (
        <>
          <div className="bg-white p-4 rounded-lg border border-[var(--vm-slate-6)] shadow-sm mb-6 flex flex-col sm:flex-row gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--vm-slate-4)]" size={18} />
              <input 
                type="text" 
                placeholder="Search by fund name..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[var(--vm-slate-5)] rounded-md text-sm outline-none focus:border-[var(--vm-indigo)] transition-colors"
              />
            </div>
            
            {/* Filters */}
            <div className="flex gap-3 w-full sm:w-auto overflow-x-auto">
              <select 
                value={selectedSector} 
                onChange={(e) =>
                  applyFilterChange(
                    { sector: e.target.value },
                    () => setSelectedSector(e.target.value)
                  )
                }
                className="px-3 py-2 border border-[var(--vm-slate-5)] rounded-md text-sm bg-white text-[var(--vm-slate-2)] outline-none focus:border-[var(--vm-indigo)]"
              >
                <option value="All">All Sectors</option>
                {uniqueSectors.map(s => <option key={s} value={s}>{s}</option>)}
              </select>

              <select 
                value={selectedStage} 
                onChange={(e) =>
                  applyFilterChange(
                    { stage: e.target.value },
                    () => setSelectedStage(e.target.value)
                  )
                }
                className="px-3 py-2 border border-[var(--vm-slate-5)] rounded-md text-sm bg-white text-[var(--vm-slate-2)] outline-none focus:border-[var(--vm-indigo)]"
              >
                <option value="All">All Stages</option>
                {uniqueStages.map(s => <option key={s} value={s}>{s}</option>)}
              </select>

              <select 
                value={selectedRegion} 
                onChange={(e) =>
                  applyFilterChange(
                    { region: e.target.value },
                    () => setSelectedRegion(e.target.value)
                  )
                }
                className="px-3 py-2 border border-[var(--vm-slate-5)] rounded-md text-sm bg-white text-[var(--vm-slate-2)] outline-none focus:border-[var(--vm-indigo)]"
              >
                <option value="All">All Regions</option>
                {uniqueRegions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {Number.isFinite(maxFilters) ? (
            <div className="mb-4 text-xs text-[var(--vm-slate-3)]">
              Filters used: {activeFiltersCount}/{maxFilters}
            </div>
          ) : null}

          {filterLimitError ? (
            <div className="mb-4">
              <UpgradePrompt feature="Advanced Investor Search Filters" />
            </div>
          ) : null}

          <div className="flex bg-[var(--vm-surface)] text-xs font-semibold text-[var(--vm-slate-4)] uppercase tracking-wide px-6 py-4 border-b border-[var(--vm-slate-5)]">
            <div className="w-1/4 min-w-[200px]">Investor</div>
            <div className="w-1/6 min-w-[120px]">Geography</div>
            <div className="w-1/6 min-w-[120px]">Checks</div>
            <div className="w-[15%] min-w-[100px]">Stages</div>
            <div className="w-[15%] min-w-[120px]">Industries</div>
            <div className="w-[120px] ml-auto text-right">Actions</div>
          </div>
          <div className="flex flex-col border border-[var(--vm-slate-5)] bg-white rounded-lg shadow-sm overflow-hidden mb-12">
            {filteredInvestors.length > 0 ? (
              filteredInvestors.map(investor => (
                <InvestorCard 
                  key={investor.id} 
                  investor={investor} 
                  onContactClick={(method) => handleContactClick(investor, method)}
                  onViewClick={() => router.push(`/investors/${investor.id}`)}
                />
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-[var(--vm-slate-3)]">
                No investors found matching your filters.
              </div>
            )}
          </div>
        </>
      )}

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
