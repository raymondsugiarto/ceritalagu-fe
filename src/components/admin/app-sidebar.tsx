"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon } from "lucide-react";
import { NAV_ITEMS, NAV_SECTIONS, type NavItem } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function NavigationItems({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-5" aria-label="Menu admin">
      {NAV_SECTIONS.map((section) => (
        <div key={section} className="space-y-1">
          <p className="px-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {section}
          </p>
          {NAV_ITEMS.filter((item) => item.section === section).map((item) => (
            <NavigationLink
              key={item.href}
              item={item}
              active={isActive(item.href, pathname)}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ))}
    </nav>
  );
}

function NavigationLink({
  item: { title, href, icon: Icon },
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      className={cn(
        "flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent",
        active && "bg-accent font-medium text-primary",
      )}
    >
      <Icon className="size-4" aria-hidden />
      {title}
    </Link>
  );
}

function isActive(href: string, pathname: string): boolean {
  return href === "/admin" ? pathname === href : pathname.startsWith(href);
}

export function AppSidebar() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 overflow-y-auto border-r bg-card lg:block">
      <div className="flex h-16 items-center gap-3 border-b px-6">
        <BrandLogo size={28} markOnly />
        <div>
          <p className="font-semibold">Cerita Lagu</p>
          <p className="text-xs text-muted-foreground">Admin workspace</p>
        </div>
      </div>
      <div className="p-3">
        <NavigationItems />
      </div>
    </aside>
  );
}

export function MobileAdminNavigation() {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="outline"
        size="icon"
        className="lg:hidden"
        aria-label="Buka menu admin"
        onClick={() => setOpen(true)}
      >
        <MenuIcon aria-hidden />
      </Button>
      <DialogContent
        className="top-0 left-0 h-dvh w-[min(20rem,calc(100vw-2rem))] max-w-none translate-x-0 translate-y-0 gap-0 overflow-y-auto rounded-none border-y-0 border-l-0 p-0"
        showCloseButton
      >
        <DialogHeader className="border-b p-5 pr-16">
          <div className="flex items-center gap-3">
            <BrandLogo size={28} markOnly />
            <div>
              <DialogTitle>Cerita Lagu</DialogTitle>
              <DialogDescription>Menu admin</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="p-3">
          <NavigationItems onNavigate={() => setOpen(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
