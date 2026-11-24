import { useTranslations } from "next-intl";
import { MessageCircleHeartIcon, QuoteIcon } from "lucide-react";
import { SectionHeading } from "./how-it-works";

const EXAMPLES = ["birthday", "anniversary", "family"] as const;

export function Testimonials() {
  const t = useTranslations("landing.testimonials");

  return (
    <section className="py-20 md:py-28" aria-labelledby="example-reviews-title">
      <div className="mx-auto max-w-6xl px-4">
        <div id="example-reviews-title">
          <SectionHeading
            eyebrow={t("eyebrow")}
            title={t("title")}
            description={t("description")}
          />
        </div>
        <ul className="mt-12 grid gap-5 md:grid-cols-3">
          {EXAMPLES.map((example) => (
            <li key={example} className="flex flex-col rounded-3xl border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <MessageCircleHeartIcon className="size-5" aria-hidden />
                </span>
                <QuoteIcon className="size-6 text-primary/30" aria-hidden />
              </div>
              <blockquote className="mt-6 flex-1 text-base leading-relaxed">
                “{t(`items.${example}.quote`)}”
              </blockquote>
              <div className="mt-6 border-t pt-4">
                <p className="text-sm font-semibold">{t(`items.${example}.occasion`)}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t("fictional")}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
