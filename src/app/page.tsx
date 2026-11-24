import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { FAQS, Faq } from "@/components/landing/faq";
import { Features } from "@/components/landing/features";
import { FinalCta } from "@/components/landing/final-cta";
import { Hero } from "@/components/landing/hero";
import { HowItWorks, STEPS } from "@/components/landing/how-it-works";
import { OccasionMarquee } from "@/components/landing/occasion-marquee";
import { Samples } from "@/components/landing/samples";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { Testimonials } from "@/components/landing/testimonials";
import { landingJsonLd, serializeJsonLd } from "@/lib/seo/json-ld";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function LandingPage() {
  const [locale, tMeta, t] = await Promise.all([
    getLocale(),
    getTranslations("metadata"),
    getTranslations("landing"),
  ]);
  const jsonLd = landingJsonLd({
    locale,
    description: tMeta("description"),
    serviceType: tMeta("serviceType"),
    genres: t("features.items.genres.body"),
    steps: STEPS.map(({ key }) => ({
      name: t(`howItWorks.steps.${key}.title`),
      text: t(`howItWorks.steps.${key}.body`),
    })),
    faqs: FAQS.map((key) => ({ q: t(`faq.items.${key}.q`), a: t(`faq.items.${key}.a`) })),
  });

  return (
    <>
      <script
        type="application/ld+json"
        // Built from our own message files; serializeJsonLd escapes `<`.
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <SiteHeader />
      <main>
        <Hero />
        <OccasionMarquee />
        <HowItWorks />
        <Samples />
        <Features />
        <Testimonials />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
