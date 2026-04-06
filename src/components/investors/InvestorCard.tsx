import * as React from "react";
import type { InvestorProfile } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

interface InvestorCardProps {
  investor: InvestorProfile;
  onContactClick: (method: "email" | "pitchDeck") => void;
}

function usdFormat(value: number) {
  if (value === 0) return "$0";
  if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (value >= 1e3) {
    return `$${(value / 1e3).toFixed(0)}k`;
  }
  return `$${value}`;
}

export function InvestorCard({ investor, onContactClick }: InvestorCardProps) {
  const checkMin = usdFormat(investor.checkSizeUsdMin);
  const checkMax = usdFormat(investor.checkSizeUsdMax);
  const ticketRange = investor.checkSizeUsdMax > 0 ? `${checkMin} - ${checkMax}` : "Flexible / Unknown";

  return (
    <div className="flex items-center px-6 py-4 border-b border-[var(--vm-slate-6)] hover:bg-slate-50 transition-colors bg-white group last:border-b-0 w-full gap-4">
      
      {/* 1. Investor (Logo + Name + Title) */}
      <div className="w-1/4 min-w-[200px] flex items-center gap-3">
        <div className="w-10 h-10 flex-shrink-0 bg-[var(--vm-indigo-light)] text-[var(--vm-indigo)] rounded-md flex justify-center items-center font-bold text-lg shadow-sm">
          {investor.firmName.charAt(0)}
        </div>
        <div className="flex flex-col overflow-hidden">
          <h3 className="text-sm font-semibold text-[var(--vm-slate)] mb-0.5 truncate flex items-center gap-1">
            {investor.firmName}
          </h3>
          <p className="text-xs text-[var(--vm-slate-3)] capitalize">
            {investor.firmName.toLowerCase().includes('angel') ? 'Solo angel' : 'VC firm'}
          </p>
        </div>
      </div>

      {/* 2. Geography */}
      <div className="w-1/6 min-w-[120px]">
        <div className="flex flex-wrap gap-1">
          {investor.regions.slice(0, 1).map((r, idx) => (
            <Badge key={`${r}-${idx}`} className="text-[11px] bg-[var(--vm-surface)] text-[var(--vm-slate-2)] border border-[var(--vm-slate-5)] font-medium px-2 py-0.5 hover:bg-slate-100">{r}</Badge>
          ))}
          {investor.regions.length > 1 && (
            <span className="text-[11px] text-[var(--vm-slate-3)] font-medium ml-1">+{investor.regions.length - 1}</span>
          )}
        </div>
      </div>

      {/* 3. Checks */}
      <div className="w-1/6 min-w-[120px] text-[13px] text-[var(--vm-slate-2)] font-medium">
        {ticketRange}
      </div>

      {/* 4. Stages */}
      <div className="w-[15%] min-w-[100px]">
        <div className="flex flex-col items-start gap-1">
          {investor.stageFocus.slice(0, 2).map((stage, idx) => (
             <Badge key={`${stage}-${idx}`} className="max-w-[100px] text-[11px] bg-[var(--vm-surface)] text-[var(--vm-slate-2)] border-none font-medium px-2 py-0.5 hover:bg-slate-100 truncate inline-block text-center">
               {idx + 1}. {stage.replace('Series ', 'S').replace('Pre-seed', 'Pre')}
             </Badge>
          ))}
          {investor.stageFocus.length > 2 && (
            <span className="text-[11px] text-[var(--vm-slate-3)] font-medium ml-1">+{investor.stageFocus.length - 2}</span>
          )}
        </div>
      </div>

      {/* 5. Industries (Sectors) */}
      <div className="w-[15%] min-w-[120px]">
        <div className="flex flex-col items-start gap-1">
          {investor.sectorFocus.slice(0, 2).map((sector, idx) => (
             <Badge key={`${sector}-${idx}`} className="max-w-[110px] text-[10px] bg-slate-100 text-slate-500 font-medium px-2 py-0.5 hover:bg-slate-200 border border-slate-200 truncate inline-block text-center">
               {sector.toLowerCase()}
             </Badge>
          ))}
          {investor.sectorFocus.length > 2 && (
            <Badge className="text-[10px] bg-transparent text-slate-400 font-medium px-1 py-0 border-none shadow-none hover:bg-transparent">+{investor.sectorFocus.length - 2}</Badge>
          )}
        </div>
      </div>

      {/* 6. Actions */}
      <div className="w-[120px] ml-auto flex flex-col gap-1.5 items-end justify-center">
        <button
          onClick={() => onContactClick("email")}
          className="w-full py-1.5 px-3 bg-[var(--vm-indigo)] hover:bg-[var(--vm-indigo-mid)] text-white text-[11px] font-bold tracking-wide rounded transition-colors shadow-sm text-center flex justify-center items-center"
        >
          Send Email
        </button>
        <button
          onClick={() => onContactClick("pitchDeck")}
          className="w-full py-1.5 px-3 bg-transparent hover:bg-slate-100 text-[var(--vm-slate-3)] text-[11px] font-semibold rounded transition-colors text-center flex justify-center items-center"
        >
          Send Pitch Deck
        </button>
      </div>

    </div>
  );
}
