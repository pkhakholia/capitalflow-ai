"use client";

import { useCallback, useState } from "react";
import { useUserPlan } from "@/contexts/UserPlanContext";
import { canAccessFeature, type PlanType, type FeatureLimits } from "@/lib/featureAccess";

interface UseFeatureAccessReturn {
  canAccess: boolean;
  showUpgradeModal: boolean;
  requiredPlan: PlanType;
  checkAccess: (feature: keyof FeatureLimits) => boolean;
  openUpgradeModal: () => void;
  closeUpgradeModal: () => void;
}

export function useFeatureAccess(feature: keyof FeatureLimits): UseFeatureAccessReturn {
  const { userPlan } = useUserPlan();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const currentPlan: PlanType = userPlan?.plan || "free";
  const canAccess = canAccessFeature(currentPlan, feature);

  // Determine minimum required plan for this feature
  const getRequiredPlan = useCallback((): PlanType => {
    // Check if feature is available in pro
    if (canAccessFeature("pro", feature)) {
      return "pro";
    }
    // If not in pro, it must be gold
    return "gold";
  }, [feature]);

  const checkAccess = useCallback(
    (checkFeature: keyof FeatureLimits): boolean => {
      return canAccessFeature(currentPlan, checkFeature);
    },
    [currentPlan]
  );

  const openUpgradeModal = useCallback(() => {
    setShowUpgradeModal(true);
  }, []);

  const closeUpgradeModal = useCallback(() => {
    setShowUpgradeModal(false);
  }, []);

  return {
    canAccess,
    showUpgradeModal,
    requiredPlan: getRequiredPlan(),
    checkAccess,
    openUpgradeModal,
    closeUpgradeModal
  };
}
