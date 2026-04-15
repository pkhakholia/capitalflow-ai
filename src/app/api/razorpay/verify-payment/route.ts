import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyPaymentSignature } from "@/lib/razorpay";

export const runtime = "nodejs";

const bodySchema = z.object({
  razorpay_order_id: z.string().trim().min(3),
  razorpay_payment_id: z.string().trim().min(3),
  razorpay_signature: z.string().trim().min(10),
  type: z.enum(["order", "subscription"])
});

/**
 * Verifies Razorpay checkout signature and marks payment success server-side.
 */
export async function POST(req: Request) {
  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, type } = parsed.data;

    const isValid = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 });
    }

    // TODO: Update `profiles` table for the authenticated user:
    // - set `plan` based on purchased product/plan mapping
    // - set `subscription_status` to "active"
    // - store payment/subscription metadata for audit trail
    // - for `type === "subscription"`, persist renewal/cancel lifecycle fields
    void type;

    return NextResponse.json({ success: true, paymentId: razorpay_payment_id }, { status: 200 });
  } catch (error) {
    console.error("[razorpay/verify-payment] error:", error);
    return NextResponse.json({ success: false, error: "Verification failed" }, { status: 500 });
  }
}

