"use client";

import * as React from "react";
import { Music2Icon } from "lucide-react";
import { sampleApi, type SampleOutput } from "@/lib/playground-api";
import { SectionHeading } from "./how-it-works";

/**
 * Songs the admin picked from the playground (Admin → Sampel Landing). Renders nothing until at
 * least one is picked, so the landing page never shows an empty section.
 */
export function Samples() {
  const [samples, setSamples] = React.useState<SampleOutput[]>([]);

  React.useEffect(() => {
    const ctrl = new AbortController();
    sampleApi
      .list(ctrl.signal)
      .then(setSamples)
      .catch(() => {
        // A missing sample section is fine; the rest of the landing page still works.
      });
    return () => ctrl.abort();
  }, []);

  if (samples.length === 0) return null;

  return (
    <section id="contoh-lagu" className="scroll-mt-20 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeading
          eyebrow="Contoh lagu"
          title="Dengarkan lagu yang sudah kami buat"
          description="Setiap lagu ditulis dari cerita yang berbeda. Putar dan rasakan sendiri."
        />
        <ul className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {samples.map((s) => (
            <li key={s.id} className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary to-highlight text-primary-foreground">
                  <Music2Icon className="size-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <h3 className="font-semibold break-words">{s.title}</h3>
                  {s.caption && <p className="text-sm text-muted-foreground">{s.caption}</p>}
                </div>
              </div>
              <audio controls preload="none" src={s.audio_url} className="w-full" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
