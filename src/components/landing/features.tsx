import { useTranslations } from "next-intl";
import {
  AudioLinesIcon,
  ClockIcon,
  LanguagesIcon,
  MessageCircleHeartIcon,
  MicIcon,
  SmileIcon,
} from "lucide-react";
import { SectionHeading } from "./how-it-works";

const FEATURES = [
  { icon: MessageCircleHeartIcon, key: "lyrics" },
  { icon: AudioLinesIcon, key: "genres" },
  { icon: MicIcon, key: "voice" },
  { icon: SmileIcon, key: "mood" },
  { icon: LanguagesIcon, key: "language" },
  { icon: ClockIcon, key: "fast" },
] as const;

/** Illustrative genre chips (genre names, not translated; the real list is master data). */
const GENRES = ["Pop", "Ballad", "Acoustic", "R&B", "Rock", "Jazz", "Dangdut", "Keroncong", "EDM"];

/** Feature grid + genre chips. */
export function Features() {
  const t = useTranslations("landing.features");
  return (
    <section id="fitur" className="scroll-mt-20 bg-muted/40 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.key}
              className="group rounded-2xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-linear-to-br group-hover:from-primary group-hover:to-highlight group-hover:text-primary-foreground">
                <f.icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-4 font-semibold">{t(`items.${f.key}.title`)}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{t(`items.${f.key}.body`)}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {GENRES.map((g) => (
            <span
              key={g}
              className="rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground"
            >
              {g}
            </span>
          ))}
          <span className="rounded-full px-3 py-1 text-xs font-medium text-muted-foreground">
            {t("more")}
          </span>
        </div>
      </div>
    </section>
  );
}
