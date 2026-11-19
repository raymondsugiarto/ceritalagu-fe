import { describe, expect, it } from "vitest";
import { landingJsonLd, occasionJsonLd, serializeJsonLd } from "./json-ld";

const input = {
  locale: "id",
  description: "Lagu personal.",
  serviceType: "Pembuatan lagu personal",
  genres: "Pop, Ballad.",
  steps: [
    { name: "Ceritakan", text: "Jawab 7 pertanyaan." },
    { name: "Dengarkan", text: "Putar preview." },
  ],
  faqs: [{ q: "Apa itu?", a: "Layanan lagu." }],
};

describe("landingJsonLd", () => {
  const graph = landingJsonLd(input)["@graph"] as Record<string, unknown>[];
  const byType = (t: string) => graph.find((n) => n["@type"] === t) as Record<string, unknown>;

  it("has the five landing nodes", () => {
    expect(graph.map((n) => n["@type"])).toEqual([
      "Organization",
      "WebSite",
      "Service",
      "HowTo",
      "FAQPage",
    ]);
  });

  it("maps FAQs to Question/Answer", () => {
    expect(byType("FAQPage").mainEntity).toEqual([
      {
        "@type": "Question",
        name: "Apa itu?",
        acceptedAnswer: { "@type": "Answer", text: "Layanan lagu." },
      },
    ]);
  });

  it("numbers HowTo steps from 1", () => {
    const steps = byType("HowTo").step as { position: number }[];
    expect(steps.map((s) => s.position)).toEqual([1, 2]);
  });

  it("uses id-ID by default and en for English", () => {
    expect(byType("WebSite").inLanguage).toBe("id-ID");
    const en = landingJsonLd({ ...input, locale: "en" })["@graph"] as Record<string, unknown>[];
    expect(en[1]?.inLanguage).toBe("en");
  });
});

describe("serializeJsonLd", () => {
  it("escapes < so a value cannot close the script tag", () => {
    const out = serializeJsonLd({ a: "</script><script>alert(1)</script>" });
    expect(out).not.toContain("</script>");
    expect(JSON.parse(out).a).toBe("</script><script>alert(1)</script>");
  });
});

describe("occasionJsonLd", () => {
  const graph = occasionJsonLd({
    path: "/lagu/ulang-tahun",
    name: "Lagu Ulang Tahun",
    title: "Lagu Ulang Tahun Personal",
    description: "Deskripsi.",
    homeLabel: "Beranda",
    faqs: [{ q: "Q?", a: "A." }],
  })["@graph"] as Record<string, unknown>[];

  it("builds a two-level breadcrumb ending at the page URL", () => {
    const crumbs = graph.find((n) => n["@type"] === "BreadcrumbList")?.itemListElement as {
      item: string;
      position: number;
    }[];
    expect(crumbs.map((c) => c.position)).toEqual([1, 2]);
    expect(crumbs[1]?.item).toMatch(/\/lagu\/ulang-tahun$/);
  });

  it("includes the page FAQ", () => {
    const faq = graph.find((n) => n["@type"] === "FAQPage");
    expect((faq?.mainEntity as unknown[]).length).toBe(1);
  });
});
