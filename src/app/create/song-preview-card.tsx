"use client";

import { useTranslations } from "next-intl";
import { HeartIcon, MusicIcon } from "lucide-react";
import { Equalizer } from "@/components/landing/equalizer";
import {
  OTHER,
  isSongLanguageCode,
  isVoiceCode,
  labelOf,
  type ChoiceOptions,
  type QuestionnaireValues,
} from "@/lib/questionnaire";

interface SongPreviewCardProps {
  values: QuestionnaireValues;
  options: ChoiceOptions;
}

/**
 * The song card filling in as the guest answers (same look as the landing hero player), so every
 * step visibly builds "their" song.
 */
export function SongPreviewCard({ values: v, options }: SongPreviewCardProps) {
  const t = useTranslations("create.preview");
  const tc = useTranslations("common");
  const name = v.recipient_nickname || v.recipient_name;
  const who =
    v.recipient_type === OTHER
      ? v.recipient_other
      : v.recipient_type
        ? labelOf(options.recipientTypes, v.recipient_type)
        : "";
  const occasion =
    v.occasion === OTHER
      ? v.occasion_other
      : v.occasion
        ? labelOf(options.occasions, v.occasion)
        : "";
  const tags = [
    v.genre && labelOf(options.genres, v.genre),
    isVoiceCode(v.voice) && tc(`voiceTags.${v.voice}`),
    v.mood && labelOf(options.moods, v.mood),
    isSongLanguageCode(v.language) && tc(`songLanguages.${v.language}`),
  ].filter(Boolean);
  const quote = v.message || v.memory || v.special;

  return (
    <div className="relative" aria-hidden>
      <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-linear-to-br from-primary/25 to-highlight/25 blur-2xl" />
      <div className="overflow-hidden rounded-3xl border bg-card shadow-2xl">
        <div className="relative flex min-h-44 items-end bg-linear-to-br from-primary to-highlight p-6 text-primary-foreground">
          <HeartIcon className="absolute top-6 right-6 size-10 fill-current opacity-30" />
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-widest uppercase opacity-80">
              {[who && t("forWho", { who }), occasion].filter(Boolean).join(" · ") ||
                t("defaultMeta")}
            </p>
            <p className="mt-1 truncate text-2xl font-bold">
              {name ? t("songFor", { name }) : t("songForEmpty")}
            </p>
            <p className="text-sm opacity-80">
              {tags.length ? tags.join(" · ") : t("tagsPlaceholder")}
            </p>
          </div>
        </div>
        <div className="space-y-5 p-6">
          <Equalizer className="h-10 justify-center" />
          <div className="rounded-xl bg-muted/60 p-4 text-sm leading-relaxed">
            <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-highlight uppercase">
              <MusicIcon className="size-3.5" />
              {t("fromStory")}
            </p>
            <p className="mt-1 line-clamp-4 break-words whitespace-pre-line text-muted-foreground">
              {quote || t("quotePlaceholder")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
