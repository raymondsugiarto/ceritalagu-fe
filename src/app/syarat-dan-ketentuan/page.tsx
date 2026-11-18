import type { Metadata } from "next";
import Link from "next/link";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { InfoIcon } from "lucide-react";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { defaultLocale } from "@/i18n/config";
import { SITE } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata.terms");
  return { title: t("title"), description: t("description") };
}

/** Section anchors (kept in Indonesian: they are linked from the footer and elsewhere). */
const SECTIONS = [
  "penerimaan",
  "layanan",
  "akun",
  "konten-pengguna",
  "preview",
  "harga",
  "pengiriman",
  "pengembalian-dana",
  "hak-penggunaan",
  "larangan",
  "privasi",
  "tanggung-jawab",
  "hukum",
] as const;

const linkClass = "font-medium text-primary underline-offset-4 hover:underline";

export default function TermsPage() {
  const t = useTranslations("legal");
  const locale = useLocale();
  const format = useFormatter();
  // Paragraph lists are read raw: plain text, no ICU placeholders.
  const body = (id: (typeof SECTIONS)[number]) => t.raw(`sections.${id}.body`) as string[];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-12 md:py-20">
        <header className="max-w-3xl">
          <p className="text-sm font-semibold tracking-wide text-primary uppercase">
            {t("eyebrow")}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">{t("title")}</h1>
          <p className="mt-3 text-muted-foreground">
            {t("updated", {
              date: format.dateTime(new Date(SITE.termsUpdatedAt), { dateStyle: "long" }),
            })}
          </p>
          {locale !== defaultLocale && (
            <p className="mt-4 flex items-start gap-2 rounded-xl border bg-muted/50 p-3 text-sm text-muted-foreground">
              <InfoIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
              {t("prevailing")}
            </p>
          )}
        </header>

        <div className="mt-10 grid gap-10 lg:grid-cols-[14rem_1fr] lg:gap-16">
          <nav aria-label={t("toc")} className="lg:sticky lg:top-24 lg:self-start">
            <p className="mb-3 text-sm font-semibold">{t("toc")}</p>
            <ol className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-1">
              {SECTIONS.map((id, i) => (
                <li key={id}>
                  <a href={`#${id}`} className="transition-colors hover:text-foreground">
                    {i + 1}. {t(`sections.${id}.title`)}
                  </a>
                </li>
              ))}
              <li>
                <a href="#kontak" className="transition-colors hover:text-foreground">
                  {SECTIONS.length + 1}. {t("contact.title")}
                </a>
              </li>
            </ol>
          </nav>

          <article className="max-w-3xl space-y-10">
            {SECTIONS.map((id, i) => (
              <section key={id} id={id} className="scroll-mt-24">
                <h2 className="text-xl font-semibold tracking-tight">
                  {i + 1}. {t(`sections.${id}.title`)}
                </h2>
                <div className="mt-3 space-y-3 leading-relaxed text-muted-foreground">
                  {body(id).map((p, j) => (
                    <p key={j}>{p}</p>
                  ))}
                </div>
              </section>
            ))}

            <section id="kontak" className="scroll-mt-24 rounded-2xl border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-semibold tracking-tight">
                {SECTIONS.length + 1}. {t("contact.title")}
              </h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                {t.rich("contact.body", {
                  email: SITE.supportEmail,
                  link: (chunks) => (
                    <Link href="/kontak" className={linkClass}>
                      {chunks}
                    </Link>
                  ),
                  mail: (chunks) => (
                    <a href={`mailto:${SITE.supportEmail}`} className={linkClass}>
                      {chunks}
                    </a>
                  ),
                })}
              </p>
            </section>
          </article>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
