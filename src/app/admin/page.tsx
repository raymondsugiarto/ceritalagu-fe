import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NAV_ITEMS } from "@/lib/nav";

export const metadata: Metadata = { title: "Home" };

export default function AdminHomePage() {
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h1 className="text-2xl font-semibold">Music Admin</h1>
      <Card>
        <CardHeader>
          <CardTitle>Back office</CardTitle>
          <CardDescription>
            Kelola AI provider, prompt, master data dan pantau job generate.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 text-sm">
          {NAV_ITEMS.filter((item) => item.href !== "/admin").map((item) => (
            <Link key={item.href} href={item.href} className="text-primary underline">
              {item.title}
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
