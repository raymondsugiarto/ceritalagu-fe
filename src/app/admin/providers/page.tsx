import type { Metadata } from "next";
import { ProvidersView } from "./providers-view";

export const metadata: Metadata = { title: "AI Providers" };

export default function AIProvidersPage() {
  return <ProvidersView />;
}
