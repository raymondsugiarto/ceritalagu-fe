import { HeadphonesIcon, ListChecksIcon, WandSparklesIcon } from "lucide-react";

const STEPS = [
  {
    icon: ListChecksIcon,
    title: "Ceritakan tentang dia",
    body: "Jawab 7 pertanyaan singkat: siapa dia, momennya, kenangan kalian, dan pesan yang ingin kamu sampaikan.",
  },
  {
    icon: WandSparklesIcon,
    title: "Kami ciptakan lagunya",
    body: "Kami menulis lirik dari ceritamu, lalu mengaransemen dan menyanyikannya sesuai genre, suara, dan mood pilihanmu.",
  },
  {
    icon: HeadphonesIcon,
    title: "Dengarkan & bagikan",
    body: "Putar preview gratis sampai reff pertama. Suka hasilnya? Buka lagu versi penuh dan kirim sebagai hadiah.",
  },
];

/** Three-step explainer. */
export function HowItWorks() {
  return (
    <section id="cara-kerja" className="scroll-mt-20 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeading
          eyebrow="Cara kerja"
          title="Dari cerita jadi lagu dalam 3 langkah"
          description="Tidak perlu bisa bernyanyi atau menulis lirik. Cukup ceritakan apa yang kamu rasakan."
        />

        <ol className="relative mt-14 grid gap-6 md:grid-cols-3">
          {/* Connector line between the step badges on desktop. */}
          <div
            aria-hidden
            className="absolute top-7 right-[16%] left-[16%] hidden h-px bg-linear-to-r from-primary/40 via-highlight/40 to-primary/40 md:block"
          />
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative flex flex-col items-center text-center">
              <span className="relative flex size-14 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-highlight text-primary-foreground shadow-lg shadow-primary/25">
                <s.icon className="size-6" aria-hidden />
                <span className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full border bg-background text-xs font-bold text-foreground">
                  {i + 1}
                </span>
              </span>
              <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 max-w-xs text-sm text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: string;
}

/** Centered eyebrow + title + description used by every landing section. */
export function SectionHeading({ eyebrow, title, description }: SectionHeadingProps) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-semibold tracking-wide text-highlight uppercase">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-bold tracking-tight text-balance md:text-4xl">{title}</h2>
      {description && <p className="mt-4 text-pretty text-muted-foreground">{description}</p>}
    </div>
  );
}
