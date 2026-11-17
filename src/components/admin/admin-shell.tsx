"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2Icon, LogOutIcon } from "lucide-react";
import { AppSidebar } from "@/components/admin/app-sidebar";
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
        <header className="flex items-center justify-end gap-3 border-b bg-card px-4 py-2 md:px-6">
          <span className="text-sm text-muted-foreground">
            {state.admin.name} · {state.admin.role === "super_admin" ? "Super admin" : "Operator"}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await signOut();
              router.replace(LOGIN_PATH);
            }}
          >
            <LogOutIcon aria-hidden />
            Keluar
          </Button>
        </header>
        <main className="min-w-0 flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
