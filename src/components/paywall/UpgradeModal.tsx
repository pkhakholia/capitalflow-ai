"use client";

import Link from "next/link";
import { X, Sparkles, Zap, Crown } from "lucide-react";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
  requiredPlan?: "pro" | "gold";
}

export function UpgradeModal({
  isOpen,
  onClose,
  featureName,
  requiredPlan = "pro"
}: UpgradeModalProps) {
  if (!isOpen) return null;

  const planDetails = {
    pro: {
      name: "Flow Pro",
      price: "₹1,500/month",
      icon: Zap,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      features: ["5 outreach per day", "3 AI matches", "3 investor search filters"]
    },
    gold: {
      name: "Flow Gold",
      price: "₹6,000/month",
      icon: Crown,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      features: ["Unlimited outreach", "Unlimited AI matching", "AI Pitch Analyzer", "Pitch Builder", "Unlimited investor search"]
    }
  };

  const plan = planDetails[requiredPlan];
  const Icon = plan.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Icon */}
        <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${plan.bgColor}`}>
          <Icon className={`h-8 w-8 ${plan.color}`} />
        </div>

        {/* Title */}
        <h2 className="mb-2 text-center text-2xl font-bold text-slate-900">
          Unlock Premium Features
        </h2>

        {/* Description */}
        <p className="mb-6 text-center text-slate-600">
          <span className="font-semibold text-slate-900">{featureName}</span> is available on the{" "}
          <span className={`font-semibold ${plan.color}`}>{plan.name}</span> plan.
        </p>

        {/* Plan card */}
        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-semibold text-slate-900">{plan.name}</span>
            <span className="text-lg font-bold text-slate-900">{plan.price}</span>
          </div>
          <ul className="space-y-2">
            {plan.features.map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                <Sparkles className="h-4 w-4 text-[#4F46E5]" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-3">
          <Link
            href="/pricing"
            onClick={onClose}
            className="flex h-12 items-center justify-center rounded-lg bg-[#4F46E5] px-6 text-base font-semibold text-white transition-colors hover:bg-[#4338CA]"
          >
            Upgrade Now
          </Link>
          <button
            onClick={onClose}
            className="h-12 rounded-lg border border-slate-200 px-6 text-base font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Maybe Later
          </button>
        </div>

        {/* Trust text */}
        <p className="mt-4 text-center text-xs text-slate-500">
          Cancel anytime. No hidden fees.
        </p>
      </div>
    </div>
  );
}
