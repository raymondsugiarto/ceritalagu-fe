"use client";

import * as React from "react";
import {
  ArchiveIcon,
  CheckCircle2Icon,
  Loader2Icon,
  PencilIcon,
  PlugZapIcon,
  PlusIcon,
  PowerIcon,
  PowerOffIcon,
  XCircleIcon,
} from "lucide-react";
import { toast } from "sonner";
import { ApiError, errorMessage } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import {
  CATEGORY_LABELS,
  providerApi,
  type AdapterOutput,
  type ProviderCategory,
  type ProviderOutput,
  type TestConnectionOutput,
} from "@/lib/provider-api";
import { useAdminAuth } from "@/components/admin/admin-auth-provider";
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
import { cn } from "@/lib/utils";
import { ConfirmDialog, type ConfirmRequest } from "@/components/admin/confirm-dialog";
import { ProviderFormDialog } from "./provider-form-dialog";

const CATEGORIES: ProviderCategory[] = ["lyrics_style", "music"];

const CATEGORY_HINTS: Record<ProviderCategory, string> = {
  lyrics_style: "Mengubah jawaban questioner menjadi lirik dan style prompt.",
  music: "Mengubah lirik dan style menjadi audio lagu.",
};

type ListState =
  | { kind: "loading" }
  | { kind: "ok"; items: ProviderOutput[]; adapters: AdapterOutput[] }
  | { kind: "error"; message: string };

export function ProvidersView() {
  const { state: auth, refresh: refreshAuth } = useAdminAuth();
  const [state, setState] = React.useState<ListState>({ kind: "loading" });
  const [form, setForm] = React.useState<{
    category: ProviderCategory;
    provider: ProviderOutput | null;
  }>({
    category: "lyrics_style",
    provider: null,
  });
  const [formOpen, setFormOpen] = React.useState(false);
  const [confirm, setConfirm] = React.useState<ConfirmRequest | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [tests, setTests] = React.useState<Record<string, TestConnectionOutput | "running">>({});

  const canEdit = auth.kind === "signed-in" && auth.admin.role === "super_admin";

  // A 401 means the session ended: let the shell send the admin to the login page.
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
      const [items, adapters] = await Promise.all([
        providerApi.list({}, ctrl.signal),
        providerApi.adapters(),
      ]);
      if (ctrl.signal.aborted) return;
      setState({ kind: "ok", items, adapters });
    } catch (err) {
      if (ctrl.signal.aborted) return;
      setState({ kind: "error", message: handleError(err, "Daftar provider belum bisa dimuat.") });
    }
  }, [handleError]);

  React.useEffect(() => {
    if (!canEdit) return;
    void fetchList();
    return () => abortRef.current?.abort();
  }, [canEdit, fetchList]);

  if (!canEdit) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <h1 className="text-2xl font-semibold">AI Providers</h1>
        <Card>
          <CardHeader>
            <CardTitle>Tidak ada akses</CardTitle>
            <CardDescription>
              Hanya super admin yang bisa mengelola provider dan API key.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  function openForm(category: ProviderCategory, provider: ProviderOutput | null) {
    setForm({ category, provider });
    setFormOpen(true);
  }

  function ask(req: ConfirmRequest) {
    setConfirm(req);
    setConfirmOpen(true);
  }

  async function run(action: () => Promise<unknown>, success: string, fallback: string) {
    try {
      await action();
      toast.success(success);
    } catch (err) {
      toast.error(handleError(err, fallback));
    }
    await fetchList();
  }

  async function test(p: ProviderOutput) {
    setTests((t) => ({ ...t, [p.id]: "running" }));
    try {
      const out = await providerApi.test(p.id);
      setTests((t) => ({ ...t, [p.id]: out }));
    } catch (err) {
      setTests((t) => {
        const { [p.id]: _, ...rest } = t;
        return rest;
      });
      toast.error(handleError(err, "Test connection gagal dijalankan."));
    }
  }

  const actions: ProviderActions = {
    edit: (p) => openForm(p.category, p),
    test: (p) => void test(p),
    activate: (p) =>
      void run(
        () => providerApi.activate(p.id),
        `${p.name} sekarang aktif`,
        "Provider belum bisa diaktifkan.",
      ),
    deactivate: (p) =>
      ask({
        title: `Nonaktifkan ${p.name}?`,
        description:
          state.kind === "ok" &&
          state.items.some((o) => o.category === p.category && o.is_active && o.id !== p.id)
            ? "Job baru akan memakai provider aktif lain di kategori ini sesuai priority."
            : "Kategori ini tidak akan punya provider aktif, jadi lagu baru akan gagal dibuat sampai provider lain diaktifkan.",
        confirmLabel: "Nonaktifkan",
        destructive: true,
        onConfirm: () =>
          run(
            () => providerApi.deactivate(p.id),
            `${p.name} dinonaktifkan`,
            "Provider belum bisa dinonaktifkan.",
          ),
      }),
    archive: (p) =>
      ask({
        title: `Arsipkan ${p.name}?`,
        description:
          "Provider disembunyikan dari daftar. Riwayat job yang memakainya tetap tersimpan.",
        confirmLabel: "Arsipkan",
        destructive: true,
        onConfirm: () =>
          run(
            () => providerApi.archive(p.id),
            `${p.name} diarsipkan`,
            "Provider belum bisa diarsipkan.",
          ),
      }),
  };

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">AI Providers</h1>
        <p className="text-sm text-muted-foreground">
          Beberapa provider boleh aktif per kategori. Priority terkecil dipakai dulu; angka yang
          sama dipilih acak tiap job. Perubahan berlaku untuk job baru.
        </p>
      </div>

      {CATEGORIES.map((category) => {
        const items = state.kind === "ok" ? state.items.filter((p) => p.category === category) : [];
        const hasActive = items.some((p) => p.is_active);
        return (
          <Card key={category}>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>{CATEGORY_LABELS[category]}</CardTitle>
                <CardDescription>{CATEGORY_HINTS[category]}</CardDescription>
              </div>
              <CardAction>
                <Button onClick={() => openForm(category, null)} disabled={state.kind !== "ok"}>
                  <PlusIcon aria-hidden />
                  Tambah
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-3">
              {state.kind === "ok" && !hasActive && (
                <p
                  role="status"
                  className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive"
                >
                  Belum ada provider aktif — lagu tidak bisa dibuat sampai satu provider diaktifkan.
                </p>
              )}
              <ProvidersTable state={state} items={items} tests={tests} actions={actions} />
            </CardContent>
          </Card>
        );
      })}

      <ProviderFormDialog
        category={form.category}
        provider={form.provider}
        adapters={state.kind === "ok" ? state.adapters : []}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSaved={() => void fetchList()}
      />
      <ConfirmDialog request={confirm} open={confirmOpen} onOpenChange={setConfirmOpen} />
    </div>
  );
}

interface ProviderActions {
  edit: (p: ProviderOutput) => void;
  test: (p: ProviderOutput) => void;
  activate: (p: ProviderOutput) => void;
  deactivate: (p: ProviderOutput) => void;
  archive: (p: ProviderOutput) => void;
}

interface ProvidersTableProps {
  state: ListState;
  items: ProviderOutput[];
  tests: Record<string, TestConnectionOutput | "running">;
  actions: ProviderActions;
}

function ProvidersTable({ state, items, tests, actions }: ProvidersTableProps) {
  if (state.kind === "loading") {
    return (
      <div className="space-y-2" aria-busy>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }
  if (state.kind === "error") {
    return <p className="py-6 text-center text-sm text-destructive">{state.message}</p>;
  }
  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Belum ada provider.</p>;
  }
  const adapterLabel = (type: string) => state.adapters.find((a) => a.type === type)?.label ?? type;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nama</TableHead>
          <TableHead>API key</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((p) => {
          const result = tests[p.id];
          return (
            <TableRow key={p.id}>
              <TableCell>
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-muted-foreground">
                  {adapterLabel(p.adapter_type)} · {p.model} · diubah {formatDateTime(p.updated_at)}
                </div>
                {result && result !== "running" && (
                  <p
                    role="status"
                    className={cn(
                      "mt-1 flex items-start gap-1 text-xs",
                      result.ok ? "text-primary" : "text-destructive",
                    )}
                  >
                    {result.ok ? (
                      <CheckCircle2Icon className="mt-px size-3.5 shrink-0" aria-hidden />
                    ) : (
                      <XCircleIcon className="mt-px size-3.5 shrink-0" aria-hidden />
                    )}
                    {result.message} ({result.latency_ms} ms)
                  </p>
                )}
              </TableCell>
              <TableCell className="font-mono text-sm">{p.api_key_masked || "—"}</TableCell>
              <TableCell className="tabular-nums">{p.priority}</TableCell>
              <TableCell>
                <span
                  className={cn(
                    "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                    p.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                  )}
                >
                  {p.is_active ? "Aktif" : "Nonaktif"}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => actions.test(p)}
                    disabled={result === "running"}
                  >
                    {result === "running" ? (
                      <Loader2Icon className="animate-spin" aria-hidden />
                    ) : (
                      <PlugZapIcon aria-hidden />
                    )}
                    Test
                  </Button>
                  {p.is_active ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => actions.deactivate(p)}
                      aria-label={`Nonaktifkan ${p.name}`}
                    >
                      <PowerOffIcon aria-hidden />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => actions.activate(p)}
                      aria-label={`Aktifkan ${p.name}`}
                    >
                      <PowerIcon aria-hidden />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => actions.edit(p)}
                    aria-label={`Ubah ${p.name}`}
                  >
                    <PencilIcon aria-hidden />
                  </Button>
                  {!p.is_active && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => actions.archive(p)}
                      aria-label={`Arsipkan ${p.name}`}
                    >
                      <ArchiveIcon aria-hidden />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
