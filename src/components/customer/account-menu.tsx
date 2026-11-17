"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogInIcon, LogOutIcon, UserRoundIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { useCustomer } from "@/hooks/use-customer";
import { cn } from "@/lib/utils";

/** Header slot: "Masuk" when signed out; the customer's email and "Keluar" when signed in. */
export function AccountMenu({ className }: { className?: string }) {
  const pathname = usePathname();
  const { state, signOut } = useCustomer();

  if (state.kind === "loading") return <span className={cn("h-8 w-20", className)} aria-hidden />;

  if (state.kind === "signed-out") {
    if (pathname === "/login") return null;
    const next = pathname && pathname !== "/" ? `?next=${encodeURIComponent(pathname)}` : "";
    return (
      <Link
        href={`/login${next}`}
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "rounded-full", className)}
      >
        <LogInIcon aria-hidden />
        Masuk
      </Link>
    );
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <span className="hidden max-w-48 items-center gap-1.5 truncate text-sm text-muted-foreground sm:flex">
        <UserRoundIcon className="size-4 shrink-0" aria-hidden />
        <span className="truncate">{state.customer.email}</span>
      </span>
      <button
        type="button"
        onClick={() => void signOut()}
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "rounded-full")}
      >
        <LogOutIcon aria-hidden />
        Keluar
      </button>
    </div>
  );
}
