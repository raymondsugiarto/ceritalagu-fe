import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { JobView } from "./job-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  return { title: t("job"), robots: { index: false, follow: false } };
}

interface JobPageProps {
  params: Promise<{ id: string }>;
}

export default async function JobPage({ params }: JobPageProps) {
  const { id } = await params;
  return <JobView jobId={id} />;
}
