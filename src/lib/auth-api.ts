import { api, unwrap } from "@/lib/api";

// Customer sign-in (mirrors backend internal/module/auth). The session is an HttpOnly cookie
// (user_session) set by the API, so nothing is stored in the browser.
//
// First time (no password yet): lookup → requestOtp → verifyOtp → setPassword.
// Afterwards: lookup → login.

export type SignInMethod = "otp" | "password";

export interface LookupOutput {
  email: string;
  method: SignInMethod;
}

export interface OtpSentOutput {
  email: string;
  expires_in_sec: number;
  resend_after_sec: number;
}

export interface OtpVerifiedOutput {
  setup_token: string;
  expires_in_sec: number;
}

export interface CustomerOutput {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
}

const ROOT = "/auth";
const noToken = { token: null } as const;

export const authApi = {
  async lookup(email: string): Promise<LookupOutput> {
    return unwrap(await api.post<LookupOutput>(`${ROOT}/lookup`, { email }, noToken));
  },

  async requestOtp(email: string): Promise<OtpSentOutput> {
    return unwrap(await api.post<OtpSentOutput>(`${ROOT}/otp`, { email }, noToken));
  },

  async verifyOtp(email: string, code: string): Promise<OtpVerifiedOutput> {
    return unwrap(
      await api.post<OtpVerifiedOutput>(`${ROOT}/otp/verify`, { email, code }, noToken),
    );
  },

  async setPassword(setupToken: string, password: string): Promise<CustomerOutput> {
    return unwrap(
      await api.post<CustomerOutput>(
        `${ROOT}/password`,
        { setup_token: setupToken, password },
        noToken,
      ),
    );
  },

  async login(email: string, password: string): Promise<CustomerOutput> {
    return unwrap(await api.post<CustomerOutput>(`${ROOT}/login`, { email, password }, noToken));
  },

  async logout(): Promise<void> {
    await api.post(`${ROOT}/logout`, undefined, noToken);
  },

  async me(signal?: AbortSignal): Promise<CustomerOutput> {
    return unwrap(await api.get<CustomerOutput>(`${ROOT}/me`, { signal, ...noToken }));
  },
};

/** Only same-site paths are allowed as the post-login target (no open redirect). */
export function safeNext(next: string | null | undefined): string {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\")
    ? next
    : "/";
}
