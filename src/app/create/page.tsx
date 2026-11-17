import type { Metadata } from "next";
import { CreateView } from "./create-view";

export const metadata: Metadata = { title: "Buat Lagu" };

export default function CreatePage() {
  return <CreateView />;
}
