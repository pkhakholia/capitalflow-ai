"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { Logo } from "@/components/ui/Logo";

export default function LoginPage() {
  const router = useRouter();
  const { signInWithOtp, verifyOtp, isAuthenticated, profile } = useAuth();
  
  const [email, setEmail] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [step, setStep] = React.useState<"email" | "otp">("email");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated && profile) {
      if (profile.role === "startup") {
        router.push("/dashboard");
      } else if (profile.role === "investor") {
        router.push("/investor/dashboard");
      }
    } else if (isAuthenticated && !profile) {
      router.push("/select-role");
    }
  }, [isAuthenticated, profile, router]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const { error } = await signInWithOtp(email);
    
    if (error) {
      setError(error.message);
    } else {
      setMessage("Check your email! We've sent you a login code.");
      setStep("otp");
    }
    
    setIsLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const { error, needsProfile } = await verifyOtp(email, otp);
    
    if (error) {
      setError(error.message);
    } else if (needsProfile) {
      router.push("/select-role");
    }
    // Otherwise, the useEffect will handle the redirect based on profile role
    
    setIsLoading(false);
  };

  const handleResendOtp = async () => {
    setError(null);
    setIsLoading(true);

    const { error } = await signInWithOtp(email);
    
    if (error) {
      setError(error.message);
    } else {
      setMessage("New code sent! Check your email.");
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Logo priority />
        </div>

        <div className="bg-white rounded-2xl border border-[#CBD5E1] p-8 shadow-sm">
          {step === "email" ? (
            <>
              <div className="text-center mb-6">
                <h1 className="font-[family-name:var(--font-fraunces)] text-[22px] font-semibold tracking-[-0.3px] text-slate-900 mb-2">
                  Welcome back
                </h1>
                <p className="text-[14px] text-[#64748B]">
                  Enter your email to sign in with a one-time code
                </p>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-[12.5px] font-medium text-[#334155] mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="founder@company.com"
                      className="w-full h-[44px] pl-10 pr-3 rounded-[6px] border border-[#CBD5E1] bg-white text-[13.5px] text-slate-900 outline-none transition placeholder:text-[#94A3B8] focus:border-[#4F46E5] focus:ring-4 focus:ring-[rgba(79,70,229,0.1)]"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 text-[13px] text-rose-600">
                    {error}
                  </div>
                )}

                {message && (
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-[13px] text-emerald-600 flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !email}
                  className="w-full h-[48px] flex items-center justify-center gap-2 rounded-[10px] bg-[#4F46E5] text-[15px] font-semibold text-white transition hover:bg-[#4338CA] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      Send Login Code
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <h1 className="font-[family-name:var(--font-fraunces)] text-[22px] font-semibold tracking-[-0.3px] text-slate-900 mb-2">
                  Enter verification code
                </h1>
                <p className="text-[14px] text-[#64748B]">
                  We sent a code to <span className="font-medium text-slate-900">{email}</span>
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-[12.5px] font-medium text-[#334155] mb-1.5">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="123456"
                    className="w-full h-[44px] px-3 rounded-[6px] border border-[#CBD5E1] bg-white text-[13.5px] text-slate-900 outline-none transition placeholder:text-[#94A3B8] focus:border-[#4F46E5] focus:ring-4 focus:ring-[rgba(79,70,229,0.1)] text-center tracking-[0.5em] font-mono text-lg"
                    required
                    maxLength={6}
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 text-[13px] text-rose-600">
                    {error}
                  </div>
                )}

                {message && (
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-[13px] text-emerald-600 flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || otp.length < 6}
                  className="w-full h-[48px] flex items-center justify-center gap-2 rounded-[10px] bg-[#4F46E5] text-[15px] font-semibold text-white transition hover:bg-[#4338CA] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    "Verify & Sign In"
                  )}
                </button>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep("email")}
                    className="text-[13px] text-[#64748B] hover:text-[#4F46E5] transition"
                  >
                    Use different email
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className="text-[13px] font-medium text-[#4F46E5] hover:text-[#4338CA] transition disabled:opacity-60"
                  >
                    Resend code
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-[13px] text-[#64748B]">
          Don&apos;t have an account?{" "}
          <Link href="/startup-signup" className="font-medium text-[#4F46E5] hover:text-[#4338CA] transition">
            Get started
          </Link>
        </p>
      </div>
    </div>
  );
}
