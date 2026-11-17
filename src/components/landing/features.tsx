import {
  AudioLinesIcon,
  ClockIcon,
  LanguagesIcon,
  MessageCircleHeartIcon,
  MicIcon,
  SmileIcon,
} from "lucide-react";
import { SectionHeading } from "./how-it-works";

const FEATURES = [
  {
    icon: MessageCircleHeartIcon,
    title: "Lirik dari kenanganmu",
    body: "Nama panggilan, momen spesial, dan pesanmu dirangkai jadi lirik yang hanya cocok untuk dia.",
  },
  {
    icon: AudioLinesIcon,
    title: "Banyak pilihan genre",
    body: "Pop, Ballad, Akustik, R&B, Jazz, Dangdut, Keroncong, sampai lagu nina bobo.",
  },
  {
    icon: MicIcon,
    title: "Pilih suara penyanyi",
    body: "Vokal pria, wanita, atau biarkan kami yang memberi kejutan.",
  },
  {
    icon: SmileIcon,
    title: "Atur suasananya",
    body: "Romantis, ceria, haru, lucu, atau penuh semangat — sesuaikan dengan momennya.",
  },
  {
    icon: LanguagesIcon,
    title: "Bahasa Indonesia & Inggris",
    body: "Tulis lirik dalam bahasa yang paling dekat di hati kalian berdua.",
  },
  {
    icon: ClockIcon,
    title: "Cepat, tanpa ribet",
    body: "Isi kuesioner dalam beberapa menit, langsung dengarkan preview tanpa membuat akun.",
  },
];

const GENRES = ["Pop", "Ballad", "Acoustic", "R&B", "Rock", "Jazz", "Dangdut", "Keroncong", "EDM"];

/** Feature grid + genre chips. */
export function Features() {
  return (
    <section id="fitur" className="scroll-mt-20 bg-muted/40 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeading
          eyebrow="Kenapa Lagu Untukmu"
          title="Hadiah yang benar-benar personal"
          description="Bukan lagu pasaran. Setiap lagu dibuat dari nol berdasarkan ceritamu."
        />

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-linear-to-br group-hover:from-primary group-hover:to-highlight group-hover:text-primary-foreground">
                <f.icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {GENRES.map((g) => (
            <span
              key={g}
              className="rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground"
            >
              {g}
            </span>
          ))}
          <span className="rounded-full px-3 py-1 text-xs font-medium text-muted-foreground">
            dan lainnya…
          </span>
        </div>
      </div>
    </section>
  );
}
