"use client";

import * as React from "react";
import {
  ArchiveIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Loader2Icon,
  SaveIcon,
} from "lucide-react";
import { toast } from "sonner";
import { errorMessage, type PaginationOutput } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { playgroundApi, type PlaygroundSongOutput } from "@/lib/playground-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 10;

type ListState =
  | { kind: "loading" }
  | { kind: "ok"; items: PlaygroundSongOutput[]; pagination: PaginationOutput }
  | { kind: "error"; message: string };

/**
 * Every song generated in the prompt playground (stored in the playground folder). The admin picks
 * which ones the landing page plays as samples / testimonials.
 */
export function SamplesView() {
  const [page, setPage] = React.useState(1);
  const [landingOnly, setLandingOnly] = React.useState(false);
  const [state, setState] = React.useState<ListState>({ kind: "loading" });

  const abortRef = React.useRef<AbortController | null>(null);
  const fetchList = React.useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setState((prev) => (prev.kind === "ok" ? prev : { kind: "loading" }));
    try {
      const out = await playgroundApi.list(
        { page, page_size: PAGE_SIZE, landing: landingOnly },
        ctrl.signal,
      );
      if (!ctrl.signal.aborted)
        setState({ kind: "ok", items: out.items, pagination: out.pagination });
    } catch (err) {
      if (!ctrl.signal.aborted)
        setState({ kind: "error", message: errorMessage(err, "Daftar lagu belum bisa dimuat.") });
    }
  }, [page, landingOnly]);

  React.useEffect(() => {
    void fetchList();
    return () => abortRef.current?.abort();
  }, [fetchList]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Sampel Landing</h1>
        <p className="text-sm text-muted-foreground">
          Semua lagu dari Playground (Prompt Templates → Langkah 2) tersimpan di folder playground.
          Centang “Tampil di landing page” untuk memakainya sebagai contoh/testimoni.
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={landingOnly}
          onChange={(e) => {
            setLandingOnly(e.target.checked);
            setPage(1);
          }}
        />
        Hanya yang tampil di landing page
      </label>

      {state.kind === "loading" && (
        <div className="space-y-4" aria-busy>
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      )}
      {state.kind === "error" && (
        <Card>
          <CardHeader>
            <CardTitle>Gagal memuat</CardTitle>
            <CardDescription>{state.message}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => void fetchList()}>
              Coba lagi
            </Button>
          </CardContent>
        </Card>
      )}
      {state.kind === "ok" && state.items.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Belum ada lagu</CardTitle>
            <CardDescription>
              {landingOnly
                ? "Belum ada lagu yang dipilih untuk landing page."
                : "Buat lagu di Prompt Templates → Playground → Generate Music. Hasilnya muncul di sini."}
            </CardDescription>
          </CardHeader>
        </Card>
      )}
      {state.kind === "ok" && state.items.length > 0 && (
        <>
          <ul className="space-y-4">
            {state.items.map((s) => (
              <li key={s.id}>
                <SongCard song={s} onChanged={() => void fetchList()} />
              </li>
            ))}
          </ul>
          <Pager pagination={state.pagination} onPage={setPage} />
        </>
      )}
    </div>
  );
}

function SongCard({ song, onChanged }: { song: PlaygroundSongOutput; onChanged: () => void }) {
  const [title, setTitle] = React.useState(song.title);
  const [caption, setCaption] = React.useState(song.caption);
  const [show, setShow] = React.useState(song.show_on_landing);
  const [order, setOrder] = React.useState(String(song.landing_order));
  const [busy, setBusy] = React.useState<"save" | "archive" | null>(null);

  const dirty =
    title !== song.title ||
    caption !== song.caption ||
    show !== song.show_on_landing ||
    order !== String(song.landing_order);

  async function save() {
    setBusy("save");
    try {
      await playgroundApi.update(song.id, {
        title,
        caption,
        show_on_landing: show,
        landing_order: Math.max(0, Number.parseInt(order, 10) || 0),
      });
      toast.success("Tersimpan");
      onChanged();
    } catch (err) {
      toast.error(errorMessage(err, "Gagal menyimpan."));
    } finally {
      setBusy(null);
    }
  }

  async function archive() {
    if (!window.confirm(`Arsipkan "${song.title}"? Lagu hilang dari daftar dan landing page.`))
      return;
    setBusy("archive");
    try {
      await playgroundApi.archive(song.id);
      toast.success("Diarsipkan");
      onChanged();
    } catch (err) {
      toast.error(errorMessage(err, "Gagal mengarsipkan."));
      setBusy(null);
    }
  }

  const id = (f: string) => `${f}-${song.id}`;
  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor={id("title")}>Judul</Label>
            <Input
              id={id("title")}
              value={title}
              maxLength={255}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={id("caption")}>Keterangan (tampil di landing)</Label>
            <Input
              id={id("caption")}
              value={caption}
              maxLength={255}
              placeholder="mis. Untuk ulang tahun Ibu · Pop akustik"
              onChange={(e) => setCaption(e.target.value)}
            />
          </div>
        </div>
        <audio controls preload="none" src={song.audio_url} className="w-full" />
        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground">Lirik & style prompt</summary>
          <p className="mt-2 text-xs text-muted-foreground">{song.style_prompt}</p>
          <pre className="mt-2 max-h-60 overflow-auto rounded bg-muted p-3 text-xs whitespace-pre-wrap">
            {song.lyrics}
          </pre>
        </details>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
            Tampil di landing page
          </label>
          <div className="flex items-center gap-2">
            <Label htmlFor={id("order")} className="text-sm">
              Urutan
            </Label>
            <Input
              id={id("order")}
              type="number"
              min={0}
              max={1000}
              className="w-20"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
            />
          </div>
          <div className="ml-auto flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={busy !== null}
              onClick={() => void archive()}
            >
              {busy === "archive" ? (
                <Loader2Icon className="animate-spin" aria-hidden />
              ) : (
                <ArchiveIcon aria-hidden />
              )}
              Arsipkan
            </Button>
            <Button size="sm" disabled={!dirty || busy !== null} onClick={() => void save()}>
              {busy === "save" ? (
                <Loader2Icon className="animate-spin" aria-hidden />
              ) : (
                <SaveIcon aria-hidden />
              )}
              Simpan
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {[song.provider, song.model, song.format.toUpperCase(), formatDateTime(song.created_at)]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </CardContent>
    </Card>
  );
}

function Pager({
  pagination: p,
  onPage,
}: {
  pagination: PaginationOutput;
  onPage: (n: number) => void;
}) {
  if (p.total_pages <= 1) return null;
  return (
    <div className="flex items-center justify-end gap-2 text-sm">
      <Button
        variant="outline"
        size="icon"
        disabled={p.page <= 1}
        onClick={() => onPage(p.page - 1)}
        aria-label="Sebelumnya"
      >
        <ChevronLeftIcon aria-hidden />
      </Button>
      <span>
        {p.page} / {p.total_pages}
      </span>
      <Button
        variant="outline"
        size="icon"
        disabled={p.page >= p.total_pages}
        onClick={() => onPage(p.page + 1)}
        aria-label="Berikutnya"
      >
        <ChevronRightIcon aria-hidden />
      </Button>
    </div>
  );
}
