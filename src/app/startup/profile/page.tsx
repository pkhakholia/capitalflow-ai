"use client";

import Link from "next/link";
import * as React from "react";
import { ArrowLeft, Building2, Mail, Globe, MapPin, TrendingUp, DollarSign, FileText, Calendar, Linkedin, CheckCircle2 } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { fetchInvestorOutreach } from "@/lib/outreach";
import { OutreachList } from "@/components/crm/OutreachList";
import type { InvestorOutreach } from "@/types/outreach";
import { SECTOR_OPTIONS } from "@/lib/types";

type StartupProfile = {
  id: string;
  startup_name?: string;
  founder_name?: string;
  contact_email?: string;
  website?: string;
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
  pitch_deck_url?: string;
  product_summary?: string;
  traction_summary?: string;
};

const COMPANY_TYPE_OPTIONS = [
  "Private Limited",
  "Proprietorship",
  "Partnership",
  "Public Limited",
  "Others"
] as const;

const TRACTION_STAGE_OPTIONS = [
  "Idea",
  "Proof of Concept",
  "Beta Launched",
  "Early Traction",
  "Steady Revenues",
  "Growth"
] as const;

const STAGE_OPTIONS = [
  "Pre-seed",
  "Seed",
  "Series A",
  "Series B",
  "Series C+",
  "Growth"
] as const;

const currentYear = new Date().getFullYear();
const yearOptions = Array.from(
  { length: currentYear - 2000 + 1 },
  (_, index) => currentYear - index
);

function formatInr(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return "Not set";
  return `₹${(value / 100000).toFixed(1)}L`;
}

function formatAmount(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return "Not set";
  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(1)}Cr`;
  }
  return `₹${(value / 100000).toFixed(1)}L`;
}

export default function StartupProfilePage() {
  const [startup, setStartup] = React.useState<StartupProfile | null>(null);
  const [outreachData, setOutreachData] = React.useState<InvestorOutreach[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [formData, setFormData] = React.useState<Partial<StartupProfile>>({});

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch startup
        const { data: startupData, error: startupError } = await supabase
          .from("Startups")
          .select("*")
          .limit(1)
          .maybeSingle();

        if (startupError) {
          console.error("Error fetching startup:", startupError);
        } else if (startupData) {
          const mappedStartup: StartupProfile = {
            id: String(startupData.id),
            startup_name: startupData.startup_name,
            founder_name: startupData.founder_name,
            contact_email: startupData.contact_email,
            website: startupData.website,
            industry: startupData.industry,
            stage: startupData.stage,
            funding_required: startupData.funding_required,
            geography: startupData.geography,
            country: startupData.country,
            city: startupData.city,
            company_type: startupData.company_type,
            monthly_revenue: startupData.monthly_revenue,
            pre_money_valuation: startupData.pre_money_valuation,
            linkedin_url: startupData.linkedin_url,
            incorporation_month: startupData.incorporation_month,
            incorporation_year: startupData.incorporation_year,
            traction_stage: startupData.traction_stage,
            moat: startupData.moat,
            prior_exit: startupData.prior_exit,
            revenue_growth_mom: startupData.revenue_growth_mom,
            pitch_deck_url: startupData.pitch_deck_url,
            product_summary: startupData.product_summary,
            traction_summary: startupData.traction_summary
          };
          setStartup(mappedStartup);
          setFormData(mappedStartup);

          // Fetch outreach data
          const outreach = await fetchInvestorOutreach(mappedStartup.id);
          setOutreachData(outreach);
        }
      } catch (e) {
        console.error("Error loading data:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSave = async () => {
    if (!startup?.id) return;

    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from("Startups")
        .update({
          startup_name: formData.startup_name,
          contact_email: formData.contact_email,
          website: formData.website,
          industry: formData.industry,
          stage: formData.stage,
          funding_required: formData.funding_required,
          country: formData.country,
          city: formData.city,
          company_type: formData.company_type,
          monthly_revenue: formData.monthly_revenue,
          pre_money_valuation: formData.pre_money_valuation,
          linkedin_url: formData.linkedin_url,
          incorporation_month: formData.incorporation_month,
          incorporation_year: formData.incorporation_year,
          traction_stage: formData.traction_stage,
          updated_at: new Date().toISOString()
        })
        .eq("id", startup.id);

      if (error) {
        throw new Error(error.message);
      }

      setStartup({ ...startup, ...formData });
      setIsEditing(false);
      setMessage({ type: "success", text: "Profile updated successfully!" });

      setTimeout(() => setMessage(null), 3000);
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Failed to update profile" });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof StartupProfile, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-gray-500">Loading profile...</div>
      </div>
    );
  }

  if (!startup) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] px-6 py-10">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">No Startup Profile Found</h1>
            <p className="text-gray-500 mb-4">Create your startup profile to get started.</p>
            <Link
              href="/startup"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Create Profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-6 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-2"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </Link>
            <h1 className="text-2xl font-semibold text-gray-900">Startup Profile</h1>
            <p className="text-gray-500 mt-1">Manage your company details and track investor outreach</p>
          </div>
          <div className="flex items-center gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setFormData(startup);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}
          >
            <div className="flex items-center gap-2">
              {message.type === "success" && <CheckCircle2 size={18} />}
              <span>{message.text}</span>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Profile Form */}
          <div className="col-span-8 space-y-6">
            {/* Company Info Section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Building2 size={18} className="text-indigo-600" />
                  Company Information
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.startup_name || ""}
                        onChange={(e) => updateField("startup_name", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    ) : (
                      <p className="text-gray-900 font-medium">{startup.startup_name || "Not set"}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={formData.contact_email || ""}
                        onChange={(e) => updateField("contact_email", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-gray-900">
                        <Mail size={16} className="text-gray-400" />
                        {startup.contact_email || "Not set"}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                    {isEditing ? (
                      <input
                        type="url"
                        value={formData.website || ""}
                        onChange={(e) => updateField("website", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-gray-900">
                        <Globe size={16} className="text-gray-400" />
                        {startup.website ? (
                          <a href={startup.website} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                            {startup.website}
                          </a>
                        ) : (
                          "Not set"
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
                    {isEditing ? (
                      <input
                        type="url"
                        value={formData.linkedin_url || ""}
                        onChange={(e) => updateField("linkedin_url", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-gray-900">
                        <Linkedin size={16} className="text-gray-400" />
                        {startup.linkedin_url ? (
                          <a href={startup.linkedin_url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                            View Profile
                          </a>
                        ) : (
                          "Not set"
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                    {isEditing ? (
                      <select
                        value={formData.industry || ""}
                        onChange={(e) => updateField("industry", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Select industry</option>
                        {SECTOR_OPTIONS.map((sector) => (
                          <option key={sector} value={sector}>
                            {sector}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-gray-900">{startup.industry || "Not set"}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Type</label>
                    {isEditing ? (
                      <select
                        value={formData.company_type || ""}
                        onChange={(e) => updateField("company_type", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Select type</option>
                        {COMPANY_TYPE_OPTIONS.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-gray-900">{startup.company_type || "Not set"}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    {isEditing ? (
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="City"
                          value={formData.city || ""}
                          onChange={(e) => updateField("city", e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <input
                          type="text"
                          placeholder="Country"
                          value={formData.country || ""}
                          onChange={(e) => updateField("country", e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-900">
                        <MapPin size={16} className="text-gray-400" />
                        {startup.city && startup.country
                          ? `${startup.city}, ${startup.country}`
                          : startup.city || startup.country || "Not set"}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Incorporation Date</label>
                    {isEditing ? (
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={formData.incorporation_month || ""}
                          onChange={(e) => updateField("incorporation_month", e.target.value ? Number(e.target.value) : undefined)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Month</option>
                          {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                              {new Date(0, i).toLocaleString("default", { month: "short" })}
                            </option>
                          ))}
                        </select>
                        <select
                          value={formData.incorporation_year || ""}
                          onChange={(e) => updateField("incorporation_year", e.target.value ? Number(e.target.value) : undefined)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Year</option>
                          {yearOptions.map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-900">
                        <Calendar size={16} className="text-gray-400" />
                        {startup.incorporation_month && startup.incorporation_year
                          ? `${new Date(0, startup.incorporation_month - 1).toLocaleString("default", { month: "short" })} ${startup.incorporation_year}`
                          : "Not set"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Fundraising Details Section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <DollarSign size={18} className="text-emerald-600" />
                  Fundraising Details
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Stage</label>
                    {isEditing ? (
                      <select
                        value={formData.stage || ""}
                        onChange={(e) => updateField("stage", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Select stage</option>
                        {STAGE_OPTIONS.map((stage) => (
                          <option key={stage} value={stage}>
                            {stage}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-gray-900">{startup.stage || "Not set"}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Funding Required</label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={formData.funding_required || ""}
                        onChange={(e) => updateField("funding_required", e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    ) : (
                      <p className="text-gray-900">{formatAmount(startup.funding_required)}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Traction Metrics Section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp size={18} className="text-amber-600" />
                  Traction Metrics
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Traction Stage</label>
                    {isEditing ? (
                      <select
                        value={formData.traction_stage || ""}
                        onChange={(e) => updateField("traction_stage", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Select traction stage</option>
                        {TRACTION_STAGE_OPTIONS.map((stage) => (
                          <option key={stage} value={stage}>
                            {stage}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-gray-900">{startup.traction_stage || "Not set"}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Revenue</label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={formData.monthly_revenue || ""}
                        onChange={(e) => updateField("monthly_revenue", e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    ) : (
                      <p className="text-gray-900">{formatInr(startup.monthly_revenue)}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pre-Money Valuation</label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={formData.pre_money_valuation || ""}
                        onChange={(e) => updateField("pre_money_valuation", e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    ) : (
                      <p className="text-gray-900">{formatAmount(startup.pre_money_valuation)}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Prior Exit</label>
                    {isEditing ? (
                      <select
                        value={formData.prior_exit === true ? "yes" : formData.prior_exit === false ? "no" : ""}
                        onChange={(e) => updateField("prior_exit", e.target.value === "yes" ? true : e.target.value === "no" ? false : undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Select</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    ) : (
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          startup.prior_exit
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {startup.prior_exit === true ? "Yes" : startup.prior_exit === false ? "No" : "Not set"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Pitch Deck Section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FileText size={18} className="text-blue-600" />
                  Pitch Deck
                </h2>
              </div>
              <div className="p-6">
                {startup.pitch_deck_url ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                        <FileText size={20} className="text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Pitch Deck Uploaded</p>
                        <p className="text-sm text-gray-500">PDF document</p>
                      </div>
                    </div>
                    <a
                      href={startup.pitch_deck_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"
                    >
                      View Deck
                    </a>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No pitch deck uploaded yet</p>
                    <Link
                      href="/startup"
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                    >
                      Upload Pitch Deck
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Outreach List */}
          <div className="col-span-4">
            <div className="sticky top-6">
              <OutreachList outreachData={outreachData} />

              {/* Quick Stats */}
              <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Outreach Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Total Contacted</span>
                    <span className="font-medium text-gray-900">{outreachData.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">In Progress</span>
                    <span className="font-medium text-amber-600">{outreachData.filter(o => o.outreach_stage === "in_progress").length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Committed</span>
                    <span className="font-medium text-emerald-600">{outreachData.filter(o => o.outreach_stage === "committed").length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
