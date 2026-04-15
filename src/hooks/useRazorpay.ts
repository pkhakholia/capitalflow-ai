"use client";

import { useCallback, useEffect, useState } from "react";

const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

type RazorpaySuccessResponse = {
  razorpay_order_id?: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  razorpay_subscription_id?: string;
};

export type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id?: string;
  subscription_id?: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: {
    color: string;
  };
  handler: (response: RazorpaySuccessResponse) => void;
  onFailure?: (response: unknown) => void;
  modal?: {
    ondismiss?: () => void;
  };
};

/**
 * Loads Razorpay checkout script and exposes a helper to open checkout.
 */
export function useRazorpay() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (window.Razorpay) {
      setIsLoading(false);
      return;
    }

    let scriptRef = document.querySelector<HTMLScriptElement>(
      `script[src="${RAZORPAY_SCRIPT_URL}"]`
    );

    const handleLoad = () => {
      if (isMounted) {
        setIsLoading(false);
        setError(null);
      }
    };

    const handleError = () => {
      if (isMounted) {
        setIsLoading(false);
        setError("Unable to load Razorpay checkout. Please try again.");
      }
    };

    if (scriptRef) {
      scriptRef.addEventListener("load", handleLoad);
      scriptRef.addEventListener("error", handleError);

      if (window.Razorpay) {
        handleLoad();
      }
    } else {
      const script = document.createElement("script");
      script.src = RAZORPAY_SCRIPT_URL;
      script.async = true;
      script.addEventListener("load", handleLoad);
      script.addEventListener("error", handleError);
      document.body.appendChild(script);
      scriptRef = script;
    }

    return () => {
      isMounted = false;
      scriptRef?.removeEventListener("load", handleLoad);
      scriptRef?.removeEventListener("error", handleError);
    };
  }, []);

  const openCheckout = useCallback(
    (options: RazorpayOptions): void => {
      if (!window.Razorpay) {
        throw new Error(error ?? "Razorpay SDK not available.");
      }

      const checkout = new window.Razorpay(options);
      if (options.onFailure && typeof (checkout as { on?: unknown }).on === "function") {
        (checkout as unknown as { on: (event: string, handler: (response: unknown) => void) => void }).on(
          "payment.failed",
          options.onFailure
        );
      }
      checkout.open();
    },
    [error]
  );

  return {
    isLoading,
    error,
    openCheckout
  };
}
