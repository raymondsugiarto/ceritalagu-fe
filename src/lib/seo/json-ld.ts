import { SITE } from "@/lib/site";

/** Plain inputs so this stays a pure function (tested without next-intl). */
export interface LandingJsonLdInput {
  locale: string;
  description: string;
  serviceType: string;
  genres: string;
  steps: { name: string; text: string }[];
  faqs: { q: string; a: string }[];
}

const ORG_ID = `${SITE.url}/#organization`;
const SITE_ID = `${SITE.url}/#website`;

/**
 * One @graph for the landing page: who we are (Organization), the site (WebSite), what we sell
 * (Service), how it works (HowTo) and the FAQ (FAQPage). Search engines use it for rich results;
 * AI answer engines use it as clean, quotable facts about Cerita Lagu.
 */
export function landingJsonLd(input: LandingJsonLdInput) {
  const inLanguage = input.locale === "en" ? "en" : "id-ID";
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": ORG_ID,
        name: SITE.name,
        url: `${SITE.url}/`,
        logo: `${SITE.url}/brand/logo-ceritalagu.png`,
        email: SITE.supportEmail,
        description: input.description,
        areaServed: { "@type": "Country", name: "Indonesia" },
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          email: SITE.supportEmail,
          url: `${SITE.url}/kontak`,
          availableLanguage: ["id", "en"],
        },
      },
      {
        "@type": "WebSite",
        "@id": SITE_ID,
        name: SITE.name,
        url: `${SITE.url}/`,
        inLanguage,
        publisher: { "@id": ORG_ID },
      },
      {
        "@type": "Service",
        "@id": `${SITE.url}/#service`,
        name: SITE.name,
        serviceType: input.serviceType,
        description: `${input.description} ${input.genres}`,
        provider: { "@id": ORG_ID },
        areaServed: { "@type": "Country", name: "Indonesia" },
        availableLanguage: ["id", "en"],
        url: `${SITE.url}/create`,
      },
      {
        "@type": "HowTo",
        name: `${SITE.name}: ${input.serviceType}`,
        inLanguage,
        step: input.steps.map((s, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          name: s.name,
          text: s.text,
        })),
      },
      {
        "@type": "FAQPage",
        inLanguage,
        mainEntity: input.faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };
}

export interface OccasionJsonLdInput {
  /** Site-relative path, e.g. /lagu/ulang-tahun. */
  path: string;
  /** Short name shown in the breadcrumb, e.g. "Lagu Ulang Tahun". */
  name: string;
  title: string;
  description: string;
  homeLabel: string;
  faqs: { q: string; a: string }[];
}

/** Occasion landing page: WebPage + BreadcrumbList + Service + FAQPage, tied to the site graph. */
export function occasionJsonLd(input: OccasionJsonLdInput) {
  const url = `${SITE.url}${input.path}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: input.title,
        description: input.description,
        inLanguage: "id-ID",
        isPartOf: { "@id": SITE_ID },
        about: { "@id": `${url}#service` },
        breadcrumb: { "@id": `${url}#breadcrumb` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: input.homeLabel, item: `${SITE.url}/` },
          { "@type": "ListItem", position: 2, name: input.name, item: url },
        ],
      },
      {
        "@type": "Service",
        "@id": `${url}#service`,
        name: input.name,
        description: input.description,
        provider: { "@id": ORG_ID },
        areaServed: { "@type": "Country", name: "Indonesia" },
        url,
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: input.faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };
}

/** JSON for a <script type="application/ld+json">, with `<` escaped so text cannot close the tag. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
