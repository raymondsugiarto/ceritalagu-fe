import type { Metadata } from "next";
import { JobView } from "./job-view";

export const metadata: Metadata = { title: "Membuat Lagu" };

interface JobPageProps {
  params: Promise<{ id: string }>;
}

export default async function JobPage({ params }: JobPageProps) {
  const { id } = await params;
  return <JobView jobId={id} />;
}
