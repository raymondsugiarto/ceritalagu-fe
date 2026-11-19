/**
 * SEO landing pages per occasion, served at /lagu/<slug>. Copy lives in messages/
 * (`occasionPages.items.<key>`). `code` is the questionnaire occasion value (master data seeded in
 * backend migration 000010); the page's CTA opens /create?momen=<code> with it preselected.
 */
export const OCCASION_PAGES = [
  { slug: "ulang-tahun", key: "birthday", code: "birthday" },
  { slug: "anniversary", key: "anniversary", code: "anniversary" },
  { slug: "pernikahan", key: "wedding", code: "wedding" },
  { slug: "lamaran", key: "proposal", code: "proposal" },
  { slug: "untuk-ibu", key: "mothersDay", code: "parents_day" },
  { slug: "untuk-ayah", key: "fathersDay", code: "parents_day" },
  { slug: "wisuda", key: "graduation", code: "graduation" },
  { slug: "valentine", key: "valentine", code: "valentine" },
] as const;

export type OccasionPage = (typeof OCCASION_PAGES)[number];

export const occasionPath = (slug: string) => `/lagu/${slug}`;

export function findOccasionPage(slug: string): OccasionPage | undefined {
  return OCCASION_PAGES.find((o) => o.slug === slug);
}

/** Query parameter /create reads to preselect the occasion. */
export const OCCASION_QUERY = "momen";

export const createHrefFor = (o: OccasionPage) => `/create?${OCCASION_QUERY}=${o.code}`;
