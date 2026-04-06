"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  LogOut, 
  Building2, 
  TrendingUp, 
  DollarSign, 
  MapPin, 
  Briefcase,
  Search,
  Filter,
  ArrowUpRight,
  Star,
  Mail,
  Loader2
} from "lucide-react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useRequireRole } from "@/hooks/useAuth";
import { useAuth } from "@/components/auth/auth-provider";
import { supabase } from "@/lib/supabase";
import { Logo } from "@/components/ui/Logo";

interface Startup {
  id: string;
  startup_name?: string;
  industry?: string;
  stage?: string;
  funding_required?: number;
  monthly_revenue?: number;
  country?: string;
  city?: string;
  traction_stage?: string;
  matchScore?: number;
}

export default function InvestorDashboardPage() {
  const { user, isLoading } = useRequireRole(["investor"]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#4F46E5]" size={32} />
      </div>
    );
  }

  return <InvestorDashboardContent user={user!} />;
}

function InvestorDashboardContent({ user }: { user: { id: string; email: string; created_at: string } }) {
  const { signOut } = useAuth();
  const router = useRouter();
  const [startups, setStartups] = React.useState<Startup[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState("all");

  React.useEffect(() => {
    fetchStartups();
  }, []);

  const fetchStartups = async () => {
    try {
      const { data, error } = await supabase
        .from("Startups")
        .select("*")
        .limit(20);

      if (error) throw error;

      // Add mock match scores for demo
      const startupsWithScores = (data || []).map((startup) => ({
        ...startup,
        matchScore: Math.floor(Math.random() * 30) + 70 // Random score between 70-100
      }));

      setStartups(startupsWithScores);
    } catch (error) {
      console.error("Error fetching startups:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  const formatAmount = (value?: number) => {
    if (!value) return "N/A";
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(1)}Cr`;
    }
    return `₹${(value / 100000).toFixed(0)}L`;
  };

  const filteredStartups = startups.filter((startup) => {
    if (filter === "all") return true;
    if (filter === "high_match") return (startup.matchScore || 0) >= 85;
    if (filter === "seed") return startup.stage === "Seed";
    if (filter === "series_a") return startup.stage === "Series A";
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo href="/investor/dashboard" />

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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="font-[family-name:var(--font-fraunces)] text-[26px] font-semibold tracking-[-0.5px] text-slate-900 mb-2">
            Deal Flow
          </h1>
          <p className="text-[#64748B]">
            Discover and evaluate promising startups that match your investment criteria
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
            <div className="text-[12px] uppercase tracking-[0.5px] text-[#64748B] mb-2">
              Total Deals
            </div>
            <div className="font-[family-name:var(--font-fraunces)] text-[28px] font-light text-slate-900">
              {startups.length}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
            <div className="text-[12px] uppercase tracking-[0.5px] text-[#64748B] mb-2">
              High Match
            </div>
            <div className="font-[family-name:var(--font-fraunces)] text-[28px] font-light text-emerald-600">
              {startups.filter(s => (s.matchScore || 0) >= 85).length}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
            <div className="text-[12px] uppercase tracking-[0.5px] text-[#64748B] mb-2">
              Viewed
            </div>
            <div className="font-[family-name:var(--font-fraunces)] text-[28px] font-light text-slate-900">
              12
            </div>
          </div>
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
            <div className="text-[12px] uppercase tracking-[0.5px] text-[#64748B] mb-2">
              Interested
            </div>
            <div className="font-[family-name:var(--font-fraunces)] text-[28px] font-light text-indigo-600">
              3
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-2 text-sm text-[#64748B]">
            <Filter size={16} />
            Filter:
          </div>
          <div className="flex gap-2">
            {[
              { value: "all", label: "All Deals" },
              { value: "high_match", label: "High Match (85+)" },
              { value: "seed", label: "Seed Stage" },
              { value: "series_a", label: "Series A" }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filter === option.value
                    ? "bg-[#4F46E5] text-white"
                    : "bg-white border border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Startup Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-[#4F46E5]" size={32} />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {filteredStartups.map((startup) => (
              <div
                key={startup.id}
                className="bg-white rounded-xl border border-[#E2E8F0] p-5 hover:border-[#4F46E5] hover:shadow-md transition cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#6366F1] to-[#4338CA] flex items-center justify-center text-white font-semibold text-sm">
                      {startup.startup_name?.slice(0, 2).toUpperCase() || "ST"}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 text-[15px]">
                        {startup.startup_name || "Unnamed Startup"}
                      </h3>
                      <p className="text-[13px] text-[#64748B]">
                        {startup.industry || "Unknown Industry"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-full">
                    <Star size={12} className="text-emerald-600 fill-emerald-600" />
                    <span className="text-[12px] font-semibold text-emerald-600">
                      {startup.matchScore}%
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-[13px] text-[#64748B]">
                    <Briefcase size={14} />
                    <span>{startup.stage || "Unknown Stage"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[13px] text-[#64748B]">
                    <MapPin size={14} />
                    <span>{startup.city && startup.country ? `${startup.city}, ${startup.country}` : "Location N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[13px] text-[#64748B]">
                    <DollarSign size={14} />
                    <span>Raising: {formatAmount(startup.funding_required)}</span>
                  </div>
                  {startup.monthly_revenue && (
                    <div className="flex items-center gap-2 text-[13px] text-[#64748B]">
                      <TrendingUp size={14} />
                      <span>Revenue: {formatAmount(startup.monthly_revenue)}/mo</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-[#E2E8F0]">
                  <span className={`text-[11px] uppercase tracking-[0.5px] font-semibold px-2 py-1 rounded-full ${
                    startup.traction_stage === "Growth" ? "bg-emerald-100 text-emerald-700" :
                    startup.traction_stage === "Early Traction" ? "bg-blue-100 text-blue-700" :
                    "bg-slate-100 text-slate-600"
                  }`}>
                    {startup.traction_stage || "No Traction Data"}
                  </span>
                </div>

                <div className="flex gap-2 mt-4">
                  <button className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-[#4F46E5] bg-[#EEF2FF] rounded-lg hover:bg-[#E0E7FF] transition">
                    <Mail size={14} />
                    Contact
                  </button>
                  <button className="flex items-center justify-center p-2 text-[#64748B] hover:text-[#4F46E5] transition">
                    <ArrowUpRight size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredStartups.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#F1F5F9] flex items-center justify-center">
              <Search size={24} className="text-[#94A3B8]" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">No startups found</h3>
            <p className="text-[#64748B]">Try adjusting your filters to see more results</p>
          </div>
        )}
      </main>
    </div>
  );
}
