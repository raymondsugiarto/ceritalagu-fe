import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export interface PlaceholderPageProps {
  title: string;
  /** What this page will do, shown until the feature is built. */
  description: string;
  /** PRD section the feature is specified in, e.g. "§6.1". */
  prdSection: string;
}

/** Temporary body for admin pages that are scaffolded but not built yet. */
export function PlaceholderPage({ title, description, prdSection }: PlaceholderPageProps) {
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <Card>
        <CardHeader>
          <CardTitle>Belum dibuat</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Spesifikasi: docs/PRD.md {prdSection}
        </CardContent>
      </Card>
    </div>
  );
}
