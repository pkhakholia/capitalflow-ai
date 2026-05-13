"use client";

import * as React from "react";
import { X, Loader2, CheckCircle2 } from "lucide-react";

import { handleSendEmail, type StructuredEmailFormData } from "@/lib/send-email";
import { handleSendPitchDeck } from "@/lib/send-pitch-deck";
import { getOrCreateInvestorOutreach } from "@/lib/outreach";
import { getOutreachUsage, incrementOutreachUsage } from "@/lib/outreach-usage";
import type { MatchResult } from "@/lib/types";
import { useAuth } from "@/components/auth/auth-provider";
import { usePlan } from "@/hooks/usePlan";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: MatchResult | null;
  mode: "startup" | "investor";
  defaultMethod?: "email" | "pitchDeck";
}

type ToastState = {
  type: "success" | "error";
  message: string;
} | null;

const defaultEmailForm: StructuredEmailFormData = {
  tractionMetrics: "",
  tractionStage: "MVP",
  sector: "",
  startupStage: "Seed",
  fundingAsk: "",
  monthlyRevenue: "",
  productSummary: ""
};

const tractionStageOptions: StructuredEmailFormData["tractionStage"][] = [
  "Idea",
  "MVP",
  "Early Revenue",
  "Scaling"
];

const startupStageOptions = [
  "Pre-seed",
  "Seed",
  "Series A",
  "Series B",
  "Series C+",
  "Growth"
];

export function ContactModal({
  isOpen,
  onClose,
  match,
  mode,
  defaultMethod = "email"
}: ContactModalProps) {
  const { user, refreshProfile } = useAuth();
  const { plan } = usePlan();
  const [method, setMethod] = React.useState<"email" | "pitchDeck">("email");
  const [emailForm, setEmailForm] = React.useState<StructuredEmailFormData>(defaultEmailForm);
  const [isSendingEmail, setIsSendingEmail] = React.useState(false);
  const [isSendingPitchDeck, setIsSendingPitchDeck] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [toast, setToast] = React.useState<ToastState>(null);
  const [outreachHint, setOutreachHint] = React.useState<string | null>(null);

  const toastTimeoutRef = React.useRef<number | null>(null);

  const showToast = React.useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => setToast(null), 3000);
  }, []);

  React.useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    if (isOpen && match) {
      setMethod(defaultMethod);
      setEmailForm({
        ...defaultEmailForm,
        sector: match.startup.sector,
        startupStage: match.startup.stage
      });
      setIsSendingEmail(false);
      setIsSendingPitchDeck(false);
      setIsSuccess(false);
      setError(null);
      setToast(null);
      setOutreachHint(null);
    }
  }, [defaultMethod, isOpen, match]);

  React.useEffect(() => {
    let active = true;
    const checkUsage = async () => {
      if (!isOpen || !user?.id) return;
      const usage = await getOutreachUsage(user.id, plan);
      if (!active) return;
      if (usage.error) {
        setOutreachHint("Unable to load outreach usage right now.");
        return;
      }
      setOutreachHint(
        `Outreach remaining this ${usage.period}: ${usage.remaining}/${usage.limit}`
      );
    };
    checkUsage();
    return () => {
      active = false;
    };
  }, [isOpen, user?.id, plan]);

  if (!isOpen || !match) return null;

  const isSending = isSendingEmail || isSendingPitchDeck;
  const targetName = mode === "startup" ? match.investor.firmName : match.startup.companyName;

  const emailValidationMissing = [
    ["Sector", emailForm.sector],
    ["Startup Stage", emailForm.startupStage],
    ["Funding Ask", emailForm.fundingAsk],
    ["Product Summary", emailForm.productSummary],
    ["Traction Metrics", emailForm.tractionMetrics],
    ["Traction Stage", emailForm.tractionStage],
    ["Monthly Revenue", emailForm.monthlyRevenue]
  ].filter(([, value]) => !String(value).trim());

  const canSubmitEmail = emailValidationMissing.length === 0;
  const canSubmitPitchDeck = Boolean(match.startup.pitchDeckUrl && match.startup.pitchDeckUrl.trim());

  const handleEmailChange =
    (field: keyof StructuredEmailFormData) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setEmailForm((prev) => ({
        ...prev,
        [field]: event.target.value
      }));
    };

  const handleSend = async () => {
    setError(null);
    setIsSuccess(false);

    if (!user?.id) {
      const authErr = "You need to be logged in to contact investors.";
      setError(authErr);
      showToast("error", authErr);
      return;
    }

    const usage = await getOutreachUsage(user.id, plan);
    if (usage.error) {
      setError(usage.error);
      showToast("error", usage.error);
      return;
    }

    if (!usage.allowed) {
      const limitErr =
        usage.period === "day"
          ? "Daily outreach limit reached. Upgrade your plan to send more outreach."
          : "Monthly outreach limit reached. Upgrade your plan to send more outreach.";
      setError(limitErr);
      showToast("error", limitErr);
      return;
    }

    if (method === "email") {
      if (!canSubmitEmail) {
        const missingNames = emailValidationMissing.map(([name]) => name).join(", ");
        const err = `Please complete all required fields: ${missingNames}.`;
        setError(err);
        showToast("error", err);
        return;
      }

      setIsSendingEmail(true);
      const res = await handleSendEmail(match.investor, match.startup, emailForm);
      setIsSendingEmail(false);

      if (!res.success) {
        const err = res.error || "Failed to send email.";
        setError(err);
        showToast("error", err);
        return;
      }

      const outreachResult = await getOrCreateInvestorOutreach(
        match.investor.id,
        match.startup.id,
        "reached_out"
      );
      if (!outreachResult.success) {
        console.warn("Failed to track outreach:", outreachResult.error);
      }

      const usageAfter = await incrementOutreachUsage(user.id, plan);
      if (!usageAfter.error) {
        setOutreachHint(
          `Outreach remaining this ${usageAfter.period}: ${usageAfter.remaining}/${usageAfter.limit}`
        );
      }
      await refreshProfile();

      setIsSuccess(true);
      showToast("success", "Structured email sent successfully.");
      window.setTimeout(() => onClose(), 1500);
      return;
    }

    if (!canSubmitPitchDeck) {
      const err = "No pitch deck URL found for this startup. Please update startup profile first.";
      setError(err);
      showToast("error", err);
      return;
    }

    setIsSendingPitchDeck(true);
    const res = await handleSendPitchDeck(match.investor, match.startup);
    setIsSendingPitchDeck(false);

    if (!res.success) {
      const err = res.error || "Failed to send pitch deck.";
      setError(err);
      showToast("error", err);
      return;
    }

    const outreachResult = await getOrCreateInvestorOutreach(
      match.investor.id,
      match.startup.id,
      "reached_out"
    );
    if (!outreachResult.success) {
      console.warn("Failed to track outreach:", outreachResult.error);
    }

    const usageAfter = await incrementOutreachUsage(user.id, plan);
    if (!usageAfter.error) {
      setOutreachHint(
        `Outreach remaining this ${usageAfter.period}: ${usageAfter.remaining}/${usageAfter.limit}`
      );
    }
    await refreshProfile();

    setIsSuccess(true);
    showToast("success", "Pitch deck email sent successfully.");
    window.setTimeout(() => onClose(), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-3 backdrop-blur-[2px] sm:p-4">
      {toast ? (
        <div
          className={`fixed left-3 right-3 top-3 z-[60] rounded-[var(--radius-sm)] px-3 py-2 text-[13px] font-medium text-white shadow-[var(--shadow-md)] sm:left-auto sm:right-5 sm:top-5 ${
            toast.type === "success" ? "bg-[var(--vm-emerald)]" : "bg-[var(--vm-rose)]"
          }`}
        >
          {toast.message}
        </div>
      ) : null}

      <div className="flex max-h-[90vh] w-full max-w-[640px] flex-col overflow-hidden rounded-[var(--radius-lg)] bg-[var(--vm-white)] shadow-[var(--shadow-lg)]">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--vm-slate-6)] px-4 py-4 sm:px-6">
          <div>
            <h2 className="mb-0.5 text-base font-semibold text-[var(--vm-slate)] sm:text-lg">
              Contact {targetName}
            </h2>
            <p className="text-[13px] text-[var(--vm-slate-3)]">
              {method === "email"
                ? "Send a concise, structured update to investor inbox."
                : "Send your pitch deck as an email attachment and link."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg text-[var(--vm-slate-3)] transition hover:bg-[var(--vm-slate-6)]"
            disabled={isSending}
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center gap-4 py-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--vm-emerald-light)] text-[var(--vm-emerald)]">
                <CheckCircle2 size={24} />
              </div>
              <div className="text-center">
                <div className="mb-1 text-base font-semibold text-[var(--vm-slate)]">
                  {method === "email" ? "Email Sent!" : "Pitch Deck Sent!"}
                </div>
                <div className="text-sm text-[var(--vm-slate-3)]">
                  {method === "email"
                    ? "Your structured startup update has been delivered."
                    : "Your pitch deck attachment and link have been delivered."}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {error ? (
                <div className="rounded-[var(--radius-sm)] border border-rose-200 bg-[var(--vm-rose-light)] p-3 text-[13px] text-[var(--vm-rose)]">
                  {error}
                </div>
              ) : null}

              {outreachHint ? (
                <div className="rounded-[var(--radius-sm)] border border-[var(--vm-slate-6)] bg-[var(--vm-surface)] p-2.5 text-xs text-[var(--vm-slate-2)]">
                  {outreachHint}
                </div>
              ) : null}

              <div className="flex flex-col rounded-[var(--radius-md)] bg-[var(--vm-slate-6)] p-1 sm:flex-row">
                <button
                  onClick={() => setMethod("email")}
                  className={`flex-1 rounded-[calc(var(--radius-md)-2px)] px-3 py-2 text-center text-[13px] font-medium transition ${
                    method === "email"
                      ? "bg-[var(--vm-white)] text-[var(--vm-slate)] shadow-sm"
                      : "text-[var(--vm-slate-3)]"
                  }`}
                >
                  Send Email
                </button>
                <button
                  onClick={() => setMethod("pitchDeck")}
                  className={`flex-1 rounded-[calc(var(--radius-md)-2px)] px-3 py-2 text-center text-[13px] font-medium transition ${
                    method === "pitchDeck"
                      ? "bg-[var(--vm-white)] text-[var(--vm-slate)] shadow-sm"
                      : "text-[var(--vm-slate-3)]"
                  }`}
                >
                  Send Pitch Deck
                </button>
              </div>

              {method === "email" ? (
                <div className="flex flex-col gap-3">
                  <div className="text-[13px] text-[var(--vm-slate-3)]">
                    Share key startup details in a structured format for faster investor review.
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <FieldLabel label="Sector" />
                    <input value={emailForm.sector} onChange={handleEmailChange("sector")} style={inputStyle} />

                    <FieldLabel label="Startup Stage" />
                    <select value={emailForm.startupStage} onChange={handleEmailChange("startupStage")} style={inputStyle}>
                      {startupStageOptions.map((stage) => (
                        <option key={stage} value={stage}>
                          {stage}
                        </option>
                      ))}
                    </select>

                    <FieldLabel label="Funding Ask" />
                    <input value={emailForm.fundingAsk} onChange={handleEmailChange("fundingAsk")} style={inputStyle} />

                    <FieldLabel label="Monthly Revenue" />
                    <input
                      value={emailForm.monthlyRevenue}
                      onChange={handleEmailChange("monthlyRevenue")}
                      style={inputStyle}
                      inputMode="decimal"
                    />

                    <FieldLabel label="Traction Stage" />
                    <select value={emailForm.tractionStage} onChange={handleEmailChange("tractionStage")} style={inputStyle}>
                      {tractionStageOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <FieldLabel label="Product Summary" />
                    <textarea
                      value={emailForm.productSummary}
                      onChange={handleEmailChange("productSummary")}
                      style={{ ...inputStyle, minHeight: "96px", resize: "vertical" }}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <FieldLabel label="Traction Metrics" />
                    <textarea
                      value={emailForm.tractionMetrics}
                      onChange={handleEmailChange("tractionMetrics")}
                      style={{ ...inputStyle, minHeight: "96px", resize: "vertical" }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  <div className="text-[13px] text-[var(--vm-slate-3)]">
                    We will fetch the pitch deck from startup profile, attach it as PDF, and include the source link in the email.
                  </div>
                  <div className="break-all rounded-[var(--radius-sm)] border border-[var(--vm-slate-6)] bg-[var(--vm-surface)] px-3 py-2.5 text-[13px] text-[var(--vm-slate-2)]">
                    <strong>Pitch deck URL: </strong>
                    {match.startup.pitchDeckUrl ?? "Not available"}
                  </div>
                </div>
              )}

              <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  onClick={onClose}
                  disabled={isSending}
                  className="min-h-11 rounded-[var(--radius-sm)] border border-[var(--vm-slate-5)] px-4 py-2.5 text-[13px] font-medium text-[var(--vm-slate-2)]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  disabled={isSending || (method === "email" ? !canSubmitEmail : !canSubmitPitchDeck)}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--vm-indigo)] px-5 py-2.5 text-[13px] font-medium text-white disabled:opacity-70"
                >
                  {isSending ? <Loader2 size={16} className="animate-spin" /> : null}
                  {isSending ? "Sending..." : method === "email" ? "Send Email" : "Send Pitch Deck"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FieldLabel({ label }: { label: string }) {
  return (
    <label className="flex items-center text-[13px] font-semibold text-[var(--vm-slate)]">
      {label}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  minHeight: "44px",
  padding: "10px 12px",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--vm-slate-5)",
  fontSize: "14px",
  color: "var(--vm-slate-2)",
  outline: "none",
  fontFamily: "inherit"
};
