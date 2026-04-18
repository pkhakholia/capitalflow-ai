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

export function ContactModal({ isOpen, onClose, match, mode, defaultMethod = "email" }: ContactModalProps) {
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

      // Track investor outreach in database
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

    // Track investor outreach in database
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
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(15, 23, 42, 0.4)",
        backdropFilter: "blur(2px)"
      }}
    >
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: 60,
            background: toast.type === "success" ? "var(--vm-emerald)" : "var(--vm-rose)",
            color: "white",
            padding: "10px 14px",
            borderRadius: "var(--radius-sm)",
            boxShadow: "var(--shadow-md)",
            fontSize: "13px",
            fontWeight: 500
          }}
        >
          {toast.message}
        </div>
      )}

      <div
        style={{
          background: "var(--vm-white)",
          borderRadius: "var(--radius-lg)",
          width: "100%",
          maxWidth: "640px",
          boxShadow: "var(--shadow-lg)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh"
        }}
      >
        <div
          style={{
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid var(--vm-slate-6)"
          }}
        >
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--vm-slate)", margin: "0 0 2px 0" }}>
              Contact {targetName}
            </h2>
            <p style={{ fontSize: "13px", color: "var(--vm-slate-3)", margin: 0 }}>
              {method === "email"
                ? "Send a concise, structured update to investor inbox."
                : "Send your pitch deck as an email attachment and link."}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--vm-slate-3)" }}
            disabled={isSending}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: "24px", overflowY: "auto" }}>
          {isSuccess ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "32px 0",
                gap: "16px"
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: "var(--vm-emerald-light)",
                  color: "var(--vm-emerald)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <CheckCircle2 size={24} />
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--vm-slate)", marginBottom: "4px" }}>
                  {method === "email" ? "Email Sent!" : "Pitch Deck Sent!"}
                </div>
                <div style={{ fontSize: "14px", color: "var(--vm-slate-3)" }}>
                  {method === "email"
                    ? "Your structured startup update has been delivered."
                    : "Your pitch deck attachment and link have been delivered."}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {error && (
                <div
                  style={{
                    background: "var(--vm-rose-light)",
                    color: "var(--vm-rose)",
                    padding: "12px",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "13px",
                    border: "1px solid rgba(225, 29, 72, 0.2)"
                  }}
                >
                  {error}
                </div>
              )}

              {outreachHint ? (
                <div
                  style={{
                    background: "var(--vm-surface)",
                    color: "var(--vm-slate-2)",
                    padding: "10px",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "12px",
                    border: "1px solid var(--vm-slate-6)"
                  }}
                >
                  {outreachHint}
                </div>
              ) : null}

              <div style={{ display: "flex", background: "var(--vm-slate-6)", padding: "4px", borderRadius: "var(--radius-md)" }}>
                <button
                  onClick={() => setMethod("email")}
                  style={{
                    flex: 1,
                    padding: "8px",
                    textWrap: "nowrap",
                    textAlign: "center",
                    fontSize: "13px",
                    fontWeight: 500,
                    borderRadius: "calc(var(--radius-md) - 2px)",
                    background: method === "email" ? "var(--vm-white)" : "transparent",
                    color: method === "email" ? "var(--vm-slate)" : "var(--vm-slate-3)",
                    border: "none",
                    boxShadow: method === "email" ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  Send Email
                </button>
                <button
                  onClick={() => setMethod("pitchDeck")}
                  style={{
                    flex: 1,
                    padding: "8px",
                    textWrap: "nowrap",
                    textAlign: "center",
                    fontSize: "13px",
                    fontWeight: 500,
                    borderRadius: "calc(var(--radius-md) - 2px)",
                    background: method === "pitchDeck" ? "var(--vm-white)" : "transparent",
                    color: method === "pitchDeck" ? "var(--vm-slate)" : "var(--vm-slate-3)",
                    border: "none",
                    boxShadow: method === "pitchDeck" ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  Send Pitch Deck
                </button>
              </div>

              {method === "email" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ fontSize: "13px", color: "var(--vm-slate-3)" }}>
                    Share key startup details in a structured format for faster investor review.
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
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

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <FieldLabel label="Product Summary" />
                    <textarea
                      value={emailForm.productSummary}
                      onChange={handleEmailChange("productSummary")}
                      style={{ ...inputStyle, minHeight: "96px", resize: "vertical" }}
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <FieldLabel label="Traction Metrics" />
                    <textarea
                      value={emailForm.tractionMetrics}
                      onChange={handleEmailChange("tractionMetrics")}
                      style={{ ...inputStyle, minHeight: "96px", resize: "vertical" }}
                    />
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ fontSize: "13px", color: "var(--vm-slate-3)" }}>
                    We will fetch the pitch deck from startup profile, attach it as PDF, and include the source link in the email.
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      background: "var(--vm-surface)",
                      border: "1px solid var(--vm-slate-6)",
                      borderRadius: "var(--radius-sm)",
                      padding: "10px 12px",
                      color: "var(--vm-slate-2)",
                      wordBreak: "break-all"
                    }}
                  >
                    <strong>Pitch deck URL: </strong>
                    {match.startup.pitchDeckUrl ?? "Not available"}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
                <button
                  onClick={onClose}
                  disabled={isSending}
                  style={{
                    background: "transparent",
                    color: "var(--vm-slate-2)",
                    border: "1px solid var(--vm-slate-5)",
                    padding: "10px 16px",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: isSending ? "not-allowed" : "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  disabled={isSending || (method === "email" ? !canSubmitEmail : !canSubmitPitchDeck)}
                  style={{
                    background: "var(--vm-indigo)",
                    color: "white",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "13px",
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: isSending ? "not-allowed" : "pointer",
                    opacity: isSending || (method === "email" ? !canSubmitEmail : !canSubmitPitchDeck) ? 0.7 : 1
                  }}
                >
                  {isSending && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />}
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
  return <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--vm-slate)", display: "flex", alignItems: "center" }}>{label}</label>;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--vm-slate-5)",
  fontSize: "14px",
  color: "var(--vm-slate-2)",
  outline: "none",
  fontFamily: "inherit"
};
