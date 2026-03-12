import PublicLayout from "@/components/layouts/PublicLayout";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import DashboardPreview from "@/components/landing/DashboardPreview";
import IssueFeedPreview from "@/components/landing/IssueFeedPreview";
import FilterDiscoverSection from "@/components/landing/FilterDiscoverSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import TrustSection from "@/components/landing/TrustSection";
import FooterCTA from "@/components/landing/FooterCTA";

const Index = () => {
  return (
    <PublicLayout fullWidth>
      <HeroSection />
      <FeaturesSection />
      <DashboardPreview />
      <IssueFeedPreview />
      <FilterDiscoverSection />
      <HowItWorksSection />
      <TrustSection />
      <FooterCTA />
    </PublicLayout>
  );
};

export default Index;
