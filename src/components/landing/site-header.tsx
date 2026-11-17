import Link from "next/link";
import { MusicIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AccountMenu } from "@/components/customer/account-menu";

const LINKS = [
  { href: "#cara-kerja", label: "Cara Kerja" },
  { href: "#fitur", label: "Fitur" },
  { href: "#faq", label: "FAQ" },
];

/** Sticky top bar: brand, section links, primary CTA. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/75 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-primary to-highlight text-primary-foreground">
            <MusicIcon className="size-4" aria-hidden />
          </span>
          Lagu Untukmu
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="transition-colors hover:text-foreground">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <AccountMenu />
          <Link href="/create" className={cn(buttonVariants({ size: "sm" }), "rounded-full px-4")}>
            Buat Lagu
          </Link>
        </div>
      </div>
    </header>
  );
}
