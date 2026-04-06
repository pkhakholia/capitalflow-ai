"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { supabase } from "@/lib/supabase";
import { Logo } from "@/components/ui/Logo";

const textareaClassName =
  "min-h-[120px] w-full resize-y rounded-[6px] border border-[#CBD5E1] bg-white px-3 py-[9px] text-[13.5px] text-slate-900 outline-none transition placeholder:text-[#94A3B8] focus:border-[#4F46E5] focus:ring-4 focus:ring-[rgba(79,70,229,0.1)]";
const inputClassName =
  "h-auto w-full rounded-[6px] border border-[#CBD5E1] bg-white px-3 py-[9px] text-[13.5px] text-slate-900 outline-none transition placeholder:text-[#94A3B8] focus:border-[#4F46E5] focus:ring-4 focus:ring-[rgba(79,70,229,0.1)]";

type TractionFormErrors = {
  moat?: string;
  prior_exit?: string;
  revenue_growth_mom?: string;
};

export default function StartupTractionPage() {
  const router = useRouter();
  const [startupId, setStartupId] = React.useState<string | null>(null);
  const [moat, setMoat] = React.useState("");
  const [priorExit, setPriorExit] = React.useState<boolean | null>(null);
  const [revenueGrowthMom, setRevenueGrowthMom] = React.useState("");
  const [errors, setErrors] = React.useState<TractionFormErrors>({});
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    const savedStartupId = localStorage.getItem("vm_startup_id");
    if (!savedStartupId) {
      router.push("/startup");
      return;
    }

    setStartupId(savedStartupId);
  }, [router]);

  const validate = (): TractionFormErrors => {
    const nextErrors: TractionFormErrors = {};

    if (moat.trim().length < 20) {
      nextErrors.moat = "Please enter at least 20 characters.";
    } else if (moat.trim().length > 500) {
      nextErrors.moat = "Moat must be 500 characters or fewer.";
    }

    if (priorExit === null) {
      nextErrors.prior_exit = "Please select one option.";
    }

    if (revenueGrowthMom !== "") {
      const numericValue = Number(revenueGrowthMom);
      if (!Number.isFinite(numericValue) || numericValue < 0) {
        nextErrors.revenue_growth_mom =
          "Revenue growth rate must be 0 or greater.";
      }
    }

    return nextErrors;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const savedStartupId = localStorage.getItem("vm_startup_id");
    if (!savedStartupId) {
      router.push("/startup");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("Startups")
        .update({
          moat: moat.trim(),
          prior_exit: priorExit,
          revenue_growth_mom:
            revenueGrowthMom === "" ? null : Number(revenueGrowthMom)
        })
        .eq("id", savedStartupId);

      if (error) {
        setSubmitError(
          "Something went wrong saving your profile. Please try again."
        );
        return;
      }

      localStorage.removeItem("vm_startup_id");
      router.push("/dashboard");
    } catch {
      setSubmitError("Something went wrong saving your profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!startupId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-6 py-10 font-[family-name:var(--font-dm-sans)] text-slate-900">
      <div className="mx-auto max-w-[680px]">
        <div className="mb-8">
          <div className="mb-6 flex justify-start">
            <Logo priority />
          </div>

          <div className="mb-7">
            <p className="mb-2 text-[13px] text-[#64748B]">Step 3 of 3</p>
            <div className="h-1 w-full overflow-hidden rounded-full bg-[#F1F5F9]">
              <div className="h-full w-full rounded-full bg-[#4F46E5]" />
            </div>
          </div>

          <h1 className="font-[family-name:var(--font-fraunces)] text-[26px] font-semibold tracking-[-0.5px] text-slate-900">
            Tell us about your traction
          </h1>
          <p className="mt-2 text-[14px] leading-6 text-[#64748B]">
            This helps investors understand your momentum and competitive
            position.
          </p>
        </div>

        <form
          className="rounded-2xl border border-[#CBD5E1] bg-white p-8"
          onSubmit={handleSubmit}
        >
          <div className="space-y-6">
            <div>
              <label
                className="mb-1.5 block text-[13.5px] font-semibold text-[#334155]"
                htmlFor="moat"
              >
                What is your competitive moat?{" "}
                <span className="text-[#E11D48]">*</span>
              </label>
              <p className="mb-2.5 text-[12.5px] leading-5 text-[#94A3B8]">
                Describe what makes you defensible — network effects,
                proprietary data, switching costs, patents, brand,
                distribution, etc.
              </p>
              <textarea
                id="moat"
                className={textareaClassName}
                maxLength={500}
                placeholder="e.g. We have 3 years of proprietary soil data across 50,000 farms that competitors cannot replicate. Our farmer relationships create strong switching costs..."
                value={moat}
                onChange={(event) => {
                  setMoat(event.target.value);
                  setErrors((current) => ({ ...current, moat: undefined }));
                }}
              />
              <div className="mt-1 text-right text-[11.5px] text-[#94A3B8]">
                {moat.length} / 500 characters
              </div>
              {errors.moat ? (
                <p className="mt-1 text-[11.5px] text-[#E11D48]">{errors.moat}</p>
              ) : null}
            </div>

            <div>
              <div className="mb-3 text-[13.5px] font-semibold text-[#334155]">
                Has any founder previously founded or exited a company?
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-3">
                {[
                  {
                    label: "Yes — one or more founders have",
                    value: true
                  },
                  {
                    label: "No — this is our first venture",
                    value: false
                  }
                ].map((option) => {
                  const selected = priorExit === option.value;
                  return (
                    <button
                      key={option.label}
                      className={`flex flex-1 items-center gap-2.5 rounded-[10px] border-[1.5px] px-5 py-3.5 text-left transition ${
                        selected
                          ? "border-[#4F46E5] bg-[#EEF2FF]"
                          : "border-[#CBD5E1] bg-white"
                      }`}
                      type="button"
                      onClick={() => {
                        setPriorExit(option.value);
                        setErrors((current) => ({
                          ...current,
                          prior_exit: undefined
                        }));
                      }}
                    >
                      <span className="flex h-4 w-4 items-center justify-center rounded-full border-[1.5px] border-[#CBD5E1] bg-white">
                        {selected ? (
                          <span className="h-2 w-2 rounded-full bg-[#4F46E5]" />
                        ) : null}
                      </span>
                      <span className="text-[14px] font-medium text-[#334155]">
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              {errors.prior_exit ? (
                <p className="mt-1 text-[11.5px] text-[#E11D48]">
                  {errors.prior_exit}
                </p>
              ) : null}
            </div>

            <div>
              <label
                className="mb-1.5 block text-[13.5px] font-semibold text-[#334155]"
                htmlFor="revenue_growth_mom"
              >
                Month-on-Month revenue growth rate
              </label>
              <p className="mb-2.5 text-[12.5px] leading-5 text-[#94A3B8]">
                Your average MoM revenue growth over the last 3 months. Leave
                blank if pre-revenue.
              </p>
              <div className="relative">
                <input
                  id="revenue_growth_mom"
                  className={`${inputClassName} pr-9`}
                  max={10000}
                  min={0}
                  placeholder="e.g. 25"
                  type="number"
                  value={revenueGrowthMom}
                  onChange={(event) => {
                    setRevenueGrowthMom(event.target.value);
                    setErrors((current) => ({
                      ...current,
                      revenue_growth_mom: undefined
                    }));
                  }}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[13.5px] text-[#64748B]">
                  %
                </span>
              </div>
              {errors.revenue_growth_mom ? (
                <p className="mt-1 text-[11.5px] text-[#E11D48]">
                  {errors.revenue_growth_mom}
                </p>
              ) : null}
            </div>
          </div>

          {submitError ? (
            <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-600">
              {submitError}
            </div>
          ) : null}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              className="rounded-lg border border-[#CBD5E1] px-6 py-2.5 text-[14px] text-[#64748B] transition hover:bg-slate-50"
              type="button"
              onClick={() => router.back()}
            >
              {"<- Back"}
            </button>

            <button
              className="flex items-center justify-center gap-2 rounded-lg bg-[#4F46E5] px-7 py-2.5 text-[14px] font-semibold text-white transition hover:bg-[#4338CA] disabled:cursor-not-allowed disabled:opacity-80"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Saving...
                </>
              ) : (
                "Complete Profile ->"
              )}
            </button>
          </div>

          <p className="mt-6 text-center text-[12px] text-[#64748B]">
            You can always update these details from your dashboard.
          </p>
        </form>
      </div>
    </div>
  );
}
