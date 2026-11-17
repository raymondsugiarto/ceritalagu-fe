"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2Icon,
  DownloadIcon,
  Loader2Icon,
  LockIcon,
  PencilIcon,
  PlusIcon,
  RotateCcwIcon,
  SparklesIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { errorMessage } from "@/lib/api";
import { NEW_SONG_HREF, VOICES, labelOf } from "@/lib/questionnaire";
import { useQuestionnaireOptions } from "@/hooks/use-questionnaire-options";
import { loadErrorText, songApi, type SongOutput } from "@/lib/song-api";
import { formatIDR, paymentApi, type OrderOutput, type PricingOutput } from "@/lib/payment-api";

/** After DOKU sends the buyer back, poll the order until DOKU confirms (≈1 minute). */
const ORDER_POLL_MS = 3000;
const ORDER_POLL_TRIES = 20;

type PaymentState =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "paid" }
  | { kind: "unpaid"; order: OrderOutput };

type SongState =
  | { kind: "loading" }
  | { kind: "ok"; song: SongOutput }
  | { kind: "error"; title: string; message: string };

interface SongViewProps {
  songId: string;
  /** Order the buyer just paid (or abandoned) on DOKU. */
  orderId?: string;
}

/** Result page: preview up to the end of the first chorus, lyrics up to the first chorus, unlock CTA (PRD §5.3). */
export function SongView({ songId, orderId }: SongViewProps) {
  const router = useRouter();
  const [state, setState] = React.useState<SongState>({ kind: "loading" });
  const [regenerating, setRegenerating] = React.useState(false);
  /** "Buat Ulang" left for this song (null until the job is loaded). */
  const [regeneratesLeft, setRegeneratesLeft] = React.useState<number | null>(null);
  const [pricing, setPricing] = React.useState<PricingOutput | null>(null);
  const [checkingOut, setCheckingOut] = React.useState(false);
  const [payment, setPayment] = React.useState<PaymentState>(
    orderId ? { kind: "checking" } : { kind: "idle" },
  );
  const [reloadKey, setReloadKey] = React.useState(0);
  const [pollKey, setPollKey] = React.useState(0);
  const { state: options } = useQuestionnaireOptions();
  // Genre name from master data; the code is shown until the options arrive (or if it was archived).
  const genres = options.kind === "ok" ? options.options.genres : [];

  React.useEffect(() => {
    const controller = new AbortController();
    songApi
      .getSong(songId, controller.signal)
      .then((song) => !controller.signal.aborted && setState({ kind: "ok", song }))
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setState({ kind: "error", ...loadErrorText(err) });
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
          toast.success("Pembayaran berhasil! Lagu lengkapmu sudah terbuka.");
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
          toast.error(errorMessage(err, "Status pembayaran tidak bisa dicek."));
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

  async function unlock() {
    setCheckingOut(true);
    try {
      const out = await paymentApi.checkout(songId);
      window.location.assign(out.payment_url);
    } catch (err) {
      toast.error(errorMessage(err, "Halaman pembayaran tidak bisa dibuka."));
      setCheckingOut(false);
    }
  }

  async function regenerate(jobId: string) {
    setRegenerating(true);
    try {
      const job = await songApi.regenerate(jobId);
      router.push(`/jobs/${job.id}`);
    } catch (err) {
      toast.error(errorMessage(err, "Gagal membuat ulang lagu."));
      setRegenerating(false);
    }
  }

  if (state.kind === "loading") {
    return (
      <main className="mx-auto max-w-xl space-y-4 px-4 py-10">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-48 w-full" />
      </main>
    );
  }

  if (state.kind === "error") {
    return (
      <main className="mx-auto max-w-xl px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>{state.title}</CardTitle>
            <CardDescription>{state.message}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={NEW_SONG_HREF} className={buttonVariants()}>
              Buat lagu baru
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  const { song } = state;
  return (
    <main className="mx-auto max-w-xl space-y-6 px-4 py-8 md:py-12">
      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">
          {labelOf(genres, song.genre)} · {labelOf(VOICES, song.vocal_gender)}
        </p>
        <h1 className="text-2xl font-semibold md:text-3xl">{song.title}</h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {song.audio_url ? "Lagu lengkap" : `Preview ${song.preview_duration_sec} detik`}
          </CardTitle>
          <CardDescription>
            {song.audio_url
              ? `Durasi sekitar ${Math.round(song.duration_sec / 60)} menit.`
              : `Lagu lengkap berdurasi sekitar ${Math.round(song.duration_sec / 60)} menit.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <audio
            key={song.audio_url ?? song.preview_url}
            controls
            preload="metadata"
            src={song.audio_url ?? song.preview_url}
            className="w-full"
          >
            Browsermu tidak mendukung pemutar audio.
          </audio>
          {song.audio_url && (
            <a
              href={`${song.audio_url}?download=1`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <DownloadIcon aria-hidden />
              Unduh MP3
            </a>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lirik</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed whitespace-pre-line">
            {song.is_unlocked && song.lyrics ? song.lyrics : song.lyrics_preview}
          </p>
          {!song.is_unlocked && (
            <div className="relative overflow-hidden rounded-md border bg-muted/40 p-4">
              <div aria-hidden className="space-y-2 blur-sm select-none">
                <div className="h-3 w-4/5 rounded bg-muted-foreground/30" />
                <div className="h-3 w-3/5 rounded bg-muted-foreground/30" />
                <div className="h-3 w-2/3 rounded bg-muted-foreground/30" />
                <div className="h-3 w-1/2 rounded bg-muted-foreground/30" />
              </div>
              <p className="absolute inset-0 flex items-center justify-center gap-2 text-sm font-medium">
                <LockIcon className="size-4" aria-hidden />
                Lirik lengkap tersedia di full lagu
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {payment.kind === "paid" && song.is_unlocked && (
        <div className="flex items-center gap-2 rounded-md bg-success/10 p-3 text-sm text-success">
          <CheckCircle2Icon className="size-4" aria-hidden />
          Pembayaran berhasil. Selamat menikmati lagu lengkapmu!
        </div>
      )}

      {!song.is_unlocked && payment.kind === "checking" && (
        <div className="flex items-center gap-2 rounded-md border p-4 text-sm">
          <Loader2Icon className="size-4 animate-spin" aria-hidden />
          Menunggu konfirmasi pembayaran dari DOKU…
        </div>
      )}

      {!song.is_unlocked && payment.kind === "unpaid" && (
        <div className="space-y-3 rounded-md border p-4 text-sm">
          <p>
            {payment.order.status === "pending"
              ? "Pembayaranmu belum terkonfirmasi. Kalau sudah bayar, tunggu sebentar lalu cek lagi."
              : payment.order.status === "expired"
                ? "Waktu pembayaran sudah habis. Silakan buat pembayaran baru."
                : "Pembayaran gagal. Silakan coba lagi."}
          </p>
          <div className="flex flex-wrap gap-2">
            {payment.order.status === "pending" && payment.order.payment_url && (
              <a href={payment.order.payment_url} className={buttonVariants({ size: "sm" })}>
                Lanjutkan pembayaran
              </a>
            )}
            {payment.order.status === "pending" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setPayment({ kind: "checking" });
                  setPollKey((k) => k + 1);
                }}
              >
                Cek lagi
              </Button>
            )}
          </div>
        </div>
      )}

      {!song.is_unlocked && payment.kind !== "checking" && (
        <div className="space-y-2">
          <Button
            size="lg"
            className="w-full"
            onClick={unlock}
            disabled={checkingOut || pricing?.enabled === false}
          >
            {checkingOut ? (
              <Loader2Icon className="animate-spin" aria-hidden />
            ) : (
              <SparklesIcon aria-hidden />
            )}
            Dapatkan Full Lagu{pricing ? ` · ${formatIDR(pricing.unlock_price)}` : ""}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            {pricing?.enabled === false
              ? "Pembayaran belum tersedia saat ini."
              : "Bayar aman lewat DOKU: QRIS, e-wallet, virtual account, atau kartu."}
          </p>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex flex-wrap gap-3">
          {regeneratesLeft !== 0 && (
            <Button
              variant="outline"
              onClick={() => regenerate(song.job_id)}
              disabled={regenerating}
            >
              {regenerating ? (
                <Loader2Icon className="animate-spin" aria-hidden />
              ) : (
                <RotateCcwIcon aria-hidden />
              )}
              Buat Ulang{regeneratesLeft !== null ? ` (sisa ${regeneratesLeft})` : ""}
            </Button>
          )}
          <Link href="/create" className={buttonVariants({ variant: "outline" })}>
            <PencilIcon aria-hidden />
            Ubah Jawaban
          </Link>
          <Link
            href={NEW_SONG_HREF}
            className={buttonVariants({ variant: regeneratesLeft === 0 ? "default" : "outline" })}
          >
            <PlusIcon aria-hidden />
            Buat Lagu Baru
          </Link>
        </div>
        {regeneratesLeft === 0 && (
          <p className="text-xs text-muted-foreground">
            Jatah buat ulang lagu ini sudah habis. Buat lagu baru dengan jawaban berbeda.
          </p>
        )}
      </div>
    </main>
  );
}
