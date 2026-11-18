/** Public site facts shared by the footer, metadata and legal pages. Copy lives in messages/. */
export const SITE = {
  /** Official brand name (not translated). */
  name: "Cerita Lagu",
  /** Support inbox; the /kontak form is delivered here by the backend (mail.contactTo). */
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "hello@ceritalagu.com",
  /** Date the current terms took effect (ISO; formatted per locale on /syarat-dan-ketentuan). */
  termsUpdatedAt: "2026-11-18",
} as const;
