"use client";

import * as React from "react";
import { Loader2Icon, SparklesIcon, TicketPercentIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { errorMessage } from "@/lib/api";
import { formatIDR, paymentApi, type PricingOutput, type QuoteOutput } from "@/lib/payment-api";

interface UnlockPanelProps {
  songId: string;
  pricing: PricingOutput | null;
}

/** Price (normal struck through, sale below), optional voucher, and the button to pay on DOKU. */
export function UnlockPanel({ songId, pricing }: UnlockPanelProps) {
  const [code, setCode] = React.useState("");
  const [applied, setApplied] = React.useState<QuoteOutput | null>(null);
  const [voucherError, setVoucherError] = React.useState<string | null>(null);
  const [checkingVoucher, setCheckingVoucher] = React.useState(false);
  const [voucherOpen, setVoucherOpen] = React.useState(false);
  const [checkingOut, setCheckingOut] = React.useState(false);

  const normal = applied?.normal_price ?? pricing?.normal_price;
  const sale = applied?.sale_price ?? pricing?.sale_price;
  const total = applied?.total ?? sale;
  const disabled = checkingOut || pricing?.enabled === false;

  async function applyVoucher(e: React.FormEvent) {
    e.preventDefault();
    const c = code.trim();
    if (!c) {
      setVoucherError("Masukkan kode voucher.");
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
      setVoucherError(errorMessage(err, "Voucher tidak bisa dipakai."));
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
      toast.error(errorMessage(err, "Halaman pembayaran tidak bisa dibuka."));
      setCheckingOut(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border bg-card p-4">
      {sale !== undefined && (
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Full lagu</p>
            {normal !== undefined && normal > sale && (
              <p
                className="text-sm text-muted-foreground line-through"
                aria-label={`Harga normal ${formatIDR(normal)}`}
              >
                {formatIDR(normal)}
              </p>
            )}
            <p className="text-2xl font-semibold tabular-nums">{formatIDR(sale)}</p>
          </div>
          {normal !== undefined && normal > sale && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              Hemat {Math.round(((normal - sale) / normal) * 100)}%
            </span>
          )}
        </div>
      )}

      {applied?.voucher_code ? (
        <div className="space-y-1 border-t pt-3 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5">
              <TicketPercentIcon className="size-4 text-primary" aria-hidden />
              Voucher <span className="font-mono font-medium">{applied.voucher_code}</span>
              <button
                type="button"
                onClick={removeVoucher}
                className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Hapus voucher"
              >
                <XIcon className="size-3.5" aria-hidden />
              </button>
            </span>
            <span className="text-primary tabular-nums">
              −{formatIDR(applied.voucher_discount)}
            </span>
          </div>
          <div className="flex items-center justify-between font-semibold">
            <span>Total bayar</span>
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
              placeholder="Kode voucher"
              aria-label="Kode voucher"
              aria-invalid={!!voucherError}
              className="font-mono uppercase"
              spellCheck={false}
              autoComplete="off"
              maxLength={30}
              autoFocus
            />
            <Button type="submit" variant="outline" disabled={checkingVoucher}>
              {checkingVoucher && <Loader2Icon className="animate-spin" aria-hidden />}
              Pakai
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
          Punya kode voucher?
        </button>
      )}

      <Button size="lg" className="w-full" onClick={unlock} disabled={disabled}>
        {checkingOut ? (
          <Loader2Icon className="animate-spin" aria-hidden />
        ) : (
          <SparklesIcon aria-hidden />
        )}
        Dapatkan Full Lagu{total !== undefined ? ` · ${formatIDR(total)}` : ""}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        {pricing?.enabled === false
          ? "Pembayaran belum tersedia saat ini."
          : "Bayar aman lewat DOKU: QRIS, e-wallet, virtual account, atau kartu."}
      </p>
    </div>
  );
}
