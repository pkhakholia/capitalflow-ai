import Link from "next/link";
import { ArrowRight, BrainCircuit, Target, Lightbulb, Zap, LineChart, Building2, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export function LandingNav() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[var(--vm-slate-5)] bg-[var(--vm-white)]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Logo />
        
        <div className="hidden items-center gap-8 md:flex">
          <Link href="#features" className="text-[14px] font-medium text-[var(--vm-slate-3)] hover:text-[var(--vm-slate)] transition-colors">Features</Link>
          <Link href="/pricing" className="text-[14px] font-medium text-[var(--vm-slate-3)] hover:text-[var(--vm-slate)] transition-colors">Pricing</Link>
          <Link href="/login" className="text-[14px] font-medium text-[var(--vm-slate-3)] hover:text-[var(--vm-slate)] transition-colors">Login</Link>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/founder-profile" className="rounded-md bg-[var(--vm-indigo)] px-4 py-2 text-[14px] font-semibold text-white transition-opacity hover:opacity-90">
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[var(--vm-white)] pt-24 pb-32">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(79,70,229,0.06),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(5,150,105,0.04),transparent_50%)]" />
      
      <div className="relative mx-auto max-w-5xl px-6 text-center">
        <div className="inline-flex items-center rounded-full border border-[var(--vm-slate-5)] bg-[var(--vm-surface)] px-3 py-1 mb-8">
          <Sparkles className="mr-2 h-4 w-4 text-[var(--vm-indigo)]" />
          <span className="text-[13px] font-medium text-[var(--vm-slate-2)]">Next-gen AI Matching Engine</span>
        </div>
        
        <h1 className="font-[family-name:var(--font-fraunces)] text-5xl font-semibold tracking-tight text-[var(--vm-slate)] sm:text-7xl mb-6">
          Find your perfect <span className="bg-gradient-to-r from-[var(--vm-indigo)] to-[var(--vm-emerald)] bg-clip-text text-transparent">venture fit</span>.
        </h1>
        
        <p className="mx-auto mb-10 max-w-2xl text-[18px] text-[var(--vm-slate-3)] leading-relaxed">
          The premium platform connecting visionary founders with high-conviction investors, driven by transparent AI insights and actionable metrics.
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/founder-profile" className="group flex w-full items-center justify-center rounded-lg bg-[var(--vm-indigo)] px-6 py-3.5 text-[15px] font-semibold text-white shadow-xl shadow-indigo-500/20 transition-all hover:bg-indigo-700 sm:w-auto">
            Sign up as Startup
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link href="/investor-signup" className="group flex w-full items-center justify-center rounded-lg border border-[var(--vm-slate-5)] bg-white px-6 py-3.5 text-[15px] font-semibold text-[var(--vm-slate-2)] shadow-sm transition-all hover:bg-[var(--vm-slate-6)] sm:w-auto">
            Sign up as Investor
          </Link>
        </div>
      </div>
    </section>
  );
}

function Sparkles(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
  );
}

export function HowItWorks() {
  const steps = [
    {
      icon: <Building2 className="h-6 w-6 text-[var(--vm-indigo)]" />,
      title: "1. Build Your Profile",
      desc: "Distill your startup's core mechanics or investor thesis into a structured, clean data format.",
    },
    {
      icon: <BrainCircuit className="h-6 w-6 text-[var(--vm-emerald)]" />,
      title: "2. Intelligent Analysis",
      desc: "Our AI scans the ecosystem to surface hyper-compatible opportunities and scores them instantly.",
    },
    {
      icon: <Zap className="h-6 w-6 text-[var(--vm-amber)]" />,
      title: "3. Direct Connection",
      desc: "Review match scoring parameters in depth, then connect directly with key decision-makers.",
    }
  ];

  return (
    <section className="bg-[var(--vm-surface)] py-24 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <h2 className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold text-[var(--vm-slate)] md:text-4xl">How CapitalFlow AI Works</h2>
          <p className="mt-4 text-[16px] text-[var(--vm-slate-3)]">A highly curated pipeline from discovery to term sheet.</p>
        </div>
        
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step, idx) => (
            <div key={idx} className="rounded-2xl border border-[var(--vm-slate-5)] bg-[var(--vm-white)] p-8 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--vm-indigo-light)]">
                {step.icon}
              </div>
              <h3 className="mb-3 text-[18px] font-semibold text-[var(--vm-slate)]">{step.title}</h3>
              <p className="text-[15px] leading-relaxed text-[var(--vm-slate-2)]">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FeaturesSection() {
  return (
    <section id="features" className="bg-[var(--vm-white)] py-24 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <h2 className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold text-[var(--vm-slate)] md:text-4xl">Features that deliver conviction</h2>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Feature 1 (Large Span) */}
          <div className="group relative overflow-hidden rounded-2xl border border-[var(--vm-slate-5)] bg-[var(--vm-surface)] p-8 md:col-span-2">
            <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-[var(--vm-indigo)]/5 opacity-50 blur-3xl transition-opacity group-hover:opacity-100" />
            <BrainCircuit className="mb-6 h-8 w-8 text-[var(--vm-indigo)]" />
            <h3 className="mb-3 text-[20px] font-semibold text-[var(--vm-slate)]">Explainable AI Matching</h3>
            <p className="max-w-md text-[15px] text-[var(--vm-slate-3)] leading-relaxed">
              Don't just see a match score. Understand *why* you match through transparent breakdown cards analyzing sector fit, stage synergy, and ticket size requirements.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="group relative overflow-hidden rounded-2xl border border-[var(--vm-slate-5)] bg-[var(--vm-emerald-light)]/30 p-8">
             <Lightbulb className="mb-6 h-8 w-8 text-[var(--vm-emerald)]" />
             <h3 className="mb-3 text-[18px] font-semibold text-[var(--vm-slate)]">Pitch deck generation</h3>
             <p className="text-[14px] text-[var(--vm-slate-3)] leading-relaxed">
               Input your core metrics and story; let our tailored AI models generate VC-ready localized pitch narratives for immediate validation.
             </p>
          </div>

          {/* Feature 3 */}
          <div className="group rounded-2xl border border-[var(--vm-slate-5)] bg-[var(--vm-amber-light)]/30 p-8">
             <LineChart className="mb-6 h-8 w-8 text-[var(--vm-amber)]" />
             <h3 className="mb-3 text-[18px] font-semibold text-[var(--vm-slate)]">Real-time Insights</h3>
             <p className="text-[14px] text-[var(--vm-slate-3)] leading-relaxed">
               Track how your platform engagement converts across dynamic scoreboards within an elegant, minimal dashboard layout.
             </p>
          </div>

          {/* Feature 4 (Large Span) */}
          <div className="group rounded-2xl border border-[var(--vm-slate-5)] bg-[var(--vm-surface)] p-8 md:col-span-2">
             <Target className="mb-6 h-8 w-8 text-[var(--vm-indigo-mid)]" />
             <h3 className="mb-3 text-[20px] font-semibold text-[var(--vm-slate)]">Direct Channel Connectivity</h3>
             <p className="max-w-md text-[15px] text-[var(--vm-slate-3)] leading-relaxed">
               When the match is mutual, bridge the gap instantly. Native messaging tools streamline term-sheet discussions to directly drive deal velocity.
             </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SocialProof() {
  const stats = [
    { label: "Capital Deployed", value: "$1.2B+" },
    { label: "Founders Funded", value: "3,400+" },
    { label: "Active Investors", value: "850+" },
    { label: "Signal Accuracy", value: "94%" },
  ];

  return (
    <section className="border-y border-[var(--vm-slate-5)] bg-[var(--vm-surface)] py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat, idx) => (
            <div key={idx} className="flex flex-col items-center justify-center text-center">
              <span className="font-[family-name:var(--font-fraunces)] text-4xl font-semibold text-[var(--vm-slate)] md:text-5xl">{stat.value}</span>
              <span className="mt-2 text-[13px] font-medium uppercase tracking-widest text-[var(--vm-slate-3)]">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="bg-[var(--vm-white)] py-32 px-6">
      <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl bg-[var(--vm-slate)] text-center relative shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.3),transparent_70%)]" />
        <div className="relative px-6 py-24 md:px-16">
          <h2 className="font-[family-name:var(--font-fraunces)] text-4xl font-semibold text-white md:text-5xl mb-6">
            Ready to find your match?
          </h2>
          <p className="mx-auto mb-10 max-w-xl text-[16px] text-slate-300 leading-relaxed">
            Join the premier network of modern founders and highly-operational investors deploying capital where it matters most.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/founder-profile" className="flex w-full items-center justify-center rounded-lg bg-[var(--vm-indigo)] px-8 py-3.5 text-[15px] font-semibold text-white transition-all hover:bg-indigo-500 sm:w-auto">
              Join as Startup
            </Link>
            <Link href="/investor-signup" className="flex w-full items-center justify-center rounded-lg bg-white/10 px-8 py-3.5 text-[15px] font-semibold text-white backdrop-blur-md transition-all hover:bg-white/20 sm:w-auto">
              Join as Investor
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="bg-[var(--vm-surface)] py-12 border-t border-[var(--vm-slate-5)]">
      <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <Logo className="w-[130px]" />
        <div className="text-[13px] text-[var(--vm-slate-3)]">
          &copy; {new Date().getFullYear()} CapitalFlow AI Inc. Profiles saved in Supabase.
        </div>
      </div>
    </footer>
  );
}

export { InvestorDirectory } from "./InvestorDirectory";
