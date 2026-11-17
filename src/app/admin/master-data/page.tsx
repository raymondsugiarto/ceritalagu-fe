import type { Metadata } from "next";
import { Suspense } from "react";
import { MasterDataView } from "./master-data-view";

export const metadata: Metadata = { title: "Master Data" };

export default function MasterDataPage() {
  // useSearchParams (?kind=) needs a Suspense boundary.
  return (
    <Suspense>
      <MasterDataView />
    </Suspense>
  );
}
