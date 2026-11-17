"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { ApiError, errorMessage } from "@/lib/api";
import { formatIDR } from "@/lib/payment-api";
import { voucherApi, type VoucherOutput } from "@/lib/pricing-api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Mirrors the backend rules (pricing/service.go); the server stays the source of truth.
const schema = z.object({
  code: z
    .string()
    .trim()
    .transform((v) => v.toUpperCase())
    .pipe(z.string().regex(/^[A-Z0-9_-]{3,30}$/, "3–30 karakter: huruf, angka, - atau _")),
  discount_amount: z.string().regex(/^[1-9]\d*$/, "Isi potongan dalam Rupiah"),
  quota: z.string().regex(/^[1-9]\d*$/, "Minimal 1"),
  expires_at: z.string().min(1, "Isi tanggal kedaluwarsa"),
  is_active: z.boolean(),
});
type FormIn = z.input<typeof schema>;
type Values = z.output<typeof schema>;
type Field = keyof FormIn;
const FIELDS: readonly Field[] = ["code", "discount_amount", "quota", "expires_at"];

/** ISO → value for <input type="datetime-local"> in the admin's time zone. */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface VoucherFormDialogProps {
  /** Voucher to edit, or `null` to add one. */
  voucher: VoucherOutput | null;
  /** Current sale price and minimum, to warn when a discount will be cut down. */
  salePrice: number | null;
  minPayable: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (v: VoucherOutput) => void;
}

export function VoucherFormDialog({
  voucher,
  salePrice,
  minPayable,
  open,
  onOpenChange,
  onSaved,
}: VoucherFormDialogProps) {
  const isEdit = voucher !== null;
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormIn, unknown, Values>({ resolver: zodResolver(schema) });

  React.useEffect(() => {
    if (!open) return;
    setServerError(null);
    const inAMonth = new Date(Date.now() + 30 * 24 * 3600 * 1000);
    inAMonth.setHours(23, 59, 0, 0);
    reset({
      code: voucher?.code ?? "",
      discount_amount: voucher ? String(voucher.discount_amount) : "",
      quota: voucher ? String(voucher.quota) : "",
      expires_at: toLocalInput(voucher?.expires_at ?? inAMonth.toISOString()),
      is_active: voucher?.is_active ?? true,
    });
  }, [open, voucher, reset]);

  const discount = Number(watch("discount_amount") || 0);
  const maxUseful = salePrice !== null && minPayable !== null ? salePrice - minPayable : null;

  async function onSubmit(v: Values) {
    setServerError(null);
    const body = {
      discount_amount: Number(v.discount_amount),
      quota: Number(v.quota),
      expires_at: new Date(v.expires_at).toISOString(),
      is_active: v.is_active,
    };
    try {
      const saved = isEdit
        ? await voucherApi.update(voucher.id, body)
        : await voucherApi.create({ ...body, code: v.code });
      toast.success(`Voucher ${saved.code} ${isEdit ? "disimpan" : "ditambahkan"}`);
      onOpenChange(false);
      onSaved(saved);
    } catch (err) {
      if (err instanceof ApiError && err.code === "VALIDATION_ERROR") {
        for (const [field, message] of Object.entries(err.fieldMap)) {
          if ((FIELDS as readonly string[]).includes(field))
            setError(field as Field, { type: "server", message });
        }
      } else if (err instanceof ApiError && err.code === "CONFLICT") {
        setError("code", { type: "server", message: err.message });
      } else {
        setServerError(errorMessage(err, "Voucher belum bisa disimpan."));
      }
    }
  }

  const fieldProps = (name: Field) => ({
    id: `voucher-${name}`,
    "aria-invalid": !!errors[name],
    "aria-describedby": errors[name] ? `voucher-${name}-error` : undefined,
  });
  const fieldError = (name: Field) => (
    <FieldError id={`voucher-${name}-error`}>{errors[name]?.message}</FieldError>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Ubah voucher ${voucher.code}` : "Tambah voucher"}</DialogTitle>
          <DialogDescription>
            Customer memasukkan kode ini saat membeli full lagu.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="voucher-code">Kode voucher</Label>
              <Input
                {...fieldProps("code")}
                className="font-mono uppercase"
                disabled={isEdit}
                autoFocus={!isEdit}
                spellCheck={false}
                placeholder="mis. HEMAT10"
                {...register("code")}
              />
              {isEdit ? (
                <p className="text-xs text-muted-foreground">Kode tidak bisa diubah.</p>
              ) : (
                fieldError("code")
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="voucher-discount_amount">Potongan (Rp)</Label>
              <Input
                {...fieldProps("discount_amount")}
                inputMode="numeric"
                placeholder="10000"
                {...register("discount_amount")}
              />
              {fieldError("discount_amount")}
              {maxUseful !== null && discount > maxUseful && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Lebih besar dari harga diskon − minimum bayar. Customer tetap membayar{" "}
                  {formatIDR(minPayable!)}; potongan efektif {formatIDR(Math.max(maxUseful, 0))}.
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="voucher-quota">Kuota</Label>
              <Input {...fieldProps("quota")} inputMode="numeric" {...register("quota")} />
              <p className="text-xs text-muted-foreground">
                Jumlah order yang boleh memakai voucher ini.
              </p>
              {fieldError("quota")}
            </div>
            <div className="space-y-2">
              <Label htmlFor="voucher-expires_at">Berlaku sampai</Label>
              <Input
                {...fieldProps("expires_at")}
                type="datetime-local"
                {...register("expires_at")}
              />
              {fieldError("expires_at")}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="size-4 accent-primary" {...register("is_active")} />
            Aktif (bisa dipakai customer)
          </label>

          <FieldError role="alert">{serverError}</FieldError>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2Icon className="animate-spin" aria-hidden />}
              {isEdit ? "Simpan" : "Tambah"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
