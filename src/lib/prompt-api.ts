import { api, unwrap } from "@/lib/api";

// Mirrors backend internal/module/prompt/dto.go.

export interface PromptVersion {
  /** "" for the built-in default. */
  id: string;
  name: string;
  /** 0 for the built-in default. */
  version: number;
  system_prompt: string;
  user_prompt: string;
  note: string;
  is_active: boolean;
  created_by_admin_id?: string;
  created_at?: string;
}

export interface PromptListOutput {
  versions: PromptVersion[];
  default: PromptVersion;
  /** True while no saved version is active: new jobs use the built-in default. */
  default_in_use: boolean;
  placeholders: string[];
}

export interface CreateVersionInput {
  name: string;
  system_prompt: string;
  user_prompt: string;
  note?: string;
  activate?: boolean;
}

export interface SampleAnswers {
  recipient_type: string;
  recipient_other: string;
  recipient_name: string;
  recipient_nickname: string;
  occasion: string;
  occasion_other: string;
  genre: string;
  voice: "male" | "female" | "surprise";
  special: string;
  memory: string;
  message: string;
  language: "id" | "en";
  mood: string;
}

export interface PlaygroundInput {
  system_prompt: string;
  user_prompt: string;
  answers: SampleAnswers;
}

export interface RenderOutput {
  system_prompt: string;
  user_prompt: string;
  unknown_placeholders: string[];
}

export interface LyricsOutput {
  title: string;
  lyrics: string;
  style_prompt: string;
  vocal_gender: string;
  language: string;
  mood: string;
}

export interface PlaygroundOutput {
  rendered: RenderOutput;
  ok: boolean;
  result?: LyricsOutput;
  raw?: string;
  error_kind?: string;
  error?: string;
  provider?: string;
  model?: string;
  duration_ms: number;
}

export interface MusicPlaygroundInput {
  /** Saved as the playground song's title. */
  title?: string;
  lyrics: string;
  style_prompt: string;
}

export interface MusicPlaygroundOutput {
  ok: boolean;
  /** The full song, base64, for instant playback. It is also saved as a playground song. */
  audio_base64?: string;
  format?: string;
  audio_duration_sec?: number;
  size_bytes?: number;
  error_kind?: string;
  error?: string;
  provider?: string;
  model?: string;
  duration_ms: number;
  /** Playground song id (stored at playground/<id>.<format>); pick it for the landing page in Sampel Landing. */
  saved_song_id?: string;
  /** Set when the song was generated but could not be saved to storage. */
  save_error?: string;
}

const ROOT = "/admin/prompts";
const noToken = { token: null };

export const promptApi = {
  async list(signal?: AbortSignal): Promise<PromptListOutput> {
    return unwrap(await api.get<PromptListOutput>(ROOT, { signal, ...noToken }));
  },

  async create(input: CreateVersionInput): Promise<PromptVersion> {
    return unwrap(await api.post<PromptVersion>(ROOT, input, noToken));
  },

  async activate(id: string): Promise<PromptVersion> {
    return unwrap(
      await api.post<PromptVersion>(`${ROOT}/${encodeURIComponent(id)}/activate`, {}, noToken),
    );
  },

  async useDefault(): Promise<string> {
    return (await api.post(`${ROOT}/use-default`, {}, noToken)).message;
  },

  async archive(id: string): Promise<string> {
    return (await api.delete(`${ROOT}/${encodeURIComponent(id)}`, noToken)).message;
  },

  async preview(input: PlaygroundInput, signal?: AbortSignal): Promise<RenderOutput> {
    return unwrap(await api.post<RenderOutput>(`${ROOT}/preview`, input, { signal, ...noToken }));
  },

  /** Calls the real lyrics & style provider: can take a minute and costs tokens. */
  async playground(input: PlaygroundInput, signal?: AbortSignal): Promise<PlaygroundOutput> {
    return unwrap(
      await api.post<PlaygroundOutput>(`${ROOT}/playground`, input, { signal, ...noToken }),
    );
  },

  /** Calls the real music provider once: takes minutes and costs credits. */
  async playgroundMusic(
    input: MusicPlaygroundInput,
    signal?: AbortSignal,
  ): Promise<MusicPlaygroundOutput> {
    return unwrap(
      await api.post<MusicPlaygroundOutput>(`${ROOT}/playground/music`, input, {
        signal,
        ...noToken,
      }),
    );
  },
};

/** Base64 audio from the music playground → a Blob the <audio> element can play. */
export function audioBlob(base64: string, format = "mp3"): Blob {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: format === "wav" ? "audio/wav" : "audio/mpeg" });
}

/** Same rule as the backend: only exact {{name}} is filled. */
export function unknownPlaceholders(text: string, known: string[]): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(/\{\{([^{}]*)\}\}/g)) {
    const name = m[1] ?? "";
    if (!known.includes(name) && !out.includes(name)) out.push(name);
  }
  return out;
}
