"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  AlertTriangleIcon,
  AudioLinesIcon,
  CheckIcon,
  ClockIcon,
  HeartIcon,
  Loader2Icon,
  LogInIcon,
  PenLineIcon,
  PencilIcon,
  PlusIcon,
  RotateCcwIcon,
  SparklesIcon,
  WandSparklesIcon,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CustomerShell } from "@/components/customer/customer-shell";
import { Equalizer } from "@/components/landing/equalizer";
import { useCustomer } from "@/hooks/use-customer";
import { ApiError } from "@/lib/api";
import { useApiError } from "@/hooks/use-api-error";
import { NEW_SONG_HREF } from "@/lib/questionnaire";
import { questionnaireApi } from "@/lib/questionnaire-api";
import {
  isFinal,
  jobFailureKind,
  loadErrorKind,
  songApi,
  type JobStatus,
  type LoadErrorKind,
  type SongJobOutput,
} from "@/lib/song-api";
import { cn } from "@/lib/utils";

const POLL_MS = 3000;
/** Consecutive failed polls (with backoff, ~1 minute) before showing the load error. */
const MAX_POLL_FAILURES = 8;
const BAR_SEGMENTS = 50;

interface Stage {
  status: JobStatus;
  icon: LucideIcon;
  /** Message key under `job.stages`. */
  key: "lyrics" | "music" | "finishing";
  /** Progress bar range [from, to] in %, and a typical duration used to ease within it. */
  from: number;
  to: number;
  typicalSec: number;
}

/** The three visible pipeline stages (queued shows as "getting ready" before the first). */
const STAGES: Stage[] = [
  {
    status: "generating_lyrics",
    icon: PenLineIcon,
    key: "lyrics",
    from: 5,
    to: 30,
    typicalSec: 25,
  },
  {
    status: "generating_music",
    icon: AudioLinesIcon,
    key: "music",
    from: 30,
    to: 90,
    typicalSec: 100,
  },
  {
    status: "processing_audio",
    icon: WandSparklesIcon,
    key: "finishing",
    from: 90,
    to: 99,
    typicalSec: 10,
  },
];

type JobState =
  | { kind: "loading" }
  | { kind: "ok"; job: SongJobOutput }
  | { kind: "error"; error: LoadErrorKind };

interface JobViewProps {
  jobId: string;
}

/** Generation screen: polls the job until it finishes, then opens the song (PRD §5.2). */
export function JobView({ jobId }: JobViewProps) {
  const t = useTranslations("job");
  const tc = useTranslations("common");
  const { errorText } = useApiError();
  const router = useRouter();
  const [state, setState] = React.useState<JobState>({ kind: "loading" });
  const [retrying, setRetrying] = React.useState(false);
  const [recipient, setRecipient] = React.useState<string>("");

  React.useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let askedName = false;
    let failures = 0;
    let seenJob = false;

    async function poll() {
      try {
        const job = await songApi.getJob(jobId, controller.signal);
        if (controller.signal.aborted) return;
        failures = 0;
        seenJob = true;
        setState({ kind: "ok", job });
        if (!askedName) {
          askedName = true;
          questionnaireApi
            .get(job.questionnaire_id)
            .then((q) => setRecipient(q.recipient_nickname || q.recipient_name))
            .catch(() => undefined); // the name is decoration only
        }
        if (job.status === "completed" && job.song_id) {
          timer = setTimeout(() => router.replace(`/songs/${job.song_id}`), 900);
          return;
        }
        if (!isFinal(job.status)) timer = setTimeout(poll, POLL_MS);
      } catch (err) {
        if (controller.signal.aborted) return;
        // A blip (API restart, network drop, 5xx) must not end the wait: the job keeps
        // running on the worker. Keep the last known progress on screen and retry with
        // backoff; give up only on a definite answer (4xx) or after ~1 minute of failures.
        failures += 1;
        const definite =
          err instanceof ApiError && err.status >= 400 && err.status < 500 && err.status !== 429;
        console.warn("[job-view] poll failed", { jobId, failures, err });
        if (definite || failures >= MAX_POLL_FAILURES || (!seenJob && failures >= 3)) {
          setState({ kind: "error", error: loadErrorKind(err) });
          return;
        }
        timer = setTimeout(poll, Math.min(POLL_MS * 2 ** (failures - 1), 10_000));
      }
    }
    void poll();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [jobId, router]);

  async function regenerate(job: SongJobOutput) {
    setRetrying(true);
    try {
      const next = await songApi.regenerate(job.id);
      router.push(`/jobs/${next.id}`);
    } catch (err) {
      toast.error(
        errorText(err, {
          overrides: {
            TOO_MANY_REQUESTS: t("regenerateErrors.limit"),
            CONFLICT: t("regenerateErrors.processing"),
            SERVICE_UNAVAILABLE: t("regenerateErrors.busy"),
          },
          fallback: t("regenerateFailed"),
        }),
      );
      setRetrying(false);
    }
  }

  return (
    <CustomerShell width="xl" centered>
      {state.kind === "loading" && (
        <div className="space-y-4" aria-busy>
          <Skeleton className="h-48 w-full rounded-3xl" />
          <Skeleton className="h-56 w-full rounded-3xl" />
        </div>
      )}

      {state.kind === "error" && (
        <Notice
          icon={AlertTriangleIcon}
          title={tc(`loadError.${state.error}.title`)}
          message={tc(`loadError.${state.error}.message`)}
        >
          <Link href={NEW_SONG_HREF} className={cn(buttonVariants({ size: "lg" }), "rounded-full")}>
            {t("newSong")}
          </Link>
        </Notice>
      )}

      {state.kind === "ok" && state.job.status === "failed" && (
        <Notice
          icon={AlertTriangleIcon}
          title={t("failedTitle")}
          message={t(`failure.${jobFailureKind(state.job.error_code)}`)}
        >
          {state.job.regenerates_left > 0 && (
            <Button
              size="lg"
              className="rounded-full"
              onClick={() => regenerate(state.job)}
              disabled={retrying}
            >
              {retrying ? (
                <Loader2Icon className="animate-spin" aria-hidden />
              ) : (
                <RotateCcwIcon aria-hidden />
              )}
              {t("tryAgain")}
            </Button>
          )}
          <Link
            href="/create"
            className={cn(buttonVariants({ size: "lg", variant: "outline" }), "rounded-full")}
          >
            <PencilIcon aria-hidden />
            {t("editAnswers")}
          </Link>
          {state.job.regenerates_left <= 0 && (
            <Link
              href={NEW_SONG_HREF}
              className={cn(buttonVariants({ size: "lg", variant: "outline" }), "rounded-full")}
            >
              <PlusIcon aria-hidden />
              {t("newSong")}
            </Link>
          )}
        </Notice>
      )}

      {state.kind === "ok" && state.job.status !== "failed" && (
        <Generating job={state.job} recipient={recipient} />
      )}
    </CustomerShell>
  );
}

// ---- In progress ----

function Generating({ job, recipient }: { job: SongJobOutput; recipient: string }) {
  const t = useTranslations("job");
  const done = job.status === "completed";
  const stageIndex = STAGES.findIndex((s) => s.status === job.status);
  const stage = STAGES[stageIndex];
  const stageSec = useSecondsSince(job.status);
  const elapsed = useElapsed(job.created_at, done);

  // Ease towards the end of the current stage's range; never jumps backwards.
  let percent = done ? 100 : 2;
  if (stage) {
    const eased = 1 - Math.exp(-stageSec / stage.typicalSec);
    percent = stage.from + (stage.to - stage.from) * eased;
  }
  // Every tip of the stage, in order (plain text, read raw from `job.stages.<key>.tips`).
  const tips = stage ? (t.raw(`stages.${stage.key}.tips`) as string[]) : [t("preparingTip")];
  const tip = useRotating(tips, 5000, job.status);

  return (
    <div className="space-y-6">
      <section className="relative">
        <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-linear-to-br from-primary/25 to-highlight/25 blur-2xl" />
        <div className="overflow-hidden rounded-3xl border bg-card shadow-2xl">
          <div className="relative bg-linear-to-br from-primary to-highlight p-6 text-primary-foreground sm:p-8">
            <HeartIcon
              className="absolute top-6 right-6 size-10 fill-current opacity-25 motion-safe:animate-pulse"
              aria-hidden
            />
            <p className="text-xs font-medium tracking-widest uppercase opacity-80">
              {done ? t("eyebrowDone") : t("eyebrowRunning")}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-balance sm:text-3xl">
              {recipient ? t("titleFor", { name: recipient }) : t("titleDefault")}
            </h1>
            <p className="mt-1 min-h-5 text-sm opacity-85" aria-live="polite">
              {done ? t("opening") : t(`status.${job.status}`)}
            </p>
            <Equalizer tone="inverse" className="mt-6 h-12" />
          </div>

          <div className="space-y-3 p-6 sm:px-8">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <ClockIcon className="size-3.5" aria-hidden />
                <span className="tabular-nums">{formatElapsed(elapsed)}</span>
              </span>
              <span className="tabular-nums">{Math.floor(percent)}%</span>
            </div>
            {/* Gradient underneath; unfilled segments are covered with the muted colour (no inline style). */}
            <div
              className="relative h-2.5 overflow-hidden rounded-full bg-linear-to-r from-primary to-highlight"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.floor(percent)}
              aria-label={t("progressAria")}
            >
              <div className="absolute inset-0 flex">
                {Array.from({ length: BAR_SEGMENTS }, (_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-full flex-1 transition-colors duration-700",
                      i < Math.round((percent / 100) * BAR_SEGMENTS)
                        ? "bg-transparent"
                        : "bg-muted",
                    )}
                  />
                ))}
              </div>
              {!done && (
                <span className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent motion-safe:animate-shimmer" />
              )}
            </div>
            <p
              key={tip}
              className="min-h-5 text-sm text-muted-foreground motion-safe:animate-in motion-safe:fade-in"
            >
              {done ? t("doneTip") : tip}
            </p>
          </div>
        </div>
      </section>

      <ol className="space-y-2 rounded-3xl border bg-card/80 p-4 shadow-xl shadow-primary/5 backdrop-blur sm:p-5">
        {STAGES.map((s, i) => {
          const isDone = done || stageIndex > i;
          const active = !done && stageIndex === i;
          const Icon = s.icon;
          return (
            <li
              key={s.status}
              className={cn(
                "flex items-center gap-4 rounded-2xl p-3 transition-colors",
                active && "bg-primary/5",
              )}
              aria-current={active ? "step" : undefined}
            >
              <span
                className={cn(
                  "relative flex size-11 shrink-0 items-center justify-center rounded-xl border transition-colors",
                  isDone && "border-transparent bg-primary text-primary-foreground",
                  active &&
                    "border-transparent bg-linear-to-br from-primary to-highlight text-primary-foreground shadow-lg shadow-primary/25",
                  !isDone && !active && "text-muted-foreground",
                )}
              >
                {isDone ? (
                  <CheckIcon className="size-5" aria-hidden />
                ) : (
                  <Icon className="size-5" aria-hidden />
                )}
                {active && (
                  <span className="absolute inset-0 rounded-xl ring-2 ring-primary/40 motion-safe:animate-ping" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn("font-medium", !isDone && !active && "text-muted-foreground")}>
                  {t(`stages.${s.key}.label`)}
                </p>
                <p className="text-sm text-muted-foreground">{t(`stages.${s.key}.detail`)}</p>
              </div>
              <span className="shrink-0 text-xs font-medium">
                {isDone ? (
                  <span className="text-primary">{t("stageDone")}</span>
                ) : active ? (
                  <Loader2Icon
                    className="size-4 animate-spin text-primary"
                    aria-label={t("stageRunning")}
                  />
                ) : (
                  <span className="text-muted-foreground">{t("stageWaiting")}</span>
                )}
              </span>
            </li>
          );
        })}
      </ol>

      <SaveHint jobId={job.id} />
    </div>
  );
}

/** "You may close this page" + a sign-in nudge so the song is tied to their account. */
function SaveHint({ jobId }: { jobId: string }) {
  const t = useTranslations("job");
  const { state } = useCustomer();
  return (
    <div className="flex flex-col items-center gap-3 text-center text-sm text-muted-foreground">
      <p className="text-pretty">{t("saveHint")}</p>
      {state.kind === "signed-out" && (
        <Link
          href={`/login?next=${encodeURIComponent(`/jobs/${jobId}`)}`}
          className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
        >
          <LogInIcon className="size-4" aria-hidden />
          {t("signInHint")}
        </Link>
      )}
    </div>
  );
}

function Notice({
  icon: Icon,
  title,
  message,
  children,
}: {
  icon: LucideIcon;
  title: string;
  message: string;
  children: React.ReactNode;
}) {
  const t = useTranslations("job");
  return (
    <div className="space-y-6 rounded-3xl border bg-card/80 p-6 text-center shadow-xl shadow-primary/5 backdrop-blur sm:p-8">
      <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <Icon className="size-7" aria-hidden />
      </span>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-balance">{title}</h1>
        <p className="text-pretty text-muted-foreground">{message}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">{children}</div>
      <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <SparklesIcon className="size-3.5" aria-hidden />
        {t("answersKept")}
      </p>
    </div>
  );
}

// ---- Hooks & helpers ----

/** Seconds since `key` last changed (restarts when the job moves to a new stage). */
function useSecondsSince(key: string): number {
  const [since, setSince] = React.useState(() => Date.now());
  const [now, setNow] = React.useState(() => Date.now());
  const [prevKey, setPrevKey] = React.useState(key);
  if (key !== prevKey) {
    setPrevKey(key);
    setSince(Date.now());
  }
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return Math.max(0, (now - since) / 1000);
}

/** Whole seconds since `iso`, ticking until `stopped`. */
function useElapsed(iso: string, stopped: boolean): number {
  const start = React.useMemo(() => new Date(iso).getTime(), [iso]);
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    if (stopped) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [stopped]);
  return Number.isFinite(start) ? Math.max(0, Math.floor((now - start) / 1000)) : 0;
}

/** Cycles through items every `ms`, restarting at the first when `resetKey` changes. */
function useRotating(items: string[], ms: number, resetKey: string): string {
  const [i, setI] = React.useState(0);
  const [prevKey, setPrevKey] = React.useState(resetKey);
  if (resetKey !== prevKey) {
    setPrevKey(resetKey);
    setI(0);
  }
  React.useEffect(() => {
    const id = setInterval(() => setI((x) => x + 1), ms);
    return () => clearInterval(id);
  }, [ms, resetKey]);
  return items[i % items.length] ?? "";
}

function formatElapsed(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
