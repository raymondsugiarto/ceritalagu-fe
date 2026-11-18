import Link from "next/link";
import { useTranslations } from "next-intl";
import { ShieldCheckIcon } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LinkKey =
  | "create"
  | "howItWorks"
  | "samples"
  | "features"
  | "faq"
  | "contact"
  | "signIn"
  | "terms"
  | "refund"
  | "privacy";

const COLUMNS: { key: "product" | "help" | "legal"; links: { href: string; key: LinkKey }[] }[] = [
  {
    key: "product",
    links: [
      { href: "/create", key: "create" },
      { href: "/#cara-kerja", key: "howItWorks" },
      { href: "/#contoh-lagu", key: "samples" },
      { href: "/#fitur", key: "features" },
    ],
  },
  {
    key: "help",
    links: [
      { href: "/#faq", key: "faq" },
      { href: "/kontak", key: "contact" },
      { href: "/login", key: "signIn" },
    ],
  },
  {
    key: "legal",
    links: [
      { href: "/syarat-dan-ketentuan", key: "terms" },
      { href: "/syarat-dan-ketentuan#pengembalian-dana", key: "refund" },
      { href: "/syarat-dan-ketentuan#privasi", key: "privacy" },
    ],
  },
];

/** Site footer: brand + CTA, link columns, legal bar. */
export function SiteFooter() {
  const t = useTranslations("landing.footer");
  const tc = useTranslations("common");
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-10 px-4 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="col-span-2 max-w-xs space-y-4 md:col-span-1">
          <Link href="/" aria-label={tc("homeAria")} className="inline-flex">
            <BrandLogo />
          </Link>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("tagline")}</p>
          <Link
            href="/create"
            className={cn(
              buttonVariants({ size: "sm" }),
              "rounded-full bg-linear-to-r from-primary to-highlight px-4 hover:opacity-95",
            )}
          >
            {t("cta")}
          </Link>
        </div>

        {COLUMNS.map((col) => (
          <nav key={col.key} aria-label={t(`columns.${col.key}`)}>
            <p className="text-sm font-semibold">{t(`columns.${col.key}`)}</p>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="transition-colors hover:text-foreground">
                    {t(`links.${l.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          {/* Year as a string so it is not number-formatted ("2.026"). */}
          <span>{t("copyright", { year: String(new Date().getFullYear()) })}</span>
          <span className="flex items-center gap-1.5">
            <ShieldCheckIcon className="size-3.5 text-success" aria-hidden />
            {t("payment")}
          </span>
        </div>
      </div>
    </footer>
  );
}
