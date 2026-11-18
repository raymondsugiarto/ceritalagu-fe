import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { BrandLogo } from "@/components/brand-logo";
import { cn } from "@/lib/utils";
import { AccountMenu } from "./account-menu";

interface CustomerShellProps {
  children: React.ReactNode;
  /** Right side of the header; defaults to the account menu (Masuk / Keluar). */
  actions?: React.ReactNode;
  /** Shown above the content, aligned with it (e.g. the questionnaire progress bar). */
  top?: React.ReactNode;
  /** Max width of the content column. */
  width?: "md" | "xl" | "5xl";
  /** Centre the content vertically (login, loading screens). */
  centered?: boolean;
}

const WIDTHS = { md: "max-w-md", xl: "max-w-xl", "5xl": "max-w-5xl" } as const;

/** Customer page frame, same look as the landing page: brand header, soft colour glows. */
export function CustomerShell({
  children,
  actions,
  top,
  width = "5xl",
  centered = false,
}: CustomerShellProps) {
  const t = useTranslations("common");
  return (
    <div className="relative flex min-h-screen flex-col overflow-clip">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 size-[40rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute top-1/2 -right-32 size-96 rounded-full bg-highlight/15 blur-3xl" />
        <div className="absolute bottom-0 -left-32 size-80 rounded-full bg-primary/10 blur-3xl" />
      </div>
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/75 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4">
          <Link href="/" aria-label={t("homeAria")}>
            <BrandLogo />
          </Link>
          {actions ?? <AccountMenu />}
        </div>
      </header>
      <main
        className={cn(
          "mx-auto flex w-full flex-1 flex-col gap-8 px-4 py-8 md:py-12",
          WIDTHS[width],
          centered && "justify-center",
        )}
      >
        {top}
        {children}
      </main>
    </div>
  );
}
