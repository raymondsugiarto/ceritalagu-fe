import { describe, expect, it } from "vitest";
import en from "../../messages/en.json";
import id from "../../messages/id.json";
import { OCCASION_PAGES, createHrefFor, findOccasionPage } from "./occasions";

// Questionnaire occasion codes seeded by backend migration 000010.
const QUESTIONNAIRE_CODES = [
  "anniversary",
  "apology",
  "birthday",
  "farewell",
  "graduation",
  "just_because",
  "parents_day",
  "proposal",
  "thank_you",
  "valentine",
  "wedding",
];

describe("OCCASION_PAGES", () => {
  it("has unique slugs and keys", () => {
    expect(new Set(OCCASION_PAGES.map((o) => o.slug)).size).toBe(OCCASION_PAGES.length);
    expect(new Set(OCCASION_PAGES.map((o) => o.key)).size).toBe(OCCASION_PAGES.length);
  });

  it("only links to occasion codes the questionnaire knows", () => {
    for (const o of OCCASION_PAGES) expect(QUESTIONNAIRE_CODES).toContain(o.code);
  });

  it.each(OCCASION_PAGES.map((o) => o.key))("has copy for %s in every locale", (key) => {
    for (const messages of [id, en]) {
      const page = messages.occasionPages.items[key];
      expect(page.lyric).toHaveLength(4);
      expect(page.reasons).toHaveLength(3);
      expect(page.faqs.length).toBeGreaterThanOrEqual(3);
      expect(page.metaDescription.length).toBeLessThanOrEqual(170);
    }
  });

  it("builds the create link and finds pages by slug", () => {
    expect(createHrefFor(OCCASION_PAGES[0])).toBe("/create?momen=birthday");
    expect(findOccasionPage("wisuda")?.key).toBe("graduation");
    expect(findOccasionPage("nope")).toBeUndefined();
  });
});
