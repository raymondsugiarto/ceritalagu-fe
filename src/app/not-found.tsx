import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <p className="text-7xl font-bold text-muted-foreground/40">404</p>
      <p className="text-lg text-muted-foreground">This page doesn&apos;t exist.</p>
      <Link href="/admin" className={buttonVariants()}>
        Go home
      </Link>
    </div>
  );
}
