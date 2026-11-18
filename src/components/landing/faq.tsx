import { useTranslations } from "next-intl";
import { ChevronDownIcon } from "lucide-react";
import { SectionHeading } from "./how-it-works";

const FAQS = ["account", "duration", "dislike", "previewVsFull", "languages"] as const;

/** Accordion FAQ built on <details>, so it works without JavaScript. */
export function Faq() {
  const t = useTranslations("landing.faq");
  return (
    <section id="faq" className="scroll-mt-20 py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-4">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />
        <div className="mt-12 divide-y rounded-2xl border bg-card shadow-sm">
          {FAQS.map((f) => (
            <details key={f} className="group px-6 py-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                {t(`items.${f}.q`)}
                <ChevronDownIcon
                  className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {t(`items.${f}.a`)}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
