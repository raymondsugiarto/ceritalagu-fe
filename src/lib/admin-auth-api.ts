import { api, unwrap } from "@/lib/api";

// Admin sign-in. The session is an HttpOnly cookie (admin_session, path /api/v1/admin) set by the
// API, so no token is stored in the browser and every same-origin request carries it.

export type AdminRole = "super_admin" | "operator";

export interface AdminOutput {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  last_login_at: string | null;
}

export interface LoginInput {
  email: string;
  password: string;
}

const ROOT = "/admin/auth";

export const adminAuthApi = {
  async login(input: LoginInput): Promise<AdminOutput> {
    return unwrap(await api.post<AdminOutput>(`${ROOT}/login`, input, { token: null }));
  },

  async logout(): Promise<void> {
    await api.post(`${ROOT}/logout`, undefined, { token: null });
  },

  async me(signal?: AbortSignal): Promise<AdminOutput> {
    return unwrap(await api.get<AdminOutput>(`${ROOT}/me`, { signal, token: null }));
  },
};
