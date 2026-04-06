import Razorpay from "razorpay";
import { NextResponse } from "next/server";

type CreateOrderResponse = {
  order: {
    id: string;
    amount: number;
    currency: string;
    receipt?: string;
    [key: string]: unknown;
  };
};

export async function POST() {
  try {
    const key_id = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id) {
      return NextResponse.json({ error: "Missing NEXT_PUBLIC_RAZORPAY_KEY_ID" }, { status: 500 });
    }
    if (!key_secret) {
      return NextResponse.json({ error: "Missing RAZORPAY_KEY_SECRET" }, { status: 500 });
    }

    const razorpay = new Razorpay({
      key_id,
      key_secret
    });

    const launchEnd = new Date("2026-04-10T00:00:00.000Z");
    const now = new Date();
    const amount = now < launchEnd ? 49900 : 99900; // ₹499 / ₹999 in paise

    const receipt = `capitalflow_${Date.now()}`;

    console.log("[create-order] now:", now.toISOString(), "launchEnd:", launchEnd.toISOString(), "amount:", amount);

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt,
      // Razorpay types vary across versions; API accepts 1/0 for capture.
      payment_capture: 1 as unknown as boolean
    });

    console.log("[create-order] created order id:", order.id);

    const safeOrder: CreateOrderResponse["order"] = {
      ...(order as any),
      id: String((order as any)?.id ?? ""),
      amount: Number((order as any)?.amount ?? amount),
      currency: String((order as any)?.currency ?? "INR"),
      receipt: typeof (order as any)?.receipt === "string" ? (order as any).receipt : receipt
    };

    return NextResponse.json({ order: safeOrder } satisfies CreateOrderResponse, { status: 200 });
  } catch (error) {
    console.error("[create-order] error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? { name: error.name, message: error.message, stack: error.stack }
            : { message: "Failed to create Razorpay order." }
      },
      { status: 500 }
    );
  }
}

