"use client";

import * as React from "react";
import { DollarSign, ArrowRight } from "lucide-react";
import type { InvestorOutreach, OutreachStage } from "@/types/outreach";
import { STAGE_DISPLAY_NAMES, STAGE_COLORS } from "@/types/outreach";

interface RoundTrackerProps {
  outreachData: InvestorOutreach[];
}

const STAGES: OutreachStage[] = ["to_contact", "reached_out", "in_progress", "committed"];

function formatAmount(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  }
  return `₹${(amount / 1000000).toFixed(1)}M`;
}

function calculateStageAmounts(outreachData: InvestorOutreach[]) {
  return STAGES.map((stage) => {
    const stageItems = outreachData.filter((item) => item.outreach_stage === stage);

    // For committed stage, use committed amount if available, otherwise use average of ticket range
    // For other stages, use potential amount (average of ticket range)
    const totalAmount = stageItems.reduce((sum, item) => {
      const min = item.ticket_min || 0;
      const max = item.ticket_max || min;
      const avg = (min + max) / 2;
      return sum + avg;
    }, 0);

    const count = stageItems.length;

    return {
      stage,
      count,
      totalAmount,
      displayName: STAGE_DISPLAY_NAMES[stage]
    };
  });
}

export function RoundTracker({ outreachData }: RoundTrackerProps) {
  const stageData = calculateStageAmounts(outreachData);
  const totalCommitted = stageData.find(s => s.stage === "committed")?.totalAmount || 0;
  const totalPotential = stageData.reduce((sum, s) => sum + s.totalAmount, 0);

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Your Current Round</h2>
          <p className="text-sm text-gray-500 mt-1">
            Track your fundraising progress across all investor conversations
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Total Committed</p>
          <p className="text-2xl font-bold text-emerald-600">{formatAmount(totalCommitted)}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
          {stageData.map((stage) => {
            const percentage = totalPotential > 0 ? (stage.totalAmount / totalPotential) * 100 : 0;
            const colorClass = STAGE_COLORS[stage.stage].bg.replace("bg-", "").replace("-50", "-500");
            return percentage > 0 ? (
              <div
                key={stage.stage}
                className={`h-full ${STAGE_COLORS[stage.stage].bg.replace("-50", "-500")}`}
                style={{ width: `${percentage}%` }}
              />
            ) : null;
          })}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>0%</span>
          <span>Fundraising Progress</span>
          <span>Goal</span>
        </div>
      </div>

      {/* Stage Cards */}
      <div className="grid grid-cols-4 gap-4">
        {stageData.map((stage) => {
          const colors = STAGE_COLORS[stage.stage];
          return (
            <div
              key={stage.stage}
              className={`rounded-xl p-4 border-2 ${colors.border} ${colors.bg} transition-all hover:shadow-md`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold uppercase tracking-wide ${colors.text}`}>
                  {stage.displayName}
                </span>
                <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full">
                  {stage.count}
                </span>
              </div>

              <div className="flex items-baseline gap-1">
                <DollarSign size={16} className={colors.text} />
                <span className={`text-lg font-bold ${colors.text}`}>
                  {formatAmount(stage.totalAmount)}
                </span>
              </div>

              <p className="text-xs text-gray-500 mt-1">
                {stage.stage === "committed"
                  ? "Total raised"
                  : stage.stage === "to_contact"
                  ? "Potential"
                  : "In discussion"}
              </p>
            </div>
          );
        })}
      </div>

      {/* Flow Arrow Indicators */}
      <div className="flex justify-center mt-4">
        <div className="flex items-center gap-8 text-gray-400">
          {STAGES.slice(0, -1).map((stage, index) => (
            <div key={stage} className="flex items-center gap-2">
              <ArrowRight size={16} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
