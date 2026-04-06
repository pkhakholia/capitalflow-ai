"use client";

import { useState } from "react";
import { useUserPlan } from "@/contexts/UserPlanContext";
import { supabase } from "@/lib/supabase";
import type { PlanType } from "@/lib/featureAccess";

interface DevUpgradeButtonProps {
  className?: string;
}

export function DevUpgradeButton({ className = "" }: DevUpgradeButtonProps) {
  const { userPlan, updateUserPlan } = useUserPlan();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [message, setMessage] = useState<string>("");

  const handleUpgrade = async (plan: PlanType) => {
    setIsUpgrading(true);
    setMessage("");

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setMessage("No user logged in");
        return;
      }

      // Update profile in database
      const { error } = await supabase
        .from("profiles")
        .update({
          plan: plan,
          subscription_status: "active",
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id);

      if (error) {
        console.error("Error upgrading plan:", error);
        setMessage(`Error: ${error.message}`);
        return;
      }

      // Update local state
      updateUserPlan(plan);
      setMessage(`Upgraded to ${plan}!`);
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error in dev upgrade:", error);
      setMessage("Upgrade failed");
    } finally {
      setIsUpgrading(false);
    }
  };

  const currentPlan = userPlan?.plan || "free";

  return (
    <div className={`rounded-lg border border-amber-200 bg-amber-50 p-4 ${className}`}>
      <h3 className="mb-2 text-sm font-semibold text-amber-900">
        🛠️ Dev Mode: Plan Override
      </h3>
      <p className="mb-3 text-xs text-amber-700">
        Current plan: <span className="font-semibold capitalize">{currentPlan}</span>
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleUpgrade("free")}
          disabled={isUpgrading || currentPlan === "free"}
          className="rounded-md bg-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-300 disabled:opacity-50"
        >
          Free
        </button>
        <button
          onClick={() => handleUpgrade("pro")}
          disabled={isUpgrading || currentPlan === "pro"}
          className="rounded-md bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-200 disabled:opacity-50"
        >
          Pro
        </button>
        <button
          onClick={() => handleUpgrade("gold")}
          disabled={isUpgrading || currentPlan === "gold"}
          className="rounded-md bg-purple-100 px-3 py-1.5 text-xs font-medium text-purple-700 transition-colors hover:bg-purple-200 disabled:opacity-50"
        >
          Gold
        </button>
      </div>
      {message && (
        <p className="mt-2 text-xs font-medium text-green-600">{message}</p>
      )}
    </div>
  );
}
