import { ChevronDownIcon } from "lucide-react";
import { SectionHeading } from "./how-it-works";

const FAQS = [
  {
    q: "Apakah saya harus daftar akun dulu?",
    a: "Tidak. Kamu bisa langsung mengisi kuesioner dan mendengarkan preview tanpa akun. Akun hanya dibutuhkan untuk menyimpan dan membuka lagu versi penuh.",
  },
  {
    q: "Berapa lama lagunya jadi?",
    a: "Biasanya hanya beberapa menit setelah kamu mengirim jawaban. Halaman akan otomatis menampilkan lagu begitu siap.",
  },
  {
    q: "Bagaimana kalau saya kurang suka hasilnya?",
    a: "Kamu bisa membuat ulang (regenerate) lagu dari jawaban yang sama untuk mendapatkan versi lirik dan aransemen yang berbeda.",
  },
  {
    q: "Apa bedanya preview dan lagu penuh?",
    a: "Preview berisi awal lagu sampai reff pertama selesai. Lagu penuh berisi seluruh lagu beserta lirik lengkap yang bisa diunduh dan dibagikan.",
  },
  {
    q: "Bahasa apa saja yang didukung?",
    a: "Saat ini lirik bisa dibuat dalam Bahasa Indonesia dan Bahasa Inggris.",
  },
];

/** Accordion FAQ built on <details>, so it works without JavaScript. */
export function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-4">
        <SectionHeading eyebrow="FAQ" title="Pertanyaan yang sering ditanyakan" />
        <div className="mt-12 divide-y rounded-2xl border bg-card shadow-sm">
          {FAQS.map((f) => (
            <details
              key={f.q}
              className="group px-6 py-5 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                {f.q}
                <ChevronDownIcon
                  className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
