import type { Metadata } from "next";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  return { title: t("notFound") };
}

export default function NotFound() {
  const t = useTranslations("notFound");
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-7xl font-bold text-muted-foreground/40">404</p>
      <p className="text-lg text-muted-foreground">{t("message")}</p>
      <Link href="/" className={buttonVariants()}>
        {t("home")}
      </Link>
    </div>
  );
}
