import { NextResponse } from "next/server";
import { z } from "zod";
import { createOrder } from "@/lib/razorpay";

/*
  Production env checklist (Vercel Project Settings -> Environment Variables):
  - RAZORPAY_KEY_ID
  - RAZORPAY_KEY_SECRET
  - NEXT_PUBLIC_RAZORPAY_KEY_ID
  - RAZORPAY_WEBHOOK_SECRET (required for webhook verification routes)
*/

export const runtime = "nodejs";

const bodySchema = z.object({
  amount: z.number().int().positive(),
  currency: z.string().trim().min(3).max(10).default("INR"),
  receipt: z.string().trim().min(3).max(100)
});

/**
 * Creates a Razorpay one-time order.
 */
export async function POST(req: Request) {
  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { amount, currency, receipt } = parsed.data;
    const publishableKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? process.env.RAZORPAY_KEY_ID;
    if (!publishableKey) {
      console.error("[razorpay/create-order] missing publishable key env var", {
        hasNextPublicKey: Boolean(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID),
        hasServerKey: Boolean(process.env.RAZORPAY_KEY_ID)
      });
      return NextResponse.json(
        {
          error: "Razorpay key is not configured",
          detail: "Missing NEXT_PUBLIC_RAZORPAY_KEY_ID (or fallback RAZORPAY_KEY_ID)."
        },
        { status: 500 }
      );
    }

    if (!Number.isInteger(amount)) {
      console.error("[razorpay/create-order] amount must be in paise as an integer", { amount });
    }

    const order = await createOrder(amount, currency, receipt);

    return NextResponse.json(
      {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: publishableKey
      },
      { status: 200 }
    );
  } catch (error) {
    const err = error as {
      message?: string;
      error?: {
        code?: string;
        description?: string;
        source?: string;
        step?: string;
        reason?: string;
      };
      code?: string;
      description?: string;
    };

    const razorpayCode = err?.error?.code ?? err?.code ?? "UNKNOWN_ERROR";
    const razorpayDescription =
      err?.error?.description ?? err?.description ?? err?.message ?? "Failed to create order";

    console.error("[razorpay/create-order] failed", {
      razorpayCode,
      razorpayDescription,
      source: err?.error?.source,
      step: err?.error?.step,
      reason: err?.error?.reason,
      rawError: error
    });

    return NextResponse.json(
      {
        error: "Failed to create order",
        razorpayCode,
        razorpayDescription
      },
      { status: 500 }
    );
  }
}
