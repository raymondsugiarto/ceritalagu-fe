"use client";

import * as React from "react";
import { ArchiveIcon, EyeIcon, EyeOffIcon, PencilIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { ApiError, errorMessage } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { formatIDR } from "@/lib/payment-api";
import {
  pricingApi,
  voucherApi,
  type PricesOutput,
  type VoucherOutput,
  type VoucherStatus,
} from "@/lib/pricing-api";
import { cn } from "@/lib/utils";
import { useAdminAuth } from "@/components/admin/admin-auth-provider";
import { ConfirmDialog, type ConfirmRequest } from "@/components/admin/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VoucherFormDialog } from "./voucher-form-dialog";

type ListState =
  { kind: "loading" } | { kind: "ok"; items: VoucherOutput[] } | { kind: "error"; message: string };

const STATUS: Record<VoucherStatus, { label: string; className: string }> = {
  active: { label: "Aktif", className: "bg-primary/10 text-primary" },
  inactive: { label: "Nonaktif", className: "bg-muted text-muted-foreground" },
  expired: { label: "Kedaluwarsa", className: "bg-muted text-muted-foreground" },
  exhausted: {
    label: "Kuota habis",
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
};

export function VouchersView() {
  const { state: auth, refresh: refreshAuth } = useAdminAuth();
  const canEdit = auth.kind === "signed-in" && auth.admin.role === "super_admin";
  const [state, setState] = React.useState<ListState>({ kind: "loading" });
  const [prices, setPrices] = React.useState<PricesOutput | null>(null);
  const [editing, setEditing] = React.useState<VoucherOutput | null>(null);
  const [formOpen, setFormOpen] = React.useState(false);
  const [confirm, setConfirm] = React.useState<ConfirmRequest | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const handleError = React.useCallback(
    (err: unknown, fallback: string) => {
      if (err instanceof ApiError && err.status === 401) void refreshAuth();
      return errorMessage(err, fallback);
    },
    [refreshAuth],
  );

  const abortRef = React.useRef<AbortController | null>(null);
  const fetchList = React.useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const items = await voucherApi.list(ctrl.signal);
      if (!ctrl.signal.aborted) setState({ kind: "ok", items });
    } catch (err) {
      if (!ctrl.signal.aborted)
        setState({ kind: "error", message: handleError(err, "Voucher belum bisa dimuat.") });
    }
  }, [handleError]);

  React.useEffect(() => {
    if (!canEdit) return;
    setState({ kind: "loading" });
    void fetchList();
    pricingApi.get().then(setPrices, () => {});
    return () => abortRef.current?.abort();
  }, [canEdit, fetchList]);

  if (!canEdit) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <h1 className="text-2xl font-semibold">Voucher</h1>
        <Card>
          <CardHeader>
            <CardTitle>Tidak ada akses</CardTitle>
            <CardDescription>Hanya super admin yang bisa mengelola voucher.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const items = state.kind === "ok" ? state.items : [];

  function openForm(v: VoucherOutput | null) {
    setEditing(v);
    setFormOpen(true);
  }

  async function toggleActive(v: VoucherOutput) {
    try {
      await voucherApi.update(v.id, { is_active: !v.is_active });
      toast.success(`${v.code} ${v.is_active ? "dinonaktifkan" : "diaktifkan"}`);
    } catch (err) {
      toast.error(handleError(err, "Status belum bisa diubah."));
    }
    await fetchList();
  }

  function askArchive(v: VoucherOutput) {
    setConfirm({
      title: `Arsipkan voucher ${v.code}?`,
      description:
        "Kode ini tidak bisa dipakai lagi dan hilang dari daftar. Order yang sudah memakainya tetap tercatat.",
      confirmLabel: "Arsipkan",
      destructive: true,
      onConfirm: async () => {
        try {
          await voucherApi.archive(v.id);
          toast.success(`${v.code} diarsipkan`);
        } catch (err) {
          toast.error(handleError(err, "Voucher belum bisa diarsipkan."));
        }
        await fetchList();
      },
    });
    setConfirmOpen(true);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Voucher</h1>
        <p className="text-sm text-muted-foreground">
          Potongan Rupiah dari harga setelah diskon
          {prices && ` (${formatIDR(prices.sale_price)})`}. Total bayar tidak pernah di bawah{" "}
          {prices ? formatIDR(prices.min_payable) : "minimum bayar"}. Satu customer hanya bisa
          memakai tiap voucher sekali.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Daftar voucher</CardTitle>
            <CardDescription>
              Kuota terpakai = order lunas + order yang masih menunggu pembayaran.
            </CardDescription>
          </div>
          <CardAction>
            <Button onClick={() => openForm(null)} disabled={state.kind !== "ok"}>
              <PlusIcon aria-hidden />
              Tambah
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {state.kind === "loading" && (
            <div className="space-y-2" aria-busy>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}
          {state.kind === "error" && (
            <p className="py-6 text-center text-sm text-destructive">{state.message}</p>
          )}
          {state.kind === "ok" && items.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Belum ada voucher. Klik Tambah untuk membuat yang pertama.
            </p>
          )}
          {state.kind === "ok" && items.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead className="text-right">Potongan</TableHead>
                  <TableHead className="text-right">Terpakai</TableHead>
                  <TableHead>Berlaku sampai</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((v) => {
                  const st = STATUS[v.status];
                  return (
                    <TableRow
                      key={v.id}
                      className={cn(v.status !== "active" && "text-muted-foreground")}
                    >
                      <TableCell className="font-mono font-medium">
                        <span className="flex items-center gap-2">
                          {v.code}
                          {v.is_public && (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                              Promo
                            </span>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatIDR(v.discount_amount)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {v.used} / {v.quota}
                      </TableCell>
                      <TableCell className="text-sm">{formatDateTime(v.expires_at)}</TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                            st.className,
                          )}
                        >
                          {st.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => void toggleActive(v)}
                            aria-label={`${v.is_active ? "Nonaktifkan" : "Aktifkan"} ${v.code}`}
                          >
                            {v.is_active ? <EyeOffIcon aria-hidden /> : <EyeIcon aria-hidden />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openForm(v)}
                            aria-label={`Ubah ${v.code}`}
                          >
                            <PencilIcon aria-hidden />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => askArchive(v)}
                            aria-label={`Arsipkan ${v.code}`}
                          >
                            <ArchiveIcon aria-hidden />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <VoucherFormDialog
        voucher={editing}
        salePrice={prices?.sale_price ?? null}
        minPayable={prices?.min_payable ?? null}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSaved={() => void fetchList()}
      />
      <ConfirmDialog request={confirm} open={confirmOpen} onOpenChange={setConfirmOpen} />
    </div>
  );
}
