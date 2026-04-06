import { NextResponse } from "next/server";
import { Resend } from "resend";
import { BRAND } from "@/lib/branding";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

let resendClient: Resend | null = null;
if (process.env.RESEND_API_KEY) {
  resendClient = new Resend(process.env.RESEND_API_KEY);
}

type SendPitchDeckPayload = {
  to?: string;
  investorFirmName?: string;
  startupName?: string;
  startupEmail?: string;
  pitchDeckUrl?: string;
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

function parseAndValidateUrl(rawUrl: string): URL | null {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as SendPitchDeckPayload;

    const required = ["to", "startupName", "startupEmail", "pitchDeckUrl"] as const;
    const missing = required.filter((key) => !String(payload[key] ?? "").trim());
    if (missing.length) {
      return NextResponse.json({ error: `Missing required fields: ${missing.join(", ")}` }, { status: 400 });
    }

    const to = String(payload.to).trim();
    const startupEmail = String(payload.startupEmail).trim();
    const pitchDeckUrlRaw = String(payload.pitchDeckUrl).trim();
    const startupName = String(payload.startupName).trim();

    if (!isValidEmail(to) || !isValidEmail(startupEmail)) {
      return NextResponse.json({ error: "Invalid recipient or sender email." }, { status: 400 });
    }

    const pitchDeckUrl = parseAndValidateUrl(pitchDeckUrlRaw);
    if (!pitchDeckUrl) {
      return NextResponse.json({ error: "Invalid URL for pitch deck." }, { status: 400 });
    }

    try {
      const headResponse = await fetch(pitchDeckUrl.toString(), { method: "HEAD" });
      if (headResponse.ok) {
        const contentLengthHeader = headResponse.headers.get("content-length");
        if (contentLengthHeader) {
          const contentLength = Number(contentLengthHeader);
          if (Number.isFinite(contentLength) && contentLength > MAX_FILE_SIZE_BYTES) {
            return NextResponse.json({ error: "Pitch deck file is too large. Maximum size is 10MB." }, { status: 400 });
          }
        }
      }
    } catch {
      // Continue to GET; some storage providers reject HEAD requests.
    }

    const fileResponse = await fetch(pitchDeckUrl.toString());
    if (!fileResponse.ok) {
      return NextResponse.json({ error: "Failed fetch while downloading pitch deck." }, { status: 400 });
    }

    const arrayBuffer = await fileResponse.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    if (fileBuffer.byteLength > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: "Pitch deck file is too large. Maximum size is 10MB." }, { status: 400 });
    }

    const attachmentName = pitchDeckUrl.pathname.toLowerCase().endsWith(".pdf")
      ? pitchDeckUrl.pathname.split("/").filter(Boolean).pop() ?? "pitch-deck.pdf"
      : "pitch-deck.pdf";

    if (!resendClient) {
      console.warn("RESEND_API_KEY is missing. Mocking pitch deck send logic.");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return NextResponse.json({ data: { id: "mock_pitch_deck_email_id" }, success: true });
    }

    const safeStartupName = escapeHtml(startupName);
    const safeFirmName = escapeHtml(String(payload.investorFirmName ?? "Investor"));
    const safePitchDeckUrl = escapeHtml(pitchDeckUrl.toString());
    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://yourdomain.com";
    const logoUrl = `${appBaseUrl}${BRAND.logoLight}`;

    const { data, error } = await resendClient.emails.send({
      from: "CapitalFlow AI <onboarding@resend.dev>",
      to: [to],
      subject: `${safeStartupName} - Pitch deck`,
      replyTo: startupEmail,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #1f2937; line-height: 1.6;">
          <img src="${logoUrl}" alt="${BRAND.name} logo" width="120" style="display:block; margin: 0 0 16px 0;" />
          <h2 style="color: #4F46E5; margin: 0 0 8px 0;">Pitch Deck Shared via CapitalFlow AI</h2>
          <p style="margin: 0 0 12px 0;">Hi ${safeFirmName} team,</p>
          <p style="margin: 0 0 12px 0;"><strong>${safeStartupName}</strong> has shared their pitch deck with you.</p>
          <p style="margin: 0 0 12px 0;">The deck is attached as a PDF for quick review.</p>
          <p style="margin: 0 0 0 0;">Direct link: <a href="${safePitchDeckUrl}" target="_blank" rel="noopener noreferrer">${safePitchDeckUrl}</a></p>
          <p style="font-size: 12px; color: #6b7280; margin-top: 20px;">Sent via CapitalFlow AI</p>
        </div>
      `,
      attachments: [
        {
          filename: attachmentName,
          content: fileBuffer
        }
      ]
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data, success: true }, { status: 200 });
  } catch (error) {
    console.error("Failed to send pitch deck:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
