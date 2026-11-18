import type { Metadata } from "next";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { FileTextIcon, HelpCircleIcon, MailIcon } from "lucide-react";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { SITE } from "@/lib/site";
import { ContactForm } from "./contact-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata.contact");
  return { title: t("title"), description: t("description") };
}

export default function ContactPage() {
  const t = useTranslations("contact");
  const shortcuts = [
    {
      icon: MailIcon,
      title: t("shortcuts.email"),
      body: SITE.supportEmail,
      href: `mailto:${SITE.supportEmail}`,
    },
    {
      icon: HelpCircleIcon,
      title: t("shortcuts.faq.title"),
      body: t("shortcuts.faq.body"),
      href: "/#faq",
    },
    {
      icon: FileTextIcon,
      title: t("shortcuts.terms.title"),
      body: t("shortcuts.terms.body"),
      href: "/syarat-dan-ketentuan",
    },
  ];
  return (
    <>
      <SiteHeader />
      <main className="relative overflow-clip">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-40 left-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute top-1/3 -right-32 size-80 rounded-full bg-highlight/15 blur-3xl" />
        </div>

        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 px-4 py-12 md:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-16">
          <div className="space-y-8">
            <header>
              <p className="text-sm font-semibold tracking-wide text-primary uppercase">
                {t("eyebrow")}
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
                {t.rich("title", {
                  highlight: (chunks) => (
                    <span className="bg-linear-to-r from-primary via-highlight to-sunset bg-clip-text text-transparent">
                      {chunks}
                    </span>
                  ),
                })}
              </h1>
              <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">{t("body")}</p>
            </header>

            <ul className="space-y-3">
              {shortcuts.map(({ icon: Icon, title, body, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="group flex items-center gap-4 rounded-2xl border bg-card/70 p-4 shadow-sm backdrop-blur transition-colors hover:border-primary/40"
                  >
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-linear-to-br group-hover:from-primary group-hover:to-highlight group-hover:text-primary-foreground">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-medium">{title}</span>
                      <span className="block truncate text-sm text-muted-foreground">{body}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border bg-card p-6 shadow-xl shadow-primary/5 sm:p-8">
            <ContactForm />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
