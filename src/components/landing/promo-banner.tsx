"use client";

import * as React from "react";
import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { ArrowRightIcon, TicketPercentIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { IDR_FORMAT, paymentApi, type PromoOutput } from "@/lib/payment-api";
import { Button } from "@/components/ui/button";

/** Where the advertised code is kept so the checkout page can offer it. */
const PROMO_CODE_KEY = "app.promo_code";

/**
 * Remember the advertised voucher so the song page can pre-fill it at checkout.
 */
export function rememberPromoCode(code: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PROMO_CODE_KEY, code);
  } catch {
    // Private mode or a full quota: the banner still works, the code is just not remembered.
  }
}

/** The voucher code the banner advertised, if any. */
export function readPromoCode(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(PROMO_CODE_KEY);
  } catch {
    return null;
  }
}

/**
 * Landing banner for the voucher the admin promoted. It renders nothing when there is no usable
 * promo, so the page never advertises a discount that cannot be applied.
 */
export function PromoBanner() {
  const t = useTranslations("landing.promo");
  const format = useFormatter();
  const [promo, setPromo] = React.useState<PromoOutput | null>(null);
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    const ctrl = new AbortController();
    paymentApi
      .pricing(ctrl.signal)
      .then((out) => {
        if (!ctrl.signal.aborted) setPromo(out.promo ?? null);
      })
      .catch(() => {
        // No pricing yet: the landing page works without the banner.
      });
    return () => ctrl.abort();
  }, []);

  if (!promo || dismissed) return null;

  const formatIDR = (amount: number) => format.number(amount, IDR_FORMAT);
  const code = promo.code;

  function copyCode() {
    rememberPromoCode(code);
    void navigator.clipboard
      ?.writeText(code)
      .then(() => toast.success(t("copied")))
      .catch(() => toast.success(t("copied")));
  }

  return (
    <section
      aria-labelledby="promo-banner-title"
      className="border-b border-primary/20 bg-linear-to-r from-primary/10 via-highlight/10 to-primary/10"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <TicketPercentIcon className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p id="promo-banner-title" className="text-sm font-semibold">
              {t("title", { discount: formatIDR(promo.discount_amount) })}
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {t("description", { price: formatIDR(promo.total) })}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={copyCode}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-primary/50 bg-background px-3 py-2 font-mono text-sm font-semibold tracking-wide text-primary transition-colors hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            aria-label={t("copyCode", { code })}
          >
            {code}
            <span className="font-sans text-xs font-normal text-muted-foreground">{t("copy")}</span>
          </button>
          <Link
            href="/create"
            className="hidden h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:inline-flex"
          >
            {t("cta")}
            <ArrowRightIcon aria-hidden />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("dismiss")}
            onClick={() => setDismissed(true)}
            className="size-9"
          >
            <XIcon aria-hidden />
          </Button>
        </div>
      </div>
    </section>
  );
}
