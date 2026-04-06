import { z } from "zod";

import { investorRoles, investorSectorOptions, investorTypes, regions, sectors, stages } from "@/lib/types";

export const SectorSchema = z.enum(sectors);
export const StageSchema = z.enum(stages);
export const RegionSchema = z.enum(regions);
export const InvestorTypeSchema = z.enum(investorTypes);
export const InvestorRoleSchema = z.enum(investorRoles);
export const InvestorSectorSchema = z.enum(investorSectorOptions);

export const StartupProfileSchema = z.object({
  id: z.string().min(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),

  companyName: z.string().min(1),
  website: z.string().url().optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  contactEmail: z.string().email(),
  pitchDeckUrl: z
    .string()
    .url()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  country: z.string().optional(),
  city: z.string().optional(),
  company_type: z
    .enum([
      "Private Limited",
      "Proprietorship",
      "Partnership",
      "Public Limited",
      "Others"
    ])
    .optional(),
  monthly_revenue: z.number().nonnegative().optional().or(z.literal("")),
  pre_money_valuation: z.number().nonnegative().optional().or(z.literal("")),
  linkedin_url: z.string().url().optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  incorporation_month: z.number().int().min(1).max(12).optional().or(z.literal("")),
  incorporation_year: z.number().int().min(2000).optional().or(z.literal("")),
  traction_stage: z
    .enum([
      "Idea",
      "Proof of Concept",
      "Beta Launched",
      "Early Traction",
      "Steady Revenues",
      "Growth"
    ])
    .optional(),
  moat: z.string().optional(),
  prior_exit: z.boolean().optional(),
  revenue_growth_mom: z.number().nonnegative().optional().or(z.literal("")),

  sector: SectorSchema,
  stage: StageSchema.exclude(["Any"]),
  regions: z.array(RegionSchema).min(1),

  fundingAskUsdMin: z.number().int().min(0),
  fundingAskUsdMax: z.number().int().min(0),

  tractionSummary: z.string().min(1),
  productSummary: z.string().min(1)
});

export const InvestorProfileSchema = z.object({
  id: z.string().min(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),

  firstName: z.string().trim().min(1, "First name is required."),
  lastName: z.string().trim().min(1, "Last name is required."),
  investorType: InvestorTypeSchema,
  role: InvestorRoleSchema,

  firmName: z.string().min(1),
  website: z.string().url().optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  contactEmail: z.string().email(),

  sectorFocus: z.array(InvestorSectorSchema).min(1),
  stageFocus: z.array(StageSchema).min(1),
  regions: z.array(RegionSchema).min(1),

  checkSizeUsdMin: z.number().int().min(0),
  checkSizeUsdMax: z.number().int().min(0),

  thesisSummary: z.string().min(1),
  valueAddSummary: z.string().optional()
});

export const StartupProfileInputSchema = StartupProfileSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const InvestorProfileInputSchema = InvestorProfileSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

