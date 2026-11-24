"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2Icon, LogOutIcon } from "lucide-react";
import { AppSidebar, MobileAdminNavigation } from "@/components/admin/app-sidebar";
import { useAdminAuth } from "@/components/admin/admin-auth-provider";
import { Button } from "@/components/ui/button";

export const LOGIN_PATH = "/admin/login";

/** Admin chrome + auth guard. The login page renders bare; every other page needs a session. */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { state, signOut, refresh } = useAdminAuth();
  const isLogin = pathname === LOGIN_PATH;

  React.useEffect(() => {
    if (!isLogin && state.kind === "signed-out") {
      router.replace(`${LOGIN_PATH}?next=${encodeURIComponent(pathname)}`);
    }
  }, [isLogin, state.kind, pathname, router]);

  if (isLogin) return <>{children}</>;

  if (state.kind === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-muted-foreground">Tidak bisa menghubungi server.</p>
        <Button variant="outline" onClick={() => void refresh()}>
          Coba lagi
        </Button>
      </div>
    );
  }

  if (state.kind !== "signed-in") {
    return (
      <div className="flex min-h-screen items-center justify-center" aria-busy>
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" aria-label="Memuat" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-muted/30">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex min-h-16 items-center justify-between gap-3 border-b bg-card/95 px-4 backdrop-blur md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <MobileAdminNavigation />
            <p className="truncate font-semibold lg:hidden">Cerita Lagu</p>
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <div className="min-w-0 text-right">
              <p className="truncate text-sm font-medium">{state.admin.name}</p>
              <p className="hidden text-xs text-muted-foreground sm:block">
                {state.admin.role === "super_admin" ? "Super admin" : "Operator"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Keluar dari admin"
              onClick={async () => {
                await signOut();
                router.replace(LOGIN_PATH);
              }}
            >
              <LogOutIcon aria-hidden />
            </Button>
          </div>
        </header>
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
