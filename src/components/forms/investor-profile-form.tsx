"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, X } from "lucide-react";

import {
  investorRoles,
  investorSectorOptions,
  investorTypes,
  regions,
  stages,
  type InvestorRole,
  type InvestorSector,
  type InvestorType,
  type Region,
  type Stage
} from "@/lib/types";
import { parseZodErrors, upsertInvestorProfile } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const InvestorFormSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required."),
  lastName: z.string().trim().min(1, "Last name is required."),
  investorType: z.enum(investorTypes, { message: "Investor type is required." }),
  role: z.enum(investorRoles, { message: "Role is required." }),

  firmName: z.string().min(1, "Firm name is required."),
  website: z.string().url("Please enter a valid URL.").optional().or(z.literal("")),
  contactEmail: z.string().email("Please enter a valid email."),

  sectorFocus: z.array(z.enum(investorSectorOptions)).min(1, "Select at least one sector."),
  stageFocus: z.array(z.enum(stages)).min(1, "Select at least one stage."),
  regions: z.array(z.enum(regions)).min(1, "Select at least one region."),

  checkSizeUsdMin: z.preprocess(
    (v) => Number(v),
    z.number().int().min(0, "Minimum check size must be 0 or higher.")
  ),
  checkSizeUsdMax: z.preprocess(
    (v) => Number(v),
    z.number().int().min(0, "Maximum check size must be 0 or higher.")
  ),

  thesisSummary: z.string().min(1, "Thesis summary is required."),
  valueAddSummary: z.string().optional()
});

type InvestorFormValues = z.infer<typeof InvestorFormSchema>;

type ToastState = { type: "success" | "error"; message: string } | null;

function MultiSelectDropdown<T extends string>({
  label,
  options,
  value,
  onChange,
  placeholder
}: {
  label: string;
  options: readonly T[];
  value: T[];
  onChange: (next: T[]) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const onClickOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const toggleItem = (opt: T) => {
    if (value.includes(opt)) {
      onChange(value.filter((x) => x !== opt));
      return;
    }
    onChange([...value, opt]);
  };

  return (
    <div className="space-y-2" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-lg border bg-card px-3 text-left text-sm outline-none",
          "ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={cn(value.length ? "text-foreground" : "text-mutedForeground")}>
          {value.length ? `${value.length} selected` : placeholder ?? `Select ${label.toLowerCase()}`}
        </span>
        <span className="text-xs text-mutedForeground">{open ? "Close" : "Open"}</span>
      </button>

      {open ? (
        <div className="max-h-64 overflow-auto rounded-lg border bg-background p-2 shadow-sm">
          {options.map((opt) => {
            const selected = value.includes(opt);
            return (
              <button
                type="button"
                key={opt}
                onClick={() => toggleItem(opt)}
                className={cn(
                  "mb-1 flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm",
                  selected ? "bg-primary/10 text-primary" : "hover:bg-muted"
                )}
                aria-pressed={selected}
              >
                <span>{opt}</span>
                <span className="text-xs">{selected ? "Selected" : "Add"}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      {value.length ? (
        <div className="flex flex-wrap gap-2">
          {value.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1 rounded-full border bg-muted px-2 py-1 text-xs"
            >
              {item}
              <button
                type="button"
                onClick={() => onChange(value.filter((x) => x !== item))}
                className="rounded-full p-0.5 hover:bg-background"
                aria-label={`Remove ${item}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function InvestorProfileForm({
  defaultSectors = ["B2B SaaS", "AI/ML"] as InvestorSector[]
}: {
  defaultSectors?: InvestorSector[];
}) {
  const router = useRouter();
  const [submitError, setSubmitError] = React.useState<string[] | null>(null);
  const [toast, setToast] = React.useState<ToastState>(null);

  React.useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const form = useForm<InvestorFormValues>({
    resolver: zodResolver(InvestorFormSchema) as any,
    defaultValues: {
      firstName: "",
      lastName: "",
      investorType: "VC",
      role: "Partner",
      firmName: "",
      website: "",
      contactEmail: "",
      sectorFocus: defaultSectors,
      stageFocus: ["Pre-seed", "Seed", "Series A"],
      regions: ["North America"],
      checkSizeUsdMin: 250000,
      checkSizeUsdMax: 2500000,
      thesisSummary: "",
      valueAddSummary: ""
    }
  });

  const onSubmit = async (values: InvestorFormValues) => {
    setSubmitError(null);
    try {
      await upsertInvestorProfile(values);
      setToast({ type: "success", message: "Profile saved successfully." });
      window.setTimeout(() => router.push("/dashboard"), 600);
    } catch (e) {
      const errors = parseZodErrors(e);
      setSubmitError(errors);
      setToast({ type: "error", message: errors[0] ?? "Could not save profile." });
    }
  };

  const sectorValue = form.watch("sectorFocus");
  const stageValue = form.watch("stageFocus");
  const regionValue = form.watch("regions");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Investor profile</CardTitle>
        <CardDescription>
          Define your investment focus to generate startup matches.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        {toast ? (
          <div
            className={cn(
              "rounded-lg border p-3 text-sm",
              toast.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            )}
          >
            {toast.message}
          </div>
        ) : null}

        {submitError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <div className="font-medium">Please fix the following:</div>
            <ul className="mt-2 list-disc pl-5">
              {submitError.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <form className="grid gap-6" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" placeholder="Arjun" {...form.register("firstName")} />
              {form.formState.errors.firstName?.message ? (
                <FieldError>{form.formState.errors.firstName.message}</FieldError>
              ) : null}
            </Field>

            <Field>
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" placeholder="Mehta" {...form.register("lastName")} />
              {form.formState.errors.lastName?.message ? (
                <FieldError>{form.formState.errors.lastName.message}</FieldError>
              ) : null}
            </Field>

            <Field>
              <Label htmlFor="firmName">Firm name</Label>
              <Input id="firmName" placeholder="Atlas Ventures" {...form.register("firmName")} />
              {form.formState.errors.firmName?.message ? (
                <FieldError>{form.formState.errors.firmName.message}</FieldError>
              ) : null}
            </Field>

            <Field>
              <Label htmlFor="contactEmail">Contact email</Label>
              <Input
                id="contactEmail"
                placeholder="partners@firm.com"
                {...form.register("contactEmail")}
              />
              {form.formState.errors.contactEmail?.message ? (
                <FieldError>{form.formState.errors.contactEmail.message}</FieldError>
              ) : null}
            </Field>

            <Field>
              <Label htmlFor="investorType">Investor type</Label>
              <Select id="investorType" {...form.register("investorType")}>
                {investorTypes.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
              {form.formState.errors.investorType?.message ? (
                <FieldError>{form.formState.errors.investorType.message}</FieldError>
              ) : null}
            </Field>

            <Field>
              <Label htmlFor="role">Role</Label>
              <Select id="role" {...form.register("role")}>
                {investorRoles.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
              {form.formState.errors.role?.message ? (
                <FieldError>{form.formState.errors.role.message}</FieldError>
              ) : null}
            </Field>

            <Field className="sm:col-span-2">
              <Label htmlFor="website">Website (optional)</Label>
              <Input id="website" placeholder="https://firm.com" {...form.register("website")} />
              {form.formState.errors.website?.message ? (
                <FieldError>{form.formState.errors.website.message}</FieldError>
              ) : null}
            </Field>
          </div>

          <Field>
            <Label>Sector focus</Label>
            <MultiSelectDropdown<InvestorSector>
              label="Sector focus"
              options={investorSectorOptions}
              value={sectorValue as InvestorSector[]}
              onChange={(next) => form.setValue("sectorFocus", next, { shouldValidate: true })}
              placeholder="Select one or more sectors"
            />
            {form.formState.errors.sectorFocus?.message ? (
              <FieldError>{form.formState.errors.sectorFocus.message as string}</FieldError>
            ) : null}
          </Field>

          <Field>
            <Label>Stage focus</Label>
            <MultiSelectDropdown<Stage>
              label="Stage focus"
              options={stages}
              value={stageValue as Stage[]}
              onChange={(next) => form.setValue("stageFocus", next, { shouldValidate: true })}
              placeholder="Select one or more stages"
            />
            {form.formState.errors.stageFocus?.message ? (
              <FieldError>{form.formState.errors.stageFocus.message as string}</FieldError>
            ) : null}
          </Field>

          <Field>
            <Label>Regions</Label>
            <MultiSelectDropdown<Region>
              label="Regions"
              options={regions}
              value={regionValue as Region[]}
              onChange={(next) => form.setValue("regions", next, { shouldValidate: true })}
              placeholder="Select one or more regions"
            />
            {form.formState.errors.regions?.message ? (
              <FieldError>{form.formState.errors.regions.message as string}</FieldError>
            ) : null}
          </Field>

          <Field>
            <Label>Typical check size (USD)</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                inputMode="numeric"
                type="number"
                min={0}
                step={50000}
                aria-label="Minimum check size in USD"
                {...form.register("checkSizeUsdMin")}
              />
              <Input
                inputMode="numeric"
                type="number"
                min={0}
                step={50000}
                aria-label="Maximum check size in USD"
                {...form.register("checkSizeUsdMax")}
              />
            </div>
            {form.formState.errors.checkSizeUsdMin?.message ? (
              <FieldError>{form.formState.errors.checkSizeUsdMin.message}</FieldError>
            ) : null}
            {form.formState.errors.checkSizeUsdMax?.message ? (
              <FieldError>{form.formState.errors.checkSizeUsdMax.message}</FieldError>
            ) : null}
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <Label htmlFor="thesisSummary">Thesis summary</Label>
              <Textarea
                id="thesisSummary"
                placeholder="What you look for and why…"
                {...form.register("thesisSummary")}
              />
              {form.formState.errors.thesisSummary?.message ? (
                <FieldError>{form.formState.errors.thesisSummary.message}</FieldError>
              ) : null}
            </Field>

            <Field>
              <Label htmlFor="valueAddSummary">Value-add (optional)</Label>
              <Textarea
                id="valueAddSummary"
                placeholder="How you help founders post-investment…"
                {...form.register("valueAddSummary")}
              />
              {form.formState.errors.valueAddSummary?.message ? (
                <FieldError>{form.formState.errors.valueAddSummary.message}</FieldError>
              ) : null}
            </Field>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-mutedForeground">
              Are you a startup?{" "}
              <Link className="underline underline-offset-4 hover:text-foreground" href="/startup-signup">
                Create a startup profile
              </Link>
              .
            </div>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </span>
              ) : (
                "Save profile"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

