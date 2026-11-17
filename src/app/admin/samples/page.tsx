import type { Metadata } from "next";
import { SamplesView } from "./samples-view";

export const metadata: Metadata = { title: "Sampel Landing" };

export default function SamplesPage() {
  return <SamplesView />;
}
