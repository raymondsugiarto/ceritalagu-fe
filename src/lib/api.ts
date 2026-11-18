/**
 * The only module that calls fetch(). `lib/<entity>-api.ts` files use `api`, never fetch directly.
 *
 * - Calls the API on the page's own origin (`/api/v1/...`). `next dev` and the Docker image forward
 *   `/api` to the backend (next.config.ts rewrites); an ingress may also route it directly.
 *   NEXT_PUBLIC_API_BASE_URL overrides.
 * - Reads the bearer token from localStorage on every call.
 * - Unwraps the standard envelope `{ code, message, errors, data?, timestamp }` and throws ApiError
 *   for every failure (HTTP error, `code !== "SUCCESS"`, network), so callers handle one error type.
 */

const TOKEN_KEY = "app.token";
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1";

// ---- Shared contract (mirrors go-fiber-baseline internal/{response,apperror,pagination}) ----

export type ApiCode =
  | "SUCCESS"
  | "BAD_REQUEST"
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "TOO_MANY_REQUESTS"
  | "SERVICE_UNAVAILABLE"
  | "INTERNAL_ERROR"
  // client-side only
  | "NETWORK_ERROR"
  | "ABORTED";

export interface ErrorDetail {
  field?: string;
  message: string;
  /** Optional stable cause (backend apperror.Reason*), e.g. "option_unavailable". */
  reason?: string;
}

/** Every response body. `data` is absent on errors and on message-only responses. */
export interface ApiResponse<T> {
  code: ApiCode;
  /** Optional stable cause within `code` (backend apperror.Reason*), e.g. "voucher_expired". */
  reason?: string;
  message: string;
  errors: ErrorDetail[];
  data?: T;
  timestamp: string;
}

export interface PaginationInput {
  page?: number;
  page_size?: number;
}

export interface PaginationOutput {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
}

/** `data` of every list endpoint. */
export interface ListOutput<T> {
  items: T[];
  pagination: PaginationOutput;
}

// ---- Errors ----

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ApiCode,
    message: string,
    readonly errors: ErrorDetail[] = [],
    readonly requestId?: string,
    /** Stable machine-readable cause, when the backend sends one. */
    readonly reason?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }

  /** Field errors keyed by field name, ready for react-hook-form `setError`. */
  /** Field reasons keyed by field name (only fields that carry one). */
  get fieldReasons(): Record<string, string> {
    return Object.fromEntries(
      this.errors
        .filter((e) => e.field && e.reason)
        .map((e) => [e.field as string, e.reason as string]),
    );
  }

  get fieldMap(): Record<string, string> {
    return Object.fromEntries(
      this.errors.filter((e) => e.field).map((e) => [e.field as string, e.message]),
    );
  }
}

/** Codes whose message is generic or technical, so the caller's fallback reads better. */
const GENERIC_CODES: ReadonlySet<ApiCode> = new Set(["INTERNAL_ERROR", "NETWORK_ERROR", "ABORTED"]);

/** A user-facing message for any thrown value. Generic server/network failures use `fallback`. */
export function errorMessage(err: unknown, fallback = "Something went wrong."): string {
  return err instanceof ApiError && !GENERIC_CODES.has(err.code) ? err.message : fallback;
}

// ---- Token ----

export function readToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function writeToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

// ---- Request ----

type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions {
  query?: Record<string, QueryValue>;
  signal?: AbortSignal;
  /** Token override (e.g. right after login, before it is stored). */
  token?: string | null;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const origin = typeof window === "undefined" ? "http://localhost" : window.location.origin;
  const url = new URL(`${BASE_URL}${path}`, origin);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "")
      url.searchParams.set(key, String(value));
  }
  return url.toString();
}

async function request<T>(
  method: string,
  path: string,
  body: unknown,
  opts: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  if (body !== undefined && !isForm) headers["Content-Type"] = "application/json";
  const token = opts.token !== undefined ? opts.token : readToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(buildUrl(path, opts.query), {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
      cache: "no-store",
      signal: opts.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError(0, "ABORTED", "Request was cancelled.");
    }
    throw new ApiError(0, "NETWORK_ERROR", "Cannot reach the server. Check your connection.");
  }

  const parsed = (await res.json().catch(() => null)) as ApiResponse<T> | null;
  if (!res.ok || !parsed || parsed.code !== "SUCCESS") {
    throw new ApiError(
      res.status,
      parsed?.code ?? "INTERNAL_ERROR",
      parsed?.message ?? `Request failed with status ${res.status}.`,
      parsed?.errors ?? [],
      res.headers.get("X-Request-ID") ?? undefined,
      parsed?.reason || undefined,
    );
  }
  return parsed;
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>("GET", path, undefined, opts),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>("POST", path, body, opts),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>("PUT", path, body, opts),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>("PATCH", path, body, opts),
  delete: <T = void>(path: string, opts?: RequestOptions) =>
    request<T>("DELETE", path, undefined, opts),
};

/** Returns `data` from a response that must carry it. */
export function unwrap<T>(res: ApiResponse<T>): T {
  if (res.data === undefined) throw new Error(`Response "${res.message}" has no data`);
  return res.data;
}
