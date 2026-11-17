"use client";

import * as React from "react";
import { authApi, type CustomerOutput } from "@/lib/auth-api";

export type CustomerState =
  { kind: "loading" } | { kind: "signed-in"; customer: CustomerOutput } | { kind: "signed-out" };

/** The signed-in customer (GET /auth/me), or signed-out when there is no valid session. */
export function useCustomer(): { state: CustomerState; signOut: () => Promise<void> } {
  const [state, setState] = React.useState<CustomerState>({ kind: "loading" });

  React.useEffect(() => {
    const controller = new AbortController();
    authApi
      .me(controller.signal)
      .then((customer) => !controller.signal.aborted && setState({ kind: "signed-in", customer }))
      .catch(() => !controller.signal.aborted && setState({ kind: "signed-out" }));
    return () => controller.abort();
  }, []);

  const signOut = React.useCallback(async () => {
    await authApi.logout().catch(() => undefined);
    setState({ kind: "signed-out" });
  }, []);

  return { state, signOut };
}
