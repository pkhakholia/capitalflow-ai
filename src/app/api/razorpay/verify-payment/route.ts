import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient as createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { z } from "zod";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { ORDER_AMOUNT_MAP, PLAN_ID_MAP } from "@/lib/plans";
import Razorpay from "razorpay";

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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("[razorpay/verify-payment] missing Supabase env vars");
      return NextResponse.json({ success: false, error: "Server misconfiguration" }, { status: 500 });
    }

    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // No-op in this route; auth reads are sufficient for this endpoint.
        }
      }
    });
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      console.error("[razorpay/verify-payment] missing Razorpay keys");
      return NextResponse.json({ success: false, error: "Server misconfiguration" }, { status: 500 });
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });

    if (type === "order") {
      let mappedPlan: string | undefined;

      try {
        const order = await razorpay.orders.fetch(razorpay_order_id);
        mappedPlan = ORDER_AMOUNT_MAP[Number(order.amount)];
      } catch (orderFetchError) {
        console.error("[razorpay/verify-payment] order fetch failed", {
          razorpay_order_id,
          error: orderFetchError
        });
      }

      if (!mappedPlan) {
        console.error("[razorpay/verify-payment] plan lookup failed for order", {
          razorpay_order_id
        });
        return NextResponse.json({ success: true, paymentId: razorpay_payment_id }, { status: 200 });
      }

      try {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            plan: mappedPlan,
            subscription_status: "active",
            razorpay_payment_id: razorpay_payment_id,
            plan_activated_at: new Date().toISOString()
          })
          .eq("id", user.id);

        if (updateError) {
          console.error("[razorpay/verify-payment] profile update failed (order)", {
            userId: user.id,
            razorpay_order_id,
            razorpay_payment_id,
            updateError
          });
        }
      } catch (dbError) {
        console.error("[razorpay/verify-payment] profile update exception (order)", {
          userId: user.id,
          razorpay_order_id,
          razorpay_payment_id,
          dbError
        });
      }
    }

    if (type === "subscription") {
      let mappedPlan: string | undefined;
      let planId: string | undefined;
      const subscriptionId = razorpay_order_id;

      try {
        const subscription = await razorpay.subscriptions.fetch(subscriptionId);
        planId = subscription.plan_id;
        mappedPlan = planId ? PLAN_ID_MAP[planId] : undefined;
      } catch (subscriptionFetchError) {
        console.error("[razorpay/verify-payment] subscription fetch failed", {
          subscriptionId,
          error: subscriptionFetchError
        });
      }

      if (!mappedPlan) {
        console.error("[razorpay/verify-payment] plan lookup failed for subscription", {
          subscriptionId,
          planId
        });
        return NextResponse.json({ success: true, paymentId: razorpay_payment_id }, { status: 200 });
      }

      try {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            plan: mappedPlan,
            subscription_status: "active",
            subscription_id: subscriptionId,
            razorpay_payment_id: razorpay_payment_id,
            plan_activated_at: new Date().toISOString()
          })
          .eq("id", user.id);

        if (updateError) {
          console.error("[razorpay/verify-payment] profile update failed (subscription)", {
            userId: user.id,
            subscriptionId,
            razorpay_payment_id,
            updateError
          });
        }
      } catch (dbError) {
        console.error("[razorpay/verify-payment] profile update exception (subscription)", {
          userId: user.id,
          subscriptionId,
          razorpay_payment_id,
          dbError
        });
      }
    }

    return NextResponse.json({ success: true, paymentId: razorpay_payment_id }, { status: 200 });
  } catch (error) {
    console.error("[razorpay/verify-payment] error:", error);
    return NextResponse.json({ success: false, error: "Verification failed" }, { status: 500 });
  }
}
