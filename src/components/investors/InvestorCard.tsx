import * as React from "react";

import type { InvestorProfile } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

interface InvestorCardProps {
  investor: InvestorProfile;
  onContactClick: (method: "email" | "pitchDeck") => void;
  onViewClick?: () => void;
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

export function InvestorCard({ investor, onContactClick, onViewClick }: InvestorCardProps) {
  const checkMin = usdFormat(investor.checkSizeUsdMin);
  const checkMax = usdFormat(investor.checkSizeUsdMax);
  const ticketRange =
    investor.checkSizeUsdMax > 0 ? `${checkMin} - ${checkMax}` : "Flexible / Unknown";

  return (
    <>
      <div className="rounded-xl border border-[var(--vm-slate-5)] bg-white p-4 shadow-sm md:hidden">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md bg-[var(--vm-indigo-light)] text-lg font-bold text-[var(--vm-indigo)] shadow-sm">
            {investor.firmName.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-[var(--vm-slate)]">{investor.firmName}</h3>
            <p className="mt-0.5 text-xs capitalize text-[var(--vm-slate-3)]">
              {investor.firmName.toLowerCase().includes("angel") ? "Solo angel" : "VC firm"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge className="border border-[var(--vm-slate-5)] bg-[var(--vm-surface)] px-2 py-0.5 text-[11px] text-[var(--vm-slate-2)]">
                {investor.regions[0] ?? "Global"}
              </Badge>
              <Badge className="border border-[var(--vm-slate-5)] bg-[var(--vm-surface)] px-2 py-0.5 text-[11px] text-[var(--vm-slate-2)]">
                {investor.stageFocus[0] ?? "Any stage"}
              </Badge>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-3 text-sm text-[var(--vm-slate-2)]">
          <div className="flex items-start justify-between gap-3">
            <span className="text-[var(--vm-slate-3)]">Check size</span>
            <span className="text-right font-medium">{ticketRange}</span>
          </div>
          <div className="flex items-start justify-between gap-3">
            <span className="text-[var(--vm-slate-3)]">Industries</span>
            <span className="text-right">{investor.sectorFocus.slice(0, 2).join(", ") || "Flexible"}</span>
          </div>
        </div>

        <div className="mt-4 grid gap-2">
          <button
            onClick={() => onViewClick?.()}
            className="flex min-h-11 items-center justify-center rounded-lg bg-slate-100 px-3 py-2 text-[13px] font-semibold text-[var(--vm-slate-2)] transition-colors hover:bg-slate-200"
          >
            View
          </button>
          <button
            onClick={() => onContactClick("email")}
            className="flex min-h-11 items-center justify-center rounded-lg bg-[var(--vm-indigo)] px-3 py-2 text-[13px] font-bold text-white transition-colors hover:bg-[var(--vm-indigo-mid)]"
          >
            Send Email
          </button>
          <button
            onClick={() => onContactClick("pitchDeck")}
            className="flex min-h-11 items-center justify-center rounded-lg bg-transparent px-3 py-2 text-[13px] font-semibold text-[var(--vm-slate-3)] transition-colors hover:bg-slate-100"
          >
            Send Pitch Deck
          </button>
        </div>
      </div>

      <div className="hidden w-full items-center gap-4 border-b border-[var(--vm-slate-6)] bg-white px-6 py-4 transition-colors last:border-b-0 hover:bg-slate-50 md:flex">
        <div className="flex min-w-0 flex-[1.5] items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-[var(--vm-indigo-light)] text-lg font-bold text-[var(--vm-indigo)] shadow-sm">
            {investor.firmName.charAt(0)}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-[var(--vm-slate)]">
              {investor.firmName}
            </h3>
            <p className="text-xs capitalize text-[var(--vm-slate-3)]">
              {investor.firmName.toLowerCase().includes("angel") ? "Solo angel" : "VC firm"}
            </p>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-1">
            {investor.regions.slice(0, 1).map((r, idx) => (
              <Badge
                key={`${r}-${idx}`}
                className="border border-[var(--vm-slate-5)] bg-[var(--vm-surface)] px-2 py-0.5 text-[11px] font-medium text-[var(--vm-slate-2)] hover:bg-slate-100"
              >
                {r}
              </Badge>
            ))}
            {investor.regions.length > 1 ? (
              <span className="ml-1 text-[11px] font-medium text-[var(--vm-slate-3)]">
                +{investor.regions.length - 1}
              </span>
            ) : null}
          </div>
        </div>

        <div className="min-w-0 flex-1 text-[13px] font-medium text-[var(--vm-slate-2)]">
          {ticketRange}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col items-start gap-1">
            {investor.stageFocus.slice(0, 2).map((stage, idx) => (
              <Badge
                key={`${stage}-${idx}`}
                className="max-w-full truncate border-none bg-[var(--vm-surface)] px-2 py-0.5 text-[11px] font-medium text-[var(--vm-slate-2)] hover:bg-slate-100"
              >
                {idx + 1}. {stage.replace("Series ", "S").replace("Pre-seed", "Pre")}
              </Badge>
            ))}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col items-start gap-1">
            {investor.sectorFocus.slice(0, 2).map((sector, idx) => (
              <Badge
                key={`${sector}-${idx}`}
                className="max-w-full truncate border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 hover:bg-slate-200"
              >
                {sector.toLowerCase()}
              </Badge>
            ))}
          </div>
        </div>

        <div className="ml-auto flex w-28 flex-shrink-0 flex-col gap-1.5">
          <button
            onClick={() => onViewClick?.()}
            className="flex min-h-9 items-center justify-center rounded bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-[var(--vm-slate-2)] transition-colors hover:bg-slate-200"
          >
            View
          </button>
          <button
            onClick={() => onContactClick("email")}
            className="flex min-h-9 items-center justify-center rounded bg-[var(--vm-indigo)] px-3 py-1.5 text-[11px] font-bold tracking-wide text-white transition-colors hover:bg-[var(--vm-indigo-mid)]"
          >
            Send Email
          </button>
          <button
            onClick={() => onContactClick("pitchDeck")}
            className="flex min-h-9 items-center justify-center rounded bg-transparent px-3 py-1.5 text-[11px] font-semibold text-[var(--vm-slate-3)] transition-colors hover:bg-slate-100"
          >
            Send Pitch Deck
          </button>
        </div>
      </div>
    </>
  );
}
