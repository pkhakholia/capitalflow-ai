export const SECTOR_OPTIONS = [
  "Aerospace, Maritime & Defense",
  "Adtech",
  "AgriTech",
  "AI/ML",
  "Autotech",
  "B2B SaaS",
  "Blockchain",
  "Chemicals",
  "Cleantech",
  "Consumer Internet",
  "Consumer Products",
  "Creator Economy",
  "Cybersecurity",
  "D2C",
  "DeepTech",
  "E-commerce",
  "Edtech",
  "Energytech",
  "Enterprise Solutions",
  "EV",
  "Fintech",
  "Gaming",
  "Gig Economy",
  "HRtech",
  "Healthtech",
  "Insurtech",
  "Jobtech",
  "Legaltech",
  "Life Sciences",
  "Logistics",
  "Mobility",
  "Nanotech",
  "Online Dating",
  "Pet Care",
  "Quick Commerce",
  "Real Estate",
  "Religion Tech",
  "Retail",
  "SaaS",
  "Semiconductors",
  "Social Media",
  "Sportstech",
  "Telecom",
  "Web 3.0"
] as const;

export const sectors = [
  "AI/ML",
  "B2B SaaS",
  "Consumer",
  "Climate",
  "FinTech",
  "HealthTech",
  "DevTools",
  "Marketplace",
  "Web3",
  "Other"
] as const;

export type Sector = (typeof sectors)[number];

export const investorTypes = [
  "VC",
  "CVC",
  "Family Office",
  "MicroVC",
  "Angel",
  "Venture Studio"
] as const;

export type InvestorType = (typeof investorTypes)[number];

export const investorRoles = [
  "Scout",
  "Analyst",
  "Associate",
  "Sr Associate",
  "VP",
  "Principal",
  "Partner",
  "GP",
  "MD",
  "Admin",
  "Portfolio Success"
] as const;

export type InvestorRole = (typeof investorRoles)[number];

export const investorSectorOptions = [
  "Defensetech",
  "Adtech",
  "Agritech",
  "AI/ML",
  "B2B SaaS",
  "Blockchain",
  "Climatetech",
  "Consumer Internet",
  "Consumer Products",
  "Cybersecurity",
  "D2C",
  "Deeptech",
  "E-Commerce",
  "QuickCommerce",
  "Edtech",
  "Energytech",
  "Enterprise solutions",
  "EV",
  "Fintech",
  "Gaming",
  "HRtech",
  "Healthtech",
  "Jobtech",
  "Legaltech",
  "Logistics",
  "Mobility",
  "Sportstech",
  "Semiconductors",
  "Others"
] as const;

export type InvestorSector = (typeof investorSectorOptions)[number];

export const stages = [
  "Pre-seed",
  "Seed",
  "Series A",
  "Series B",
  "Growth",
  "Any"
] as const;

export type Stage = (typeof stages)[number];

export const regions = [
  "North America",
  "Europe",
  "LATAM",
  "MENA",
  "Africa",
  "APAC",
  "Remote/Global"
] as const;

export type Region = (typeof regions)[number];

export type StartupProfile = {
  id: string;
  createdAt: string;
  updatedAt: string;

  companyName: string;
  website?: string;
  contactEmail: string;
  pitchDeckUrl?: string;
  country?: string;
  city?: string;
  company_type?:
    | "Private Limited"
    | "Proprietorship"
    | "Partnership"
    | "Public Limited"
    | "Others";
  monthly_revenue?: number | "";
  pre_money_valuation?: number | "";
  linkedin_url?: string;
  incorporation_month?: number | "";
  incorporation_year?: number | "";
  traction_stage?:
    | "Idea"
    | "Proof of Concept"
    | "Beta Launched"
    | "Early Traction"
    | "Steady Revenues"
    | "Growth";
  moat?: string;
  prior_exit?: boolean;
  revenue_growth_mom?: number | "";

  sector: Sector;
  stage: Exclude<Stage, "Any">;
  regions: Region[];
  embedding?: number[];

  fundingAskUsdMin: number;
  fundingAskUsdMax: number;

  tractionSummary: string;
  productSummary: string;
};

export type InvestorProfile = {
  id: string;
  createdAt: string;
  updatedAt: string;

  firstName: string;
  lastName: string;
  investorType: InvestorType;
  role: InvestorRole;

  firmName: string;
  website?: string;
  contactEmail: string;

  sectorFocus: InvestorSector[];
  stageFocus: Stage[];
  regions: Region[];
  embedding?: number[];

  checkSizeUsdMin: number;
  checkSizeUsdMax: number;

  thesisSummary: string;
  valueAddSummary?: string;
};

export type MatchReason = {
  label: string;
  detail: string;
  weight: number;
};

export type MatchResult = {
  id: string;
  score: number; // 0..100
  startup: StartupProfile;
  investor: InvestorProfile;
  explanation: string[];
  reasons: MatchReason[];
};
