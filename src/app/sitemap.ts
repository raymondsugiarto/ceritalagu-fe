import type { MetadataRoute } from "next";
import { OCCASION_PAGES, occasionPath } from "@/lib/occasions";
import { SITE } from "@/lib/site";

/** Public, indexable pages only. Customer pages (/jobs, /songs) and /admin stay out. */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(SITE.termsUpdatedAt);
  return [
    { url: `${SITE.url}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE.url}/create`, lastModified, changeFrequency: "monthly", priority: 0.9 },
    ...OCCASION_PAGES.map((o) => ({
      url: `${SITE.url}${occasionPath(o.slug)}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    { url: `${SITE.url}/kontak`, lastModified, changeFrequency: "yearly", priority: 0.4 },
    {
      url: `${SITE.url}/syarat-dan-ketentuan`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
