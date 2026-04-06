"use client";

import * as React from "react";
import { createContext, useContext, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { PlanType } from "@/lib/featureAccess";

interface UserPlan {
  plan: PlanType;
  subscriptionStatus: "active" | "inactive" | "cancelled" | null;
  subscriptionEnd: string | null;
}

interface UserPlanContextType {
  userPlan: UserPlan | null;
  isLoading: boolean;
  fetchUserPlan: (userId: string) => Promise<void>;
  updateUserPlan: (plan: PlanType) => void;
  clearUserPlan: () => void;
}

const UserPlanContext = createContext<UserPlanContextType | undefined>(undefined);

export function UserPlanProvider({ children }: { children: React.ReactNode }) {
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUserPlan = useCallback(async (userId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("plan, subscription_status, subscription_end")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching user plan:", error);
        // Default to free if error
        setUserPlan({
          plan: "free",
          subscriptionStatus: null,
          subscriptionEnd: null
        });
        return;
      }

      setUserPlan({
        plan: (data?.plan as PlanType) || "free",
        subscriptionStatus: data?.subscription_status || null,
        subscriptionEnd: data?.subscription_end || null
      });
    } catch (error) {
      console.error("Error in fetchUserPlan:", error);
      setUserPlan({
        plan: "free",
        subscriptionStatus: null,
        subscriptionEnd: null
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateUserPlan = useCallback((plan: PlanType) => {
    setUserPlan((prev) =>
      prev
        ? { ...prev, plan, subscriptionStatus: "active" }
        : { plan, subscriptionStatus: "active", subscriptionEnd: null }
    );
  }, []);

  const clearUserPlan = useCallback(() => {
    setUserPlan(null);
  }, []);

  return (
    <UserPlanContext.Provider
      value={{ userPlan, isLoading, fetchUserPlan, updateUserPlan, clearUserPlan }}
    >
      {children}
    </UserPlanContext.Provider>
  );
}

export function useUserPlan() {
  const context = useContext(UserPlanContext);
  if (context === undefined) {
    throw new Error("useUserPlan must be used within a UserPlanProvider");
  }
  return context;
}
