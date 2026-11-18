import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SongView } from "./song-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  return { title: t("song") };
}

interface SongPageProps {
  params: Promise<{ id: string }>;
  /** ?order=<id>: DOKU sends the buyer back here after paying. */
  searchParams: Promise<{ order?: string }>;
}

export default async function SongPage({ params, searchParams }: SongPageProps) {
  const { id } = await params;
  const { order } = await searchParams;
  return <SongView songId={id} orderId={order} />;
}
