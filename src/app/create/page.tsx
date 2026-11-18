import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CreateView } from "./create-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  return { title: t("create") };
}

export default function CreatePage() {
  return <CreateView />;
}
