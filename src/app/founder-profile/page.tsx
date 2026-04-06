"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { supabase } from "@/lib/supabase";
import { EMPTY_FOUNDER, type FounderFormData, type Gender } from "@/types/founder";
import { Logo } from "@/components/ui/Logo";

type FounderFieldName = keyof FounderFormData;
type FounderErrors = Partial<Record<FounderFieldName, string>>;

const MAX_FOUNDERS = 4;
const LINKEDIN_PREFIXES = [
  "https://linkedin.com/in/",
  "https://www.linkedin.com/in/"
] as const;
const GENDER_OPTIONS: Gender[] = [
  "Male",
  "Female",
  "Non-binary",
  "Prefer not to say"
];
const FIELD_ORDER: FounderFieldName[] = [
  "full_name",
  "email",
  "mobile",
  "gender",
  "university",
  "degree",
  "linkedin_url"
];
const FIELD_LABELS: Record<FounderFieldName, string> = {
  full_name: "Full Name",
  email: "Email Address",
  mobile: "Mobile Number",
  gender: "Gender",
  university: "University",
  degree: "Degree / Course",
  linkedin_url: "LinkedIn Profile URL"
};
const inputClassName =
  "w-full rounded-[6px] border border-[#CBD5E1] bg-white px-3 py-[9px] text-[13.5px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#4F46E5] focus:ring-4 focus:ring-[rgba(79,70,229,0.1)]";

function getFounderLabel(index: number) {
  return index === 0 ? "Primary Founder" : `Co-Founder ${index + 1}`;
}

function normalizeMobile(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(-10);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(-10);
  return digits;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidLinkedInUrl(value: string) {
  return LINKEDIN_PREFIXES.some((prefix) => value.startsWith(prefix));
}

function validateFounder(founder: FounderFormData): FounderErrors {
  const errors: FounderErrors = {};

  if (founder.full_name.trim().length < 2) {
    errors.full_name = "Please enter a full name with at least 2 characters";
  }

  if (!founder.email.trim()) {
    errors.email = "Email address is required";
  } else if (!isValidEmail(founder.email.trim())) {
    errors.email = "Please enter a valid email address";
  }

  if (!founder.mobile.trim()) {
    errors.mobile = "Mobile number is required";
  } else if (normalizeMobile(founder.mobile).length !== 10) {
    errors.mobile = "Please enter a valid 10-digit mobile number";
  }

  if (!founder.gender) {
    errors.gender = "Please select a gender";
  }

  if (
    founder.linkedin_url.trim() &&
    !isValidLinkedInUrl(founder.linkedin_url.trim())
  ) {
    errors.linkedin_url = "Please enter a valid LinkedIn profile URL";
  }

  return errors;
}

function getFirstErrorFieldId(errors: FounderErrors[]) {
  for (let founderIndex = 0; founderIndex < errors.length; founderIndex += 1) {
    for (const field of FIELD_ORDER) {
      if (errors[founderIndex]?.[field]) {
        return `founder-${founderIndex}-${field}`;
      }
    }
  }

  return null;
}

function FounderField({
  founderIndex,
  field,
  required,
  error,
  children
}: {
  founderIndex: number;
  field: FounderFieldName;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        className="mb-1.5 block text-[12.5px] font-medium text-slate-700"
        htmlFor={`founder-${founderIndex}-${field}`}
      >
        {FIELD_LABELS[field]}
        {required ? <span className="ml-0.5 text-rose-600">*</span> : null}
      </label>
      {children}
      {error ? <p className="mt-1 text-[11.5px] text-rose-600">{error}</p> : null}
    </div>
  );
}

export default function FounderProfilePage() {
  const router = useRouter();
  const [founders, setFounders] = React.useState<FounderFormData[]>([
    EMPTY_FOUNDER
  ]);
  const [errors, setErrors] = React.useState<FounderErrors[]>([{}]);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const updateFounder = (
    founderIndex: number,
    field: FounderFieldName,
    value: string
  ) => {
    setFounders((current) =>
      current.map((founder, index) => {
        if (index !== founderIndex) return founder;
        if (field === "gender") {
          return { ...founder, gender: value as FounderFormData["gender"] };
        }

        return { ...founder, [field]: value };
      })
    );

    setErrors((current) =>
      current.map((founderErrors, index) => {
        if (field !== "email") {
          return index === founderIndex
            ? { ...founderErrors, [field]: undefined }
            : founderErrors;
        }

        return { ...founderErrors, email: undefined };
      })
    );

    setSubmitError(null);
  };

  const addFounder = () => {
    setFounders((current) => [...current, { ...EMPTY_FOUNDER }]);
    setErrors((current) => [...current, {}]);
  };

  const removeFounder = (founderIndex: number) => {
    setFounders((current) => current.filter((_, index) => index !== founderIndex));
    setErrors((current) => current.filter((_, index) => index !== founderIndex));
    setSubmitError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    const nextErrors = founders.map(validateFounder);
    const emailMap = new Map<string, number[]>();

    founders.forEach((founder, index) => {
      const email = founder.email.trim().toLowerCase();
      if (!email) return;
      emailMap.set(email, [...(emailMap.get(email) ?? []), index]);
    });

    emailMap.forEach((indexes) => {
      if (indexes.length > 1) {
        indexes.forEach((index) => {
          nextErrors[index] = {
            ...nextErrors[index],
            email: "Two founders cannot have the same email address"
          };
        });
      }
    });

    setErrors(nextErrors);

    const firstErrorFieldId = getFirstErrorFieldId(nextErrors);
    if (firstErrorFieldId) {
      window.requestAnimationFrame(() => {
        const element = document.getElementById(firstErrorFieldId);
        element?.scrollIntoView({ behavior: "smooth", block: "center" });
        element?.focus();
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const sessionToken = crypto.randomUUID();
      localStorage.setItem("vm_session_token", sessionToken);

      const foundersToInsert = founders.map((founder, index) => ({
        ...founder,
        full_name: founder.full_name.trim(),
        email: founder.email.trim(),
        mobile: normalizeMobile(founder.mobile),
        university: founder.university.trim(),
        degree: founder.degree.trim(),
        linkedin_url: founder.linkedin_url.trim(),
        session_token: sessionToken,
        founder_order: index + 1,
        startup_id: null
      }));

      const { error } = await supabase.from("founders").insert(foundersToInsert);

      if (error) {
        localStorage.removeItem("vm_session_token");
        setSubmitError("Something went wrong. Please try again.");
        return;
      }

      localStorage.setItem("vm_primary_founder_email", founders[0].email.trim());
      localStorage.setItem("vm_primary_founder_name", founders[0].full_name.trim());
      router.push("/startup-signup");
    } catch {
      localStorage.removeItem("vm_session_token");
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
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
            <p className="mb-2 text-[13px] text-[#64748B]">Step 1 of 2</p>
            <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-1/2 rounded-full bg-[#4F46E5]" />
            </div>
          </div>

          <h1 className="font-[family-name:var(--font-fraunces)] text-[26px] font-semibold tracking-[-0.5px] text-slate-900">
            Tell us about the founders
          </h1>
          <p className="mt-2 max-w-[560px] text-[14px] leading-6 text-[#64748B]">
            We use this to personalise your matches and build your credibility
            with investors.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {founders.map((founder, founderIndex) => (
            <section
              key={`founder-card-${founderIndex}`}
              className="rounded-2xl border border-[#CBD5E1] bg-white p-6"
            >
              <div className="mb-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#6366F1] to-[#4338CA] text-[13px] font-semibold text-white">
                    F{founderIndex + 1}
                  </div>
                  <div className="text-[14px] font-medium text-slate-900">
                    {getFounderLabel(founderIndex)}
                  </div>
                </div>

                {founderIndex > 0 ? (
                  <button
                    className="text-[12px] font-medium text-[#E11D48] transition hover:opacity-80"
                    type="button"
                    onClick={() => removeFounder(founderIndex)}
                  >
                    Remove
                  </button>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FounderField
                  founderIndex={founderIndex}
                  field="full_name"
                  required
                  error={errors[founderIndex]?.full_name}
                >
                  <input
                    id={`founder-${founderIndex}-full_name`}
                    className={inputClassName}
                    placeholder="Aarav Mehta"
                    value={founder.full_name}
                    onChange={(event) =>
                      updateFounder(founderIndex, "full_name", event.target.value)
                    }
                  />
                </FounderField>

                <FounderField
                  founderIndex={founderIndex}
                  field="email"
                  required
                  error={errors[founderIndex]?.email}
                >
                  <input
                    id={`founder-${founderIndex}-email`}
                    className={inputClassName}
                    placeholder="founder@venturematch.com"
                    type="email"
                    value={founder.email}
                    onChange={(event) =>
                      updateFounder(founderIndex, "email", event.target.value)
                    }
                  />
                </FounderField>

                <FounderField
                  founderIndex={founderIndex}
                  field="mobile"
                  required
                  error={errors[founderIndex]?.mobile}
                >
                  <input
                    id={`founder-${founderIndex}-mobile`}
                    className={inputClassName}
                    inputMode="tel"
                    placeholder="+91 9876543210"
                    value={founder.mobile}
                    onChange={(event) =>
                      updateFounder(founderIndex, "mobile", event.target.value)
                    }
                  />
                </FounderField>

                <FounderField
                  founderIndex={founderIndex}
                  field="gender"
                  required
                  error={errors[founderIndex]?.gender}
                >
                  <select
                    id={`founder-${founderIndex}-gender`}
                    className={inputClassName}
                    value={founder.gender}
                    onChange={(event) =>
                      updateFounder(founderIndex, "gender", event.target.value)
                    }
                  >
                    <option disabled value="">
                      Select gender
                    </option>
                    {GENDER_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </FounderField>

                <FounderField
                  founderIndex={founderIndex}
                  field="university"
                  error={errors[founderIndex]?.university}
                >
                  <input
                    id={`founder-${founderIndex}-university`}
                    className={inputClassName}
                    placeholder="IIT Delhi"
                    value={founder.university}
                    onChange={(event) =>
                      updateFounder(founderIndex, "university", event.target.value)
                    }
                  />
                </FounderField>

                <FounderField
                  founderIndex={founderIndex}
                  field="degree"
                  error={errors[founderIndex]?.degree}
                >
                  <input
                    id={`founder-${founderIndex}-degree`}
                    className={inputClassName}
                    placeholder="B.Tech, Computer Science"
                    value={founder.degree}
                    onChange={(event) =>
                      updateFounder(founderIndex, "degree", event.target.value)
                    }
                  />
                </FounderField>

                <div className="sm:col-span-2">
                  <FounderField
                    founderIndex={founderIndex}
                    field="linkedin_url"
                    error={errors[founderIndex]?.linkedin_url}
                  >
                    <input
                      id={`founder-${founderIndex}-linkedin_url`}
                      className={inputClassName}
                      placeholder="https://linkedin.com/in/yourname"
                      value={founder.linkedin_url}
                      onChange={(event) =>
                        updateFounder(founderIndex, "linkedin_url", event.target.value)
                      }
                    />
                  </FounderField>
                </div>
              </div>
            </section>
          ))}

          {founders.length < MAX_FOUNDERS ? (
            <button
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border-[1.5px] border-dashed border-[#CBD5E1] bg-white text-[14px] font-medium text-[#4F46E5] transition hover:border-[#4F46E5] hover:bg-[#EEF2FF]"
              type="button"
              onClick={addFounder}
            >
              <span className="text-[20px] leading-none">+</span>
              Add Co-Founder
            </button>
          ) : null}

          {submitError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-600">
              {submitError}
            </div>
          ) : null}

          <button
            className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[10px] bg-[#4F46E5] text-[15px] font-semibold text-white transition hover:bg-[#4338CA] disabled:cursor-not-allowed disabled:opacity-80"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Saving...
              </>
            ) : (
              "Save & Continue to Startup Profile ->"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-[12px] text-[#64748B]">
          Already have an account?{" "}
          <Link className="font-medium text-[#4F46E5]" href="/login">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
