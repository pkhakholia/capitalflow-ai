"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, DollarSign, Building2, GripVertical } from "lucide-react";
import type { InvestorOutreach, OutreachStage } from "@/types/outreach";
import { STAGE_DISPLAY_NAMES, STAGE_COLORS } from "@/types/outreach";

interface InvestorCardProps {
  outreach: InvestorOutreach;
  onContactClick?: () => void;
}

function formatInr(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return "TBD";
  return `₹${(value / 1000000).toFixed(1)}M`;
}

function formatDate(dateString?: string) {
  if (!dateString) return "Not contacted";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function InvestorCard({ outreach, onContactClick }: InvestorCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: outreach.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  const stageColor = STAGE_COLORS[outreach.outreach_stage];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl bg-white p-4 shadow-sm hover:shadow-md transition-shadow border ${stageColor.border} cursor-pointer`}
      onClick={onContactClick}
    >
      {/* Drag Handle */}
      <div className="flex items-start justify-between mb-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 -ml-1 rounded hover:bg-gray-100"
        >
          <GripVertical size={16} className="text-gray-400" />
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${stageColor.badge}`}>
          {STAGE_DISPLAY_NAMES[outreach.outreach_stage]}
        </span>
      </div>

      {/* Investor Info */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <Building2 size={14} className="text-gray-400" />
          <h4 className="font-semibold text-sm text-gray-900 line-clamp-1">
            {outreach.fund_name || "Unknown Fund"}
          </h4>
        </div>
        <p className="text-xs text-gray-500 ml-5">
          Investor ID: {outreach.investor_id.slice(0, 8)}...
        </p>
      </div>

      {/* Ticket Size */}
      <div className="flex items-center gap-2 mb-2 text-xs text-gray-600">
        <DollarSign size={14} className="text-gray-400" />
        <span>
          {formatInr(outreach.ticket_min)} - {formatInr(outreach.ticket_max)}
        </span>
      </div>

      {/* Last Contacted */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Calendar size={14} className="text-gray-400" />
        <span>Contacted: {formatDate(outreach.date_contacted)}</span>
      </div>
    </div>
  );
}
