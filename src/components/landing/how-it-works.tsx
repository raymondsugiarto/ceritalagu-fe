import { useTranslations } from "next-intl";
import { HeadphonesIcon, ListChecksIcon, WandSparklesIcon } from "lucide-react";

export const STEPS = [
  { icon: ListChecksIcon, key: "tell" },
  { icon: WandSparklesIcon, key: "create" },
  { icon: HeadphonesIcon, key: "listen" },
] as const;

/** Three-step explainer. */
export function HowItWorks() {
  const t = useTranslations("landing.howItWorks");
  return (
    <section id="cara-kerja" className="scroll-mt-20 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />

        <ol className="relative mt-14 grid gap-6 md:grid-cols-3">
          {/* Connector line between the step badges on desktop. */}
          <div
            aria-hidden
            className="absolute top-7 right-[16%] left-[16%] hidden h-px bg-linear-to-r from-primary/40 via-highlight/40 to-primary/40 md:block"
          />
          {STEPS.map((s, i) => (
            <li key={s.key} className="relative flex flex-col items-center text-center">
              <span className="relative flex size-14 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-highlight text-primary-foreground shadow-lg shadow-primary/25">
                <s.icon className="size-6" aria-hidden />
                <span className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full border bg-background text-xs font-bold text-foreground">
                  {i + 1}
                </span>
              </span>
              <h3 className="mt-5 text-lg font-semibold">{t(`steps.${s.key}.title`)}</h3>
              <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                {t(`steps.${s.key}.body`)}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: string;
}

/** Centered eyebrow + title + description used by every landing section. */
export function SectionHeading({ eyebrow, title, description }: SectionHeadingProps) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-semibold tracking-wide text-highlight uppercase">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-bold tracking-tight text-balance md:text-4xl">{title}</h2>
      {description && <p className="mt-4 text-pretty text-muted-foreground">{description}</p>}
    </div>
  );
}
