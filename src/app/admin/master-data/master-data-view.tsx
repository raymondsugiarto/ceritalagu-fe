"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArchiveIcon, EyeIcon, EyeOffIcon, PencilIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { ApiError, errorMessage } from "@/lib/api";
import {
  MASTER_DATA_KINDS,
  masterDataApi,
  type MasterDataItemOutput,
  type MasterDataKind,
} from "@/lib/masterdata-api";
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
import { ItemFormDialog } from "./item-form-dialog";

type ListState =
  | { kind: "loading" }
  | { kind: "ok"; items: MasterDataItemOutput[] }
  | { kind: "error"; message: string };

const DEFAULT_KIND: MasterDataKind = "recipient_type";

export function MasterDataView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const info =
    MASTER_DATA_KINDS.find((k) => k.kind === params.get("kind")) ??
    MASTER_DATA_KINDS.find((k) => k.kind === DEFAULT_KIND)!;

  const { state: auth, refresh: refreshAuth } = useAdminAuth();
  const canEdit = auth.kind === "signed-in" && auth.admin.role === "super_admin";
  const [state, setState] = React.useState<ListState>({ kind: "loading" });
  const [editing, setEditing] = React.useState<MasterDataItemOutput | null>(null);
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
      const items = await masterDataApi.list(info.kind, ctrl.signal);
      if (!ctrl.signal.aborted) setState({ kind: "ok", items });
    } catch (err) {
      if (!ctrl.signal.aborted)
        setState({ kind: "error", message: handleError(err, "Data belum bisa dimuat.") });
    }
  }, [info.kind, handleError]);

  React.useEffect(() => {
    if (!canEdit) return;
    setState({ kind: "loading" });
    void fetchList();
    return () => abortRef.current?.abort();
  }, [canEdit, fetchList]);

  if (!canEdit) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <h1 className="text-2xl font-semibold">Master Data</h1>
        <Card>
          <CardHeader>
            <CardTitle>Tidak ada akses</CardTitle>
            <CardDescription>
              Hanya super admin yang bisa mengubah pilihan questioner.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const items = state.kind === "ok" ? state.items : [];
  const nextSortOrder = items.reduce((max, it) => Math.max(max, it.sort_order), 0) + 10;

  function openForm(item: MasterDataItemOutput | null) {
    setEditing(item);
    setFormOpen(true);
  }

  async function toggleActive(it: MasterDataItemOutput) {
    try {
      await masterDataApi.update(info.kind, it.id, { is_active: !it.is_active });
      toast.success(`${it.name} ${it.is_active ? "disembunyikan" : "ditampilkan"}`);
    } catch (err) {
      toast.error(handleError(err, "Status belum bisa diubah."));
    }
    await fetchList();
  }

  function askArchive(it: MasterDataItemOutput) {
    setConfirm({
      title: `Arsipkan ${it.name}?`,
      description:
        "Pilihan ini hilang dari questioner dan daftar admin. Lagu yang sudah memakainya tidak terpengaruh.",
      confirmLabel: "Arsipkan",
      destructive: true,
      onConfirm: async () => {
        try {
          await masterDataApi.archive(info.kind, it.id);
          toast.success(`${it.name} diarsipkan`);
        } catch (err) {
          toast.error(handleError(err, "Data belum bisa diarsipkan."));
        }
        await fetchList();
      },
    });
    setConfirmOpen(true);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Master Data</h1>
        <p className="text-sm text-muted-foreground">
          Pilihan yang dilihat customer di questioner. Hint hanya dikirim ke AI.
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Jenis master data"
        className="inline-flex gap-1 rounded-lg border bg-card p-1"
      >
        {MASTER_DATA_KINDS.map((k) => {
          const active = k.kind === info.kind;
          return (
            <button
              key={k.kind}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => router.replace(`${pathname}?kind=${k.kind}`)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-accent",
                active && "bg-accent font-medium text-primary",
              )}
            >
              {k.title}
            </button>
          );
        })}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>{info.title}</CardTitle>
            <CardDescription>
              Langkah {info.step} questioner
              {state.kind === "ok" &&
                ` · ${items.filter((i) => i.is_active).length} aktif dari ${items.length}`}
            </CardDescription>
          </div>
          <CardAction>
            <Button onClick={() => openForm(null)} disabled={state.kind !== "ok"}>
              <PlusIcon aria-hidden />
              Tambah
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-3">
          {info.kind !== "genre" && (
            <p className="text-xs text-muted-foreground">
              Questioner selalu menambahkan pilihan “Lainnya” dengan isian bebas di akhir daftar
              ini.
            </p>
          )}
          {state.kind === "loading" && (
            <div className="space-y-2" aria-busy>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}
          {state.kind === "error" && (
            <p className="py-6 text-center text-sm text-destructive">{state.message}</p>
          )}
          {state.kind === "ok" && items.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Belum ada data. Tambahkan di sini, atau jalankan{" "}
              <code className="font-mono">server masterdata import-defaults</code>.
            </p>
          )}
          {state.kind === "ok" && items.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Urutan</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>{info.hintLabel}</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((it) => (
                  <TableRow key={it.id} className={cn(!it.is_active && "text-muted-foreground")}>
                    <TableCell className="tabular-nums">{it.sort_order}</TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {it.icon && <span className="mr-1">{it.icon}</span>}
                        {it.name}
                      </div>
                      <div className="font-mono text-xs text-muted-foreground">{it.code}</div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="line-clamp-2 text-xs whitespace-normal">{it.hint || "—"}</p>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                          it.is_active
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {it.is_active ? "Aktif" : "Disembunyikan"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => void toggleActive(it)}
                          aria-label={`${it.is_active ? "Sembunyikan" : "Tampilkan"} ${it.name}`}
                        >
                          {it.is_active ? <EyeOffIcon aria-hidden /> : <EyeIcon aria-hidden />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openForm(it)}
                          aria-label={`Ubah ${it.name}`}
                        >
                          <PencilIcon aria-hidden />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => askArchive(it)}
                          aria-label={`Arsipkan ${it.name}`}
                        >
                          <ArchiveIcon aria-hidden />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ItemFormDialog
        info={info}
        item={editing}
        nextSortOrder={nextSortOrder}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSaved={() => void fetchList()}
      />
      <ConfirmDialog request={confirm} open={confirmOpen} onOpenChange={setConfirmOpen} />
    </div>
  );
}
