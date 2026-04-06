"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Building2, Wallet, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import type { UserRole } from "@/types/auth";
import { Logo } from "@/components/ui/Logo";

export default function SelectRolePage() {
  const router = useRouter();
  const { user, profile, isLoading: authLoading, createProfile } = useAuth();
  
  const [selectedRole, setSelectedRole] = React.useState<UserRole | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
    // If user already has a profile, redirect to their dashboard
    if (profile) {
      if (profile.role === "startup") {
        router.push("/dashboard");
      } else {
        router.push("/investor/dashboard");
      }
    }
  }, [user, profile, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    setError(null);
    setIsSubmitting(true);

    const { error } = await createProfile(selectedRole);

    if (error) {
      setError(error.message);
    }
    // If successful, the useEffect will handle the redirect based on profile.role

    setIsSubmitting(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#4F46E5]" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Logo priority />
        </div>

        <div className="bg-white rounded-2xl border border-[#CBD5E1] p-8 shadow-sm">
          <div className="text-center mb-8">
            <h1 className="font-[family-name:var(--font-fraunces)] text-[24px] font-semibold tracking-[-0.3px] text-slate-900 mb-3">
              I am a...
            </h1>
            <p className="text-[14px] text-[#64748B]">
              Select your role to personalize your experience
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4">
              {/* Startup Option */}
              <button
                type="button"
                onClick={() => setSelectedRole("startup")}
                className={`relative flex items-center gap-4 p-5 rounded-xl border-2 transition-all text-left ${
                  selectedRole === "startup"
                    ? "border-[#4F46E5] bg-[#EEF2FF]"
                    : "border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-[#F8FAFC]"
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  selectedRole === "startup" ? "bg-[#4F46E5] text-white" : "bg-[#F1F5F9] text-[#64748B]"
                }`}>
                  <Building2 size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 text-[15px] mb-1">
                    Startup
                  </h3>
                  <p className="text-[13px] text-[#64748B]">
                    Looking to raise funding and connect with investors
                  </p>
                </div>
                {selectedRole === "startup" && (
                  <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-[#4F46E5] flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>

              {/* Investor Option */}
              <button
                type="button"
                onClick={() => setSelectedRole("investor")}
                className={`relative flex items-center gap-4 p-5 rounded-xl border-2 transition-all text-left ${
                  selectedRole === "investor"
                    ? "border-[#4F46E5] bg-[#EEF2FF]"
                    : "border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-[#F8FAFC]"
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  selectedRole === "investor" ? "bg-[#4F46E5] text-white" : "bg-[#F1F5F9] text-[#64748B]"
                }`}>
                  <Wallet size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 text-[15px] mb-1">
                    Investor
                  </h3>
                  <p className="text-[13px] text-[#64748B]">
                    Looking to discover and invest in promising startups
                  </p>
                </div>
                {selectedRole === "investor" && (
                  <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-[#4F46E5] flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            </div>

            {error && (
              <div className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 text-[13px] text-rose-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!selectedRole || isSubmitting}
              className="w-full h-[52px] flex items-center justify-center gap-2 rounded-[10px] bg-[#4F46E5] text-[15px] font-semibold text-white transition hover:bg-[#4338CA] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Continue
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
