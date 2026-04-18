export type PlanName = "free" | "pro" | "gold";
export type SubscriptionStatus = "inactive" | "active" | "cancelled";

export type PlanLimits = {
  outreachPerDay?: number;
  outreachPerMonth?: number;
  aiMatches: number;
  filters: number;
  pitchAnalyzer: boolean;
  pitchBuilder: boolean;
};

export const PLAN_LIMITS: Record<PlanName, PlanLimits> = {
  free: {
    outreachPerMonth: 1,
    aiMatches: 0,
    filters: 1,
    pitchAnalyzer: false,
    pitchBuilder: false
  },
  pro: {
    outreachPerDay: 5,
    aiMatches: 3,
    filters: 3,
    pitchAnalyzer: false,
    pitchBuilder: false
  },
  gold: {
    outreachPerDay: 15,
    aiMatches: 5,
    filters: Number.POSITIVE_INFINITY,
    pitchAnalyzer: true,
    pitchBuilder: true
  }
};

export function getOutreachLimit(limits: PlanLimits) {
  if (typeof limits.outreachPerDay === "number") {
    return { count: limits.outreachPerDay, period: "day" as const };
  }
  return { count: limits.outreachPerMonth ?? 0, period: "month" as const };
}

