import type { Metadata } from "next";
import { SongView } from "./song-view";

export const metadata: Metadata = { title: "Lagumu" };

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
