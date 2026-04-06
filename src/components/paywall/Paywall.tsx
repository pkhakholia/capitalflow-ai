"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const launchEnd = new Date("2026-04-10T00:00:00.000Z");
const now = new Date();
const isLaunchOffer = now < launchEnd;

export function Paywall({ onUnlocked }: { onUnlocked?: () => void }) {
  const router = useRouter();
  const [isPaying, setIsPaying] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function getRazorpayCtor(): Promise<NonNullable<Window["Razorpay"]>> {
    const started = Date.now();
    const timeoutMs = 10_000;

    while (Date.now() - started < timeoutMs) {
      if (window.Razorpay) return window.Razorpay;
      await new Promise((r) => setTimeout(r, 250));
    }

    throw new Error("Razorpay checkout script not loaded. Please try again.");
  }

  const handlePayment = async () => {
    setError(null);
    setIsPaying(true);

    try {
      console.log("[paywall] creating order...");
      const res = await fetch("/api/create-order", { method: "POST" });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `create-order failed (${res.status})`);
      }

      const data = (await res.json()) as { order: { id: string; amount: number; currency: string } };
      const order = data.order;

      if (!order?.id) throw new Error("Missing order id from /api/create-order");

      const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID as string | undefined;
      if (!keyId) {
        throw new Error("Missing NEXT_PUBLIC_RAZORPAY_KEY_ID env var on client.");
      }

      console.log("[paywall] opening checkout for order:", order.id);

      const options = {
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: "CapitalFlow AI",
        description: "Unlock CapitalFlow AI",
        order_id: order.id,
        theme: {
          color: "#111827"
        },
        handler: async function (response: any) {
          try {
            console.log("[paywall] payment handler response:", response?.razorpay_payment_id);

            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response?.razorpay_order_id,
                razorpay_payment_id: response?.razorpay_payment_id,
                razorpay_signature: response?.razorpay_signature
              })
            });

            const verifyData = await verifyRes.json().catch(() => null);
            if (!verifyRes.ok || !verifyData?.ok) {
              throw new Error(JSON.stringify(verifyData?.error ?? verifyData ?? "Verification failed"));
            }

            onUnlocked?.();

            router.push("/dashboard");
          } catch (e) {
            console.error("[paywall] verification error:", e);
            setError(e instanceof Error ? e.message : "Payment verification failed.");
          } finally {
            setIsPaying(false);
          }
        }
      } as Record<string, unknown>;

      const RazorpayCtor = await getRazorpayCtor();
      const rzp = new RazorpayCtor(options);
      rzp.open();
    } catch (e) {
      console.error("[paywall] handlePayment error:", e);
      setError(e instanceof Error ? e.message : "Payment failed.");
      setIsPaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Script
        id="razorpay-checkout-js"
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 px-4 py-10">
        <div className="rounded-2xl border bg-card p-7 shadow-soft">
          <div className="flex items-start justify-between gap-4">
            <div className="grid gap-3">
              <Badge className="w-fit bg-muted">
                Limited time launch offer
              </Badge>
              <h1 className="text-3xl font-semibold tracking-tight">
                Unlock CapitalFlow AI 🚀
              </h1>
              <p className="text-sm text-mutedForeground">
                Access curated investor matches and AI insights
              </p>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-end gap-4">
              <div className="text-4xl font-bold">₹{isLaunchOffer ? "499" : "999"}</div>
              {isLaunchOffer ? (
                <div className="text-lg text-mutedForeground line-through">₹999</div>
              ) : null}
            </div>
            <p className="mt-2 text-xs text-mutedForeground">
              Includes one-time platform access.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button onClick={handlePayment} disabled={isPaying} className="w-full sm:w-auto">
              {isPaying ? "Processing..." : "Pay & Unlock"}
            </Button>
          </div>

          {error ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="mt-6">
            <ul className="grid gap-2 text-sm text-mutedForeground">
              <li>✔ Verified investor database</li>
              <li>✔ AI-powered matching</li>
              <li>✔ Save hours of cold outreach</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

