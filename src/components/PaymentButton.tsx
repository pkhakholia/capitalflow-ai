"use client";

import { useMemo, useState } from "react";
import { useRazorpay } from "@/hooks/useRazorpay";

type VerifyPaymentRequest = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  type: "order" | "subscription";
};

function extractFailureMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error && "error" in error) {
    const nested = (error as { error?: { description?: string } }).error;
    if (nested?.description) {
      return nested.description;
    }
  }

  return "Payment failed";
}

interface PaymentButtonProps {
  planName: string;
  amount: number;
  currency: string;
  orderId?: string;
  subscriptionId?: string;
  userEmail: string;
  userName: string;
  userPhone: string;
  onSuccess: (paymentId: string) => void;
  onFailure: (error: string) => void;
}

/**
 * Opens Razorpay checkout and verifies successful payment on backend.
 */
export function PaymentButton({
  planName,
  amount,
  currency,
  orderId,
  subscriptionId,
  userEmail,
  userName,
  userPhone,
  onSuccess,
  onFailure
}: PaymentButtonProps) {
  const { isLoading: isScriptLoading, error: scriptError, openCheckout } = useRazorpay();
  const [isProcessing, setIsProcessing] = useState(false);

  const keyId = useMemo(
    () => process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "",
    []
  );

  const isSubscriptionFlow = Boolean(subscriptionId);
  const isDisabled = isScriptLoading || isProcessing || Boolean(scriptError);

  const handlePaymentVerification = async (payload: VerifyPaymentRequest) => {
    const verifyResponse = await fetch("/api/razorpay/verify-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const verifyData = (await verifyResponse.json()) as
      | { success: true; paymentId: string }
      | { success: false; error?: string };

    if (!verifyResponse.ok || !verifyData.success) {
      throw new Error(
        "error" in verifyData && verifyData.error
          ? verifyData.error
          : "Payment verification failed"
      );
    }

    return verifyData.paymentId;
  };

  const createOneTimeOrder = async () => {
    const receipt = `receipt_${Date.now()}`;
    const response = await fetch("/api/razorpay/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, currency, receipt })
    });

    const data = (await response.json()) as
      | { orderId: string; keyId?: string }
      | { error?: string };

    if (!response.ok || !("orderId" in data) || !data.orderId) {
      throw new Error("error" in data && data.error ? data.error : "Unable to create order");
    }

    return data;
  };

  const handleClick = async () => {
    try {
      setIsProcessing(true);

      if (scriptError) {
        throw new Error(scriptError);
      }

      let resolvedOrderId = orderId;
      let resolvedKey = keyId;

      if (!resolvedOrderId && !subscriptionId) {
        const orderData = await createOneTimeOrder();
        resolvedOrderId = orderData.orderId;
        resolvedKey = orderData.keyId ?? resolvedKey;
      }

      if (!resolvedKey) {
        throw new Error("Missing NEXT_PUBLIC_RAZORPAY_KEY_ID");
      }

      if (!resolvedOrderId && !subscriptionId) {
        throw new Error("No Razorpay order or subscription found for checkout");
      }

      openCheckout({
        key: resolvedKey,
        amount,
        currency,
        name: "CapitalFlow AI",
        description: `${planName} plan`,
        order_id: resolvedOrderId,
        subscription_id: subscriptionId,
        prefill: {
          name: userName,
          email: userEmail,
          contact: userPhone
        },
        theme: {
          color: "#4F46E5"
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          }
        },
        onFailure: (response) => {
          setIsProcessing(false);
          onFailure(extractFailureMessage(response));
        },
        handler: async (response) => {
          try {
            const entityId =
              response.razorpay_order_id ??
              response.razorpay_subscription_id ??
              resolvedOrderId ??
              subscriptionId;

            if (!entityId) {
              throw new Error("Missing order/subscription identifier from Razorpay");
            }

            const paymentId = await handlePaymentVerification({
              razorpay_order_id: entityId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              type: isSubscriptionFlow ? "subscription" : "order"
            });

            onSuccess(paymentId);
          } catch (error) {
            const message = error instanceof Error ? error.message : "Payment verification failed";
            onFailure(message);
          } finally {
            setIsProcessing(false);
          }
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to start payment";
      setIsProcessing(false);
      onFailure(message);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      className="block w-full rounded-lg bg-[#4F46E5] py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-[#4338CA] disabled:cursor-not-allowed disabled:bg-slate-400"
    >
      {isScriptLoading
        ? "Loading checkout..."
        : isProcessing
          ? "Processing..."
          : "Upgrade Now"}
    </button>
  );
}
