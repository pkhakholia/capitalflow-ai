"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { SECTOR_OPTIONS, stages, type Sector } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { Logo } from "@/components/ui/Logo";

const COMPANY_TYPE_OPTIONS = [
  "Private Limited",
  "Proprietorship",
  "Partnership",
  "Public Limited",
  "Others"
] as const;

const TRACTION_STAGE_OPTIONS = [
  "Idea",
  "Proof of Concept",
  "Beta Launched",
  "Early Traction",
  "Steady Revenues",
  "Growth"
] as const;

const LINKEDIN_COMPANY_PREFIXES = [
  "https://linkedin.com/company/",
  "https://www.linkedin.com/company/"
] as const;

const currentYear = new Date().getFullYear();
const yearOptions = Array.from(
  { length: currentYear - 2000 + 1 },
  (_, index) => currentYear - index
);
const monthOptions = [
  { label: "Month", value: "" },
  { label: "Jan", value: "1" },
  { label: "Feb", value: "2" },
  { label: "Mar", value: "3" },
  { label: "Apr", value: "4" },
  { label: "May", value: "5" },
  { label: "Jun", value: "6" },
  { label: "Jul", value: "7" },
  { label: "Aug", value: "8" },
  { label: "Sep", value: "9" },
  { label: "Oct", value: "10" },
  { label: "Nov", value: "11" },
  { label: "Dec", value: "12" }
] as const;

const inputClassName =
  "h-auto w-full rounded-[6px] border border-[#CBD5E1] bg-white px-3 py-[9px] text-[13.5px] text-slate-900 outline-none transition placeholder:text-[#94A3B8] focus:border-[#4F46E5] focus:ring-4 focus:ring-[rgba(79,70,229,0.1)]";
const labelClassName = "mb-1.5 block text-[12.5px] font-medium text-[#334155]";
const helperClassName = "mt-1 text-[11.5px] text-[#94A3B8]";
const errorClassName = "mt-1 text-[11.5px] text-[#E11D48]";

const StartupFormSchema = z
  .object({
    companyName: z.string().min(1, "Company name is required."),
    website: z
      .string()
      .trim()
      .url("Please enter a valid URL.")
      .optional()
      .or(z.literal("")),
    contactEmail: z.string().email("Please enter a valid email."),
    sector: z.enum(SECTOR_OPTIONS),
    stage: z.enum(stages).refine((value) => value !== "Any", {
      message: "Please select a specific stage."
    }),
    country: z.string().trim().min(1, "Country is required."),
    city: z.string().trim().min(1, "City of operation is required."),
    company_type: z.enum(COMPANY_TYPE_OPTIONS),
    incorporation_month: z.string().optional(),
    incorporation_year: z.string().optional(),
    traction_stage: z.enum(TRACTION_STAGE_OPTIONS),
    monthly_revenue: z.preprocess(
      (value) => (value === "" || value == null ? undefined : Number(value)),
      z.number().positive("Monthly revenue must be a positive number.").optional()
    ),
    pre_money_valuation: z.preprocess(
      (value) => (value === "" || value == null ? undefined : Number(value)),
      z.number().positive("Pre-money valuation must be a positive number.").optional()
    ),
    linkedin_url: z.string().trim().optional(),
    fundingAskUsdMin: z.preprocess(
      (value) => Number(value),
      z.number().int().min(0, "Minimum ask must be 0 or higher.")
    ),
    fundingAskUsdMax: z.preprocess(
      (value) => Number(value),
      z.number().int().min(0, "Maximum ask must be 0 or higher.")
    ),
    productSummary: z.string().min(1, "Product summary is required."),
    tractionSummary: z.string().min(1, "Traction summary is required.")
  })
  .superRefine((values, ctx) => {
    const hasMonth = Boolean(values.incorporation_month);
    const hasYear = Boolean(values.incorporation_year);

    if (hasMonth !== hasYear) {
      const message = "Please select both incorporation month and year.";
      if (!hasMonth) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["incorporation_month"],
          message
        });
      }
      if (!hasYear) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["incorporation_year"],
          message
        });
      }
    }

    const linkedin = values.linkedin_url?.trim();
    if (
      linkedin &&
      !LINKEDIN_COMPANY_PREFIXES.some((prefix) => linkedin.startsWith(prefix))
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["linkedin_url"],
        message: "Please enter a valid LinkedIn company URL."
      });
    }
  });

type StartupFormValues = z.infer<typeof StartupFormSchema>;

function FieldShell({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

function InlineError({ message }: { message?: string }) {
  return message ? <p className={errorClassName}>{message}</p> : null;
}

export function StartupProfileForm({
  defaultSector = "B2B SaaS" as Sector
}: {
  defaultSector?: Sector;
}) {
  const router = useRouter();
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [pitchDeckFile, setPitchDeckFile] = React.useState<File | null>(null);
  const [pitchDeckError, setPitchDeckError] = React.useState<string | null>(null);

  const form = useForm<StartupFormValues>({
    resolver: zodResolver(StartupFormSchema) as any,
    defaultValues: {
      companyName: "",
      website: "",
      contactEmail: "",
      sector: SECTOR_OPTIONS.includes(defaultSector as (typeof SECTOR_OPTIONS)[number])
        ? (defaultSector as (typeof SECTOR_OPTIONS)[number])
        : "B2B SaaS",
      stage: "Seed",
      country: "",
      city: "",
      company_type: undefined,
      incorporation_month: "",
      incorporation_year: "",
      traction_stage: undefined,
      monthly_revenue: undefined,
      pre_money_valuation: undefined,
      linkedin_url: "",
      fundingAskUsdMin: 500000,
      fundingAskUsdMax: 1500000,
      productSummary: "",
      tractionSummary: ""
    }
  });

  React.useEffect(() => {
    const founderEmail = window.localStorage.getItem("vm_primary_founder_email");
    if (founderEmail && !form.getValues("contactEmail")) {
      form.setValue("contactEmail", founderEmail, { shouldDirty: false });
    }
  }, [form]);

  const onSubmit = async (values: StartupFormValues) => {
    setSubmitError(null);
    setPitchDeckError(null);

    let pitchDeckUrl: string | null = null;

    try {
      if (pitchDeckFile) {
        const isPdf =
          pitchDeckFile.type === "application/pdf" ||
          pitchDeckFile.name.toLowerCase().endsWith(".pdf");

        if (!isPdf) {
          setPitchDeckError("Only PDF files are allowed.");
          return;
        }

        if (pitchDeckFile.size > 10 * 1024 * 1024) {
          setPitchDeckError("File size must be 10MB or smaller.");
          return;
        }

        const filePath = `${crypto.randomUUID()}_${Date.now()}.pdf`;
        const { error: uploadError } = await supabase.storage
          .from("pitch-decks")
          .upload(filePath, pitchDeckFile, {
            contentType: "application/pdf",
            upsert: false
          });

        if (uploadError) {
          throw new Error(uploadError.message || "Failed to upload pitch deck.");
        }

        const { data } = supabase.storage.from("pitch-decks").getPublicUrl(filePath);
        pitchDeckUrl = data.publicUrl;
      }

      const founderName =
        window.localStorage.getItem("vm_primary_founder_name") ||
        values.contactEmail;

      const startupInsert = {
        startup_name: values.companyName,
        founder_name: founderName,
        industry: values.sector,
        stage: values.stage,
        funding_required: Math.max(values.fundingAskUsdMin, values.fundingAskUsdMax),
        revenue: values.monthly_revenue ?? 0,
        growth_rate: 0,
        description: `${values.productSummary}\n\nTraction: ${values.tractionSummary}`,
        pitch_deck_url: pitchDeckUrl,
        country: values.country,
        city: values.city,
        company_type: values.company_type,
        monthly_revenue: values.monthly_revenue ?? null,
        pre_money_valuation: values.pre_money_valuation ?? null,
        linkedin_url: values.linkedin_url?.trim() || null,
        incorporation_month: values.incorporation_month
          ? Number(values.incorporation_month)
          : null,
        incorporation_year: values.incorporation_year
          ? Number(values.incorporation_year)
          : null,
        traction_stage: values.traction_stage
      };

      const { data: newStartup, error } = await supabase
        .from("Startups")
        .insert([startupInsert])
        .select("id")
        .single();

      if (error || !newStartup) {
        throw new Error(error?.message || "Failed to save startup profile.");
      }

      window.localStorage.setItem("vm_startup_id", newStartup.id);

      const sessionToken = window.localStorage.getItem("vm_session_token");
      if (sessionToken) {
        const { error: linkError } = await supabase
          .from("founders")
          .update({ startup_id: newStartup.id })
          .eq("session_token", sessionToken);

        if (!linkError) {
          window.localStorage.removeItem("vm_session_token");
          window.localStorage.removeItem("vm_primary_founder_email");
          window.localStorage.removeItem("vm_primary_founder_name");
        } else {
          console.error("FOUNDER LINK ERROR:", linkError);
        }
      }

      router.push("/startup/traction");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong saving your profile. Please try again.";

      if (message.includes("Pitch deck") || message.includes("upload")) {
        setPitchDeckError(message);
      } else {
        setSubmitError("Something went wrong saving your profile. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-6 py-10 font-[family-name:var(--font-dm-sans)] text-slate-900">
      <div className="mx-auto max-w-[680px]">
        <div className="mb-8">
          <div className="mb-6 flex justify-start">
            <Logo priority />
          </div>

          <div className="mb-7">
            <p className="mb-2 text-[13px] text-[#64748B]">Step 2 of 3</p>
            <div className="h-1 w-full overflow-hidden rounded-full bg-[#F1F5F9]">
              <div className="h-full w-2/3 rounded-full bg-[#4F46E5]" />
            </div>
          </div>

          <h1 className="font-[family-name:var(--font-fraunces)] text-[26px] font-semibold tracking-[-0.5px] text-slate-900">
            Tell us about your CapitalFlow AI startup
          </h1>
          <p className="mt-2 text-[14px] leading-6 text-[#64748B]">
            Add the core company details investors expect before we dive into your
            traction and defensibility.
          </p>
        </div>

        <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
          <section className="rounded-2xl border border-[#CBD5E1] bg-white p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldShell>
                <label className={labelClassName} htmlFor="companyName">
                  Company Name <span className="ml-0.5 text-[#E11D48]">*</span>
                </label>
                <input
                  id="companyName"
                  className={inputClassName}
                  placeholder="CascadeHQ"
                  {...form.register("companyName")}
                />
                <InlineError message={form.formState.errors.companyName?.message} />
              </FieldShell>

              <FieldShell>
                <label className={labelClassName} htmlFor="contactEmail">
                  Contact Email <span className="ml-0.5 text-[#E11D48]">*</span>
                </label>
                <input
                  id="contactEmail"
                  className={inputClassName}
                  placeholder="founders@company.com"
                  {...form.register("contactEmail")}
                />
                <InlineError message={form.formState.errors.contactEmail?.message} />
              </FieldShell>

              <FieldShell className="sm:col-span-2">
                <label className={labelClassName} htmlFor="website">
                  Website
                </label>
                <input
                  id="website"
                  className={inputClassName}
                  placeholder="https://company.com"
                  {...form.register("website")}
                />
                <InlineError message={form.formState.errors.website?.message} />
              </FieldShell>

              <FieldShell>
                <label className={labelClassName} htmlFor="sector">
                  Sector <span className="ml-0.5 text-[#E11D48]">*</span>
                </label>
                <select id="sector" className={inputClassName} {...form.register("sector")}>
                  {SECTOR_OPTIONS.map((sector) => (
                    <option key={sector} value={sector}>
                      {sector}
                    </option>
                  ))}
                </select>
                <InlineError message={form.formState.errors.sector?.message} />
              </FieldShell>

              <FieldShell>
                <label className={labelClassName} htmlFor="stage">
                  Stage <span className="ml-0.5 text-[#E11D48]">*</span>
                </label>
                <select id="stage" className={inputClassName} {...form.register("stage")}>
                  {stages
                    .filter((stage) => stage !== "Any")
                    .map((stage) => (
                      <option key={stage} value={stage}>
                        {stage}
                      </option>
                    ))}
                </select>
                <InlineError message={form.formState.errors.stage?.message} />
              </FieldShell>
            </div>

            <div className="mt-8">
              <div className="mb-4 border-b border-[#F1F5F9] pb-[10px] text-[13px] font-semibold uppercase tracking-[0.6px] text-[#334155]">
                Company Details
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FieldShell>
                  <label className={labelClassName} htmlFor="country">
                    Country <span className="ml-0.5 text-[#E11D48]">*</span>
                  </label>
                  <input
                    id="country"
                    className={inputClassName}
                    placeholder="e.g. India"
                    {...form.register("country")}
                  />
                  <InlineError message={form.formState.errors.country?.message} />
                </FieldShell>

                <FieldShell>
                  <label className={labelClassName} htmlFor="city">
                    City of Operation <span className="ml-0.5 text-[#E11D48]">*</span>
                  </label>
                  <input
                    id="city"
                    className={inputClassName}
                    placeholder="e.g. Bangalore"
                    {...form.register("city")}
                  />
                  <InlineError message={form.formState.errors.city?.message} />
                </FieldShell>

                <FieldShell>
                  <label className={labelClassName} htmlFor="company_type">
                    Company Type <span className="ml-0.5 text-[#E11D48]">*</span>
                  </label>
                  <select
                    id="company_type"
                    className={inputClassName}
        {...form.register("company_type")}
                  >
                    <option disabled value="">
                      Select company type
                    </option>
                    {COMPANY_TYPE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <InlineError message={form.formState.errors.company_type?.message} />
                </FieldShell>

                <FieldShell>
                  <span className={labelClassName}>Month & Year of Incorporation</span>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <select
                        className={inputClassName}
                        {...form.register("incorporation_month")}
                      >
                        {monthOptions.map((option) => (
                          <option key={option.label} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <select
                        className={inputClassName}
                        {...form.register("incorporation_year")}
                      >
                        <option value="">Year</option>
                        {yearOptions.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <InlineError
                    message={
                      form.formState.errors.incorporation_month?.message ||
                      form.formState.errors.incorporation_year?.message
                    }
                  />
                </FieldShell>

                <FieldShell>
                  <label className={labelClassName} htmlFor="traction_stage">
                    Traction Stage <span className="ml-0.5 text-[#E11D48]">*</span>
                  </label>
                  <select
                    id="traction_stage"
                    className={inputClassName}
        {...form.register("traction_stage")}
                  >
                    <option disabled value="">
                      Select traction stage
                    </option>
                    {TRACTION_STAGE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <InlineError message={form.formState.errors.traction_stage?.message} />
                </FieldShell>

                <FieldShell>
                  <label className={labelClassName} htmlFor="monthly_revenue">
                    Monthly Revenue (₹)
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13.5px] text-[#64748B]">
                      ₹
                    </span>
                    <input
                      id="monthly_revenue"
                      className={`${inputClassName} pl-6`}
                      inputMode="numeric"
                      placeholder="e.g. 400000"
                      type="number"
                      {...form.register("monthly_revenue")}
                    />
                  </div>
                  <p className={helperClassName}>Leave blank if pre-revenue</p>
                  <InlineError message={form.formState.errors.monthly_revenue?.message} />
                </FieldShell>

                <FieldShell>
                  <label className={labelClassName} htmlFor="pre_money_valuation">
                    Pre-Money Valuation (₹)
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13.5px] text-[#64748B]">
                      ₹
                    </span>
                    <input
                      id="pre_money_valuation"
                      className={`${inputClassName} pl-6`}
                      inputMode="numeric"
                      placeholder="e.g. 10000000"
                      type="number"
                      {...form.register("pre_money_valuation")}
                    />
                  </div>
                  <p className={helperClassName}>
                    Optional — your current round valuation
                  </p>
                  <InlineError
                    message={form.formState.errors.pre_money_valuation?.message}
                  />
                </FieldShell>

                <FieldShell>
                  <label className={labelClassName} htmlFor="linkedin_url">
                    LinkedIn Company URL
                  </label>
                  <input
                    id="linkedin_url"
                    className={inputClassName}
                    placeholder="https://linkedin.com/company/yourcompany"
                    {...form.register("linkedin_url")}
                  />
                  <InlineError message={form.formState.errors.linkedin_url?.message} />
                </FieldShell>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <FieldShell>
                <label className={labelClassName}>Funding Ask (USD)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className={inputClassName}
                    inputMode="numeric"
                    min={0}
                    placeholder="Min"
                    type="number"
                    {...form.register("fundingAskUsdMin")}
                  />
                  <input
                    className={inputClassName}
                    inputMode="numeric"
                    min={0}
                    placeholder="Max"
                    type="number"
                    {...form.register("fundingAskUsdMax")}
                  />
                </div>
                <InlineError message={form.formState.errors.fundingAskUsdMin?.message} />
                <InlineError message={form.formState.errors.fundingAskUsdMax?.message} />
              </FieldShell>

              <FieldShell>
                <label className={labelClassName} htmlFor="pitchDeck">
                  Pitch Deck (PDF only, max 10MB)
                </label>
                <input
                  id="pitchDeck"
                  className={inputClassName}
                  accept="application/pdf,.pdf"
                  type="file"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    if (!file) {
                      setPitchDeckFile(null);
                      setPitchDeckError(null);
                      return;
                    }

                    const isPdf =
                      file.type === "application/pdf" ||
                      file.name.toLowerCase().endsWith(".pdf");
                    if (!isPdf) {
                      setPitchDeckFile(null);
                      setPitchDeckError("Only PDF files are allowed.");
                      return;
                    }

                    if (file.size > 10 * 1024 * 1024) {
                      setPitchDeckFile(null);
                      setPitchDeckError("File size must be 10MB or smaller.");
                      return;
                    }

                    setPitchDeckFile(file);
                    setPitchDeckError(null);
                  }}
                />
                {pitchDeckError ? <p className={errorClassName}>{pitchDeckError}</p> : null}
              </FieldShell>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <FieldShell>
                <label className={labelClassName} htmlFor="productSummary">
                  Product Summary <span className="ml-0.5 text-[#E11D48]">*</span>
                </label>
                <textarea
                  id="productSummary"
                  className={`${inputClassName} min-h-[120px] resize-y py-2`}
                  placeholder="What you build and who it's for..."
                  {...form.register("productSummary")}
                />
                <InlineError message={form.formState.errors.productSummary?.message} />
              </FieldShell>

              <FieldShell>
                <label className={labelClassName} htmlFor="tractionSummary">
                  Traction Summary <span className="ml-0.5 text-[#E11D48]">*</span>
                </label>
                <textarea
                  id="tractionSummary"
                  className={`${inputClassName} min-h-[120px] resize-y py-2`}
                  placeholder="MRR, pilots, retention, users..."
                  {...form.register("tractionSummary")}
                />
                <InlineError message={form.formState.errors.tractionSummary?.message} />
              </FieldShell>
            </div>
          </section>

          {submitError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-600">
              {submitError}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-[12px] text-[#64748B]">
              Already have an investor profile?{" "}
              <Link className="font-medium text-[#4F46E5]" href="/investor-signup">
                Create it here
              </Link>
              .
            </div>

            <button
              className="flex h-[52px] items-center justify-center rounded-[10px] bg-[#4F46E5] px-6 text-[15px] font-semibold text-white transition hover:bg-[#4338CA] disabled:cursor-not-allowed disabled:opacity-80"
              disabled={form.formState.isSubmitting}
              type="submit"
            >
              {form.formState.isSubmitting ? "Saving..." : "Save & Continue ->"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
