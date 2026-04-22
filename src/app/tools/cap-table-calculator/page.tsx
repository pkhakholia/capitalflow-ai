"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight, Plus, Trash2 } from "lucide-react";
import { LandingNav, LandingFooter } from "@/components/marketing";

type InvestorType = "SAFE" | "Note" | "Equity";

type Founder = {
  id: string;
  name: string;
  shares: number;
};

type InvestorInput = {
  id: string;
  name: string;
  amount: number;
  type: InvestorType;
  discount: number;
  valuationCap: number;
};

type RoundInput = {
  key: string;
  label: string;
  preMoneyValuation: number;
  investors: InvestorInput[];
};

type OwnershipRow = {
  name: string;
  shares: number;
  percentage: number;
};

type SimulationResult = {
  before: OwnershipRow[];
  after: OwnershipRow[];
  founderDilution: number;
  roundInvestment: number;
};

const ROUND_LABELS = ["Pre-seed", "Seed", "Series A", "Series B", "Series C", "Series D", "Series E"];
const PIE_COLORS = ["#4F46E5", "#059669", "#D97706", "#0EA5E9", "#E11D48", "#8B5CF6", "#14B8A6", "#64748B"];

function createRound(label: string, index: number): RoundInput {
  const key = label.toLowerCase().replace(" ", "-");
  return {
    key,
    label,
    preMoneyValuation: 0,
    investors: [
      {
        id: `${key}-investor-${index + 1}-1`,
        name: "",
        amount: 0,
        type: "Equity",
        discount: 20,
        valuationCap: 0,
      },
    ],
  };
}

function numberOrZero(value: string): number {
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrencyINR(value: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

function formatPercent(value: number): string {
  return `${Math.max(value, 0).toFixed(2)}%`;
}

function getRoundInvestment(round: RoundInput): number {
  return round.investors.reduce((sum, investor) => sum + Math.max(0, investor.amount), 0);
}

function roundHasRequiredDetails(round: RoundInput): boolean {
  return round.preMoneyValuation > 0 && getRoundInvestment(round) > 0;
}

function normalizeFounderName(name: string, index: number): string {
  return name.trim() || `Founder ${index + 1}`;
}

function sortOwnership(map: Map<string, number>): OwnershipRow[] {
  const total = Array.from(map.values()).reduce((sum, shares) => sum + shares, 0);
  if (total <= 0) {
    return [];
  }

  return Array.from(map.entries())
    .map(([name, shares]) => ({
      name,
      shares,
      percentage: (shares / total) * 100,
    }))
    .sort((a, b) => b.shares - a.shares);
}

function applyRound(round: RoundInput, capTable: Map<string, number>, totalShares: number): number {
  if (!roundHasRequiredDetails(round) || totalShares <= 0) {
    return totalShares;
  }

  const preMoney = round.preMoneyValuation;
  const basePricePerShare = preMoney / totalShares;
  if (basePricePerShare <= 0) {
    return totalShares;
  }

  for (const investor of round.investors) {
    if (investor.amount <= 0) {
      continue;
    }

    const cleanName = investor.name.trim() || `${round.label} Investor`;
    let effectivePricePerShare = basePricePerShare;

    if (investor.type === "SAFE" || investor.type === "Note") {
      const discountFactor = Math.min(Math.max(investor.discount, 0), 99.9);
      const discountedValuation = preMoney * (1 - discountFactor / 100);
      const cappedValuation = investor.valuationCap > 0 ? investor.valuationCap : Number.POSITIVE_INFINITY;
      const conversionValuation = Math.min(discountedValuation, cappedValuation);
      effectivePricePerShare = conversionValuation / totalShares;
    }

    if (effectivePricePerShare <= 0) {
      continue;
    }

    const investorShares = investor.amount / effectivePricePerShare;
    capTable.set(cleanName, (capTable.get(cleanName) ?? 0) + investorShares);
    totalShares += investorShares;
  }

  return totalShares;
}

function runSimulation(founders: Founder[], optionPoolPct: number, rounds: RoundInput[], activeRoundIndex: number): SimulationResult {
  const capTable = new Map<string, number>();
  const founderNames = new Set<string>();

  let founderSharesTotal = 0;
  founders.forEach((founder, idx) => {
    const shares = Math.max(0, founder.shares);
    if (shares <= 0) {
      return;
    }
    const name = normalizeFounderName(founder.name, idx);
    founderNames.add(name);
    capTable.set(name, (capTable.get(name) ?? 0) + shares);
    founderSharesTotal += shares;
  });

  const clampedPool = Math.min(Math.max(optionPoolPct, 0), 99.9);
  if (clampedPool > 0 && founderSharesTotal > 0) {
    const poolShares = (founderSharesTotal * clampedPool) / (100 - clampedPool);
    capTable.set("Option Pool", poolShares);
  }

  let totalShares = Array.from(capTable.values()).reduce((sum, shares) => sum + shares, 0);
  let beforeSnapshot = new Map(capTable);
  let afterSnapshot = new Map(capTable);
  let roundInvestment = 0;

  for (let i = 0; i <= activeRoundIndex; i += 1) {
    const round = rounds[i];
    if (!round) {
      continue;
    }

    if (i === activeRoundIndex) {
      beforeSnapshot = new Map(capTable);
      roundInvestment = getRoundInvestment(round);
      if (roundHasRequiredDetails(round)) {
        totalShares = applyRound(round, capTable, totalShares);
      }
      afterSnapshot = new Map(capTable);
    } else if (roundHasRequiredDetails(round)) {
      totalShares = applyRound(round, capTable, totalShares);
    }
  }

  const before = sortOwnership(beforeSnapshot);
  const after = sortOwnership(afterSnapshot);

  const founderBefore = before.filter((row) => founderNames.has(row.name)).reduce((sum, row) => sum + row.percentage, 0);
  const founderAfter = after.filter((row) => founderNames.has(row.name)).reduce((sum, row) => sum + row.percentage, 0);

  return {
    before,
    after,
    founderDilution: Math.max(0, founderBefore - founderAfter),
    roundInvestment,
  };
}

function buildPieGradient(rows: OwnershipRow[]): string {
  const filteredRows = rows.filter((row) => row.percentage > 0.02).slice(0, PIE_COLORS.length);
  if (filteredRows.length === 0) {
    return "conic-gradient(#CBD5E1 0 100%)";
  }

  let current = 0;
  const segments = filteredRows.map((row, idx) => {
    const next = current + row.percentage;
    const segment = `${PIE_COLORS[idx]} ${current}% ${next}%`;
    current = next;
    return segment;
  });

  if (current < 100) {
    segments.push(`#E2E8F0 ${current}% 100%`);
  }

  return `conic-gradient(${segments.join(", ")})`;
}

export default function CapTableCalculatorPage() {
  const [founders, setFounders] = useState<Founder[]>([
    { id: "founder-1", name: "Founder 1", shares: 1000000 },
    { id: "founder-2", name: "Founder 2", shares: 1000000 },
  ]);
  const [optionPoolPct, setOptionPoolPct] = useState(10);
  const [rounds, setRounds] = useState<RoundInput[]>(ROUND_LABELS.map((label, index) => createRound(label, index)));
  const [activeRoundIndex, setActiveRoundIndex] = useState(0);

  const founderTotalShares = founders.reduce((sum, founder) => sum + Math.max(0, founder.shares), 0);
  const simulation = useMemo(
    () => runSimulation(founders, optionPoolPct, rounds, activeRoundIndex),
    [activeRoundIndex, founders, optionPoolPct, rounds],
  );

  const firstLockedRoundIndex = rounds.findIndex((_, idx) => idx > 0 && !roundHasRequiredDetails(rounds[idx - 1]));
  const maxRoundIndex = firstLockedRoundIndex === -1 ? rounds.length - 1 : firstLockedRoundIndex - 1;

  const canOpenRound = (index: number): boolean => index <= maxRoundIndex;

  const mergedRows = useMemo(() => {
    const beforeMap = new Map(simulation.before.map((row) => [row.name, row]));
    const afterMap = new Map(simulation.after.map((row) => [row.name, row]));
    const names = Array.from(new Set([...beforeMap.keys(), ...afterMap.keys()]));
    return names.map((name) => ({
      name,
      beforeShares: beforeMap.get(name)?.shares ?? 0,
      beforePct: beforeMap.get(name)?.percentage ?? 0,
      afterShares: afterMap.get(name)?.shares ?? 0,
      afterPct: afterMap.get(name)?.percentage ?? 0,
    }));
  }, [simulation.after, simulation.before]);

  const pieGradient = buildPieGradient(simulation.after);

  const updateRound = (roundIndex: number, updater: (round: RoundInput) => RoundInput) => {
    setRounds((prev) => prev.map((round, idx) => (idx === roundIndex ? updater(round) : round)));
  };

  const activeRound = rounds[activeRoundIndex];
  const activeRoundLocked = !canOpenRound(activeRoundIndex);

  return (
    <div className="min-h-screen bg-[var(--vm-surface)] font-[family-name:var(--font-dm-sans)]">
      <LandingNav />

      <main className="mx-auto w-full max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-[var(--vm-slate-5)] bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 border-b border-[var(--vm-slate-5)] pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold text-[var(--vm-slate)] sm:text-4xl">
                Cap Table Calculator for Indian Startups
              </h1>
              <p className="mt-2 text-[15px] text-[var(--vm-slate-3)] sm:text-base">
                Model dilution across SAFE, convertible notes, and equity rounds in seconds
              </p>
            </div>
            <Link
              className="inline-flex items-center justify-center rounded-lg bg-[var(--vm-indigo)] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              href="/founder-profile"
            >
              Open in CapitalFlow
            </Link>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <section className="rounded-xl border border-[var(--vm-slate-5)] bg-[var(--vm-surface)] p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[var(--vm-slate)]">Founders</h2>
                <button
                  className="inline-flex items-center gap-2 rounded-md border border-[var(--vm-slate-5)] bg-white px-3 py-2 text-sm font-medium text-[var(--vm-slate-2)] hover:bg-[var(--vm-slate-6)]"
                  onClick={() =>
                    setFounders((prev) => [
                      ...prev,
                      { id: crypto.randomUUID(), name: `Founder ${prev.length + 1}`, shares: 250000 },
                    ])
                  }
                  type="button"
                >
                  <Plus className="h-4 w-4" />
                  Add founder
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-[12px] uppercase tracking-wide text-[var(--vm-slate-4)]">
                      <th className="pb-2 pr-3">Name</th>
                      <th className="pb-2 pr-3">Shares</th>
                      <th className="pb-2 pr-3">% Ownership</th>
                      <th className="pb-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {founders.map((founder, index) => {
                      const pct = founderTotalShares > 0 ? (founder.shares / founderTotalShares) * 100 : 0;
                      return (
                        <tr key={founder.id} className="border-t border-[var(--vm-slate-5)]">
                          <td className="py-2 pr-3">
                            <input
                              onChange={(event) =>
                                setFounders((prev) =>
                                  prev.map((item) => (item.id === founder.id ? { ...item, name: event.target.value } : item)),
                                )
                              }
                              value={founder.name}
                            />
                          </td>
                          <td className="py-2 pr-3">
                            <input
                              min={0}
                              onChange={(event) =>
                                setFounders((prev) =>
                                  prev.map((item) =>
                                    item.id === founder.id ? { ...item, shares: numberOrZero(event.target.value) } : item,
                                  ),
                                )
                              }
                              type="number"
                              value={founder.shares}
                            />
                          </td>
                          <td className="py-2 pr-3 text-[var(--vm-slate-2)]">{formatPercent(pct)}</td>
                          <td className="py-2 text-right">
                            <button
                              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[var(--vm-slate-3)] hover:bg-[var(--vm-slate-6)] hover:text-[var(--vm-rose)]"
                              disabled={founders.length <= 1}
                              onClick={() => setFounders((prev) => prev.filter((item) => item.id !== founder.id))}
                              type="button"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-xl border border-[var(--vm-slate-5)] bg-[var(--vm-surface)] p-4 sm:p-5">
              <h2 className="text-lg font-semibold text-[var(--vm-slate)]">ESOP / Option Pool</h2>
              <p className="mt-1 text-sm text-[var(--vm-slate-3)]">Target option pool percentage before investment.</p>
              <div className="mt-4">
                <label className="text-sm font-medium text-[var(--vm-slate-2)]" htmlFor="option-pool">
                  Option pool (%)
                </label>
                <input
                  id="option-pool"
                  max={99}
                  min={0}
                  onChange={(event) => setOptionPoolPct(numberOrZero(event.target.value))}
                  type="number"
                  value={optionPoolPct}
                />
              </div>
              <div className="mt-4 rounded-lg bg-white p-4 text-sm text-[var(--vm-slate-2)]">
                <p>
                  Current founder shares: <span className="font-semibold">{founderTotalShares.toLocaleString("en-IN")}</span>
                </p>
                <p className="mt-1">
                  Indicative pool size:{" "}
                  <span className="font-semibold">
                    {founderTotalShares > 0
                      ? Math.round((founderTotalShares * Math.min(optionPoolPct, 99)) / (100 - Math.min(optionPoolPct, 99))).toLocaleString("en-IN")
                      : 0}{" "}
                    shares
                  </span>
                </p>
              </div>
            </section>
          </div>

          <section className="mt-8">
            <h2 className="text-xl font-semibold text-[var(--vm-slate)]">Round Simulation</h2>
            <div className="mt-4 overflow-x-auto">
              <div className="inline-flex min-w-full gap-2 rounded-xl border border-[var(--vm-slate-5)] bg-[var(--vm-slate-6)] p-2">
                {rounds.map((round, idx) => {
                  const isActive = idx === activeRoundIndex;
                  const unlocked = canOpenRound(idx);
                  return (
                    <button
                      className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
                        isActive
                          ? "bg-white text-[var(--vm-slate)] shadow-sm"
                          : unlocked
                            ? "text-[var(--vm-slate-3)] hover:text-[var(--vm-slate)]"
                            : "cursor-not-allowed text-[var(--vm-slate-4)]"
                      }`}
                      disabled={!unlocked}
                      key={round.key}
                      onClick={() => setActiveRoundIndex(idx)}
                      type="button"
                    >
                      {round.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {activeRoundLocked ? (
              <div className="mt-4 rounded-xl border border-[var(--vm-slate-5)] bg-[var(--vm-slate-6)] p-4 text-sm text-[var(--vm-slate-2)]">
                This funding round is unavailable because details for the previous round are incomplete.
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-[var(--vm-slate-5)] bg-[var(--vm-surface)] p-4 sm:p-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-[var(--vm-slate-2)]" htmlFor="pre-money-valuation">
                      Pre-money valuation (INR)
                    </label>
                    <input
                      id="pre-money-valuation"
                      min={0}
                      onChange={(event) =>
                        updateRound(activeRoundIndex, (round) => ({
                          ...round,
                          preMoneyValuation: numberOrZero(event.target.value),
                        }))
                      }
                      type="number"
                      value={activeRound.preMoneyValuation}
                    />
                  </div>
                  <div className="rounded-lg border border-[var(--vm-slate-5)] bg-white p-4">
                    <p className="text-sm text-[var(--vm-slate-3)]">Total round investment</p>
                    <p className="mt-1 text-lg font-semibold text-[var(--vm-slate)]">{formatCurrencyINR(getRoundInvestment(activeRound))}</p>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-[var(--vm-slate)]">Investors</h3>
                  <button
                    className="inline-flex items-center gap-2 rounded-md border border-[var(--vm-slate-5)] bg-white px-3 py-2 text-sm font-medium text-[var(--vm-slate-2)] hover:bg-[var(--vm-slate-6)]"
                    onClick={() =>
                      updateRound(activeRoundIndex, (round) => ({
                        ...round,
                        investors: [
                          ...round.investors,
                          {
                            id: crypto.randomUUID(),
                            name: "",
                            amount: 0,
                            type: "Equity",
                            discount: 20,
                            valuationCap: 0,
                          },
                        ],
                      }))
                    }
                    type="button"
                  >
                    <Plus className="h-4 w-4" />
                    Add investor
                  </button>
                </div>

                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-[860px] w-full text-sm">
                    <thead>
                      <tr className="text-left text-[12px] uppercase tracking-wide text-[var(--vm-slate-4)]">
                        <th className="pb-2 pr-3">Name</th>
                        <th className="pb-2 pr-3">Type</th>
                        <th className="pb-2 pr-3">Investment (INR)</th>
                        <th className="pb-2 pr-3">Discount %</th>
                        <th className="pb-2 pr-3">Valuation cap (INR)</th>
                        <th className="pb-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeRound.investors.map((investor) => {
                        const showConvertible = investor.type === "SAFE" || investor.type === "Note";
                        return (
                          <tr className="border-t border-[var(--vm-slate-5)]" key={investor.id}>
                            <td className="py-2 pr-3">
                              <input
                                onChange={(event) =>
                                  updateRound(activeRoundIndex, (round) => ({
                                    ...round,
                                    investors: round.investors.map((item) =>
                                      item.id === investor.id ? { ...item, name: event.target.value } : item,
                                    ),
                                  }))
                                }
                                placeholder="Investor name"
                                value={investor.name}
                              />
                            </td>
                            <td className="py-2 pr-3">
                              <select
                                onChange={(event) =>
                                  updateRound(activeRoundIndex, (round) => ({
                                    ...round,
                                    investors: round.investors.map((item) =>
                                      item.id === investor.id ? { ...item, type: event.target.value as InvestorType } : item,
                                    ),
                                  }))
                                }
                                value={investor.type}
                              >
                                <option value="SAFE">SAFE</option>
                                <option value="Note">Note</option>
                                <option value="Equity">Equity</option>
                              </select>
                            </td>
                            <td className="py-2 pr-3">
                              <input
                                min={0}
                                onChange={(event) =>
                                  updateRound(activeRoundIndex, (round) => ({
                                    ...round,
                                    investors: round.investors.map((item) =>
                                      item.id === investor.id ? { ...item, amount: numberOrZero(event.target.value) } : item,
                                    ),
                                  }))
                                }
                                type="number"
                                value={investor.amount}
                              />
                            </td>
                            <td className="py-2 pr-3">
                              <input
                                disabled={!showConvertible}
                                min={0}
                                onChange={(event) =>
                                  updateRound(activeRoundIndex, (round) => ({
                                    ...round,
                                    investors: round.investors.map((item) =>
                                      item.id === investor.id ? { ...item, discount: numberOrZero(event.target.value) } : item,
                                    ),
                                  }))
                                }
                                type="number"
                                value={showConvertible ? investor.discount : 0}
                              />
                            </td>
                            <td className="py-2 pr-3">
                              <input
                                disabled={!showConvertible}
                                min={0}
                                onChange={(event) =>
                                  updateRound(activeRoundIndex, (round) => ({
                                    ...round,
                                    investors: round.investors.map((item) =>
                                      item.id === investor.id ? { ...item, valuationCap: numberOrZero(event.target.value) } : item,
                                    ),
                                  }))
                                }
                                type="number"
                                value={showConvertible ? investor.valuationCap : 0}
                              />
                            </td>
                            <td className="py-2 text-right">
                              <button
                                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[var(--vm-slate-3)] hover:bg-[var(--vm-slate-6)] hover:text-[var(--vm-rose)]"
                                disabled={activeRound.investors.length <= 1}
                                onClick={() =>
                                  updateRound(activeRoundIndex, (round) => ({
                                    ...round,
                                    investors: round.investors.filter((item) => item.id !== investor.id),
                                  }))
                                }
                                type="button"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 rounded-lg bg-[var(--vm-indigo-light)] p-4 text-sm text-[var(--vm-slate-2)]">
                  Move to the next round after filling this round&apos;s pre-money valuation and investment details.
                </div>
              </div>
            )}
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold text-[var(--vm-slate)]">Output</h2>
            <div className="mt-4 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
              <div className="rounded-xl border border-[var(--vm-slate-5)] bg-white p-4 sm:p-5">
                <h3 className="text-base font-semibold text-[var(--vm-slate)]">Cap table before vs after</h3>
                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-[12px] uppercase tracking-wide text-[var(--vm-slate-4)]">
                        <th className="pb-2 pr-3">Stakeholder</th>
                        <th className="pb-2 pr-3">Before shares</th>
                        <th className="pb-2 pr-3">Before %</th>
                        <th className="pb-2 pr-3">After shares</th>
                        <th className="pb-2">After %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mergedRows.map((row) => (
                        <tr className="border-t border-[var(--vm-slate-5)]" key={row.name}>
                          <td className="py-2 pr-3 font-medium text-[var(--vm-slate)]">{row.name}</td>
                          <td className="py-2 pr-3">{Math.round(row.beforeShares).toLocaleString("en-IN")}</td>
                          <td className="py-2 pr-3">{formatPercent(row.beforePct)}</td>
                          <td className="py-2 pr-3">{Math.round(row.afterShares).toLocaleString("en-IN")}</td>
                          <td className="py-2">{formatPercent(row.afterPct)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-xl border border-[var(--vm-slate-5)] bg-white p-4 sm:p-5">
                <h3 className="text-base font-semibold text-[var(--vm-slate)]">Ownership after this round</h3>
                <div className="mt-4 flex items-center justify-center">
                  <div
                    aria-label="Ownership pie chart"
                    className="h-52 w-52 rounded-full border border-[var(--vm-slate-5)]"
                    style={{ background: pieGradient }}
                  />
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  {simulation.after.slice(0, PIE_COLORS.length).map((row, idx) => (
                    <div className="flex items-center justify-between" key={row.name}>
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx] }} />
                        <span className="text-[var(--vm-slate-2)]">{row.name}</span>
                      </div>
                      <span className="font-medium text-[var(--vm-slate)]">{formatPercent(row.percentage)}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-lg bg-[var(--vm-indigo-light)] p-4">
                  <p className="text-sm text-[var(--vm-slate-2)]">Dilution summary</p>
                  <p className="mt-1 text-lg font-semibold text-[var(--vm-slate)]">
                    You are diluted by {formatPercent(simulation.founderDilution)} in this round
                  </p>
                  <p className="mt-1 text-sm text-[var(--vm-slate-3)]">
                    Round investment modeled: {formatCurrencyINR(simulation.roundInvestment)}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-8 rounded-xl border border-[var(--vm-indigo-mid)]/20 bg-[var(--vm-indigo-light)] p-6">
            <p className="text-base font-semibold text-[var(--vm-slate)]">
              Track this cap table live, collaborate with co-founders, and share with investors - import into CapitalFlow
            </p>
            <Link
              className="mt-4 inline-flex items-center rounded-lg bg-[var(--vm-indigo)] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              href="/founder-profile"
            >
              Import this into CapitalFlow
            </Link>
          </section>

          <section className="mt-10 border-t border-[var(--vm-slate-5)] pt-8">
            <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-[var(--vm-slate)]">
              Cap Table Guide for Founders
            </h2>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <article className="rounded-xl border border-[var(--vm-slate-5)] bg-[var(--vm-surface)] p-5">
                <h3 className="text-lg font-semibold text-[var(--vm-slate)]">What is a cap table?</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--vm-slate-2)]">
                  A cap table is a record of who owns how many shares in your company. It tracks founders, option pools,
                  and investors across fundraising rounds.
                </p>
              </article>

              <article className="rounded-xl border border-[var(--vm-slate-5)] bg-[var(--vm-surface)] p-5">
                <h3 className="text-lg font-semibold text-[var(--vm-slate)]">What is an option pool?</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--vm-slate-2)]">
                  An option pool is reserved equity for employees and advisors. It helps startups hire key talent while
                  keeping cash burn manageable in early stages.
                </p>
              </article>

              <article className="rounded-xl border border-[var(--vm-slate-5)] bg-[var(--vm-surface)] p-5">
                <h3 className="text-lg font-semibold text-[var(--vm-slate)]">How dilution works in India</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--vm-slate-2)]">
                  Dilution happens when new shares are issued to investors or for ESOP expansion. Your share count may stay
                  the same, but your ownership percentage can reduce after each round.
                </p>
              </article>

              <article className="rounded-xl border border-[var(--vm-slate-5)] bg-[var(--vm-surface)] p-5">
                <h3 className="text-lg font-semibold text-[var(--vm-slate)]">SAFE vs Convertible notes</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--vm-slate-2)]">
                  SAFE and convertible notes both defer pricing to a later round. SAFEs are typically simpler, while notes
                  may include interest and maturity terms. Both can use discounts and valuation caps.
                </p>
              </article>
            </div>

            <div className="mt-8 rounded-xl border border-[var(--vm-slate-5)] bg-white p-5">
              <h3 className="text-lg font-semibold text-[var(--vm-slate)]">FAQ</h3>
              <div className="mt-3 divide-y divide-[var(--vm-slate-5)]">
                {[
                  {
                    q: "Do I need to sign up to use this calculator?",
                    a: "No. This tools page is free and fully accessible without login.",
                  },
                  {
                    q: "How is SAFE dilution calculated here?",
                    a: "The calculator applies the better of discount-based valuation or valuation cap, then converts into shares at that effective price.",
                  },
                  {
                    q: "Can I model mixed rounds with SAFE and equity together?",
                    a: "Yes. You can add multiple investors per round and select SAFE, Note, or Equity for each line item.",
                  },
                  {
                    q: "Does this include legal or tax advice?",
                    a: "No. This is a planning model for scenario analysis and should be reviewed with your legal and finance advisors.",
                  },
                  {
                    q: "What should I set for option pool percentage?",
                    a: "Early-stage Indian startups commonly model 8% to 15% based on hiring plans and expected seniority of upcoming hires.",
                  },
                  {
                    q: "Can I continue this cap table inside CapitalFlow?",
                    a: "Yes. Use the import button above to move this structure into CapitalFlow and collaborate with your team.",
                  },
                ].map((item) => (
                  <details className="group py-3" key={item.q}>
                    <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-[var(--vm-slate)]">
                      {item.q}
                      <ChevronRight className="h-4 w-4 text-[var(--vm-slate-3)] transition-transform group-open:rotate-90" />
                    </summary>
                    <p className="pt-2 text-sm leading-6 text-[var(--vm-slate-2)]">{item.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
