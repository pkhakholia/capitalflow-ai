import crypto from "crypto";

const COOKIE_NAME = "vm_paid_session";

function getSecret() {
  const secret = process.env.PAYWALL_SESSION_SECRET;
  if (!secret) {
    throw new Error("Missing PAYWALL_SESSION_SECRET env var on the server.");
  }
  return secret;
}

function base64urlEncode(input: Buffer) {
  return input
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64urlDecode(input: string) {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "===".slice((base64.length + 3) % 4);
  return Buffer.from(padded, "base64").toString("utf8");
}

export type PaidSessionPayload = {
  paidAt: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
};

export function createPaidSessionToken(payload: PaidSessionPayload) {
  const secret = getSecret();
  const body = Buffer.from(JSON.stringify(payload), "utf8");
  const sig = crypto.createHmac("sha256", secret).update(body).digest();
  return `${base64urlEncode(body)}.${base64urlEncode(sig)}`;
}

export function verifyPaidSessionToken(token: string): PaidSessionPayload | null {
  try {
    const secret = getSecret();
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [bodyPart, sigPart] = parts;

    const bodyBuf = Buffer.from(
      bodyPart.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((bodyPart.length + 3) % 4),
      "base64"
    );
    const sigExpected = crypto.createHmac("sha256", secret).update(bodyBuf).digest();

    const sigBuf = Buffer.from(
      sigPart.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((sigPart.length + 3) % 4),
      "base64"
    );

    if (!crypto.timingSafeEqual(sigExpected, sigBuf)) return null;

    const decoded = base64urlDecode(bodyPart);
    const parsed = JSON.parse(decoded) as PaidSessionPayload;
    if (!parsed?.paidAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getPaidCookieValue(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((p) => p.trim());
  const pair = parts.find((p) => p.startsWith(`${COOKIE_NAME}=`));
  if (!pair) return null;
  return decodeURIComponent(pair.split("=").slice(1).join("="));
}

export { COOKIE_NAME };

