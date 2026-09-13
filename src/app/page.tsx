import { LoadingExperience } from '@/components/ui/LoadingExperience';
import { Navbar } from '@/components/layout/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { MarqueeRibbon } from '@/components/ui/MarqueeRibbon';
import { ProblemSection } from '@/components/landing/ProblemSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { FeaturesGrid } from '@/components/landing/FeaturesGrid';
import { ImpactStats } from '@/components/landing/ImpactStats';
import { CTASection } from '@/components/landing/CTASection';
import { Footer } from '@/components/layout/Footer';

export default function HomePage() {
  return (
    <>
      <LoadingExperience />
      <Navbar />
      <main>
        <HeroSection />
        <MarqueeRibbon />
        <ProblemSection />
        <HowItWorksSection />
        <FeaturesGrid />
        <ImpactStats />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
