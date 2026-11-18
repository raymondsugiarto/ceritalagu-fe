import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRightIcon, GiftIcon, MusicIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Equalizer } from "./equalizer";

/** Closing call-to-action band. */
export function FinalCta() {
  const t = useTranslations("landing.finalCta");
  return (
    <section className="px-4 pb-20 md:pb-28">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-linear-to-br from-primary to-highlight px-6 py-16 text-center text-primary-foreground shadow-2xl md:py-20">
        <GiftIcon
          aria-hidden
          className="absolute -top-6 -left-6 size-40 rotate-[-15deg] opacity-10"
        />
        <MusicIcon
          aria-hidden
          className="absolute -right-8 -bottom-8 size-48 rotate-12 opacity-10"
        />
        <Equalizer bars={7} tone="inverse" className="mx-auto mb-6 h-8 justify-center" />
        <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-balance md:text-5xl">
          {t("title")}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-pretty opacity-90">{t("body")}</p>
        <Link
          href="/create"
          className={cn(
            buttonVariants({ variant: "secondary", size: "lg" }),
            "mt-8 h-12 rounded-full px-8 text-base shadow-lg",
          )}
        >
          {t("cta")}
          <ArrowRightIcon aria-hidden />
        </Link>
      </div>
    </section>
  );
}
