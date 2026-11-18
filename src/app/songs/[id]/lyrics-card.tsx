import { useTranslations } from "next-intl";
import { LockIcon, MicVocalIcon } from "lucide-react";
import { parseLyrics, type LyricsSection } from "@/lib/lyrics";
import { cn } from "@/lib/utils";

interface LyricsCardProps {
  lyrics: string;
  /** Preview: show a faded, locked teaser after the visible lines. */
  locked: boolean;
}

/** Lyrics with "Bait / Reff" headings; the chorus gets the brand highlight. */
export function LyricsCard({ lyrics, locked }: LyricsCardProps) {
  const t = useTranslations("song.lyrics");
  const sections = parseLyrics(lyrics);
  const labelOf = (s: LyricsSection): string | null =>
    s.kind ? t(`sections.${s.kind}`, { n: s.number ?? "none" }) : s.label;
  return (
    <section className="rounded-3xl border bg-card/80 p-6 shadow-sm backdrop-blur-sm md:p-8">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-primary to-highlight text-primary-foreground">
          <MicVocalIcon className="size-5" aria-hidden />
        </span>
        <div>
          <h2 className="font-semibold">{t("title")}</h2>
          <p className="text-xs text-muted-foreground">{locked ? t("untilChorus") : t("full")}</p>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {sections.map((s, i) => {
          const label = labelOf(s);
          return (
            <div
              key={i}
              className={cn(
                s.chorus &&
                  "-mx-3 rounded-2xl border-l-4 border-highlight bg-highlight/10 px-4 py-3 md:-mx-4",
              )}
            >
              {label && (
                <p
                  className={cn(
                    "mb-1.5 text-[11px] font-semibold tracking-widest uppercase",
                    s.chorus ? "text-highlight" : "text-muted-foreground",
                  )}
                >
                  {label}
                </p>
              )}
              <div className={cn("leading-relaxed", s.chorus && "font-medium")}>
                {s.lines.map((line, j) => (
                  <p key={j}>{line}</p>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {locked && (
        <div className="relative mt-6">
          <div aria-hidden className="space-y-2.5 blur-[3px] select-none">
            <div className="h-3 w-4/5 rounded-full bg-muted-foreground/25" />
            <div className="h-3 w-3/5 rounded-full bg-muted-foreground/25" />
            <div className="h-3 w-2/3 rounded-full bg-muted-foreground/25" />
            <div className="h-3 w-1/2 rounded-full bg-muted-foreground/25" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-linear-to-b from-transparent to-card/90">
            <span className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm font-medium shadow-sm">
              <LockIcon className="size-4 text-highlight" aria-hidden />
              {t("locked")}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
