"use client";

import * as React from "react";
import { errorMessage } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { adminSongApi, type AdminSongAnswersOutput } from "@/lib/admin-song-api";
import { QUESTIONNAIRE_STEPS } from "@/lib/questionnaire";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

const VOICE: Record<string, string> = {
  male: "Pria",
  female: "Wanita",
  surprise: "Kejutkan aku",
};
const LANGUAGE: Record<string, string> = { id: "Indonesia", en: "Inggris" };

type State =
  | { kind: "loading" }
  | { kind: "ok"; data: AdminSongAnswersOutput }
  | { kind: "error"; message: string };

/** Shows what the customer filled in questionnaire steps 1-8 for one song. */
export function AnswersDialog({
  song,
  onOpenChange,
}: {
  song: { id: string; title: string } | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, setState] = React.useState<State>({ kind: "loading" });

  React.useEffect(() => {
    if (!song) return;
    const ctrl = new AbortController();
    setState({ kind: "loading" });
    adminSongApi
      .answers(song.id, ctrl.signal)
      .then((data) => setState({ kind: "ok", data }))
      .catch((err) => {
        if (!ctrl.signal.aborted)
          setState({ kind: "error", message: errorMessage(err, "Gagal memuat jawaban.") });
      });
    return () => ctrl.abort();
  }, [song]);

  return (
    <Dialog open={song !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Jawaban customer</DialogTitle>
          <DialogDescription>
            {song?.title || "Tanpa judul"}
            {state.kind === "ok" && state.data.submitted_at
              ? ` · dikirim ${formatDateTime(state.data.submitted_at)}`
              : null}
          </DialogDescription>
        </DialogHeader>
        {state.kind === "loading" && (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        )}
        {state.kind === "error" && (
          <div
            role="alert"
            className="rounded-md bg-destructive/10 px-4 py-6 text-center text-sm text-destructive"
          >
            {state.message}
          </div>
        )}
        {state.kind === "ok" && <AnswerSteps a={state.data} />}
      </DialogContent>
    </Dialog>
  );
}

function label(code: string, name: string, other: string): string {
  if (code === "other") return other ? `Lainnya: ${other}` : "Lainnya";
  return name || code || "—";
}

function AnswerSteps({ a }: { a: AdminSongAnswersOutput }) {
  const rows: Record<number, [string, string][]> = {
    1: [["Penerima", label(a.recipient_type, a.recipient_type_name, a.recipient_other)]],
    2: [
      ["Nama", a.recipient_name],
      ["Panggilan", a.recipient_nickname],
    ],
    3: [["Momen", label(a.occasion, a.occasion_name, a.occasion_other)]],
    4: [
      ["Genre", a.genre_name || a.genre],
      ["Suara", VOICE[a.voice] ?? a.voice],
      ["Bahasa", LANGUAGE[a.language] ?? a.language],
      ["Mood", a.mood_name || a.mood],
    ],
    5: [["Spesial", a.special]],
    6: [["Kenangan", a.memory]],
    7: [["Pesan", a.message]],
    8: [
      ["Email", a.email],
      ["No. HP", a.phone],
    ],
  };

  return (
    <ol className="space-y-3 text-sm">
      {QUESTIONNAIRE_STEPS.map((s) => (
        <li key={s.step} className="rounded-md border p-3">
          <p className="mb-2 flex items-center gap-2 font-medium">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">
              {s.step}
            </span>
            {s.title}
          </p>
          <dl className="grid grid-cols-[6rem_1fr] gap-x-3 gap-y-1">
            {(rows[s.step] ?? []).map(([k, v]) => (
              <React.Fragment key={k}>
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="break-words whitespace-pre-wrap">{v || "—"}</dd>
              </React.Fragment>
            ))}
          </dl>
        </li>
      ))}
    </ol>
  );
}
