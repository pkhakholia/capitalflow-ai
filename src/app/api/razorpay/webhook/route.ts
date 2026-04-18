import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { ORDER_AMOUNT_MAP, PLAN_ID_MAP } from "@/lib/plans";

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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase =
      supabaseUrl && serviceRoleKey
        ? createClient(supabaseUrl, serviceRoleKey)
        : null;

    if (!supabase) {
      console.error("[razorpay/webhook] missing Supabase service role configuration");
    }

    const paymentEntity = (event.payload?.payment as { entity?: Record<string, unknown> } | undefined)
      ?.entity;
    const subscriptionEntity = (
      event.payload?.subscription as { entity?: Record<string, unknown> } | undefined
    )?.entity;

    switch (event.event) {
      case "payment.captured": {
        if (!supabase || !paymentEntity) break;

        const paymentId = typeof paymentEntity.id === "string" ? paymentEntity.id : null;
        const orderId = typeof paymentEntity.order_id === "string" ? paymentEntity.order_id : null;
        const amount = Number(paymentEntity.amount);
        const mappedPlan = Number.isFinite(amount) ? ORDER_AMOUNT_MAP[amount] : undefined;
        const notes =
          typeof paymentEntity.notes === "object" && paymentEntity.notes
            ? (paymentEntity.notes as Record<string, unknown>)
            : {};
        const metadataUserId =
          typeof notes.user_id === "string"
            ? notes.user_id
            : typeof notes.profile_id === "string"
              ? notes.profile_id
              : null;

        if (!paymentId) {
          console.error("[razorpay/webhook] missing payment id in payment.captured", {
            event: event.event
          });
          break;
        }

        if (!mappedPlan) {
          console.error("[razorpay/webhook] plan lookup failed for captured payment", {
            paymentId,
            orderId,
            amount
          });
          break;
        }

        try {
          let targetUserId: string | null = metadataUserId;

          if (!targetUserId) {
            const { data: existingProfile, error: findError } = await supabase
              .from("profiles")
              .select("id")
              .eq("razorpay_payment_id", paymentId)
              .maybeSingle();

            if (findError) {
              console.error("[razorpay/webhook] profile lookup failed (payment.captured)", {
                paymentId,
                findError
              });
            }

            targetUserId = existingProfile?.id ?? null;
          }

          if (!targetUserId) {
            console.error("[razorpay/webhook] no profile match for payment.captured", {
              paymentId,
              orderId
            });
            break;
          }

          const { error: updateError } = await supabase
            .from("profiles")
            .update({
              plan: mappedPlan,
              subscription_status: "active",
              plan_activated_at: new Date().toISOString(),
              razorpay_payment_id: paymentId
            })
            .eq("id", targetUserId);

          if (updateError) {
            console.error("[razorpay/webhook] profile update failed (payment.captured)", {
              paymentId,
              orderId,
              targetUserId,
              updateError
            });
          }
        } catch (dbError) {
          console.error("[razorpay/webhook] profile update exception (payment.captured)", {
            paymentId,
            orderId,
            dbError
          });
        }
        break;
      }
      case "subscription.activated": {
        if (!supabase || !subscriptionEntity) break;

        const subscriptionId =
          typeof subscriptionEntity.id === "string" ? subscriptionEntity.id : null;
        const planId =
          typeof subscriptionEntity.plan_id === "string" ? subscriptionEntity.plan_id : null;
        const mappedPlan = planId ? PLAN_ID_MAP[planId] : undefined;

        if (!subscriptionId || !mappedPlan) {
          console.error("[razorpay/webhook] invalid subscription.activated payload", {
            subscriptionId,
            planId
          });
          break;
        }

        try {
          const { error: updateError } = await supabase
            .from("profiles")
            .update({
              plan: mappedPlan,
              subscription_status: "active",
              plan_activated_at: new Date().toISOString()
            })
            .eq("subscription_id", subscriptionId);

          if (updateError) {
            console.error("[razorpay/webhook] profile update failed (subscription.activated)", {
              subscriptionId,
              planId,
              updateError
            });
          }
        } catch (dbError) {
          console.error("[razorpay/webhook] profile update exception (subscription.activated)", {
            subscriptionId,
            planId,
            dbError
          });
        }
        break;
      }
      case "subscription.charged": {
        if (!supabase || !subscriptionEntity) break;

        const subscriptionId =
          typeof subscriptionEntity.id === "string" ? subscriptionEntity.id : null;
        const currentEndRaw = Number(subscriptionEntity.current_end);
        const nextBillingAt =
          Number.isFinite(currentEndRaw) && currentEndRaw > 0
            ? new Date(currentEndRaw * 1000).toISOString()
            : null;

        if (!subscriptionId || !nextBillingAt) {
          console.error("[razorpay/webhook] invalid subscription.charged payload", {
            subscriptionId,
            currentEndRaw
          });
          break;
        }

        try {
          const { error: updateError } = await supabase
            .from("profiles")
            .update({
              subscription_status: "active",
              next_billing_at: nextBillingAt
            })
            .eq("subscription_id", subscriptionId);

          if (updateError) {
            console.error("[razorpay/webhook] profile update failed (subscription.charged)", {
              subscriptionId,
              nextBillingAt,
              updateError
            });
          }
        } catch (dbError) {
          console.error("[razorpay/webhook] profile update exception (subscription.charged)", {
            subscriptionId,
            nextBillingAt,
            dbError
          });
        }
        break;
      }
      case "subscription.cancelled": {
        if (!supabase || !subscriptionEntity) break;

        const subscriptionId =
          typeof subscriptionEntity.id === "string" ? subscriptionEntity.id : null;

        if (!subscriptionId) {
          console.error("[razorpay/webhook] invalid subscription.cancelled payload");
          break;
        }

        try {
          const { error: updateError } = await supabase
            .from("profiles")
            .update({
              plan: "free",
              subscription_status: "cancelled"
            })
            .eq("subscription_id", subscriptionId);

          if (updateError) {
            console.error("[razorpay/webhook] profile update failed (subscription.cancelled)", {
              subscriptionId,
              updateError
            });
          }
        } catch (dbError) {
          console.error("[razorpay/webhook] profile update exception (subscription.cancelled)", {
            subscriptionId,
            dbError
          });
        }
        break;
      }
      case "payment.failed": {
        if (!supabase || !paymentEntity) break;

        const paymentId = typeof paymentEntity.id === "string" ? paymentEntity.id : null;
        const orderId = typeof paymentEntity.order_id === "string" ? paymentEntity.order_id : null;
        const description =
          typeof paymentEntity.error_description === "string"
            ? paymentEntity.error_description
            : typeof paymentEntity.description === "string"
              ? paymentEntity.description
              : "Unknown payment failure";
        const subscriptionId =
          typeof paymentEntity.subscription_id === "string"
            ? paymentEntity.subscription_id
            : null;

        try {
          const { error: insertError } = await supabase.from("payment_failures").insert({
            payment_id: paymentId,
            order_id: orderId,
            error_description: description
          });

          if (insertError) {
            console.error("[razorpay/webhook] payment failure insert failed", {
              paymentId,
              orderId,
              insertError
            });
          }
        } catch (dbError) {
          console.error("[razorpay/webhook] payment failure insert exception", {
            paymentId,
            orderId,
            dbError
          });
        }

        if (subscriptionId) {
          try {
            const { error: updateError } = await supabase
              .from("profiles")
              .update({ subscription_status: "inactive" })
              .eq("subscription_id", subscriptionId);

            if (updateError) {
              console.error("[razorpay/webhook] profile update failed (payment.failed)", {
                subscriptionId,
                updateError
              });
            }
          } catch (dbError) {
            console.error("[razorpay/webhook] profile update exception (payment.failed)", {
              subscriptionId,
              dbError
            });
          }
        }
        break;
      }
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
