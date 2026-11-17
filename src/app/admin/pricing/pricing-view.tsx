"use client";

import * as React from "react";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { ApiError, errorMessage } from "@/lib/api";
import { formatIDR } from "@/lib/payment-api";
import { pricingApi, type UpdatePricesInput } from "@/lib/pricing-api";
import { useAdminAuth } from "@/components/admin/admin-auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

type Field = keyof UpdatePricesInput;
type Values = Record<Field, string>;

const FIELDS: { name: Field; label: string; help: string }[] = [
  { name: "normal_price", label: "Harga normal", help: "Tampil dicoret di halaman lagu." },
  {
    name: "sale_price",
    label: "Harga setelah diskon",
    help: "Yang dibayar customer tanpa voucher.",
  },
  {
    name: "min_payable",
    label: "Minimum bayar",
    help: "Voucher tidak akan membuat total di bawah angka ini (DOKU tidak bisa Rp0).",
  },
];

const toNumber = (v: string) => Number(v.replace(/\D/g, "") || "0");

export function PricingView() {
  const { state: auth, refresh: refreshAuth } = useAdminAuth();
  const canEdit = auth.kind === "signed-in" && auth.admin.role === "super_admin";
  const [values, setValues] = React.useState<Values | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [errors, setErrors] = React.useState<Partial<Record<Field, string>>>({});
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const handleError = React.useCallback(
    (err: unknown, fallback: string) => {
      if (err instanceof ApiError && err.status === 401) void refreshAuth();
      return errorMessage(err, fallback);
    },
    [refreshAuth],
  );

  React.useEffect(() => {
    if (!canEdit) return;
    const ctrl = new AbortController();
    pricingApi.get(ctrl.signal).then(
      (p) =>
        setValues({
          normal_price: String(p.normal_price),
          sale_price: String(p.sale_price),
          min_payable: String(p.min_payable),
        }),
      (err) => {
        if (!ctrl.signal.aborted) setLoadError(handleError(err, "Harga belum bisa dimuat."));
      },
    );
    return () => ctrl.abort();
  }, [canEdit, handleError]);

  if (!canEdit) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <h1 className="text-2xl font-semibold">Harga</h1>
        <Card>
          <CardHeader>
            <CardTitle>Tidak ada akses</CardTitle>
            <CardDescription>Hanya super admin yang bisa mengubah harga.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const nums = values && {
    normal_price: toNumber(values.normal_price),
    sale_price: toNumber(values.sale_price),
    min_payable: toNumber(values.min_payable),
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nums) return;
    const next: Partial<Record<Field, string>> = {};
    if (nums.normal_price <= 0) next.normal_price = "Harus lebih dari 0";
    if (nums.min_payable <= 0) next.min_payable = "Harus lebih dari 0";
    if (nums.sale_price > nums.normal_price)
      next.sale_price = "Tidak boleh lebih besar dari harga normal";
    else if (nums.sale_price < nums.min_payable)
      next.sale_price = "Tidak boleh lebih kecil dari minimum bayar";
    setErrors(next);
    setServerError(null);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      await pricingApi.update(nums);
      toast.success("Harga disimpan");
    } catch (err) {
      if (err instanceof ApiError && err.code === "VALIDATION_ERROR") {
        setErrors(err.fieldMap as Partial<Record<Field, string>>);
      } else {
        setServerError(handleError(err, "Harga belum bisa disimpan."));
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Harga</h1>
        <p className="text-sm text-muted-foreground">
          Harga full lagu. Berlaku untuk checkout baru; order yang sedang menunggu pembayaran dibuat
          ulang dengan harga baru.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Harga full lagu</CardTitle>
          <CardDescription>Dalam Rupiah, tanpa titik.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadError && <p className="py-6 text-center text-sm text-destructive">{loadError}</p>}
          {!values && !loadError && (
            <div className="space-y-3" aria-busy>
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          )}
          {values && nums && (
            <form onSubmit={onSubmit} noValidate className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-3">
                {FIELDS.map((f) => (
                  <div key={f.name} className="space-y-2">
                    <Label htmlFor={`price-${f.name}`}>{f.label}</Label>
                    <Input
                      id={`price-${f.name}`}
                      inputMode="numeric"
                      value={values[f.name]}
                      aria-invalid={!!errors[f.name]}
                      onChange={(e) =>
                        setValues({ ...values, [f.name]: e.target.value.replace(/\D/g, "") })
                      }
                    />
                    <p className="text-xs text-muted-foreground">{f.help}</p>
                    <FieldError>{errors[f.name]}</FieldError>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border bg-muted/40 p-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Pratinjau di halaman lagu
                </p>
                {nums.normal_price > nums.sale_price && (
                  <p className="text-sm text-muted-foreground line-through">
                    {formatIDR(nums.normal_price)}
                  </p>
                )}
                <p className="text-xl font-semibold">{formatIDR(nums.sale_price)}</p>
              </div>

              <FieldError role="alert">{serverError}</FieldError>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2Icon className="animate-spin" aria-hidden />}
                Simpan harga
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
