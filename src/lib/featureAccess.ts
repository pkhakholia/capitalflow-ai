export type PlanType = "free" | "pro" | "gold";

export interface FeatureLimits {
  outreach: number | "unlimited"; // per day/month depending on plan
  aiMatching: number | "unlimited"; // per month
  aiAnalyzer: boolean;
  pitchBuilder: boolean;
  investorSearch: number | "unlimited"; // max filters
}

export interface PlanConfig {
  name: string;
  displayName: string;
  limits: FeatureLimits;
  price: {
    monthly: number;
    yearly: number;
  };
}

export const featureAccess: Record<PlanType, PlanConfig> = {
  free: {
    name: "free",
    displayName: "Free",
    limits: {
      outreach: 1, // 1 per month for free
      aiMatching: 0,
      aiAnalyzer: false,
      pitchBuilder: false,
      investorSearch: 1
    },
    price: {
      monthly: 0,
      yearly: 0
    }
  },
  pro: {
    name: "pro",
    displayName: "Flow Pro",
    limits: {
      outreach: 5,
      aiMatching: 3,
      aiAnalyzer: false,
      pitchBuilder: false,
      investorSearch: 3
    },
    price: {
      monthly: 1500,
      yearly: 13500
    }
  },
  gold: {
    name: "gold",
    displayName: "Flow Gold",
    limits: {
      outreach: 15,
      aiMatching: 5,
      aiAnalyzer: true,
      pitchBuilder: true,
      investorSearch: "unlimited"
    },
    price: {
      monthly: 6000,
      yearly: 54000
    }
  }
};

export function getFeatureLimit(plan: PlanType, feature: keyof FeatureLimits): number | boolean | "unlimited" {
  return featureAccess[plan].limits[feature];
}

export function canAccessFeature(plan: PlanType, feature: keyof FeatureLimits): boolean {
  const limit = getFeatureLimit(plan, feature);

  if (typeof limit === "boolean") {
    return limit;
  }

  if (typeof limit === "number") {
    return limit > 0;
  }

  return limit === "unlimited";
}

export function formatLimit(value: number | boolean | "unlimited"): string {
  if (value === true) return "Unlimited";
  if (value === false) return "-";
  if (value === "unlimited") return "Unlimited";
  if (value === 0) return "-";
  return value.toString();
}