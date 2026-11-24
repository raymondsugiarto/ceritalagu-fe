"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { HeadphonesIcon, Music2Icon, PauseIcon, PlayIcon } from "lucide-react";
import { sampleApi, type SampleOutput } from "@/lib/playground-api";
import { formatClock } from "@/lib/lyrics";
import { Equalizer } from "./equalizer";
import { SectionHeading } from "./how-it-works";

export function Samples() {
  const t = useTranslations("landing.samples");
  const [state, setState] = React.useState<
    { kind: "loading" } | { kind: "loaded"; samples: SampleOutput[] } | { kind: "error" }
  >({ kind: "loading" });
  const [attempt, setAttempt] = React.useState(0);
  const playingRef = React.useRef<HTMLAudioElement | null>(null);

  React.useEffect(() => {
    const ctrl = new AbortController();
    sampleApi
      .list(ctrl.signal)
      .then((samples) => {
        if (!ctrl.signal.aborted) setState({ kind: "loaded", samples });
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setState({ kind: "error" });
      });
    return () => ctrl.abort();
  }, [attempt]);

  if (state.kind === "loading" || (state.kind === "loaded" && state.samples.length === 0))
    return null;

  return (
    <section id="contoh-lagu" className="scroll-mt-20 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
        {state.kind === "error" ? (
          <div className="mt-10 text-center" role="alert">
            <p className="text-sm text-muted-foreground">{t("loadError")}</p>
            <button
              type="button"
              onClick={() => {
                setState({ kind: "loading" });
                setAttempt((value) => value + 1);
              }}
              className="mt-3 cursor-pointer text-sm font-medium text-primary underline underline-offset-4"
            >
              {t("retry")}
            </button>
          </div>
        ) : (
          <ul className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {state.samples.map((sample) => (
              <li key={sample.id}>
                <SamplePlayer
                  sample={sample}
                  onPlay={(audio) => {
                    if (playingRef.current !== audio) playingRef.current?.pause();
                    playingRef.current = audio;
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function SamplePlayer({
  sample,
  onPlay,
}: {
  sample: SampleOutput;
  onPlay: (audio: HTMLAudioElement) => void;
}) {
  const t = useTranslations("landing.samples");
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = React.useState(false);
  const [time, setTime] = React.useState(0);
  const [duration, setDuration] = React.useState(
    Number.isFinite(sample.duration_sec) && sample.duration_sec > 0 ? sample.duration_sec : 0,
  );
  const [failed, setFailed] = React.useState(false);

  async function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) {
      audio.pause();
      return;
    }

    setFailed(false);
    try {
      await audio.play();
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) setFailed(true);
    }
  }

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-3xl border bg-card shadow-sm transition-shadow hover:shadow-lg">
      <div className="relative overflow-hidden bg-linear-to-br from-primary to-highlight p-5 text-primary-foreground">
        <Music2Icon className="absolute -top-5 -right-4 size-32 rotate-12 opacity-15" aria-hidden />
        <div className="relative flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-medium">
            <HeadphonesIcon className="size-3.5" aria-hidden />
            {t("sampleLabel")}
          </span>
          <Equalizer bars={7} tone="inverse" paused={!playing} className="h-6 opacity-80" />
        </div>
        <h3 className="relative mt-8 text-xl font-bold break-words">{sample.title}</h3>
        {sample.caption && <p className="relative mt-1 text-sm opacity-85">{sample.caption}</p>}
      </div>
      <div className="flex flex-1 items-center gap-4 p-5">
        <audio
          ref={audioRef}
          src={sample.audio_url}
          preload="none"
          onPlay={(event) => {
            onPlay(event.currentTarget);
            setPlaying(true);
            setFailed(false);
          }}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
          onLoadedMetadata={(event) => {
            const value = event.currentTarget.duration;
            if (Number.isFinite(value) && value > 0) setDuration(value);
          }}
          onError={() => setFailed(true)}
        >
          {t("noAudio")}
        </audio>
        <button
          type="button"
          onClick={() => void toggle()}
          aria-label={t(playing ? "pause" : "play", { title: sample.title })}
          className="flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-95"
        >
          {playing ? (
            <PauseIcon className="size-5 fill-current" aria-hidden />
          ) : (
            <PlayIcon className="ml-0.5 size-5 fill-current" aria-hidden />
          )}
        </button>
        <div className="min-w-0 flex-1">
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={Math.min(time, duration)}
            disabled={!duration}
            onChange={(event) => {
              const audio = audioRef.current;
              if (!audio) return;
              audio.currentTime = Number(event.currentTarget.value);
              setTime(audio.currentTime);
            }}
            aria-label={t("seek", { title: sample.title })}
            aria-valuetext={t("seekValue", {
              time: formatClock(time),
              duration: duration ? formatClock(duration) : t("unknownDuration"),
            })}
            className="h-6 w-full cursor-pointer accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed"
          />
          <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
            <span>{formatClock(time)}</span>
            <span>{duration ? formatClock(duration) : t("unknownDuration")}</span>
          </div>
          {failed && (
            <p className="mt-2 text-xs text-destructive" role="alert">
              {t("playError")}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
