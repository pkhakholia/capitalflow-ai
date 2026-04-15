import { NextResponse } from "next/server";
import { z } from "zod";
import { createSubscription } from "@/lib/razorpay";

export const runtime = "nodejs";

const bodySchema = z.object({
  planId: z.string().trim().min(3),
  totalCount: z.number().int().positive(),
  customerId: z.string().trim().min(3).optional()
});

/**
 * Creates a Razorpay subscription.
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

    const { planId, totalCount, customerId } = parsed.data;
    const subscription = await createSubscription(planId, totalCount, customerId);

    return NextResponse.json(
      {
        subscriptionId: subscription.id,
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? process.env.RAZORPAY_KEY_ID
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[razorpay/create-subscription] error:", error);
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
  }
}

