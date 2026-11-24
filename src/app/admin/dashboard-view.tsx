"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRightIcon,
  BadgeDollarSignIcon,
  BotIcon,
  CheckCircle2Icon,
  CircleAlertIcon,
  GaugeIcon,
  ListMusicIcon,
  Loader2Icon,
  MegaphoneIcon,
  Music2Icon,
  RefreshCwIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TargetIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react";
import { errorMessage } from "@/lib/api";
import { adminJobApi, type JobStatsOutput } from "@/lib/admin-job-api";
import { adminSongApi, type SongStatsOutput } from "@/lib/admin-song-api";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type DashboardState =
  | { kind: "loading" }
  | { kind: "ok"; jobs: JobStatsOutput; songs: SongStatsOutput }
  | { kind: "error"; message: string };

const TARGETS = [
  {
    label: "Harga per lagu",
    value: "Rp99.000",
    note: "Model transaksi B2C",
    icon: BadgeDollarSignIcon,
  },
  {
    label: "Kontribusi per order",
    value: "Rp55.020",
    note: "Sesudah biaya variabel & CAC",
    icon: TrendingUpIcon,
  },
  {
    label: "Titik impas",
    value: "364 order",
    note: "Per bulan · sekitar 12/hari",
    icon: GaugeIcon,
  },
  {
    label: "Target bulan ke-12",
    value: "500 order",
    note: "Volume bulanan",
    icon: TargetIcon,
  },
];

const PRIORITIES = [
  {
    title: "Jaga kualitas dan keandalan",
    description:
      "Pantau kegagalan, durasi proses, dan kualitas hasil sebelum lagu sampai ke customer.",
    icon: ShieldCheckIcon,
  },
  {
    title: "Optimalkan biaya produksi",
    description: "Awasi penggunaan provider AI dan jaga biaya produksi sesuai asumsi per order.",
    icon: BotIcon,
  },
  {
    title: "Validasi pertumbuhan",
    description:
      "Gunakan CAC, refund, dan repeat purchase sebagai acuan sebelum memperbesar kanal akuisisi.",
    icon: MegaphoneIcon,
  },
];

const numberFormat = new Intl.NumberFormat("id-ID");

export function DashboardView() {
  const [state, setState] = React.useState<DashboardState>({ kind: "loading" });
  const [refreshing, setRefreshing] = React.useState(false);
  const abortRef = React.useRef<AbortController | null>(null);

  const loadStats = React.useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setRefreshing(true);

    try {
      const [jobs, songs] = await Promise.all([
        adminJobApi.stats(controller.signal),
        adminSongApi.stats(controller.signal),
      ]);
      if (!controller.signal.aborted) setState({ kind: "ok", jobs, songs });
    } catch (error) {
      if (!controller.signal.aborted) {
        setState({
          kind: "error",
          message: errorMessage(error, "Statistik dashboard tidak dapat dimuat."),
        });
      }
    } finally {
      if (!controller.signal.aborted) setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    void loadStats();
    return () => abortRef.current?.abort();
  }, [loadStats]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="relative overflow-hidden rounded-2xl border bg-card">
        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_auto] lg:items-center lg:p-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <SparklesIcon className="size-3.5" aria-hidden />
              Pusat operasi Cerita Lagu
            </div>
            <div className="max-w-2xl">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Pantau platform, jaga kualitas lagu.
              </h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
                Satu tempat untuk memantau produksi, mengelola AI, merawat konten, dan mengikuti
                target pertumbuhan Cerita Lagu.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 min-[420px]:flex-row lg:flex-col">
            <Link href="/admin/jobs" className={buttonVariants({ className: "sm:min-w-40" })}>
              Pantau job
              <ArrowRightIcon aria-hidden />
            </Link>
            <Link
              href="/admin/songs"
              className={buttonVariants({ variant: "outline", className: "sm:min-w-40" })}
            >
              Kelola lagu
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="platform-stats">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 id="platform-stats" className="font-semibold">
              Ringkasan platform
            </h2>
            <p className="text-sm text-muted-foreground">Data operasional saat ini.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadStats()}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2Icon className="animate-spin" aria-hidden />
            ) : (
              <RefreshCwIcon aria-hidden />
            )}
            Muat ulang
          </Button>
        </div>

        {state.kind === "error" ? (
          <Card className="border-destructive/40">
            <CardContent className="flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center">
              <CircleAlertIcon className="size-5 shrink-0 text-destructive" aria-hidden />
              <p className="flex-1 text-sm">{state.message}</p>
              <Button variant="outline" size="sm" onClick={() => void loadStats()}>
                Coba lagi
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard
              label="Lagu tersedia"
              value={state.kind === "ok" ? state.songs.total : undefined}
              description="Hasil produksi selesai"
              icon={Music2Icon}
            />
            <MetricCard
              label="Job aktif"
              value={state.kind === "ok" ? state.jobs.active : undefined}
              description="Antre atau sedang diproses"
              icon={ListMusicIcon}
              highlighted
            />
            <MetricCard
              label="Lagu terbuka"
              value={state.kind === "ok" ? state.songs.unlocked : undefined}
              description="Akses lagu lengkap aktif"
              icon={CheckCircle2Icon}
            />
            <MetricCard
              label="Job gagal"
              value={state.kind === "ok" ? (state.jobs.counts.failed ?? 0) : undefined}
              description="Perlu ditinjau"
              icon={CircleAlertIcon}
            />
          </div>
        )}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Akses cepat</CardTitle>
            <CardDescription>
              Area yang paling sering dipakai untuk operasional harian.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <QuickLink
              href="/admin/jobs"
              icon={ListMusicIcon}
              title="Pantau Job Lagu"
              description="Periksa status, waktu proses, dan error."
            />
            <QuickLink
              href="/admin/providers"
              icon={BotIcon}
              title="Kelola Provider AI"
              description="Atur model, koneksi, dan API key."
            />
            <QuickLink
              href="/admin/prompts"
              icon={SparklesIcon}
              title="Uji Template Prompt"
              description="Kembangkan prompt dan uji di playground."
            />
            <QuickLink
              href="/admin/users"
              icon={UsersIcon}
              title="Kelola Pengguna"
              description="Lihat akun dan akses pengguna."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fokus operasional</CardTitle>
            <CardDescription>
              Prioritas 12 bulan dari fase validasi hingga pertumbuhan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {PRIORITIES.map(({ title, description, icon: Icon }) => (
              <div key={title} className="flex gap-3 rounded-lg p-3 hover:bg-muted/60">
                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-4" aria-hidden />
                </div>
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="business-targets">
        <div className="mb-3">
          <h2 id="business-targets" className="font-semibold">
            Target & unit ekonomi
          </h2>
          <p className="text-sm text-muted-foreground">
            Asumsi proposal bisnis—bukan performa aktual platform.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {TARGETS.map(({ label, value, note, icon: Icon }) => (
            <Card key={label}>
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <Icon className="size-4 shrink-0 text-primary" aria-hidden />
                </div>
                <p className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">{value}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{note}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  highlighted = false,
}: {
  label: string;
  value: number | undefined;
  description: string;
  icon: typeof Music2Icon;
  highlighted?: boolean;
}) {
  return (
    <Card className={cn(highlighted && "border-primary/30 bg-primary/5")}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-muted-foreground">{label}</p>
          <Icon className="size-4 shrink-0 text-primary" aria-hidden />
        </div>
        {value === undefined ? (
          <Skeleton className="mt-3 h-8 w-20" />
        ) : (
          <p className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            {numberFormat.format(value)}
          </p>
        )}
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function QuickLink({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: typeof Music2Icon;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-24 items-start gap-3 rounded-xl border p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
        <Icon className="size-4" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
      </div>
      <ArrowRightIcon
        className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
        aria-hidden
      />
    </Link>
  );
}
