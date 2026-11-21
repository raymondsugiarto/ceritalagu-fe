"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  Loader2Icon,
  MusicIcon,
  PencilIcon,
  PlusIcon,
  RotateCcwIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { CustomerShell } from "@/components/customer/customer-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiError } from "@/hooks/use-api-error";
import { NEW_SONG_HREF, labelOf } from "@/lib/questionnaire";
import { useQuestionnaireOptions } from "@/hooks/use-questionnaire-options";
import { loadErrorKind, songApi, type LoadErrorKind, type SongOutput } from "@/lib/song-api";
import { paymentApi, type OrderOutput, type PricingOutput } from "@/lib/payment-api";
import { cn } from "@/lib/utils";
import { LyricsCard } from "./lyrics-card";
import { SongPlayer } from "./song-player";
import { UnlockPanel } from "./unlock-panel";

/** After DOKU sends the buyer back, poll the order until DOKU confirms (≈1 minute). */
const ORDER_POLL_MS = 3000;
const ORDER_POLL_TRIES = 20;

type PaymentState =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "paid" }
  | { kind: "unpaid"; order: OrderOutput };

type SongState =
  { kind: "loading" } | { kind: "ok"; song: SongOutput } | { kind: "error"; error: LoadErrorKind };

interface SongViewProps {
  songId: string;
  /** Order the buyer just paid (or abandoned) on DOKU. */
  orderId?: string;
}

/** Result page: preview up to the end of the first chorus, lyrics up to the first chorus, unlock CTA (PRD §5.3). */
export function SongView({ songId, orderId }: SongViewProps) {
  const t = useTranslations("song");
  const tc = useTranslations("common");
  const tJob = useTranslations("job");
  const { errorText } = useApiError();
  // Latest texts for the effects below without re-running them on identity changes.
  const text = React.useRef({ t, errorText });
  React.useEffect(() => {
    text.current = { t, errorText };
  });
  const router = useRouter();
  const [state, setState] = React.useState<SongState>({ kind: "loading" });
  const [regenerating, setRegenerating] = React.useState(false);
  /** "Buat Ulang" left for this song (null until the job is loaded). */
  const [regeneratesLeft, setRegeneratesLeft] = React.useState<number | null>(null);
  const [pricing, setPricing] = React.useState<PricingOutput | null>(null);
  const [payment, setPayment] = React.useState<PaymentState>(
    orderId ? { kind: "checking" } : { kind: "idle" },
  );
  const [bannerDismissed, setBannerDismissed] = React.useState(false);
  const [reloadKey, setReloadKey] = React.useState(0);
  const [pollKey, setPollKey] = React.useState(0);
  const { state: options } = useQuestionnaireOptions();
  // Genre name from master data; the code is shown until the options arrive (or if it was archived).
  const genres = options.kind === "ok" ? options.options.genres : [];
  const moods = options.kind === "ok" ? options.options.moods : [];

  React.useEffect(() => {
    const controller = new AbortController();
    songApi
      .getSong(songId, controller.signal)
      .then((song) => !controller.signal.aborted && setState({ kind: "ok", song }))
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setState({ kind: "error", error: loadErrorKind(err) });
        }
      });
    return () => controller.abort();
  }, [songId, reloadKey]);

  const jobId = state.kind === "ok" ? state.song.job_id : "";
  React.useEffect(() => {
    if (!jobId) return;
    const controller = new AbortController();
    songApi.getJob(jobId, controller.signal).then(
      (job) => !controller.signal.aborted && setRegeneratesLeft(job.regenerates_left),
      () => {},
    );
    return () => controller.abort();
  }, [jobId]);

  React.useEffect(() => {
    const controller = new AbortController();
    paymentApi.pricing(controller.signal).then(setPricing, () => {});
    return () => controller.abort();
  }, []);

  // Back from DOKU: wait for the payment to be confirmed, then reload the (now unlocked) song.
  React.useEffect(() => {
    if (!orderId) return;
    const controller = new AbortController();
    let tries = 0;
    let timer: number | undefined;
    const poll = async () => {
      tries++;
      try {
        const order = await paymentApi.getOrder(orderId, controller.signal);
        if (controller.signal.aborted) return;
        if (order.status === "paid") {
          setPayment({ kind: "paid" });
          setReloadKey((k) => k + 1);
          toast.success(text.current.t("paymentSuccessToast"));
          router.replace(`/songs/${songId}`, { scroll: false });
          return;
        }
        if (order.status !== "pending" || tries >= ORDER_POLL_TRIES) {
          setPayment({ kind: "unpaid", order });
          return;
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        if (tries >= ORDER_POLL_TRIES) {
          setPayment({ kind: "idle" });
          toast.error(
            text.current.errorText(err, { fallback: text.current.t("paymentCheckFailed") }),
          );
          return;
        }
      }
      timer = window.setTimeout(poll, ORDER_POLL_MS);
    };
    void poll();
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [orderId, songId, router, pollKey]);

  async function regenerate(jobId: string) {
    setRegenerating(true);
    try {
      const job = await songApi.regenerate(jobId);
      router.push(`/jobs/${job.id}`);
    } catch (err) {
      toast.error(
        errorText(err, {
          overrides: {
            TOO_MANY_REQUESTS: tJob("regenerateErrors.limit"),
            CONFLICT: tJob("regenerateErrors.processing"),
            SERVICE_UNAVAILABLE: tJob("regenerateErrors.busy"),
          },
          fallback: tJob("regenerateFailed"),
        }),
      );
      setRegenerating(false);
    }
  }

  if (state.kind === "loading") {
    return (
      <CustomerShell>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,26rem)_1fr]">
          <Skeleton className="h-[26rem] w-full rounded-3xl" />
          <Skeleton className="h-96 w-full rounded-3xl" />
        </div>
      </CustomerShell>
    );
  }

  if (state.kind === "error") {
    return (
      <CustomerShell width="md" centered>
        <div className="rounded-3xl border bg-card p-8 text-center shadow-xl">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-highlight text-primary-foreground">
            <MusicIcon className="size-7" aria-hidden />
          </span>
          <h1 className="mt-5 text-xl font-semibold">{tc(`loadError.${state.error}.title`)}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {tc(`loadError.${state.error}.message`)}
          </p>
          <Link
            href={NEW_SONG_HREF}
            className={cn(
              buttonVariants({ size: "lg" }),
              "mt-6 h-12 rounded-full px-7 shadow-lg shadow-primary/25",
            )}
          >
            {t("newSong")}
            <ArrowRightIcon aria-hidden />
          </Link>
        </div>
      </CustomerShell>
    );
  }

  const { song } = state;
  const meta = [
    labelOf(genres, song.genre),
    song.vocal_gender === "male" || song.vocal_gender === "female"
      ? tc(`voiceTags.${song.vocal_gender}`)
      : null,
    song.mood ? labelOf(moods, song.mood) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <CustomerShell>
      {payment.kind === "paid" && song.is_unlocked && !bannerDismissed && (
        <div
          role="status"
          className="relative mb-6 flex items-center gap-4 overflow-hidden rounded-3xl border border-success/30 bg-linear-to-r from-success/15 via-success/10 to-primary/10 p-4 pr-12 shadow-sm motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 sm:p-5 sm:pr-14 lg:mb-8"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-success text-white shadow-md shadow-success/30 sm:size-12">
            <CheckCircle2Icon className="size-6" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-foreground sm:text-lg">{t("paidBanner.title")}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{t("paidBanner.body")}</p>
          </div>
          <button
            type="button"
            onClick={() => setBannerDismissed(true)}
            aria-label={t("paidBanner.dismiss")}
            className="absolute top-3 right-3 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            <XIcon className="size-4" aria-hidden />
          </button>
        </div>
      )}

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,26rem)_1fr] lg:gap-10">
        <div className="space-y-6 lg:sticky lg:top-24">
          <SongPlayer
            title={song.title}
            meta={meta}
            src={song.audio_url ?? song.preview_url}
            full={!!song.audio_url}
            durationHint={song.audio_url ? song.duration_sec : song.preview_duration_sec}
            fullDurationSec={song.duration_sec}
            downloadUrl={song.audio_url ? `${song.audio_url}?download=1` : undefined}
          />

          {!song.is_unlocked && payment.kind === "checking" && (
            <div className="flex items-center gap-3 rounded-2xl border bg-card p-4 text-sm shadow-sm">
              <Loader2Icon className="size-5 shrink-0 animate-spin text-primary" aria-hidden />
              {t("waitingDoku")}
            </div>
          )}

          {!song.is_unlocked && payment.kind === "unpaid" && (
            <div className="space-y-3 rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm">
              <p>
                {payment.order.status === "pending"
                  ? t("unpaid.pending")
                  : payment.order.status === "expired"
                    ? t("unpaid.expired")
                    : t("unpaid.failed")}
              </p>
              <div className="flex flex-wrap gap-2">
                {payment.order.status === "pending" && payment.order.payment_url && (
                  <a
                    href={payment.order.payment_url}
                    className={cn(buttonVariants({ size: "sm" }), "rounded-full")}
                  >
                    {t("continuePayment")}
                  </a>
                )}
                {payment.order.status === "pending" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => {
                      setPayment({ kind: "checking" });
                      setPollKey((k) => k + 1);
                    }}
                  >
                    {t("checkAgain")}
                  </Button>
                )}
              </div>
            </div>
          )}

          {!song.is_unlocked && payment.kind !== "checking" && (
            <UnlockPanel songId={songId} pricing={pricing} />
          )}
        </div>

        <div className="space-y-6">
          <LyricsCard
            lyrics={song.is_unlocked && song.lyrics ? song.lyrics : song.lyrics_preview}
            locked={!song.is_unlocked}
          />

          <section className="rounded-3xl border bg-card/80 p-6 shadow-sm backdrop-blur-sm">
            <h2 className="font-semibold">{t("notQuite")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {regeneratesLeft === 0 ? t("regenExhausted") : t("regenOptions")}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {regeneratesLeft !== 0 && (
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => regenerate(song.job_id)}
                  disabled={regenerating}
                >
                  {regenerating ? (
                    <Loader2Icon className="animate-spin" aria-hidden />
                  ) : (
                    <RotateCcwIcon aria-hidden />
                  )}
                  {regeneratesLeft !== null
                    ? t("regenerateLeft", { count: regeneratesLeft })
                    : t("regenerate")}
                </Button>
              )}
              <Link
                href="/create"
                className={cn(buttonVariants({ variant: "outline" }), "rounded-full")}
              >
                <PencilIcon aria-hidden />
                {t("editAnswers")}
              </Link>
              <Link
                href={NEW_SONG_HREF}
                className={cn(
                  buttonVariants({ variant: regeneratesLeft === 0 ? "default" : "outline" }),
                  "rounded-full",
                )}
              >
                <PlusIcon aria-hidden />
                {t("newSongCta")}
              </Link>
            </div>
          </section>
        </div>
      </div>
    </CustomerShell>
  );
}
