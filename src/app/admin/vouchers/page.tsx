import type { Metadata } from "next";
import { VouchersView } from "./vouchers-view";

export const metadata: Metadata = { title: "Voucher" };

export default function VouchersPage() {
  return <VouchersView />;
}
