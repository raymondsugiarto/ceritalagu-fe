import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ArrowRightIcon,
  CheckIcon,
  HeartIcon,
  PauseIcon,
  SkipBackIcon,
  SkipForwardIcon,
  SparklesIcon,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Equalizer } from "./equalizer";

const PROMISES = ["noSignup", "fast"] as const;

/** Above-the-fold: headline, CTAs and a mock song player. */
export function Hero() {
  const t = useTranslations("landing.hero");
  return (
    <section className="relative overflow-hidden">
      {/* Soft colour glows behind the hero. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute top-40 -right-24 size-80 rounded-full bg-highlight/20 blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pt-16 pb-20 md:pt-24 lg:grid-cols-[1.1fr_1fr] lg:pb-28">
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
            <SparklesIcon className="size-3.5 text-highlight" aria-hidden />
            {t("badge")}
          </span>

          <h1 className="mt-6 text-4xl leading-tight font-bold tracking-tight text-balance md:text-5xl lg:text-6xl">
            {t.rich("title", {
              highlight: (chunks) => (
                <span className="bg-linear-to-r from-primary via-highlight to-sunset bg-clip-text text-transparent">
                  {chunks}
                </span>
              ),
            })}
          </h1>

          <p className="mt-5 max-w-xl text-lg text-pretty text-muted-foreground">{t("body")}</p>

          <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              href="/create"
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-12 rounded-full px-7 text-base shadow-lg shadow-primary/25",
              )}
            >
              {t("ctaPrimary")}
              <ArrowRightIcon aria-hidden />
            </Link>
            <a
              href="#cara-kerja"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-12 rounded-full px-7 text-base",
              )}
            >
              {t("ctaSecondary")}
            </a>
          </div>

          <ul className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground lg:justify-start">
            {PROMISES.map((p) => (
              <li key={p} className="flex items-center gap-1.5">
                <CheckIcon className="size-4 text-success" aria-hidden />
                {t(`promises.${p}`)}
              </li>
            ))}
          </ul>
        </div>

        <SongPreviewMock />
      </div>
    </section>
  );
}

/** Illustrative player card — shows what a finished song page feels like. */
function SongPreviewMock() {
  const t = useTranslations("landing.hero.mock");
  return (
    <div className="relative mx-auto w-full max-w-md motion-safe:animate-float" aria-hidden>
      <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-linear-to-br from-primary/30 to-highlight/30 blur-2xl" />

      <div className="overflow-hidden rounded-3xl border bg-card shadow-2xl">
        <div className="relative flex h-48 items-end bg-linear-to-br from-primary to-highlight p-6 text-primary-foreground">
          <HeartIcon className="absolute top-6 right-6 size-10 fill-current opacity-30" />
          <div>
            <p className="text-xs font-medium tracking-widest uppercase opacity-80">{t("meta")}</p>
            <p className="mt-1 text-2xl font-bold">{t("title")}</p>
            <p className="text-sm opacity-80">{t("tags")}</p>
          </div>
        </div>

        <div className="space-y-5 p-6">
          <Equalizer className="h-12 justify-center" />

          <div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-2/5 rounded-full bg-linear-to-r from-primary to-highlight" />
            </div>
            <div className="mt-1.5 flex justify-between text-xs text-muted-foreground tabular-nums">
              <span>0:24</span>
              <span>1:00</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 text-muted-foreground">
            <SkipBackIcon className="size-5" />
            <span className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30">
              <PauseIcon className="size-6 fill-current" />
            </span>
            <SkipForwardIcon className="size-5" />
          </div>

          <div className="rounded-xl bg-muted/60 p-4 text-sm leading-relaxed">
            <p className="text-xs font-semibold tracking-wide text-highlight uppercase">
              {t("chorus")}
            </p>
            <p className="mt-1">{t("line1")}</p>
            <p>{t("line2")}</p>
            <p className="text-muted-foreground blur-[3px]">{t("line3")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
