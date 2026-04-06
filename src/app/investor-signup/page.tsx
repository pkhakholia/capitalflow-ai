import { InvestorProfileForm } from "@/components/forms/investor-profile-form";
import { PublicNav } from "@/components/nav/public-nav";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/Logo";

export default function InvestorSignupPage() {
  return (
    <div className="min-h-screen">
      <PublicNav />
      <main>
        <Container className="py-10">
          <div className="grid gap-6">
            <div className="flex justify-center">
              <Logo priority />
            </div>
            <div className="grid gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">Investor signup</h1>
              <p className="max-w-2xl text-sm text-mutedForeground">
                Define your investment focus to generate a ranked startup list. Data is saved to Supabase.
              </p>
            </div>
            <InvestorProfileForm />
          </div>
        </Container>
      </main>
    </div>
  );
}

