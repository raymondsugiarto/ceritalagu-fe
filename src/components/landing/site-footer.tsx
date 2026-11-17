import { MusicIcon } from "lucide-react";

/** Minimal footer. */
export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row">
        <span className="flex items-center gap-2 font-medium text-foreground">
          <MusicIcon className="size-4 text-highlight" aria-hidden />
          Lagu Untukmu
        </span>
        <span>© {new Date().getFullYear()} Lagu Untukmu. Dibuat dengan ❤️.</span>
      </div>
    </footer>
  );
}
