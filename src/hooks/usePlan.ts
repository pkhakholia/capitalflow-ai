"use client";

import { useMemo } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { PLAN_LIMITS, type PlanName, type SubscriptionStatus } from "@/lib/planLimits";

export function usePlan() {
  const { profile } = useAuth();

  const plan = (profile?.plan as PlanName | undefined) || "free";
  const subscriptionStatus = (profile?.subscription_status as SubscriptionStatus | undefined) || "inactive";

  const limits = useMemo(() => PLAN_LIMITS[plan], [plan]);
  const isPaidPlan = plan !== "free" && subscriptionStatus === "active";

  return { plan, subscriptionStatus, limits, isPaidPlan };
}

