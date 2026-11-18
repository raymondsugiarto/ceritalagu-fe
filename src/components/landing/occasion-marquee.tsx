import { useTranslations } from "next-intl";

const OCCASIONS = [
  "birthday",
  "anniversary",
  "wedding",
  "proposal",
  "mothersDay",
  "fathersDay",
  "graduation",
  "apology",
  "thankYou",
  "farewell",
  "valentine",
  "justBecause",
] as const;

/** Endless strip of occasions. The list is rendered twice so the -50% loop is seamless. */
export function OccasionMarquee() {
  const t = useTranslations("landing.marquee");
  return (
    <section aria-label={t("aria")} className="border-y bg-muted/40 py-6">
      <p className="mb-4 text-center text-sm font-medium text-muted-foreground">{t("title")}</p>
      <div className="relative overflow-hidden mask-x-from-85% mask-x-to-100%">
        <ul className="flex w-max gap-3 motion-safe:animate-marquee">
          {[...OCCASIONS, ...OCCASIONS].map((o, i) => (
            <li
              key={i}
              aria-hidden={i >= OCCASIONS.length}
              className="rounded-full border bg-card px-4 py-2 text-sm whitespace-nowrap shadow-sm"
            >
              {t(`occasions.${o}`)}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
