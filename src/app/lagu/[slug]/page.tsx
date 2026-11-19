import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowRightIcon, CheckIcon, ChevronDownIcon, HeartIcon, LightbulbIcon } from "lucide-react";
import { alt as ogAlt, size as ogSize } from "@/app/opengraph-image";
import { FinalCta } from "@/components/landing/final-cta";
import { HowItWorks, SectionHeading } from "@/components/landing/how-it-works";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { buttonVariants } from "@/components/ui/button";
import { OCCASION_PAGES, createHrefFor, findOccasionPage, occasionPath } from "@/lib/occasions";
import { occasionJsonLd, serializeJsonLd } from "@/lib/seo/json-ld";
import { cn } from "@/lib/utils";

interface OccasionPageProps {
  params: Promise<{ slug: string }>;
}

interface Reason {
  title: string;
  body: string;
}
interface Faq {
  q: string;
  a: string;
}

const PROMISES = ["freePreview", "noSignup", "fast"] as const;

/** The site-wide share card from src/app/opengraph-image.tsx. */
const OG_IMAGE = {
  url: "/opengraph-image",
  width: ogSize.width,
  height: ogSize.height,
  alt: ogAlt,
};

export const dynamicParams = false;

export function generateStaticParams() {
  return OCCASION_PAGES.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: OccasionPageProps): Promise<Metadata> {
  const occasion = findOccasionPage((await params).slug);
  if (!occasion) return {};
  const t = await getTranslations(`occasionPages.items.${occasion.key}`);
  const path = occasionPath(occasion.slug);
  return {
    // Absolute, no " · Cerita Lagu" suffix: these titles are already ~60 chars (Google's cut-off).
    // The brand still shows via og:site_name and the page itself.
    title: { absolute: t("metaTitle") },
    description: t("metaDescription"),
    alternates: { canonical: path },
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      url: path,
      type: "website",
      // Setting openGraph here replaces the root one, so point back at the root share image.
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: t("metaTitle"),
      description: t("metaDescription"),
      images: [OG_IMAGE.url],
    },
  };
}

export default async function OccasionLandingPage({ params }: OccasionPageProps) {
  const occasion = findOccasionPage((await params).slug);
  if (!occasion) notFound();

  const [t, tc, tAll] = await Promise.all([
    getTranslations(`occasionPages.items.${occasion.key}`),
    getTranslations("occasionPages.common"),
    getTranslations("occasionPages.items"),
  ]);
  const lyric = t.raw("lyric") as string[];
  const reasons = t.raw("reasons") as Reason[];
  const ideas = t.raw("ideas") as string[];
  const faqs = t.raw("faqs") as Faq[];
  const createHref = createHrefFor(occasion);
  const others = OCCASION_PAGES.filter((o) => o.slug !== occasion.slug);

  const jsonLd = occasionJsonLd({
    path: occasionPath(occasion.slug),
    name: t("name"),
    title: t("metaTitle"),
    description: t("metaDescription"),
    homeLabel: tc("breadcrumbHome"),
    faqs,
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
        {/* Hero: keyword H1, intro, CTA, and a sample lyric card. */}
        <section className="relative overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -top-32 left-1/2 size-[32rem] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute top-40 -right-24 size-72 rounded-full bg-highlight/20 blur-3xl" />
          </div>
          <div className="mx-auto max-w-6xl px-4 pt-6 pb-16 md:pb-24">
            <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
              <ol className="flex flex-wrap items-center gap-1.5">
                <li>
                  <Link href="/" className="hover:text-foreground">
                    {tc("breadcrumbHome")}
                  </Link>
                </li>
                <li aria-hidden>/</li>
                <li aria-current="page" className="text-foreground">
                  {t("name")}
                </li>
              </ol>
            </nav>

            <div className="mt-10 grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
              <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
                <p className="text-sm font-semibold tracking-wide text-highlight uppercase">
                  {tc("eyebrow")}
                </p>
                <h1 className="mt-3 text-4xl leading-tight font-bold tracking-tight text-balance md:text-5xl">
                  {t("h1")}
                </h1>
                <p className="mt-5 max-w-xl text-lg text-pretty text-muted-foreground">
                  {t("intro")}
                </p>
                <Link
                  href={createHref}
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "mt-8 h-12 w-full rounded-full px-7 text-base shadow-lg shadow-primary/25 sm:w-auto",
                  )}
                >
                  {t("cta")}
                  <ArrowRightIcon aria-hidden />
                </Link>
                <ul className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground lg:justify-start">
                  {PROMISES.map((p) => (
                    <li key={p} className="flex items-center gap-1.5">
                      <CheckIcon className="size-4 text-success" aria-hidden />
                      {tc(`promises.${p}`)}
                    </li>
                  ))}
                </ul>
              </div>

              <figure className="mx-auto w-full max-w-md rounded-3xl border bg-card p-6 shadow-xl">
                <figcaption className="text-xs font-semibold tracking-wide text-highlight uppercase">
                  {tc("lyricTitle")}
                </figcaption>
                <p className="mt-1 text-sm text-muted-foreground">{t("lyricMeta")}</p>
                <blockquote className="mt-5 space-y-1.5 border-l-2 border-primary/40 pl-4 text-lg leading-relaxed italic">
                  {lyric.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </blockquote>
                <p className="mt-5 text-xs text-muted-foreground">{tc("lyricNote")}</p>
              </figure>
            </div>
          </div>
        </section>

        {/* Why a personal song for this occasion. */}
        <section className="bg-muted/30 py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4">
            <SectionHeading eyebrow={t("name")} title={tc("reasonsTitle")} />
            <ul className="mt-12 grid gap-6 md:grid-cols-3">
              {reasons.map((r) => (
                <li key={r.title} className="rounded-2xl border bg-card p-6 shadow-sm">
                  <HeartIcon className="size-5 text-highlight" aria-hidden />
                  <h3 className="mt-4 font-semibold">{r.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{r.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Story prompts + genre tips: helps the visitor and gives the page its own content. */}
        <section className="py-16 md:py-24">
          <div className="mx-auto grid max-w-5xl gap-8 px-4 md:grid-cols-[1.4fr_1fr]">
            <div className="rounded-2xl border bg-card p-6 shadow-sm md:p-8">
              <h2 className="text-2xl font-bold tracking-tight">{tc("ideasTitle")}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{tc("ideasBody")}</p>
              <ul className="mt-6 space-y-3">
                {ideas.map((idea) => (
                  <li key={idea} className="flex gap-3">
                    <LightbulbIcon className="mt-0.5 size-5 shrink-0 text-sunset" aria-hidden />
                    <span>{idea}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border bg-card p-6 shadow-sm md:p-8">
              <h2 className="text-2xl font-bold tracking-tight">{tc("genresTitle")}</h2>
              <p className="mt-4 text-muted-foreground">{t("genres")}</p>
            </div>
          </div>
        </section>

        <HowItWorks />

        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-3xl px-4">
            <h2 className="text-center text-3xl font-bold tracking-tight text-balance">
              {tc("faqTitle", { name: t("name") })}
            </h2>
            <div className="mt-10 divide-y rounded-2xl border bg-card shadow-sm">
              {faqs.map((f) => (
                <details
                  key={f.q}
                  className="group px-6 py-5 [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                    {f.q}
                    <ChevronDownIcon
                      className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                      aria-hidden
                    />
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Internal links to the sibling occasion pages. */}
        <section className="pb-16 md:pb-24">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <h2 className="text-xl font-semibold">{tc("othersTitle")}</h2>
            <ul className="mt-6 flex flex-wrap justify-center gap-3">
              {others.map((o) => (
                <li key={o.slug}>
                  <Link
                    href={occasionPath(o.slug)}
                    className="inline-flex rounded-full border bg-card px-4 py-2 text-sm shadow-sm transition-colors hover:border-primary hover:text-primary"
                  >
                    {tAll(`${o.key}.name`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <FinalCta href={createHref} cta={t("cta")} />
      </main>
      <SiteFooter />
    </>
  );
}
