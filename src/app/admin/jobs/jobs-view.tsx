"use client";

import * as React from "react";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ListMusicIcon,
  Loader2Icon,
  RefreshCwIcon,
  SearchIcon,
} from "lucide-react";
import { errorMessage, type PaginationOutput } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import {
  adminJobApi,
  formatDuration,
  type AdminJobOutput,
  type JobFilter,
  type JobStatsOutput,
} from "@/lib/admin-job-api";
import type { JobStatus } from "@/lib/song-api";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Button } from "@/components/ui/button";
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

const PAGE_SIZE = 20;
/** Running jobs change every few seconds; refresh while the page is open. */
const REFRESH_MS = 5000;

const FILTERS: { value: JobFilter; label: string }[] = [
  { value: "active", label: "Berjalan" },
  { value: "failed", label: "Gagal" },
  { value: "completed", label: "Selesai" },
  { value: "all", label: "Semua" },
];

const STATUS_LABEL: Record<JobStatus, string> = {
  queued: "Antre",
  generating_lyrics: "Lirik",
  generating_music: "Musik",
  processing_audio: "Audio",
  completed: "Selesai",
  failed: "Gagal",
};

const STATUS_CLASS: Record<JobStatus, string> = {
  queued: "bg-muted text-muted-foreground",
  generating_lyrics: "bg-primary/15 text-primary",
  generating_music: "bg-primary/15 text-primary",
  processing_audio: "bg-primary/15 text-primary",
  completed: "bg-success/15 text-success",
  failed: "bg-destructive/15 text-destructive",
};

type ListState =
  | { kind: "loading" }
  | { kind: "ok"; items: AdminJobOutput[]; pagination: PaginationOutput }
  | { kind: "error"; message: string };

export function JobsView() {
  const [filter, setFilter] = React.useState<JobFilter>("active");
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const [page, setPage] = React.useState(1);
  const [state, setState] = React.useState<ListState>({ kind: "loading" });
  const [stats, setStats] = React.useState<JobStatsOutput | null>(null);
  const [autoRefresh, setAutoRefresh] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  React.useEffect(() => setPage(1), [debouncedSearch, filter]);

  const abortRef = React.useRef<AbortController | null>(null);
  const fetchAll = React.useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setRefreshing(true);
    try {
      const [list, st] = await Promise.all([
        adminJobApi.list(
          { page, page_size: PAGE_SIZE, filter, search: debouncedSearch },
          ctrl.signal,
        ),
        adminJobApi.stats(ctrl.signal),
      ]);
      if (ctrl.signal.aborted) return;
      setState({ kind: "ok", items: list.items, pagination: list.pagination });
      setStats(st);
    } catch (err) {
      if (ctrl.signal.aborted) return;
      setState({ kind: "error", message: errorMessage(err, "Could not load jobs.") });
    } finally {
      if (!ctrl.signal.aborted) setRefreshing(false);
    }
  }, [page, filter, debouncedSearch]);

  React.useEffect(() => {
    setState({ kind: "loading" });
    void fetchAll();
    return () => abortRef.current?.abort();
  }, [fetchAll]);

  React.useEffect(() => {
    if (!autoRefresh) return;
    const t = window.setInterval(() => {
      if (document.visibilityState === "visible") void fetchAll();
    }, REFRESH_MS);
    return () => window.clearInterval(t);
  }, [autoRefresh, fetchAll]);

  const pagination = state.kind === "ok" ? state.pagination : null;

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Song Jobs</h1>
        <p className="text-sm text-muted-foreground">
          Job generate lagu: status, provider, durasi tiap tahap dan error.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Sedang berjalan" value={stats?.active} highlight />
        <StatTile label="Antre" value={stats ? (stats.counts.queued ?? 0) : undefined} />
        <StatTile label="Selesai" value={stats ? (stats.counts.completed ?? 0) : undefined} />
        <StatTile label="Gagal" value={stats ? (stats.counts.failed ?? 0) : undefined} />
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle>Daftar job</CardTitle>
            <CardDescription>
              {pagination ? `${pagination.total_items} job` : "Memuat…"}
              {autoRefresh ? " · diperbarui otomatis tiap 5 detik" : ""}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              Auto refresh
            </label>
            <Button variant="outline" size="sm" onClick={() => void fetchAll()}>
              {refreshing ? (
                <Loader2Icon className="animate-spin" aria-hidden />
              ) : (
                <RefreshCwIcon aria-hidden />
              )}
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-md border p-0.5" role="tablist">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  role="tab"
                  aria-selected={filter === f.value}
                  onClick={() => setFilter(f.value)}
                  className={cn(
                    "rounded px-3 py-1 text-sm",
                    filter === f.value
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
                placeholder="Job ID, email, judul lagu…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search jobs"
              />
            </div>
          </div>

          <JobsTable state={state} />

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
              highlight && value > 0 && "text-primary",
            )}
          >
            {value}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function JobsTable({ state }: { state: ListState }) {
  const [open, setOpen] = React.useState<string | null>(null);

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
          <ListMusicIcon className="size-6 text-primary" aria-hidden />
        </span>
        <p className="text-sm text-muted-foreground">Tidak ada job di filter ini.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-px" />
          <TableHead>Status</TableHead>
          <TableHead>Lagu / Customer</TableHead>
          <TableHead>Provider</TableHead>
          <TableHead>Durasi</TableHead>
          <TableHead>Dibuat</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {state.items.map((j) => {
          const expanded = open === j.id;
          return (
            <React.Fragment key={j.id}>
              <TableRow className="cursor-pointer" onClick={() => setOpen(expanded ? null : j.id)}>
                <TableCell>
                  <ChevronDownIcon
                    className={cn("size-4 transition-transform", !expanded && "-rotate-90")}
                    aria-hidden
                  />
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                      STATUS_CLASS[j.status],
                    )}
                  >
                    {!["completed", "failed", "queued"].includes(j.status) && (
                      <Loader2Icon className="size-3 animate-spin" aria-hidden />
                    )}
                    {STATUS_LABEL[j.status] ?? j.status}
                  </span>
                  {j.regenerate_of_job_id && (
                    <span className="ml-1 text-xs text-muted-foreground">ulang</span>
                  )}
                </TableCell>
                <TableCell>
                  <p className="font-medium">{j.song_title || "—"}</p>
                  <p className="text-xs text-muted-foreground">{j.user_email || "guest"}</p>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  <p>{j.lyrics_provider || "—"}</p>
                  <p>{j.music_provider || "—"}</p>
                </TableCell>
                <TableCell className="tabular-nums">{formatDuration(j.elapsed_ms)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDateTime(j.created_at)}
                </TableCell>
              </TableRow>
              {expanded && (
                <TableRow className="hover:bg-transparent">
                  <TableCell />
                  <TableCell colSpan={5}>
                    <JobDetail job={j} />
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          );
        })}
      </TableBody>
    </Table>
  );
}

function JobDetail({ job }: { job: AdminJobOutput }) {
  const timings = Object.entries(job.timings);
  return (
    <div className="grid gap-4 py-2 text-sm md:grid-cols-2">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        <dt className="text-muted-foreground">Job ID</dt>
        <dd className="font-mono text-xs break-all">{job.id}</dd>
        <dt className="text-muted-foreground">Attempt</dt>
        <dd>{job.attempt}</dd>
        <dt className="text-muted-foreground">Mulai</dt>
        <dd>{job.started_at ? formatDateTime(job.started_at) : "—"}</dd>
        <dt className="text-muted-foreground">Selesai</dt>
        <dd>{job.finished_at ? formatDateTime(job.finished_at) : "—"}</dd>
        {job.song_id && (
          <>
            <dt className="text-muted-foreground">Song ID</dt>
            <dd className="font-mono text-xs break-all">{job.song_id}</dd>
          </>
        )}
      </dl>
      <div className="space-y-2">
        <p className="text-muted-foreground">Durasi per tahap</p>
        {timings.length === 0 ? (
          <p className="text-xs text-muted-foreground">Belum ada.</p>
        ) : (
          <ul className="space-y-0.5">
            {timings.map(([step, ms]) => (
              <li key={step} className="flex justify-between gap-4 font-mono text-xs">
                <span>{step}</span>
                <span className="tabular-nums">{formatDuration(ms)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {job.status === "failed" && (
        <div className="rounded-md bg-destructive/10 p-3 text-xs text-destructive md:col-span-2">
          <p className="font-semibold">{job.error_code || "error"}</p>
          {job.error_message && (
            <p className="mt-1 break-words whitespace-pre-wrap">{job.error_message}</p>
          )}
        </div>
      )}
    </div>
  );
}
