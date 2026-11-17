import type { Metadata } from "next";
import { SongsView } from "./songs-view";

export const metadata: Metadata = { title: "Songs" };

export default function SongsPage() {
  return <SongsView />;
}
