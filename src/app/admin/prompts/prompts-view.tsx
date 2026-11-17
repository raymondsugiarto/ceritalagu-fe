"use client";

import * as React from "react";
import {
  ArchiveIcon,
  CheckCircle2Icon,
  Loader2Icon,
  PencilLineIcon,
  RotateCcwIcon,
  SaveIcon,
} from "lucide-react";
import { toast } from "sonner";
import { ApiError, errorMessage } from "@/lib/api";
import {
  promptApi,
  unknownPlaceholders,
  type PromptListOutput,
  type PromptVersion,
} from "@/lib/prompt-api";
import { cn } from "@/lib/utils";
import { useAdminAuth } from "@/components/admin/admin-auth-provider";
import { ConfirmDialog, type ConfirmRequest } from "@/components/admin/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { PlaygroundPanel } from "./playground-panel";

type ListState =
  { kind: "loading" } | { kind: "ok"; data: PromptListOutput } | { kind: "error"; message: string };

interface Draft {
  /** The version the draft started from (to tell whether anything changed). */
  base: PromptVersion;
  name: string;
  note: string;
  system: string;
  user: string;
}

type PromptField = "system" | "user";

function draftFrom(v: PromptVersion): Draft {
  return {
    base: v,
    name: v.version === 0 ? "Prompt utama" : v.name,
    note: "",
    system: v.system_prompt,
    user: v.user_prompt,
  };
}

function versionLabel(v: PromptVersion) {
  return v.version === 0 ? "Default bawaan" : `v${v.version}`;
}

const dateFmt = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" });

export function PromptsView() {
  const { state: auth, refresh: refreshAuth } = useAdminAuth();
  const canEdit = auth.kind === "signed-in" && auth.admin.role === "super_admin";
  const [state, setState] = React.useState<ListState>({ kind: "loading" });
  const [draft, setDraft] = React.useState<Draft | null>(null);
  const [saving, setSaving] = React.useState<"save" | "activate" | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [confirm, setConfirm] = React.useState<ConfirmRequest | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const lastFocused = React.useRef<PromptField>("user");
  const textareas = {
    system: React.useRef<HTMLTextAreaElement>(null),
    user: React.useRef<HTMLTextAreaElement>(null),
  };

  const handleError = React.useCallback(
    (err: unknown, fallback: string) => {
      if (err instanceof ApiError && err.status === 401) void refreshAuth();
      return errorMessage(err, fallback);
    },
    [refreshAuth],
  );

  const fetchList = React.useCallback(
    async (signal?: AbortSignal) => {
      try {
        const data = await promptApi.list(signal);
        if (signal?.aborted) return;
        setState({ kind: "ok", data });
        // First load: start editing from what is live.
        setDraft((d) => d ?? draftFrom(data.versions.find((v) => v.is_active) ?? data.default));
      } catch (err) {
        if (!signal?.aborted)
          setState({ kind: "error", message: handleError(err, "Prompt belum bisa dimuat.") });
      }
    },
    [handleError],
  );

  React.useEffect(() => {
    if (!canEdit) return;
    const ctrl = new AbortController();
    void fetchList(ctrl.signal);
    return () => ctrl.abort();
  }, [canEdit, fetchList]);

  if (!canEdit) {
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <h1 className="text-2xl font-semibold">Prompt Templates</h1>
        <Card>
          <CardHeader>
            <CardTitle>Tidak ada akses</CardTitle>
            <CardDescription>Hanya super admin yang bisa mengubah prompt.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const data = state.kind === "ok" ? state.data : null;
  const placeholders = data?.placeholders ?? [];
  const dirty =
    draft !== null &&
    (draft.system !== draft.base.system_prompt || draft.user !== draft.base.user_prompt);
  const unknown = draft ? unknownPlaceholders(`${draft.system}\n${draft.user}`, placeholders) : [];
  const baseArchived =
    draft !== null &&
    draft.base.version > 0 &&
    !!data &&
    !data.versions.some((v) => v.id === draft.base.id);

  function confirmThen(req: ConfirmRequest) {
    setConfirm(req);
    setConfirmOpen(true);
  }

  function edit(v: PromptVersion) {
    const load = () => {
      setDraft(draftFrom(v));
      setFieldErrors({});
    };
    if (!dirty) return load();
    confirmThen({
      title: `Buka ${versionLabel(v)} di editor?`,
      description: "Perubahan di editor yang belum disimpan akan hilang.",
      confirmLabel: "Buka",
      onConfirm: async () => load(),
    });
  }

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
  }

  function insertPlaceholder(name: string) {
    const field = lastFocused.current;
    const el = textareas[field].current;
    const token = `{{${name}}}`;
    if (!draft || !el) return;
    const value = draft[field];
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    update(field, value.slice(0, start) + token + value.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length);
    });
  }

  async function save(activate: boolean) {
    if (!draft) return;
    setSaving(activate ? "activate" : "save");
    setFieldErrors({});
    try {
      const v = await promptApi.create({
        name: draft.name,
        note: draft.note,
        system_prompt: draft.system,
        user_prompt: draft.user,
        activate,
      });
      toast.success(
        activate ? `v${v.version} disimpan dan aktif` : `v${v.version} disimpan (belum aktif)`,
      );
      setDraft(draftFrom(v));
      await fetchList();
    } catch (err) {
      if (err instanceof ApiError) setFieldErrors(err.fieldMap);
      toast.error(handleError(err, "Versi belum bisa disimpan."));
    } finally {
      setSaving(null);
    }
  }

  function askActivate(v: PromptVersion) {
    const isDefault = v.version === 0;
    confirmThen({
      title: isDefault ? "Kembali ke default bawaan?" : `Aktifkan v${v.version}?`,
      description:
        "Job lagu baru langsung memakai prompt ini. Job yang sudah berjalan tetap memakai versinya sendiri.",
      confirmLabel: "Aktifkan",
      onConfirm: async () => {
        try {
          if (isDefault) await promptApi.useDefault();
          else await promptApi.activate(v.id);
          toast.success(`${versionLabel(v)} aktif`);
        } catch (err) {
          toast.error(handleError(err, "Versi belum bisa diaktifkan."));
        }
        await fetchList();
      },
    });
  }

  function askArchive(v: PromptVersion) {
    confirmThen({
      title: `Arsipkan v${v.version}?`,
      description:
        "Versi ini hilang dari daftar. Job yang pernah memakainya tetap mencatat ID versinya.",
      confirmLabel: "Arsipkan",
      destructive: true,
      onConfirm: async () => {
        try {
          await promptApi.archive(v.id);
          toast.success(`v${v.version} diarsipkan`);
        } catch (err) {
          toast.error(handleError(err, "Versi belum bisa diarsipkan."));
        }
        await fetchList();
      },
    });
  }

  const rows = data ? [...data.versions, data.default] : [];

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Prompt Templates</h1>
        <p className="text-sm text-muted-foreground">
          Prompt untuk AI Lyrics &amp; Style. Setiap simpan membuat versi baru; versi lama tetap ada
          untuk rollback, dan setiap job mencatat versi yang dipakai.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Versi</CardTitle>
          <CardDescription>
            {data &&
              (data.default_in_use
                ? "Belum ada versi tersimpan yang aktif: job memakai default bawaan."
                : `Aktif: ${versionLabel(data.versions.find((v) => v.is_active)!)}`)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {state.kind === "loading" && (
            <div className="space-y-2" aria-busy>
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          )}
          {state.kind === "error" && (
            <p className="py-6 text-center text-sm text-destructive">{state.message}</p>
          )}
          {data && (
            <ul className="divide-y">
              {rows.map((v) => {
                const editing = draft?.base.id === v.id && draft.base.version === v.version;
                return (
                  <li
                    key={v.id || "default"}
                    className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-medium">{versionLabel(v)}</span>
                        {v.version > 0 && <span className="text-sm">{v.name}</span>}
                        {v.is_active && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            <CheckCircle2Icon className="size-3" aria-hidden />
                            Aktif
                          </span>
                        )}
                        {editing && (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            Di editor
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {v.version === 0
                          ? "Bawaan aplikasi, dipakai saat tidak ada versi aktif."
                          : [v.created_at && dateFmt.format(new Date(v.created_at)), v.note]
                              .filter(Boolean)
                              .join(" · ")}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => edit(v)}>
                        <PencilLineIcon aria-hidden />
                        Buka
                      </Button>
                      {!v.is_active && (
                        <Button variant="outline" size="sm" onClick={() => askActivate(v)}>
                          {v.version === 0 ? (
                            <RotateCcwIcon aria-hidden />
                          ) : (
                            <CheckCircle2Icon aria-hidden />
                          )}
                          {v.version === 0 ? "Pakai default" : "Aktifkan"}
                        </Button>
                      )}
                      {v.version > 0 && !v.is_active && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => askArchive(v)}
                          aria-label={`Arsipkan v${v.version}`}
                        >
                          <ArchiveIcon aria-hidden />
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {draft && (
        <div className="grid items-start gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Editor</CardTitle>
              <CardDescription>
                Berdasarkan {versionLabel(draft.base)}
                {baseArchived && " (sudah diarsipkan)"}
                {dirty ? " · ada perubahan belum disimpan" : " · belum diubah"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="pt-name">Nama</Label>
                  <Input
                    id="pt-name"
                    value={draft.name}
                    maxLength={100}
                    aria-invalid={!!fieldErrors.name}
                    onChange={(e) => update("name", e.target.value)}
                  />
                  <FieldError>{fieldErrors.name}</FieldError>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pt-note">Catatan perubahan</Label>
                  <Input
                    id="pt-note"
                    value={draft.note}
                    maxLength={500}
                    placeholder="mis. chorus lebih cepat"
                    onChange={(e) => update("note", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-sm font-medium">Placeholder</p>
                <p className="text-xs text-muted-foreground">
                  Klik untuk menyisipkan di posisi kursor pada kotak prompt terakhir yang dipilih.
                </p>
                <div className="flex flex-wrap gap-1">
                  {placeholders.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => insertPlaceholder(p)}
                      className="rounded-md border bg-muted/50 px-2 py-0.5 font-mono text-xs transition-colors hover:bg-accent"
                    >
                      {`{{${p}}}`}
                    </button>
                  ))}
                </div>
              </div>

              <PromptArea
                id="pt-system"
                label="System prompt"
                value={draft.system}
                error={fieldErrors.system_prompt}
                textareaRef={textareas.system}
                rows={16}
                onFocus={() => (lastFocused.current = "system")}
                onChange={(v) => update("system", v)}
              />
              <PromptArea
                id="pt-user"
                label="User prompt"
                value={draft.user}
                error={fieldErrors.user_prompt}
                textareaRef={textareas.user}
                rows={10}
                onFocus={() => (lastFocused.current = "user")}
                onChange={(v) => update("user", v)}
              />

              {unknown.length > 0 && (
                <p className="text-sm text-destructive" role="alert">
                  Placeholder tidak dikenal: {unknown.map((p) => `{{${p}}}`).join(", ")}. Perbaiki
                  sebelum menyimpan.
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => void save(false)}
                  disabled={saving !== null || !dirty || unknown.length > 0}
                >
                  {saving === "save" ? (
                    <Loader2Icon className="animate-spin" aria-hidden />
                  ) : (
                    <SaveIcon aria-hidden />
                  )}
                  Simpan versi baru
                </Button>
                <Button
                  onClick={() => void save(true)}
                  disabled={saving !== null || !dirty || unknown.length > 0}
                >
                  {saving === "activate" ? (
                    <Loader2Icon className="animate-spin" aria-hidden />
                  ) : (
                    <CheckCircle2Icon aria-hidden />
                  )}
                  Simpan &amp; aktifkan
                </Button>
                {dirty && (
                  <Button
                    variant="ghost"
                    onClick={() => setDraft(draftFrom(draft.base))}
                    disabled={saving !== null}
                  >
                    <RotateCcwIcon aria-hidden />
                    Batalkan perubahan
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <PlaygroundPanel
            systemPrompt={draft.system}
            userPrompt={draft.user}
            draftLabel={
              dirty ? `draft (dari ${versionLabel(draft.base)})` : versionLabel(draft.base)
            }
          />
        </div>
      )}

      <ConfirmDialog request={confirm} open={confirmOpen} onOpenChange={setConfirmOpen} />
    </div>
  );
}

function PromptArea({
  id,
  label,
  value,
  error,
  rows,
  textareaRef,
  onFocus,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  error?: string;
  rows: number;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onFocus: () => void;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <Label htmlFor={id}>{label}</Label>
        <span
          className={cn(
            "text-xs text-muted-foreground",
            value.length > 20000 && "text-destructive",
          )}
        >
          {value.length.toLocaleString("id-ID")} / 20.000
        </span>
      </div>
      <Textarea
        id={id}
        ref={textareaRef}
        rows={rows}
        value={value}
        spellCheck={false}
        aria-invalid={!!error}
        className="font-mono text-xs leading-relaxed"
        onFocus={onFocus}
        onChange={(e) => onChange(e.target.value)}
      />
      <FieldError>{error}</FieldError>
    </div>
  );
}
