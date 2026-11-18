import { ApiError, type ApiCode } from "@/lib/api";
import { defaultLocale, type Locale } from "./config";

/** Keys of the `errors` namespace: one per envelope `code`, plus `unknown`. */
export type ErrorTextKey = ApiCode extends infer C ? Exclude<C, "SUCCESS"> | "unknown" : never;

/**
 * Codes whose backend `message` is written for customers (in Bahasa Indonesia). Generic failures
 * (INTERNAL_ERROR, NETWORK_ERROR, ABORTED) and VALIDATION_ERROR ("request validation failed") are not.
 */
export const CUSTOMER_WORDED_CODES: readonly ApiCode[] = [
  "BAD_REQUEST",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "TOO_MANY_REQUESTS",
  "SERVICE_UNAVAILABLE",
];

export interface ApiErrorTextOptions {
  /** Viewer locale. */
  locale: Locale;
  /** Translates an `errors.<code>` key. */
  codeText: (key: ErrorTextKey) => string;
  /**
   * Translates a backend `reason` (`errors.<reason>`), or `undefined` when the catalogue has no
   * message for it (an unknown/new reason then falls through to the override / code).
   */
  reasonText?: (reason: string) => string | undefined;
  /** Call-site message when the code is not trusted / has no override. */
  fallback?: string;
  /** Call-site wording per code (e.g. UNAUTHORIZED on login = "wrong email or password"). */
  overrides?: Partial<Record<ApiCode, string>>;
  /** Codes whose backend message this call site shows. Defaults to CUSTOMER_WORDED_CODES. */
  trusted?: readonly ApiCode[];
}

/**
 * Customer-facing text for any thrown value (plan §3.6: map the envelope `code`).
 *
 * The backend writes its customer messages in Bahasa Indonesia and sends a stable `reason` for
 * the cases the UI shows (plan Phase 2), so:
 * - trusted code + default locale (`id`) → the backend message (today's wording, unchanged);
 * - other locales → `errors.<reason>` → call-site override → `errors.<code>` (trusted) or the
 *   call-site fallback → `errors.unknown`.
 */
export function apiErrorText(err: unknown, opts: ApiErrorTextOptions): string {
  const { locale, codeText, reasonText, fallback, overrides } = opts;
  if (!(err instanceof ApiError)) return fallback ?? codeText("unknown");
  const code = err.code;
  const codeKey: ErrorTextKey = code === "SUCCESS" ? "unknown" : code;
  const trusted = (opts.trusted ?? CUSTOMER_WORDED_CODES).includes(code);
  if (trusted && locale === defaultLocale && err.message) return err.message;
  if (locale !== defaultLocale && err.reason) {
    const byReason = reasonText?.(err.reason);
    if (byReason) return byReason;
  }
  if (trusted) return overrides?.[code] ?? codeText(codeKey);
  return overrides?.[code] ?? fallback ?? codeText(codeKey);
}

/**
 * A field message from a VALIDATION_ERROR (`err.fieldMap`). The backend writes these in Bahasa
 * Indonesia, so other locales get `errors.<reason>` when the field carries a known reason, else a
 * generic "check this field".
 */
export function fieldErrorText(
  serverMessage: string,
  locale: Locale,
  generic: string,
  reasonMessage?: string,
): string {
  if (locale === defaultLocale) return serverMessage;
  return reasonMessage || generic;
}
