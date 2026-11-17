"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r bg-card md:block">
      <div className="px-6 py-5 text-lg font-semibold">Music Admin</div>
      <nav className="flex flex-col gap-1 px-3" aria-label="Main">
        {NAV_ITEMS.map(({ title, href, icon: Icon }) => {
          const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent",
                active && "bg-accent font-medium text-primary",
              )}
            >
              <Icon className="size-4" aria-hidden />
              {title}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
