import type { Metadata } from "next";
import { UsersView } from "./users-view";

export const metadata: Metadata = { title: "Users" };

// Server component: metadata only. The interactive view is a client component next to it.
export default function UsersPage() {
  return <UsersView />;
}
