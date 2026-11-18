import Link from "next/link";
import { useTranslations } from "next-intl";
import { BrandLogo } from "@/components/brand-logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AccountMenu } from "@/components/customer/account-menu";

const LINKS = [
  { href: "/#cara-kerja", key: "howItWorks" },
  { href: "/#fitur", key: "features" },
  { href: "/#faq", key: "faq" },
  { href: "/kontak", key: "contact" },
] as const;

/** Sticky top bar: brand, section links, primary CTA. */
export function SiteHeader() {
  const t = useTranslations("landing.header");
  const tc = useTranslations("common");
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/75 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" aria-label={tc("homeAria")}>
          <BrandLogo />
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="transition-colors hover:text-foreground">
              {t(l.key)}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <AccountMenu />
          <Link href="/create" className={cn(buttonVariants({ size: "sm" }), "rounded-full px-4")}>
            {t("cta")}
          </Link>
        </div>
      </div>
    </header>
  );
}
