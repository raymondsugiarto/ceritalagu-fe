/**
 * Google Tag Manager container id. Public by nature (it appears in the page source), so it is a
 * NEXT_PUBLIC_* variable and inlined at build time. Set it per environment; the default is the
 * production container.
 */
export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || "GTM-KSHSFPKG";
