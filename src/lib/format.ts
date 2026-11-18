/** BCP 47 locale used for Intl formatting of an app locale (`id` / `en`). */
export function intlLocale(locale: string): string {
  return locale === "id" ? "id-ID" : locale === "en" ? "en-US" : locale;
}

/**
 * "Nov 1, 2026, 09:30" — for timestamps from the API (RFC 3339, UTC). Customer screens pass the
 * viewer's locale (or use next-intl `useFormatter`); the admin panel keeps the en-US default.
 */
export function formatDateTime(iso: string, locale = "en-US"): string {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}
