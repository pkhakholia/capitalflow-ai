"use client";

import * as React from "react";
import Link from "next/link";
import { PricingToggle } from "@/components/pricing/PricingToggle";
import { PricingCard } from "@/components/pricing/PricingCard";
import { PricingTable } from "@/components/pricing/PricingTable";
import { DevUpgradeButton } from "@/components/dev/DevUpgradeButton";
import { plans } from "@/lib/pricing";
import { useUserPlan } from "@/contexts/UserPlanContext";
import { featureAccess } from "@/lib/featureAccess";
import { supabase } from "@/lib/supabase";
import { Logo } from "@/components/ui/Logo";

export default function PricingPage() {
  const [isYearly, setIsYearly] = React.useState(false);
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const { userPlan, isLoading: isPlanLoading } = useUserPlan();

  React.useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session?.user);
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const currentPlan = userPlan?.plan || "free";
  const planConfig = featureAccess[currentPlan];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Logo />
            <div className="flex items-center gap-4">
              {!isLoading && (
                <>
                  {isLoggedIn ? (
                    <Link
                      href="/dashboard"
                      className="rounded-lg bg-[#4F46E5] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4338CA]"
                    >
                      Dashboard
                    </Link>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="text-sm font-medium text-slate-600 hover:text-slate-900"
                      >
                        Sign in
                      </Link>
                      <Link
                        href="/signup"
                        className="rounded-lg bg-[#4F46E5] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4338CA]"
                      >
                        Get Started
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="font-[family-name:var(--font-fraunces)] text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Supercharge your fundraising
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Upgrade your plan and unlock better investor access, AI tools, and faster fundraising.
          </p>
          
          {/* Current Plan Badge */}
          {isLoggedIn && !isPlanLoading && (
            <div className="mt-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#4F46E5]/10 px-4 py-2 text-sm font-medium text-[#4F46E5]">
                Current Plan: {planConfig.displayName}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Pricing Toggle */}
      <section className="px-4 pb-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-center gap-3">
            <PricingToggle isYearly={isYearly} onToggle={setIsYearly} />
            {isYearly && (
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                Save 25%
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 md:grid-cols-3">
            {plans.map((plan) => (
              <PricingCard
                key={plan.name}
                plan={plan}
                isYearly={isYearly}
                isLoggedIn={isLoggedIn}
                currentPlan={currentPlan}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-slate-900">
            Compare all features
          </h2>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <PricingTable isYearly={isYearly} currentPlan={currentPlan} />
          </div>
        </div>
      </section>

      {/* Dev Mode Upgrade Button (Only in development) */}
      {process.env.NODE_ENV === "development" && isLoggedIn && (
        <section className="px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-md">
            <DevUpgradeButton />
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-bold text-slate-900">
            Ready to accelerate your fundraising?
          </h2>
          <p className="mt-2 text-slate-600">
            Join thousands of startups using CapitalFlow AI to connect with the right investors.
          </p>
          <div className="mt-6">
            <Link
              href={isLoggedIn ? "/dashboard" : "/founder-profile"}
              className="inline-flex h-12 items-center justify-center rounded-lg bg-[#4F46E5] px-8 text-base font-semibold text-white transition-colors hover:bg-[#4338CA]"
            >
              {isLoggedIn ? "Go to Dashboard" : "Get Started Free"}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-slate-500">
              © 2025 CapitalFlow AI. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-sm text-slate-500 hover:text-slate-700">
                Privacy
              </Link>
              <Link href="/terms" className="text-sm text-slate-500 hover:text-slate-700">
                Terms
              </Link>
              <Link href="/contact" className="text-sm text-slate-500 hover:text-slate-700">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
