import { supabase } from "@/lib/supabase";
import { PLAN_LIMITS, getOutreachLimit, type PlanName } from "@/lib/planLimits";

type UsageResult = {
  allowed: boolean;
  used: number;
  remaining: number;
  limit: number;
  period: "day" | "month";
  error?: string;
};

type ProfileUsageRow = {
  outreach_count: number | null;
  last_reset: string | null;
};

function getResetKey(plan: PlanName, date = new Date()) {
  const iso = date.toISOString();
  if (plan === "free") return iso.slice(0, 7);
  return iso.slice(0, 10);
}

function getLastResetKey(plan: PlanName, lastReset: string | null) {
  if (!lastReset) return null;
  const parsed = new Date(lastReset);
  if (Number.isNaN(parsed.getTime())) return null;
  return getResetKey(plan, parsed);
}

async function getProfileUsage(userId: string): Promise<ProfileUsageRow> {
  const { data, error } = await supabase
    .from("profiles")
    .select("outreach_count, last_reset")
    .eq("id", userId)
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Unable to read outreach usage.");
  }

  return {
    outreach_count: typeof data.outreach_count === "number" ? data.outreach_count : 0,
    last_reset: typeof data.last_reset === "string" ? data.last_reset : null
  };
}

export async function getOutreachUsage(userId: string, plan: PlanName): Promise<UsageResult> {
  try {
    const limits = PLAN_LIMITS[plan];
    const outreachLimit = getOutreachLimit(limits);
    const currentResetKey = getResetKey(plan);
    const usage = await getProfileUsage(userId);
    const lastResetKey = getLastResetKey(plan, usage.last_reset);

    let used = Math.max(0, usage.outreach_count ?? 0);
    if (lastResetKey !== currentResetKey) {
      const { error: resetError } = await supabase
        .from("profiles")
        .update({
          outreach_count: 0,
          last_reset: new Date().toISOString()
        })
        .eq("id", userId);

      if (resetError) {
        throw new Error(resetError.message);
      }
      used = 0;
    }

    const remaining = Math.max(0, outreachLimit.count - used);
    return {
      allowed: remaining > 0,
      used,
      remaining,
      limit: outreachLimit.count,
      period: outreachLimit.period
    };
  } catch (error) {
    return {
      allowed: false,
      used: 0,
      remaining: 0,
      limit: 0,
      period: "day",
      error: error instanceof Error ? error.message : "Unable to check outreach limits."
    };
  }
}

export async function incrementOutreachUsage(userId: string, plan: PlanName): Promise<UsageResult> {
  const usage = await getOutreachUsage(userId, plan);
  if (!usage.allowed) return usage;

  const nextCount = usage.used + 1;
  const { error } = await supabase
    .from("profiles")
    .update({
      outreach_count: nextCount,
      last_reset: new Date().toISOString()
    })
    .eq("id", userId);

  if (error) {
    return {
      ...usage,
      allowed: false,
      remaining: 0,
      error: error.message
    };
  }

  const remaining = Math.max(0, usage.limit - nextCount);
  return {
    ...usage,
    used: nextCount,
    remaining,
    allowed: remaining > 0
  };
}

