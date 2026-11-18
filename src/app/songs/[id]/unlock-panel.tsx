"use client";

import * as React from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Loader2Icon, SparklesIcon, TicketPercentIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { useApiError } from "@/hooks/use-api-error";
import { IDR_FORMAT, paymentApi, type PricingOutput, type QuoteOutput } from "@/lib/payment-api";

interface UnlockPanelProps {
  songId: string;
  pricing: PricingOutput | null;
}

/** Price (normal struck through, sale below), optional voucher, and the button to pay on DOKU. */
export function UnlockPanel({ songId, pricing }: UnlockPanelProps) {
  const t = useTranslations("song.unlock");
  const format = useFormatter();
  const { errorText } = useApiError();
  const formatIDR = (amount: number) => format.number(amount, IDR_FORMAT);
  const [code, setCode] = React.useState("");
  const [applied, setApplied] = React.useState<QuoteOutput | null>(null);
  const [voucherError, setVoucherError] = React.useState<string | null>(null);
  const [checkingVoucher, setCheckingVoucher] = React.useState(false);
  const [voucherOpen, setVoucherOpen] = React.useState(false);
  const [checkingOut, setCheckingOut] = React.useState(false);

  const normal = applied?.normal_price ?? pricing?.normal_price;
  const sale = applied?.sale_price ?? pricing?.sale_price ?? pricing?.unlock_price;
  const total = applied?.total ?? sale;
  const disabled = checkingOut || pricing?.enabled === false;

  async function applyVoucher(e: React.FormEvent) {
    e.preventDefault();
    const c = code.trim();
    if (!c) {
      setVoucherError(t("enterVoucher"));
      return;
    }
    setCheckingVoucher(true);
    setVoucherError(null);
    try {
      const q = await paymentApi.quote(songId, c);
      setApplied(q);
      setCode(q.voucher_code ?? c.toUpperCase());
    } catch (err) {
      setApplied(null);
      setVoucherError(
        errorText(err, {
          overrides: {
            BAD_REQUEST: t("errors.voucherInvalid"),
            CONFLICT: t("errors.voucherConflict"),
            SERVICE_UNAVAILABLE: t("errors.paymentUnavailable"),
          },
          fallback: t("voucherFailed"),
        }),
      );
    } finally {
      setCheckingVoucher(false);
    }
  }

  function removeVoucher() {
    setApplied(null);
    setCode("");
    setVoucherError(null);
  }

  async function unlock() {
    setCheckingOut(true);
    try {
      const out = await paymentApi.checkout(songId, applied?.voucher_code);
      window.location.assign(out.payment_url);
    } catch (err) {
      toast.error(
        errorText(err, {
          overrides: {
            BAD_REQUEST: t("errors.voucherInvalid"),
            CONFLICT: t("errors.checkoutConflict"),
            FORBIDDEN: t("errors.accountDisabled"),
            SERVICE_UNAVAILABLE: t("errors.paymentUnavailable"),
          },
          fallback: t("checkoutFailed"),
        }),
      );
      setCheckingOut(false);
    }
  }

  return (
    <div className="relative space-y-4 overflow-hidden rounded-3xl border bg-card p-6 shadow-xl">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-primary to-highlight"
      />
      {sale !== undefined && (
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              {t("heading")}
            </p>
            {normal !== undefined && normal > sale && (
              <p
                className="text-sm text-muted-foreground line-through"
                aria-label={t("normalPriceAria", { price: formatIDR(normal) })}
              >
                {formatIDR(normal)}
              </p>
            )}
            <p className="text-3xl font-bold tracking-tight tabular-nums">{formatIDR(sale)}</p>
          </div>
          {normal !== undefined && normal > sale && (
            <span className="rounded-full bg-highlight/15 px-2.5 py-1 text-xs font-semibold text-highlight">
              {t("save", { percent: Math.round(((normal - sale) / normal) * 100) })}
            </span>
          )}
        </div>
      )}

      {applied?.voucher_code ? (
        <div className="space-y-1 border-t pt-3 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5">
              <TicketPercentIcon className="size-4 text-primary" aria-hidden />
              {t("voucher")} <span className="font-mono font-medium">{applied.voucher_code}</span>
              <button
                type="button"
                onClick={removeVoucher}
                className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label={t("removeVoucher")}
              >
                <XIcon className="size-3.5" aria-hidden />
              </button>
            </span>
            <span className="text-primary tabular-nums">
              −{formatIDR(applied.voucher_discount)}
            </span>
          </div>
          <div className="flex items-center justify-between font-semibold">
            <span>{t("total")}</span>
            <span className="tabular-nums">{formatIDR(applied.total)}</span>
          </div>
        </div>
      ) : voucherOpen ? (
        <form onSubmit={applyVoucher} noValidate className="space-y-1 border-t pt-3">
          <div className="flex gap-2">
            <Input
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setVoucherError(null);
              }}
              placeholder={t("voucherPlaceholder")}
              aria-label={t("voucherPlaceholder")}
              aria-invalid={!!voucherError}
              className="font-mono uppercase"
              spellCheck={false}
              autoComplete="off"
              maxLength={30}
              autoFocus
            />
            <Button type="submit" variant="outline" disabled={checkingVoucher}>
              {checkingVoucher && <Loader2Icon className="animate-spin" aria-hidden />}
              {t("apply")}
            </Button>
          </div>
          <FieldError role="alert">{voucherError}</FieldError>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setVoucherOpen(true)}
          className="flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <TicketPercentIcon className="size-4" aria-hidden />
          {t("haveVoucher")}
        </button>
      )}

      <Button
        size="lg"
        className="h-12 w-full rounded-full bg-linear-to-r from-primary to-highlight text-base shadow-lg shadow-primary/25 hover:opacity-95"
        onClick={unlock}
        disabled={disabled}
      >
        {checkingOut ? (
          <Loader2Icon className="animate-spin" aria-hidden />
        ) : (
          <SparklesIcon aria-hidden />
        )}
        {total !== undefined ? t("ctaWithPrice", { price: formatIDR(total) }) : t("cta")}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        {pricing?.enabled === false ? t("unavailable") : t("methods")}
      </p>
    </div>
  );
}
