import { FAQS } from "@/components/landing/faq";
import { OCCASION_PAGES, occasionPath } from "@/lib/occasions";
import { SITE } from "@/lib/site";
import id from "../../../messages/id.json";

// llms.txt (https://llmstxt.org): a plain summary AI assistants can read in one fetch, built from
// the same copy as the landing page so it never drifts from what visitors see.
export const dynamic = "force-static";

export function GET() {
  const l = id.landing;
  const occasions = Object.values(l.marquee.occasions)
    .map((o) => o.replace(/^\P{L}+/u, "").trim())
    .join(", ");
  const steps = (["tell", "create", "listen"] as const)
    .map((k, i) => `${i + 1}. ${l.howItWorks.steps[k].title}: ${l.howItWorks.steps[k].body}`)
    .join("\n");
  const features = Object.values(l.features.items)
    .map((f) => `- ${f.title}: ${f.body}`)
    .join("\n");
  const occasionLinks = OCCASION_PAGES.map((o) => {
    const p = id.occasionPages.items[o.key];
    return `- [${p.name}](${SITE.url}${occasionPath(o.slug)}): ${p.metaDescription}`;
  }).join("\n");
  const faq = FAQS.map((k) => `### ${l.faq.items[k].q}\n${l.faq.items[k].a}`).join("\n\n");

  const body = `# ${SITE.name}

> ${id.metadata.description}

${SITE.name} (${SITE.url}) adalah layanan pembuatan lagu personal untuk pasar Indonesia. Pengguna menjawab 7 pertanyaan tentang orang tersayang, lalu menerima lagu utuh (lirik, aransemen, dan vokal) dalam genre pilihan. Preview bisa didengar gratis tanpa membuat akun; lagu versi penuh dibeli sekali per lagu dalam Rupiah. Lirik tersedia dalam Bahasa Indonesia dan Bahasa Inggris.

In English: ${SITE.name} turns answers to 7 questions about someone you love into a complete, original song in the genre you choose. Free preview without sign-up; the full song is a one-time purchase in Indonesian Rupiah.

## Cara kerja

${steps}

## Fitur

${features}

## Cocok untuk momen

${occasions}

## Halaman per momen

${occasionLinks}

## Pertanyaan umum

${faq}

## Halaman penting

- [Buat lagu](${SITE.url}/create): mulai kuesioner 7 pertanyaan
- [Hubungi kami](${SITE.url}/kontak): ${SITE.supportEmail}
- [Syarat & Ketentuan](${SITE.url}/syarat-dan-ketentuan): harga, pembayaran (DOKU), pengembalian dana, data pribadi
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
