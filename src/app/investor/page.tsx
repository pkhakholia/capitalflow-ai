"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type InvestorDirectoryItem = {
  id: string;
  fund_name: string;
  investor_type: string;
  stage: string;
  geography: string;
};

function toText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export default function InvestorViewPickerPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [selectedInvestorId, setSelectedInvestorId] = React.useState("");
  const [investors, setInvestors] = React.useState<InvestorDirectoryItem[]>([]);

  React.useEffect(() => {
    let isMounted = true;

    async function fetchInvestors() {
      try {
        setLoading(true);
        const { data, error: queryError } = await supabase
          .from("investors")
          .select("id, fund_name, investor_type, stage, geography")
          .order("fund_name", { ascending: true });

        if (queryError) {
          throw new Error(queryError.message);
        }

        const rows = ((data ?? []) as Record<string, unknown>[]).map((row) => ({
          id: toText(row.id),
          fund_name: toText(row.fund_name) || "Unnamed Investor",
          investor_type: toText(row.investor_type),
          stage: toText(row.stage),
          geography: toText(row.geography)
        }));

        const validRows = rows.filter((row) => row.id);

        if (isMounted) {
          setInvestors(validRows);
          if (validRows.length > 0) {
            setSelectedInvestorId(validRows[0].id);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load investor directory.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchInvestors();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredInvestors = React.useMemo(() => {
    if (!search.trim()) return investors;
    const term = search.trim().toLowerCase();
    return investors.filter((investor) => {
      return (
        investor.fund_name.toLowerCase().includes(term) ||
        investor.investor_type.toLowerCase().includes(term) ||
        investor.stage.toLowerCase().includes(term) ||
        investor.geography.toLowerCase().includes(term)
      );
    });
  }, [investors, search]);

  return (
    <div className="min-h-screen bg-[var(--vm-surface)] p-6 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--vm-slate)]">Investor View</h1>
          <p className="mt-1 text-sm text-[var(--vm-slate-3)]">
            Select any investor from the directory to view complete details.
          </p>
        </div>

        {loading ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading investors
              </CardTitle>
              <CardDescription>Fetching investor directory from Supabase.</CardDescription>
            </CardHeader>
          </Card>
        ) : error ? (
          <Card>
            <CardHeader>
              <CardTitle>Could not load investors</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <>
            <Card>
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--vm-slate-4)]" />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search by fund, stage, geography, or investor type..."
                      className="w-full rounded-lg border border-[var(--vm-slate-5)] bg-white py-2 pl-9 pr-3 text-sm text-[var(--vm-slate-2)] outline-none transition-colors focus:border-[var(--vm-indigo)]"
                    />
                  </div>
                  <select
                    value={selectedInvestorId}
                    onChange={(event) => setSelectedInvestorId(event.target.value)}
                    className="w-full rounded-lg border border-[var(--vm-slate-5)] bg-white px-3 py-2 text-sm text-[var(--vm-slate-2)] outline-none transition-colors focus:border-[var(--vm-indigo)] sm:w-[320px]"
                  >
                    {filteredInvestors.map((investor) => (
                      <option key={investor.id} value={investor.id}>
                        {investor.fund_name}
                      </option>
                    ))}
                  </select>
                  <Button
                    onClick={() => selectedInvestorId && router.push(`/investors/${selectedInvestorId}`)}
                    disabled={!selectedInvestorId}
                    className="whitespace-nowrap"
                  >
                    View Investor
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Directory Snapshot</CardTitle>
                <CardDescription>{filteredInvestors.length} investor(s) available.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {filteredInvestors.slice(0, 8).map((investor) => (
                  <div
                    key={investor.id}
                    className="flex flex-col gap-2 rounded-lg border border-[var(--vm-slate-6)] bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[var(--vm-slate)]">{investor.fund_name}</p>
                      <p className="text-xs text-[var(--vm-slate-3)]">
                        {[investor.investor_type, investor.stage, investor.geography].filter(Boolean).join(" • ")}
                      </p>
                    </div>
                    <Link href={`/investors/${investor.id}`} className="text-sm font-medium text-[var(--vm-indigo)] hover:underline">
                      Open details
                    </Link>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
