"use client";

import * as React from "react";
import { ApiError } from "@/lib/api";
import { adminAuthApi, type AdminOutput } from "@/lib/admin-auth-api";

type AuthState =
  | { kind: "loading" }
  | { kind: "signed-in"; admin: AdminOutput }
  | { kind: "signed-out" }
  | { kind: "error" };

interface AdminAuthContextValue {
  state: AuthState;
  /** Store the admin returned by a successful login. */
  signedIn: (admin: AdminOutput) => void;
  signOut: () => Promise<void>;
  /** Re-check the session, e.g. after an API call answered 401. */
  refresh: () => Promise<void>;
}

const AdminAuthContext = React.createContext<AdminAuthContextValue | null>(null);

/** Knows whether an admin is signed in (GET /admin/auth/me on mount). */
export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AuthState>({ kind: "loading" });

  const refresh = React.useCallback(async () => {
    try {
      setState({ kind: "signed-in", admin: await adminAuthApi.me() });
    } catch (err) {
      setState(
        err instanceof ApiError && err.status === 401 ? { kind: "signed-out" } : { kind: "error" },
      );
    }
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = React.useMemo<AdminAuthContextValue>(
    () => ({
      state,
      refresh,
      signedIn: (admin) => setState({ kind: "signed-in", admin }),
      signOut: async () => {
        await adminAuthApi.logout().catch(() => undefined);
        setState({ kind: "signed-out" });
      },
    }),
    [state, refresh],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = React.useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used inside <AdminAuthProvider>");
  return ctx;
}
