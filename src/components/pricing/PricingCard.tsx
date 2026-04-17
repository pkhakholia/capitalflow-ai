"use client";

import Link from "next/link";
import type { Plan } from "@/lib/pricing";

interface PricingCardProps {
  plan: Plan;
  isYearly: boolean;
  isLoggedIn: boolean;
  currentPlan?: string;
  userEmail?: string;
  userName?: string;
  userPhone?: string;
  onUpgradeSuccess?: (paymentId: string) => void;
  onUpgradeFailure?: (error: string) => void;
}

export function PricingCard({
  plan,
  isYearly,
  isLoggedIn,
  currentPlan = "free",
  userEmail = "",
  userName = "",
  userPhone = "",
  onUpgradeSuccess,
  onUpgradeFailure
}: PricingCardProps) {
  void isLoggedIn;
  void userEmail;
  void userName;
  void userPhone;
  void onUpgradeSuccess;
  void onUpgradeFailure;

  const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
  const period = isYearly ? "/year" : "/month";
  const isFree = price === 0;
  const isCurrentPlan =
    plan.name.toLowerCase().includes(currentPlan.toLowerCase()) ||
    (currentPlan === "free" && plan.name === "Free") ||
    (currentPlan === "pro" && plan.name === "Flow Pro") ||
    (currentPlan === "gold" && plan.name === "Flow Gold");

  const isProPlan = plan.name === "Flow Pro";
  const isGoldPlan = plan.name === "Flow Gold";

  return (
    <div
      className={`relative rounded-2xl bg-white p-6 shadow-md transition-all hover:shadow-lg ${
        plan.mostPopular
          ? "scale-105 border-2 border-[#4F46E5] shadow-lg"
          : "border border-slate-200"
      }`}
    >
      {plan.mostPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-[#4F46E5] px-4 py-1 text-xs font-semibold text-white">
            Most Popular
          </span>
        </div>
      )}

      <div className="mb-6 text-center">
        <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
        <div className="mt-4 flex items-baseline justify-center gap-1">
          <span className="text-4xl font-bold text-slate-900">Rs{price.toLocaleString()}</span>
          <span className="text-sm text-slate-500">{period}</span>
        </div>
        {isYearly && !isFree && <p className="mt-1 text-xs text-slate-500">Billed annually</p>}
      </div>

      {isFree ? (
        <Link
          href="/founder-profile"
          className="block w-full rounded-lg bg-[#4F46E5] py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-[#4338CA]"
        >
          Get Started
        </Link>
      ) : isCurrentPlan ? (
        <button
          disabled
          className="block w-full cursor-default rounded-lg bg-green-100 py-3 text-center text-sm font-semibold text-green-700"
        >
          Current Plan
        </button>
      ) : isProPlan ? (
        <div className="w-full text-center">
          <div
            className="[&_form]:mx-auto [&_form]:w-full [&_iframe]:mx-auto [&_iframe]:max-w-full"
            dangerouslySetInnerHTML={{
              __html:
                '<form><script src="https://checkout.razorpay.com/v1/payment-button.js" data-payment_button_id="pl_SeVxgXvkLncDMj" async></script></form>'
            }}
          />
          <p className="mt-3 text-center text-xs text-slate-500">
            After payment, your plan will be activated within 24 hours. Contact support@capitalflow.in
            for assistance.
          </p>
        </div>
      ) : isGoldPlan ? (
        <div className="w-full text-center">
          <div
            className="[&_form]:mx-auto [&_form]:w-full [&_iframe]:mx-auto [&_iframe]:max-w-full"
            dangerouslySetInnerHTML={{
              __html:
                '<form><script src="https://checkout.razorpay.com/v1/payment-button.js" data-payment_button_id="pl_SeVzHsOezXCpCV" async></script></form>'
            }}
          />
          <p className="mt-3 text-center text-xs text-slate-500">
            After payment, your plan will be activated within 24 hours. Contact support@capitalflow.in
            for assistance.
          </p>
        </div>
      ) : (
        <Link
          href="/signup"
          className={`block w-full rounded-lg py-3 text-center text-sm font-semibold transition-colors ${
            plan.mostPopular
              ? "bg-[#4F46E5] text-white hover:bg-[#4338CA]"
              : "bg-slate-900 text-white hover:bg-slate-800"
          }`}
        >
          Upgrade Now
        </Link>
      )}

      <p className="mt-3 text-center text-xs text-slate-500">Cancel anytime</p>

      <ul className="mt-6 space-y-3">
        <li className="flex items-center gap-2 text-sm text-slate-700">
          <svg className="h-4 w-4 text-[#4F46E5]" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span className="font-medium">{plan.features.outreach}</span> outreach
        </li>
        <li className="flex items-center gap-2 text-sm text-slate-700">
          <svg className="h-4 w-4 text-[#4F46E5]" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span className="font-medium">{plan.features.aiMatching}</span> AI matches
        </li>
        {plan.features.aiAnalyzer !== "-" && (
          <li className="flex items-center gap-2 text-sm text-slate-700">
            <svg className="h-4 w-4 text-[#4F46E5]" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            AI Pitch Deck Analyzer
          </li>
        )}
        {plan.features.pitchBuilder !== "-" && (
          <li className="flex items-center gap-2 text-sm text-slate-700">
            <svg className="h-4 w-4 text-[#4F46E5]" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Pitch Builder
          </li>
        )}
        <li className="flex items-center gap-2 text-sm text-slate-700">
          <svg className="h-4 w-4 text-[#4F46E5]" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          {plan.features.investorSearch}
        </li>
      </ul>
    </div>
  );
}
