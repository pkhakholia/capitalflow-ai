import { 
  LandingNav, 
  HeroSection, 
  InvestorDirectory,
  HowItWorks, 
  FeaturesSection, 
  SocialProof, 
  FinalCta, 
  LandingFooter 
} from "@/components/marketing/index";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--vm-surface)] font-[family-name:var(--font-dm-sans)] selection:bg-[var(--vm-indigo-light)] selection:text-[var(--vm-indigo)]">
      <LandingNav />
      
      <main className="flex-1">
        <HeroSection />
        <InvestorDirectory />
        <HowItWorks />
        <FeaturesSection />
        <SocialProof />
        <FinalCta />
      </main>
      
      <LandingFooter />
    </div>
  );
}
