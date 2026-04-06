export interface PlanFeatures {
  outreach: string;
  aiMatching: string;
  aiAnalyzer: string;
  pitchBuilder: string;
  investorSearch: string;
}

export interface Plan {
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  mostPopular?: boolean;
  features: PlanFeatures;
}

export const plans: Plan[] = [
  {
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: {
      outreach: "1/month",
      aiMatching: "-",
      aiAnalyzer: "-",
      pitchBuilder: "-",
      investorSearch: "1 filter/search"
    }
  },
  {
    name: "Flow Pro",
    monthlyPrice: 1500,
    yearlyPrice: 13500,
    features: {
      outreach: "5/day",
      aiMatching: "3 matches",
      aiAnalyzer: "-",
      pitchBuilder: "-",
      investorSearch: "3 filters/search"
    }
  },
  {
    name: "Flow Gold",
    monthlyPrice: 6000,
    yearlyPrice: 54000,
    mostPopular: true,
    features: {
      outreach: "15/day",
      aiMatching: "5 matches",
      aiAnalyzer: "Yes",
      pitchBuilder: "Yes",
      investorSearch: "Unlimited"
    }
  }
];

export const featureLabels: Record<keyof PlanFeatures, string> = {
  outreach: "Investor Outreach",
  aiMatching: "AI Matching",
  aiAnalyzer: "AI Pitch Deck Analyzer",
  pitchBuilder: "Pitch Builder",
  investorSearch: "Investor Search"
};
