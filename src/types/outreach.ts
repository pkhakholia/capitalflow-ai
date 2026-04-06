// Investor Outreach types for CRM functionality

export const OUTREACH_STAGES = [
  "to_contact",
  "reached_out",
  "in_progress",
  "committed"
] as const;

export type OutreachStage = (typeof OUTREACH_STAGES)[number];

export const STAGE_DISPLAY_NAMES: Record<OutreachStage, string> = {
  to_contact: "To be Contacted",
  reached_out: "Reached Out",
  in_progress: "In Progress",
  committed: "Committed"
};

export const STAGE_COLORS: Record<OutreachStage, { bg: string; border: string; text: string; badge: string }> = {
  to_contact: {
    bg: "bg-gray-50",
    border: "border-gray-200",
    text: "text-gray-600",
    badge: "bg-gray-100 text-gray-700"
  },
  reached_out: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-600",
    badge: "bg-blue-100 text-blue-700"
  },
  in_progress: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-600",
    badge: "bg-amber-100 text-amber-700"
  },
  committed: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-600",
    badge: "bg-emerald-100 text-emerald-700"
  }
};

export interface InvestorOutreach {
  id: string;
  investor_id: string;
  startup_id: string;
  outreach_stage: OutreachStage;
  date_contacted?: string;
  created_at: string;
  updated_at: string;
  // Join fields from investors table
  investor_name?: string;
  fund_name?: string;
  ticket_min?: number;
  ticket_max?: number;
  last_interaction_date?: string;
  next_action?: string;
}

export interface InvestorOutreachInsert {
  investor_id: string;
  startup_id: string;
  outreach_stage: OutreachStage;
  date_contacted?: string;
}

export interface InvestorOutreachUpdate {
  outreach_stage?: OutreachStage;
  date_contacted?: string;
  next_action?: string;
}
