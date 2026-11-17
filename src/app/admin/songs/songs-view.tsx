"use client";

import * as React from "react";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  FileTextIcon,
  Loader2Icon,
  MusicIcon,
  RefreshCwIcon,
  SearchIcon,
} from "lucide-react";
import { errorMessage, type PaginationOutput } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import {
  adminSongApi,
  formatSeconds,
  type AdminSongOutput,
  type SongAccess,
  type SongStatsOutput,
} from "@/lib/admin-song-api";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { AnswersDialog } from "./answers-dialog";

const PAGE_SIZE = 20;

const FILTERS: { value: SongAccess; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "unlocked", label: "Sudah dibeli" },
  { value: "locked", label: "Preview saja" },
];

type ListState =
  | { kind: "loading" }
  | { kind: "ok"; items: AdminSongOutput[]; pagination: PaginationOutput }
  | { kind: "error"; message: string };

export function SongsView() {
  const [access, setAccess] = React.useState<SongAccess>("all");
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const [page, setPage] = React.useState(1);
  const [state, setState] = React.useState<ListState>({ kind: "loading" });
  const [stats, setStats] = React.useState<SongStatsOutput | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);

  React.useEffect(() => setPage(1), [debouncedSearch, access]);

  const abortRef = React.useRef<AbortController | null>(null);
  const fetchAll = React.useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setRefreshing(true);
    try {
      const [list, st] = await Promise.all([
        adminSongApi.list(
          { page, page_size: PAGE_SIZE, access, search: debouncedSearch },
          ctrl.signal,
        ),
        adminSongApi.stats(ctrl.signal),
      ]);
      if (ctrl.signal.aborted) return;
      setState({ kind: "ok", items: list.items, pagination: list.pagination });
      setStats(st);
    } catch (err) {
      if (ctrl.signal.aborted) return;
      setState({ kind: "error", message: errorMessage(err, "Could not load songs.") });
    } finally {
      if (!ctrl.signal.aborted) setRefreshing(false);
    }
  }, [page, access, debouncedSearch]);

  React.useEffect(() => {
    setState({ kind: "loading" });
    void fetchAll();
    return () => abortRef.current?.abort();
  }, [fetchAll]);

  const pagination = state.kind === "ok" ? state.pagination : null;

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Songs</h1>
        <p className="text-sm text-muted-foreground">
          Semua lagu yang berhasil di-generate: customer, lirik, preview dan lagu lengkap.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Total lagu" value={stats?.total} />
        <StatTile label="Sudah dibeli" value={stats?.unlocked} highlight />
        <StatTile label="Milik guest" value={stats?.guest} />
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle>Daftar lagu</CardTitle>
            <CardDescription>
              {pagination ? `${pagination.total_items} lagu` : "Memuat…"}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => void fetchAll()}>
            {refreshing ? (
              <Loader2Icon className="animate-spin" aria-hidden />
            ) : (
              <RefreshCwIcon aria-hidden />
            )}
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-md border p-0.5" role="tablist">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  role="tab"
                  aria-selected={access === f.value}
                  onClick={() => setAccess(f.value)}
                  className={cn(
                    "rounded px-3 py-1 text-sm",
                    access === f.value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="w-full max-w-xs">
              <Input
                startAdornment={<SearchIcon aria-hidden />}
                placeholder="Judul, email, song ID…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search songs"
              />
            </div>
          </div>

          <SongsTable state={state} />

          {pagination && pagination.total_pages > 1 ? (
            <div className="flex items-center justify-between gap-4 pt-2">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.total_pages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={pagination.page <= 1}
                >
                  <ChevronLeftIcon aria-hidden />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={pagination.page >= pagination.total_pages}
                >
                  Next
                  <ChevronRightIcon aria-hidden />
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function StatTile({
  label,
  value,
  highlight,
}: {
  label: string;
  value?: number;
  highlight?: boolean;
}) {
  return (
    <Card className="gap-1 py-4">
      <CardContent className="space-y-1 px-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        {value === undefined ? (
          <Skeleton className="h-7 w-12" />
        ) : (
          <p
            className={cn(
              "text-2xl font-semibold tabular-nums",
              highlight && value > 0 && "text-success",
            )}
          >
            {value}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function SongsTable({ state }: { state: ListState }) {
  const [open, setOpen] = React.useState<string | null>(null);
  const [answersOf, setAnswersOf] = React.useState<AdminSongOutput | null>(null);

  if (state.kind === "loading") {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }
  if (state.kind === "error") {
    return (
      <div
        role="alert"
        className="rounded-md bg-destructive/10 px-4 py-6 text-center text-sm text-destructive"
      >
        {state.message}
      </div>
    );
  }
  if (state.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed py-12 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-primary/10">
          <MusicIcon className="size-6 text-primary" aria-hidden />
        </span>
        <p className="text-sm text-muted-foreground">Belum ada lagu di filter ini.</p>
      </div>
    );
  }

  return (
    <>
      <AnswersDialog song={answersOf} onOpenChange={(o) => !o && setAnswersOf(null)} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-px" />
            <TableHead>Judul</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Genre / Mood</TableHead>
            <TableHead>Durasi</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Dibuat</TableHead>
            <TableHead className="w-px">
              <span className="sr-only">Aksi</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {state.items.map((s) => {
            const expanded = open === s.id;
            return (
              <React.Fragment key={s.id}>
                <TableRow
                  className="cursor-pointer"
                  onClick={() => setOpen(expanded ? null : s.id)}
                >
                  <TableCell>
                    <ChevronDownIcon
                      className={cn("size-4 transition-transform", !expanded && "-rotate-90")}
                      aria-hidden
                    />
                  </TableCell>
                  <TableCell className="font-medium">{s.title || "Tanpa judul"}</TableCell>
                  <TableCell className="text-muted-foreground">{s.user_email || "guest"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <p>{s.genre || "—"}</p>
                    <p>{s.mood || "—"}</p>
                  </TableCell>
                  <TableCell className="tabular-nums">{formatSeconds(s.duration_sec)}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                        s.is_unlocked
                          ? "bg-success/15 text-success"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {s.is_unlocked ? "Dibeli" : "Preview"}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateTime(s.created_at)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Lihat jawaban customer"
                      aria-label={`Lihat jawaban customer untuk ${s.title || "lagu ini"}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setAnswersOf(s);
                      }}
                    >
                      <FileTextIcon aria-hidden />
                    </Button>
                  </TableCell>
                </TableRow>
                {expanded && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell />
                    <TableCell colSpan={7}>
                      <SongDetail song={s} />
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
}

function SongDetail({ song }: { song: AdminSongOutput }) {
  return (
    <div className="grid gap-4 py-2 text-sm md:grid-cols-2">
      <div className="space-y-4">
        <div className="space-y-1">
          <p className="text-muted-foreground">
            Preview ({formatSeconds(song.preview_duration_sec)})
          </p>
          <audio controls preload="none" src={song.preview_url} className="w-full" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">
              Lagu lengkap ({formatSeconds(song.duration_sec)})
            </p>
            <a
              href={`${song.audio_url}&download=1`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <DownloadIcon aria-hidden />
              MP3
            </a>
          </div>
          <audio controls preload="none" src={song.audio_url} className="w-full" />
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          <dt className="text-muted-foreground">Song ID</dt>
          <dd className="font-mono text-xs break-all">{song.id}</dd>
          <dt className="text-muted-foreground">Job ID</dt>
          <dd className="font-mono text-xs break-all">{song.job_id}</dd>
          <dt className="text-muted-foreground">Vokal</dt>
          <dd>{song.vocal_gender || "—"}</dd>
          <dt className="text-muted-foreground">Bahasa</dt>
          <dd>{song.language || "—"}</dd>
          {song.unlocked_at && (
            <>
              <dt className="text-muted-foreground">Dibeli</dt>
              <dd>{formatDateTime(song.unlocked_at)}</dd>
            </>
          )}
          {!song.user_id && song.expires_at && (
            <>
              <dt className="text-muted-foreground">Kedaluwarsa</dt>
              <dd>{formatDateTime(song.expires_at)}</dd>
            </>
          )}
          {song.style_prompt && (
            <>
              <dt className="text-muted-foreground">Style</dt>
              <dd className="text-xs break-words">{song.style_prompt}</dd>
            </>
          )}
        </dl>
      </div>
      <div className="space-y-1">
        <p className="text-muted-foreground">Lirik</p>
        <pre className="max-h-96 overflow-auto rounded-md bg-muted p-3 font-sans text-xs whitespace-pre-wrap">
          {song.lyrics || "—"}
        </pre>
      </div>
    </div>
  );
}
