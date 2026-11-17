"use client";

import Link from "next/link";
import * as React from "react";
import { DownloadIcon, EyeIcon, Loader2Icon, MusicIcon, PlayIcon } from "lucide-react";
import { toast } from "sonner";
import { errorMessage } from "@/lib/api";
import {
  MASTER_DATA_KINDS,
  masterDataApi,
  type MasterDataItemOutput,
  type MasterDataKind,
} from "@/lib/masterdata-api";
import {
  audioBlob,
  promptApi,
  type MusicPlaygroundOutput,
  type PlaygroundOutput,
  type RenderOutput,
  type SampleAnswers,
} from "@/lib/prompt-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";

const SAMPLE: SampleAnswers = {
  recipient_type: "mother",
  recipient_other: "",
  recipient_name: "Sri",
  recipient_nickname: "Mama",
  occasion: "birthday",
  occasion_other: "",
  genre: "pop",
  voice: "surprise",
  special: "Selalu bangun paling pagi dan masakannya bikin rumah terasa hangat.",
  memory: "Waktu hujan deras, Mama menjemputku di sekolah sambil bawa payung kuning.",
  message: "Terima kasih sudah sabar menemani aku tumbuh. Aku sayang Mama.",
  language: "id",
  mood: "",
};

type Options = Record<MasterDataKind, MasterDataItemOutput[]>;

interface PlaygroundPanelProps {
  systemPrompt: string;
  userPrompt: string;
  /** Label of what is being tested, e.g. "draft (dari v3)". */
  draftLabel: string;
}

/**
 * Sample answers → final prompt → step 1 "Generate Lyrics" (active lyrics & style provider) →
 * step 2 "Generate Music" (active music provider) with the lyrics and style prompt from step 1.
 */
export function PlaygroundPanel({ systemPrompt, userPrompt, draftLabel }: PlaygroundPanelProps) {
  const [answers, setAnswers] = React.useState<SampleAnswers>(SAMPLE);
  const [options, setOptions] = React.useState<Options | null>(null);
  const [busy, setBusy] = React.useState<"preview" | "run" | null>(null);
  const [rendered, setRendered] = React.useState<RenderOutput | null>(null);
  const [run, setRun] = React.useState<PlaygroundOutput | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    const ctrl = new AbortController();
    Promise.all(MASTER_DATA_KINDS.map((k) => masterDataApi.list(k.kind, ctrl.signal)))
      .then(([recipient_type = [], occasion = [], genre = [], mood = []]) =>
        setOptions({ recipient_type, occasion, genre, mood }),
      )
      .catch((err) => {
        if (!ctrl.signal.aborted)
          toast.error(errorMessage(err, "Pilihan master data belum termuat."));
      });
    return () => ctrl.abort();
  }, []);

  React.useEffect(() => () => abortRef.current?.abort(), []);

  function set<K extends keyof SampleAnswers>(key: K, value: SampleAnswers[K]) {
    setAnswers((a) => ({ ...a, [key]: value }));
  }

  async function submit(mode: "preview" | "run") {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setBusy(mode);
    if (mode === "run") setRun(null);
    const input = { system_prompt: systemPrompt, user_prompt: userPrompt, answers };
    try {
      if (mode === "preview") {
        setRendered(await promptApi.preview(input, ctrl.signal));
        setRun(null);
      } else {
        const out = await promptApi.playground(input, ctrl.signal);
        setRendered(out.rendered);
        setRun(out);
      }
    } catch (err) {
      if (!ctrl.signal.aborted) toast.error(errorMessage(err, "Playground gagal dijalankan."));
    } finally {
      if (abortRef.current === ctrl) setBusy(null);
    }
  }

  const empty = !systemPrompt.trim() || !userPrompt.trim();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Playground</CardTitle>
        <CardDescription>
          Uji {draftLabel} dengan contoh jawaban questioner. Langkah 1 “Generate Lyrics” memanggil
          provider Lyrics &amp; Style yang aktif; langkah 2 “Generate Music” memanggil provider
          Music yang aktif dengan hasil langkah 1. Setiap langkah memakai kuota/biaya provider.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <fieldset className="grid gap-3 sm:grid-cols-2" disabled={busy !== null}>
          <legend className="sr-only">Contoh jawaban</legend>
          <OptionSelect
            id="pg-recipient"
            label="1. Untuk siapa"
            value={answers.recipient_type}
            items={options?.recipient_type}
            onChange={(v) => set("recipient_type", v)}
          />
          {answers.recipient_type === "other" && (
            <TextField
              id="pg-recipient-other"
              label="Lainnya (penerima)"
              value={answers.recipient_other}
              onChange={(v) => set("recipient_other", v)}
            />
          )}
          <TextField
            id="pg-name"
            label="2. Nama"
            value={answers.recipient_name}
            onChange={(v) => set("recipient_name", v)}
          />
          <TextField
            id="pg-nickname"
            label="Panggilan"
            value={answers.recipient_nickname}
            onChange={(v) => set("recipient_nickname", v)}
          />
          <OptionSelect
            id="pg-occasion"
            label="3. Momen"
            value={answers.occasion}
            items={options?.occasion}
            onChange={(v) => set("occasion", v)}
          />
          {answers.occasion === "other" && (
            <TextField
              id="pg-occasion-other"
              label="Lainnya (momen)"
              value={answers.occasion_other}
              onChange={(v) => set("occasion_other", v)}
            />
          )}
          <OptionSelect
            id="pg-genre"
            label="4. Genre"
            value={answers.genre}
            items={options?.genre}
            withOther={false}
            onChange={(v) => set("genre", v)}
          />
          <div className="space-y-1.5">
            <Label htmlFor="pg-voice">Vokal</Label>
            <NativeSelect
              id="pg-voice"
              value={answers.voice}
              onChange={(e) => set("voice", e.target.value as SampleAnswers["voice"])}
            >
              <option value="surprise">Kejutkan aku</option>
              <option value="female">Wanita</option>
              <option value="male">Pria</option>
            </NativeSelect>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pg-language">Bahasa</Label>
            <NativeSelect
              id="pg-language"
              value={answers.language}
              onChange={(e) => set("language", e.target.value as SampleAnswers["language"])}
            >
              <option value="id">Bahasa Indonesia</option>
              <option value="en">English</option>
            </NativeSelect>
          </div>
          <OptionSelect
            id="pg-mood"
            label="Mood (opsional)"
            value={answers.mood}
            items={options?.mood}
            withOther={false}
            emptyLabel="— Sesuai momen —"
            onChange={(v) => set("mood", v)}
          />
          <AreaField
            id="pg-special"
            label="5. Apa yang membuatnya spesial"
            value={answers.special}
            onChange={(v) => set("special", v)}
          />
          <AreaField
            id="pg-memory"
            label="6. Kenangan favorit"
            value={answers.memory}
            onChange={(v) => set("memory", v)}
          />
          <AreaField
            id="pg-message"
            label="7. Pesan dari hati"
            value={answers.message}
            onChange={(v) => set("message", v)}
          />
        </fieldset>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => void submit("preview")}
            disabled={busy !== null || empty}
          >
            {busy === "preview" ? (
              <Loader2Icon className="animate-spin" aria-hidden />
            ) : (
              <EyeIcon aria-hidden />
            )}
            Lihat prompt final
          </Button>
          <Button onClick={() => void submit("run")} disabled={busy !== null || empty}>
            {busy === "run" ? (
              <Loader2Icon className="animate-spin" aria-hidden />
            ) : (
              <PlayIcon aria-hidden />
            )}
            {busy === "run" ? "Menunggu AI lirik…" : "1. Generate Lyrics"}
          </Button>
        </div>

        <div aria-live="polite" className="space-y-4">
          {run && <RunResult run={run} />}
          {run?.ok && run.result && (
            <MusicStep
              key={`${run.result.title}:${run.duration_ms}`}
              title={run.result.title}
              lyrics={run.result.lyrics}
              stylePrompt={run.result.style_prompt}
            />
          )}
          {rendered && <RenderedPrompt rendered={rendered} defaultOpen={!run} />}
        </div>
      </CardContent>
    </Card>
  );
}

function RunResult({ run }: { run: PlaygroundOutput }) {
  const meta = [run.provider, run.model, `${(run.duration_ms / 1000).toFixed(1)} dtk`]
    .filter(Boolean)
    .join(" · ");
  if (!run.ok) {
    return (
      <div className="space-y-2 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
        <p className="text-sm font-medium text-destructive">
          Gagal{run.error_kind ? ` (${run.error_kind})` : ""}
        </p>
        <p className="text-sm break-words">{run.error}</p>
        <p className="text-xs text-muted-foreground">{meta}</p>
        {run.raw && <RawReply raw={run.raw} open />}
      </div>
    );
  }
  const r = run.result!;
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-semibold">{r.title}</h3>
        <span className="text-xs text-muted-foreground">{meta}</span>
      </div>
      <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
        <dt className="text-muted-foreground">Style prompt</dt>
        <dd className="font-mono text-xs break-words">{r.style_prompt}</dd>
        <dt className="text-muted-foreground">Vokal · bahasa · mood</dt>
        <dd>{[r.vocal_gender || "—", r.language || "—", r.mood || "—"].join(" · ")}</dd>
        <dt className="text-muted-foreground">Panjang lirik</dt>
        <dd className={r.lyrics.length > 2500 ? "text-destructive" : undefined}>
          {r.lyrics.length} karakter{r.lyrics.length > 2500 && " (lebih dari batas 2500)"}
        </dd>
      </dl>
      <pre className="max-h-96 overflow-auto rounded-md bg-muted p-3 text-sm whitespace-pre-wrap">
        {r.lyrics}
      </pre>
      {run.raw && <RawReply raw={run.raw} />}
    </div>
  );
}

const MAX_MUSIC_LYRICS = 3500;
const MAX_MUSIC_STYLE = 2000;

/** Step 2: lyrics + style prompt (editable) → one real call to the active music provider. */
function MusicStep({
  title,
  lyrics: initialLyrics,
  stylePrompt: initialStyle,
}: {
  title: string;
  lyrics: string;
  stylePrompt: string;
}) {
  const [lyrics, setLyrics] = React.useState(initialLyrics);
  const [style, setStyle] = React.useState(initialStyle);
  const [busy, setBusy] = React.useState(false);
  const [out, setOut] = React.useState<MusicPlaygroundOutput | null>(null);
  const [audioUrl, setAudioUrl] = React.useState<string | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => () => abortRef.current?.abort(), []);
  React.useEffect(() => {
    if (!audioUrl) return;
    return () => URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);

  async function generate() {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setBusy(true);
    setOut(null);
    setAudioUrl(null);
    try {
      const res = await promptApi.playgroundMusic(
        { title, lyrics, style_prompt: style },
        ctrl.signal,
      );
      setOut(res);
      if (res.ok && res.audio_base64) {
        setAudioUrl(URL.createObjectURL(audioBlob(res.audio_base64, res.format)));
      }
    } catch (err) {
      if (!ctrl.signal.aborted) toast.error(errorMessage(err, "Generate Music gagal dijalankan."));
    } finally {
      if (abortRef.current === ctrl) setBusy(false);
    }
  }

  const tooLong = lyrics.length > MAX_MUSIC_LYRICS || style.length > MAX_MUSIC_STYLE;
  const meta = out
    ? [out.provider, out.model, `${(out.duration_ms / 1000).toFixed(1)} dtk`]
        .filter(Boolean)
        .join(" · ")
    : "";

  return (
    <section className="space-y-3 rounded-lg border p-4" aria-labelledby="pg-music-title">
      <div>
        <h3 id="pg-music-title" className="font-semibold">
          Langkah 2 · Generate Music
        </h3>
        <p className="text-sm text-muted-foreground">
          Lirik dan style prompt dari langkah 1 dikirim ke provider Music yang aktif. Boleh diubah
          dulu. Satu lagu penuh biasanya butuh beberapa menit.
        </p>
      </div>
      <fieldset className="space-y-3" disabled={busy}>
        <div className="space-y-1.5">
          <Label htmlFor="pg-music-style">Style prompt</Label>
          <Textarea
            id="pg-music-style"
            rows={2}
            value={style}
            onChange={(e) => setStyle(e.target.value)}
          />
          <p
            className={`text-xs ${style.length > MAX_MUSIC_STYLE ? "text-destructive" : "text-muted-foreground"}`}
          >
            {style.length} / {MAX_MUSIC_STYLE}
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pg-music-lyrics">Lirik</Label>
          <Textarea
            id="pg-music-lyrics"
            rows={8}
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            className="font-mono text-xs"
          />
          <p
            className={`text-xs ${lyrics.length > MAX_MUSIC_LYRICS ? "text-destructive" : "text-muted-foreground"}`}
          >
            {lyrics.length} / {MAX_MUSIC_LYRICS}
          </p>
        </div>
      </fieldset>
      <Button onClick={() => void generate()} disabled={busy || !lyrics.trim() || tooLong}>
        {busy ? <Loader2Icon className="animate-spin" aria-hidden /> : <MusicIcon aria-hidden />}
        {busy ? "Menunggu AI musik…" : "2. Generate Music"}
      </Button>

      {out && !out.ok && (
        <div className="space-y-2 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
          <p className="text-sm font-medium text-destructive">
            Gagal{out.error_kind ? ` (${out.error_kind})` : ""}
          </p>
          <p className="text-sm break-words">{out.error}</p>
          <p className="text-xs text-muted-foreground">{meta}</p>
        </div>
      )}
      {out?.ok && audioUrl && (
        <div className="space-y-2 rounded-lg bg-muted/50 p-4">
          <audio controls src={audioUrl} className="w-full" />
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>
              {[
                out.audio_duration_sec ? `${formatSeconds(out.audio_duration_sec)} lagu` : null,
                out.size_bytes ? `${(out.size_bytes / 1_048_576).toFixed(1)} MB` : null,
                meta,
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
            <a
              href={audioUrl}
              download={`playground.${out.format ?? "mp3"}`}
              className="inline-flex items-center gap-1 underline-offset-4 hover:underline"
            >
              <DownloadIcon className="size-3.5" aria-hidden />
              Unduh
            </a>
          </div>
          {out.saved_song_id && (
            <p className="text-xs text-muted-foreground">
              Tersimpan di folder playground. Pilih untuk landing page di{" "}
              <Link href="/admin/samples" className="underline underline-offset-4">
                Sampel Landing
              </Link>
              .
            </p>
          )}
          {out.save_error && <p className="text-xs text-destructive">{out.save_error}</p>}
        </div>
      )}
    </section>
  );
}

function formatSeconds(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function RawReply({ raw, open }: { raw: string; open?: boolean }) {
  return (
    <details open={open}>
      <summary className="cursor-pointer text-xs text-muted-foreground">Balasan mentah AI</summary>
      <pre className="mt-2 max-h-72 overflow-auto rounded-md bg-muted p-3 font-mono text-xs whitespace-pre-wrap">
        {raw}
      </pre>
    </details>
  );
}

function RenderedPrompt({
  rendered,
  defaultOpen,
}: {
  rendered: RenderOutput;
  defaultOpen: boolean;
}) {
  return (
    <details open={defaultOpen} className="rounded-lg border p-4">
      <summary className="cursor-pointer text-sm font-medium">
        Prompt final yang dikirim ke AI
      </summary>
      {rendered.unknown_placeholders.length > 0 && (
        <p className="mt-2 text-sm text-destructive">
          Placeholder tidak dikenal (terkirim apa adanya):{" "}
          {rendered.unknown_placeholders.map((p) => `{{${p}}}`).join(", ")}
        </p>
      )}
      <h4 className="mt-3 text-xs font-medium text-muted-foreground uppercase">System</h4>
      <pre className="mt-1 max-h-72 overflow-auto rounded-md bg-muted p-3 font-mono text-xs whitespace-pre-wrap">
        {rendered.system_prompt}
      </pre>
      <h4 className="mt-3 text-xs font-medium text-muted-foreground uppercase">User</h4>
      <pre className="mt-1 max-h-72 overflow-auto rounded-md bg-muted p-3 font-mono text-xs whitespace-pre-wrap">
        {rendered.user_prompt}
      </pre>
    </details>
  );
}

function OptionSelect({
  id,
  label,
  value,
  items,
  withOther = true,
  emptyLabel,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  items?: MasterDataItemOutput[];
  withOther?: boolean;
  /** When set, the list starts with an empty choice (for optional fields). */
  emptyLabel?: string;
  onChange: (v: string) => void;
}) {
  const known =
    items?.some((it) => it.code === value) ||
    value === "other" ||
    (emptyLabel !== undefined && value === "");
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <NativeSelect id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        {emptyLabel !== undefined && <option value="">{emptyLabel}</option>}
        {!known && <option value={value}>{value || "—"}</option>}
        {items?.map((it) => (
          <option key={it.id} value={it.code}>
            {it.name}
            {!it.is_active && " (disembunyikan)"}
          </option>
        ))}
        {withOther && <option value="other">Lainnya…</option>}
      </NativeSelect>
    </div>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function AreaField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5 sm:col-span-2">
      <Label htmlFor={id}>{label}</Label>
      <Textarea id={id} rows={2} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
