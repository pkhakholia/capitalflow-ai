"use client";

import { useState, useEffect, useRef } from "react";
import { Search, ChevronDown, Mail, FileText } from "lucide-react";

interface Investor {
  id: string;
  name: string;
  geography: string;
  checks: string;
  stages: string;
  industries: string;
  initial: string;
}

const investors: Investor[] = [
  {
    id: "1",
    name: "Sequoia Capital India",
    geography: "Remote/Global",
    checks: "$500k–$10M",
    stages: "Any",
    industries: "SaaS, Fintech",
    initial: "S",
  },
  {
    id: "2",
    name: "Accel India",
    geography: "Remote/Global",
    checks: "$250k–$5M",
    stages: "Seed, Series A",
    industries: "B2B, EdTech",
    initial: "A",
  },
  {
    id: "3",
    name: "Peak XV Partners",
    geography: "Remote/Global",
    checks: "$2M–$20M",
    stages: "Series A, B",
    industries: "Consumer, SaaS",
    initial: "P",
  },
  {
    id: "4",
    name: "Kalaari Capital",
    geography: "Remote/Global",
    checks: "$500k–$5M",
    stages: "Seed",
    industries: "DeepTech, AI",
    initial: "K",
  },
  {
    id: "5",
    name: "Nexus Venture Partners",
    geography: "Remote/Global",
    checks: "$1M–$8M",
    stages: "Series A",
    industries: "Enterprise, Cloud",
    initial: "N",
  },
  {
    id: "6",
    name: "Blume Ventures",
    geography: "India",
    checks: "$250k–$2M",
    stages: "Pre-Seed, Seed",
    industries: "Consumer, D2C",
    initial: "B",
  },
  {
    id: "7",
    name: "Matrix Partners India",
    geography: "Remote/Global",
    checks: "$500k–$5M",
    stages: "Seed, Series A",
    industries: "Fintech, SaaS",
    initial: "M",
  },
];

const sectors = ["All Sectors", "SaaS", "Fintech", "B2B", "EdTech", "Consumer", "DeepTech", "AI", "Enterprise", "Cloud", "D2C"];
const stages = ["All Stages", "Pre-Seed", "Seed", "Series A", "Series B", "Any"];
const regions = ["All Regions", "Remote/Global", "India", "US", "Europe", "Southeast Asia"];

function InvestorAvatar({ initial, name }: { initial: string; name: string }) {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#DBEAFE] text-sm font-semibold text-[#1E40AF]">
      {initial}
    </div>
  );
}

function SendEmailButton({ hasPitchDeck = false }: { hasPitchDeck?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <button className="inline-flex items-center gap-1.5 rounded-md bg-[#2563EB] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#1E40AF]">
        <Mail className="h-3.5 w-3.5" />
        Send Email
      </button>
      {hasPitchDeck && (
        <button className="inline-flex items-center gap-1.5 text-sm font-medium text-[#2563EB] transition-colors hover:text-[#1E40AF]">
          <FileText className="h-3.5 w-3.5" />
          Send Pitch Deck
        </button>
      )}
    </div>
  );
}

function MobileInvestorCard({ investor }: { investor: Investor }) {
  return (
    <div className="rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-sm transition-all hover:bg-[#EFF6FF]">
      <div className="flex items-start gap-3">
        <InvestorAvatar initial={investor.initial} name={investor.name} />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-[#111827] truncate">{investor.name}</h3>
          <p className="text-xs text-[#6B7280] mt-0.5">{investor.checks}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#6B7280]">
        <span className="inline-flex items-center rounded-full bg-[#F3F4F6] px-2 py-0.5">{investor.stages}</span>
        <span className="inline-flex items-center rounded-full bg-[#F3F4F6] px-2 py-0.5">{investor.industries}</span>
      </div>
      <div className="mt-3">
        <SendEmailButton hasPitchDeck={true} />
      </div>
    </div>
  );
}

export function InvestorDirectory() {
  const [isVisible, setIsVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState("All Sectors");
  const [selectedStage, setSelectedStage] = useState("All Stages");
  const [selectedRegion, setSelectedRegion] = useState("All Regions");
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="bg-[#F0F4FF] py-20 px-4 sm:px-6 lg:px-8"
    >
      <div
        className={`mx-auto max-w-6xl transition-all duration-700 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* Headline */}
        <div className="text-center mb-4">
          <h2 className="font-[family-name:var(--font-jakarta)] text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#111827] leading-tight">
            Raise Capital from 1,000+ Active Investors Through Our Intelligent AI Matching Framework
          </h2>
        </div>

        {/* Subheadline */}
        <p className="text-center text-[#6B7280] text-base sm:text-lg max-w-3xl mx-auto mb-10 font-[family-name:var(--font-dm-sans)]">
          AI-powered matching connects your startup with investors aligned to your stage, sector, and geography
        </p>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E5E7EB] p-4 mb-8">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search by sector, stage or investor name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                suppressHydrationWarning
                className="w-full rounded-lg border border-[#E5E7EB] bg-white pl-10 pr-4 py-2.5 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 font-[family-name:var(--font-dm-sans)]"
              />
            </div>

            {/* Dropdowns */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Sector Dropdown */}
              <div className="relative">
                <select
                  value={selectedSector}
                  onChange={(e) => setSelectedSector(e.target.value)}
                  className="appearance-none w-full sm:w-40 rounded-lg border border-[#E5E7EB] bg-white px-4 py-2.5 pr-10 text-sm text-[#111827] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 cursor-pointer font-[family-name:var(--font-dm-sans)]"
                >
                  {sectors.map((sector) => (
                    <option key={sector} value={sector}>{sector}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280] pointer-events-none" />
              </div>

              {/* Stage Dropdown */}
              <div className="relative">
                <select
                  value={selectedStage}
                  onChange={(e) => setSelectedStage(e.target.value)}
                  className="appearance-none w-full sm:w-40 rounded-lg border border-[#E5E7EB] bg-white px-4 py-2.5 pr-10 text-sm text-[#111827] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 cursor-pointer font-[family-name:var(--font-dm-sans)]"
                >
                  {stages.map((stage) => (
                    <option key={stage} value={stage}>{stage}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280] pointer-events-none" />
              </div>

              {/* Region Dropdown */}
              <div className="relative">
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="appearance-none w-full sm:w-40 rounded-lg border border-[#E5E7EB] bg-white px-4 py-2.5 pr-10 text-sm text-[#111827] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 cursor-pointer font-[family-name:var(--font-dm-sans)]"
                >
                  {regions.map((region) => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280] pointer-events-none" />
              </div>
            </div>

            {/* Search Button */}
            <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2563EB] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1E40AF] whitespace-nowrap font-[family-name:var(--font-dm-sans)]">
              <Search className="h-4 w-4" />
              Search
            </button>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block bg-white rounded-xl shadow-sm border border-[#E5E7EB] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider font-[family-name:var(--font-dm-sans)]">
                  Investor
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider font-[family-name:var(--font-dm-sans)]">
                  Geography
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider font-[family-name:var(--font-dm-sans)]">
                  Checks
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider font-[family-name:var(--font-dm-sans)]">
                  Stages
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider font-[family-name:var(--font-dm-sans)]">
                  Industries
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider font-[family-name:var(--font-dm-sans)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {investors.map((investor) => (
                <tr
                  key={investor.id}
                  className="transition-colors hover:bg-[#EFF6FF]"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <InvestorAvatar initial={investor.initial} name={investor.name} />
                      <span className="text-sm font-medium text-[#111827] font-[family-name:var(--font-dm-sans)]">
                        {investor.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#6B7280] font-[family-name:var(--font-dm-sans)]">
                    {investor.geography}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#111827] font-medium font-[family-name:var(--font-dm-sans)]">
                    {investor.checks}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#6B7280] font-[family-name:var(--font-dm-sans)]">
                    {investor.stages}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#6B7280] font-[family-name:var(--font-dm-sans)]">
                    {investor.industries}
                  </td>
                  <td className="px-6 py-4">
                    <SendEmailButton hasPitchDeck={true} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {investors.map((investor) => (
            <MobileInvestorCard key={investor.id} investor={investor} />
          ))}
        </div>

        {/* Showing count */}
        <p className="mt-6 text-center text-sm text-[#6B7280] font-[family-name:var(--font-dm-sans)]">
          Showing 7 of 2,000+ investors
        </p>
      </div>
    </section>
  );
}
