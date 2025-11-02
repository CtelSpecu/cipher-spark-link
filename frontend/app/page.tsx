import { HeroSection } from "@/components/HeroSection";
import { ApplicationsSection } from "@/components/ApplicationsSection";
import { HowItWorksSection } from "@/components/HowItWorksSection";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <ApplicationsSection />
      <HowItWorksSection />
    </div>
  );
}
