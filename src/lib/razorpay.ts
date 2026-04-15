import "server-only";
import crypto from "crypto";
import Razorpay from "razorpay";

function getRequiredEnv(name: "RAZORPAY_KEY_ID" | "RAZORPAY_KEY_SECRET"): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

const razorpayClient = new Razorpay({
  key_id: getRequiredEnv("RAZORPAY_KEY_ID"),
  key_secret: getRequiredEnv("RAZORPAY_KEY_SECRET")
});

/**
 * Creates a one-time Razorpay order.
 */
export async function createOrder(
  amount: number,
  currency: string,
  receipt: string
){
  return razorpayClient.orders.create({
    amount,
    currency,
    receipt
  });
}

/**
 * Creates a Razorpay subscription for a plan.
 */
export async function createSubscription(
  planId: string,
  totalCount: number,
  customerId?: string
){
  return razorpayClient.subscriptions.create({
    plan_id: planId,
    total_count: totalCount,
    customer_notify: 1,
    ...(customerId ? { customer_id: customerId } : {})
  });
}

/**
 * Verifies Razorpay checkout signature for order/subscription payment callbacks.
 * For subscription callback verification, pass `subscription_id` as `orderId`.
 */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const secret = getRequiredEnv("RAZORPAY_KEY_SECRET");
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  if (expected.length !== signature.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(expected, "utf8"),
    Buffer.from(signature, "utf8")
  );
}
