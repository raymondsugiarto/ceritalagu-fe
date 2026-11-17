import type { Metadata } from "next";
import { PricingView } from "./pricing-view";

export const metadata: Metadata = { title: "Harga" };

export default function PricingPage() {
  return <PricingView />;
}
