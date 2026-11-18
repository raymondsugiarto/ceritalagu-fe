"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { DownloadIcon, HeartIcon, PauseIcon, PlayIcon, RotateCcwIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Equalizer } from "@/components/landing/equalizer";
import { formatClock } from "@/lib/lyrics";
import { cn } from "@/lib/utils";

interface SongPlayerProps {
  title: string;
  /** "Pop · Suara wanita · Haru" */
  meta: string;
  src: string;
  /** Full song (unlocked) or the free preview. */
  full: boolean;
  /** Expected length, shown until the audio metadata loads. */
  durationHint: number;
  /** Shown on preview: how long the full song is. */
  fullDurationSec: number;
  downloadUrl?: string;
}

/** Player card in the landing page style: gradient cover, big play button, gradient progress. */
export function SongPlayer({
  title,
  meta,
  src,
  full,
  durationHint,
  fullDurationSec,
  downloadUrl,
}: SongPlayerProps) {
  const t = useTranslations("song.player");
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = React.useState(false);
  const [time, setTime] = React.useState(0);
  const [duration, setDuration] = React.useState(durationHint);
  const [ended, setEnded] = React.useState(false);

  // New source (preview → full song after paying): start over.
  React.useEffect(() => {
    setPlaying(false);
    setTime(0);
    setEnded(false);
    setDuration(durationHint);
  }, [src, durationHint]);

  function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) void a.play().catch(() => setPlaying(false));
    else a.pause();
  }

  function seek(e: React.ChangeEvent<HTMLInputElement>) {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Number(e.target.value);
    setTime(a.currentTime);
  }

  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute -inset-3 -z-10 rounded-[2rem] bg-linear-to-br from-primary/25 to-highlight/25 blur-2xl"
      />
      <div className="overflow-hidden rounded-3xl border bg-card shadow-2xl">
        <div className="relative flex min-h-48 items-end overflow-hidden bg-linear-to-br from-primary to-highlight p-6 text-primary-foreground">
          <HeartIcon
            aria-hidden
            className="absolute -top-4 -right-4 size-32 rotate-12 fill-current opacity-15"
          />
          <Equalizer
            bars={7}
            tone="inverse"
            paused={!playing}
            className="absolute top-6 left-6 h-6 opacity-80"
          />
          <div className="relative min-w-0">
            <span className="inline-flex rounded-full bg-primary-foreground/20 px-2.5 py-0.5 text-[11px] font-semibold tracking-wider uppercase backdrop-blur-sm">
              {full ? t("full") : t("preview")}
            </span>
            <h1 className="mt-3 text-2xl leading-tight font-bold tracking-tight text-balance break-words md:text-3xl">
              {title}
            </h1>
            <p className="mt-1 text-sm opacity-85">{meta}</p>
          </div>
        </div>

        <div className="space-y-5 p-6">
          <audio
            ref={audioRef}
            src={src}
            preload="metadata"
            onPlay={() => {
              setPlaying(true);
              setEnded(false);
            }}
            onPause={() => setPlaying(false)}
            onEnded={() => {
              setPlaying(false);
              setEnded(true);
            }}
            onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => {
              const d = e.currentTarget.duration;
              if (Number.isFinite(d) && d > 0) setDuration(d);
            }}
            className="hidden"
          >
            {t("noAudio")}
          </audio>

          <div>
            <div className="relative h-2">
              <progress
                aria-hidden
                value={time}
                max={duration || 1}
                className="absolute inset-0 h-2 w-full appearance-none overflow-hidden rounded-full bg-muted [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-primary [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-linear-to-r [&::-webkit-progress-value]:from-primary [&::-webkit-progress-value]:to-highlight"
              />
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={time}
                onChange={seek}
                aria-label={t("seekAria")}
                aria-valuetext={t("seekValue", {
                  time: formatClock(time),
                  duration: formatClock(duration),
                })}
                className="absolute inset-x-0 -top-2 h-6 w-full cursor-pointer opacity-0"
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted-foreground tabular-nums">
              <span>{formatClock(time)}</span>
              <span>{formatClock(duration)}</span>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={toggle}
              aria-label={playing ? t("pause") : ended ? t("replay") : t("play")}
              className="flex size-16 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-95"
            >
              {playing ? (
                <PauseIcon className="size-7 fill-current" aria-hidden />
              ) : ended ? (
                <RotateCcwIcon className="size-7" aria-hidden />
              ) : (
                <PlayIcon className="ml-1 size-7 fill-current" aria-hidden />
              )}
            </button>
          </div>

          {full ? (
            downloadUrl && (
              <a
                href={downloadUrl}
                className={cn(buttonVariants({ variant: "outline" }), "h-11 w-full rounded-full")}
              >
                <DownloadIcon aria-hidden />
                {t("download")}
              </a>
            )
          ) : (
            <p className="text-center text-xs text-muted-foreground">
              {t("previewNote", { minutes: Math.max(1, Math.round(fullDurationSec / 60)) })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
