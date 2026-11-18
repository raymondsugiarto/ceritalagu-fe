"use server";

import { cookies } from "next/headers";
import { isLocale, LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE } from "./config";

/**
 * Stores the viewer's UI locale in the NEXT_LOCALE cookie. Unsupported values are rejected so the
 * cookie only ever holds a locale the app can render. The caller refreshes the route afterwards
 * (`router.refresh()`) to re-render server components in the new locale.
 */
export async function setLocale(locale: string): Promise<void> {
  if (!isLocale(locale)) {
    throw new Error(`Unsupported locale: ${locale}`);
  }
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: "lax",
  });
}
