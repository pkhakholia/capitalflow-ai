import crypto from "crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  if (expected.length !== signature.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(signature, "utf8"));
}

/**
 * Receives Razorpay webhook events and processes payment lifecycle changes.
 */
export async function POST(req: Request) {
  try {
    const signature = req.headers.get("x-razorpay-signature");
    if (!signature) {
      return NextResponse.json({ error: "Missing webhook signature" }, { status: 400 });
    }

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json({ error: "Missing RAZORPAY_WEBHOOK_SECRET" }, { status: 500 });
    }

    const payload = await req.text();
    const isValid = verifyWebhookSignature(payload, signature, webhookSecret);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
    }

    const event = JSON.parse(payload) as {
      event?: string;
      payload?: Record<string, unknown>;
    };

    switch (event.event) {
      case "payment.captured":
        // TODO: Mark payment as complete in DB and reconcile against created order/subscription.
        break;
      case "subscription.activated":
        // TODO: Activate user plan in `profiles` table.
        break;
      case "subscription.charged":
        // TODO: Log subscription renewal and update next billing metadata.
        break;
      case "subscription.cancelled":
        // TODO: Downgrade user plan and mark subscription status as cancelled.
        break;
      case "payment.failed":
        // TODO: Persist payment failure details for retry/recovery workflows.
        break;
      default:
        break;
    }

    // Razorpay expects 2xx so delivery is acknowledged even for unhandled events.
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("[razorpay/webhook] error:", error);
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}

