"use client";

import * as React from "react";
import { Building2, Calendar, ChevronRight, MessageSquare } from "lucide-react";
import type { InvestorOutreach } from "@/types/outreach";
import { STAGE_DISPLAY_NAMES, STAGE_COLORS } from "@/types/outreach";

interface OutreachListProps {
  outreachData: InvestorOutreach[];
}

function formatDate(dateString?: string) {
  if (!dateString) return "Not contacted";
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function OutreachList({ outreachData }: OutreachListProps) {
  if (outreachData.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-1">Your Investor Outreach</h3>
        <p className="text-sm text-gray-500 mb-4">
          Investors you contact will appear here
        </p>
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <MessageSquare size={20} className="text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">No outreach yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Send emails or pitch decks to investors from the matches page
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Your Investor Outreach</h3>
        <p className="text-sm text-gray-500 mt-1">
          {outreachData.length} investor{outreachData.length !== 1 ? "s" : ""} contacted
        </p>
      </div>

      <div className="max-h-[500px] overflow-y-auto">
        {outreachData.map((outreach) => {
          const stageColor = STAGE_COLORS[outreach.outreach_stage];
          return (
            <div
              key={outreach.id}
              className="p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                    {(outreach.fund_name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-gray-900">
                      {outreach.fund_name || "Unknown Fund"}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Building2 size={12} className="text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {outreach.investor_id.slice(0, 8)}...
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${stageColor.badge}`}>
                    {STAGE_DISPLAY_NAMES[outreach.outreach_stage]}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Calendar size={12} />
                    <span>{formatDate(outreach.date_contacted)}</span>
                  </div>
                </div>
              </div>

              {outreach.next_action && (
                <div className="mt-3 pl-13 ml-12">
                  <div className="text-xs text-gray-500 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                    <span className="font-medium">Next:</span> {outreach.next_action}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <button className="w-full flex items-center justify-center gap-2 text-sm text-indigo-600 font-medium hover:text-indigo-700 transition-colors">
          View All Outreach
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
