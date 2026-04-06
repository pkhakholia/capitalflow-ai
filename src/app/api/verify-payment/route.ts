import crypto from "crypto";

import { NextResponse } from "next/server";
import { createPaidSessionToken, COOKIE_NAME } from "@/lib/paywall-session";

type VerifyBody = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as VerifyBody;

    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_secret) {
      return NextResponse.json(
        { error: "Missing RAZORPAY_KEY_SECRET env var on server" },
        { status: 500 }
      );
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing required payment fields." },
        { status: 400 }
      );
    }

    // Verify HMAC signature (order_id|payment_id) matches.
    const expected = crypto
      .createHmac("sha256", key_secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const ok = crypto.timingSafeEqual(
      Buffer.from(expected, "utf8"),
      Buffer.from(razorpay_signature, "utf8")
    );

    if (!ok) {
      return NextResponse.json(
        { error: "Invalid Razorpay signature." },
        { status: 400 }
      );
    }

    const res = NextResponse.json({ ok: true }, { status: 200 });

    // Issue a signed, httpOnly cookie so the client cannot bypass the paywall.
    const token = createPaidSessionToken({
      paidAt: new Date().toISOString(),
      razorpayPaymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id
    });

    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      // 1 year
      maxAge: 60 * 60 * 24 * 365
    });

    return res;
  } catch (error) {
    console.error("[verify-payment] error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? { name: error.name, message: error.message, stack: error.stack }
            : { message: "Payment verification failed." }
      },
      { status: 500 }
    );
  }
}

