import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/** Private or per-customer routes: nothing there is useful in a search or AI answer. */
const PRIVATE = ["/admin", "/api/", "/jobs/", "/songs/", "/login"];

/**
 * AI search and answer crawlers, named explicitly so a later blanket rule cannot shut them out by
 * accident (GEO: being quotable in ChatGPT, Claude, Perplexity, Gemini and Copilot answers).
 */
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Bingbot",
  "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      { userAgent: AI_CRAWLERS, allow: "/", disallow: PRIVATE },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
