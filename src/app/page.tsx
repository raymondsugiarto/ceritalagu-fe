import { Faq } from "@/components/landing/faq";
import { Features } from "@/components/landing/features";
import { FinalCta } from "@/components/landing/final-cta";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { OccasionMarquee } from "@/components/landing/occasion-marquee";
import { Samples } from "@/components/landing/samples";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";

export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <OccasionMarquee />
        <HowItWorks />
        <Samples />
        <Features />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
