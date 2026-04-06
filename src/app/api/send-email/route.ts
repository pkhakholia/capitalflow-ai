import { NextResponse } from "next/server";
import { Resend } from "resend";
import { BRAND } from "@/lib/branding";

let resendClient: Resend | null = null;
if (process.env.RESEND_API_KEY) {
  resendClient = new Resend(process.env.RESEND_API_KEY);
}

type SendEmailPayload = {
  to?: string;
  investorFirmName?: string;
  startupName?: string;
  startupEmail?: string;
  tractionMetrics?: string;
  tractionStage?: string;
  sector?: string;
  startupStage?: string;
  fundingAsk?: string;
  monthlyRevenue?: string;
  productSummary?: string;
};

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as SendEmailPayload;

    const required = [
      "to",
      "startupName",
      "startupEmail",
      "tractionMetrics",
      "tractionStage",
      "sector",
      "startupStage",
      "fundingAsk",
      "monthlyRevenue",
      "productSummary"
    ] as const;

    const missing = required.filter((key) => !String(payload[key] ?? "").trim());
    if (missing.length) {
      return NextResponse.json({ error: `Missing required fields: ${missing.join(", ")}` }, { status: 400 });
    }

    const to = String(payload.to).trim();
    const startupEmail = String(payload.startupEmail).trim();
    if (!isValidEmail(to) || !isValidEmail(startupEmail)) {
      return NextResponse.json({ error: "Invalid recipient or sender email." }, { status: 400 });
    }

    if (!resendClient) {
      console.warn("RESEND_API_KEY is missing. Mocking email send logic.");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return NextResponse.json({ data: { id: "mock_structured_email_id" }, success: true });
    }

    const startupName = escapeHtml(String(payload.startupName));
    const firmName = escapeHtml(String(payload.investorFirmName ?? "Investor"));
    const sector = escapeHtml(String(payload.sector));
    const startupStage = escapeHtml(String(payload.startupStage));
    const fundingAsk = escapeHtml(String(payload.fundingAsk));
    const productSummary = escapeHtml(String(payload.productSummary));
    const tractionMetrics = escapeHtml(String(payload.tractionMetrics));
    const tractionStage = escapeHtml(String(payload.tractionStage));
    const monthlyRevenue = escapeHtml(String(payload.monthlyRevenue));
    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://yourdomain.com";
    const logoUrl = `${appBaseUrl}${BRAND.logoLight}`;

    const { data, error } = await resendClient.emails.send({
      from: "CapitalFlow AI <onboarding@resend.dev>",
      to: [to],
      subject: `Structured startup update from ${startupName}`,
      replyTo: startupEmail,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #1f2937; line-height: 1.6;">
          <img src="${logoUrl}" alt="${BRAND.name} logo" width="120" style="display:block; margin: 0 0 16px 0;" />
          <h2 style="color: #4F46E5; margin: 0 0 8px 0;">Startup Update via CapitalFlow AI</h2>
          <p style="margin: 0 0 18px 0;">Hi ${firmName} team,</p>
          <p style="margin: 0 0 18px 0;"><strong>${startupName}</strong> has shared a quick structured update:</p>

          <table cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr><td style="padding: 10px; border: 1px solid #e5e7eb; width: 180px;"><strong>Sector</strong></td><td style="padding: 10px; border: 1px solid #e5e7eb;">${sector}</td></tr>
            <tr><td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Stage</strong></td><td style="padding: 10px; border: 1px solid #e5e7eb;">${startupStage}</td></tr>
            <tr><td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Funding Ask</strong></td><td style="padding: 10px; border: 1px solid #e5e7eb;">${fundingAsk}</td></tr>
            <tr><td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Product Summary</strong></td><td style="padding: 10px; border: 1px solid #e5e7eb; white-space: pre-wrap;">${productSummary}</td></tr>
            <tr><td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Traction Metrics</strong></td><td style="padding: 10px; border: 1px solid #e5e7eb; white-space: pre-wrap;">${tractionMetrics}</td></tr>
            <tr><td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Traction Stage</strong></td><td style="padding: 10px; border: 1px solid #e5e7eb;">${tractionStage}</td></tr>
            <tr><td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Monthly Revenue</strong></td><td style="padding: 10px; border: 1px solid #e5e7eb;">${monthlyRevenue}</td></tr>
          </table>

          <p style="margin: 18px 0 0 0;">You can reply directly to this email to continue the conversation.</p>
          <p style="font-size: 12px; color: #6b7280; margin-top: 20px;">Sent via CapitalFlow AI</p>
        </div>
      `
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data, success: true }, { status: 200 });
  } catch (error) {
    console.error("Failed to send structured email:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
