import { NextResponse } from "next/server";
import { z } from "zod";
import { createOrder } from "@/lib/razorpay";

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
    const order = await createOrder(amount, currency, receipt);

    return NextResponse.json(
      {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? process.env.RAZORPAY_KEY_ID
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[razorpay/create-order] error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}

