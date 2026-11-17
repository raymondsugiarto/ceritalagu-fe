const LOCALE = "en-US";

/** "Nov 1, 2026, 09:30" — for timestamps from the API (RFC 3339, UTC). */
export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat(LOCALE, { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(iso),
  );
}
