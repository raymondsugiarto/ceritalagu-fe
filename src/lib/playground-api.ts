import { api, unwrap, type ListOutput, type PaginationInput } from "@/lib/api";

// Mirrors backend internal/module/playground/dto.go.

/** A full song an admin generated in the prompt playground (stored at playground/<id>.<format>). */
export interface PlaygroundSongOutput {
  id: string;
  title: string;
  caption: string;
  lyrics: string;
  style_prompt: string;
  /** Admin-only audio URL (cookie auth). */
  audio_url: string;
  format: string;
  duration_sec: number;
  size_bytes: number;
  provider: string;
  model: string;
  show_on_landing: boolean;
  landing_order: number;
  created_at: string;
}

export interface UpdatePlaygroundSongInput {
  title?: string;
  caption?: string;
  show_on_landing?: boolean;
  landing_order?: number;
}

export interface ListPlaygroundSongsInput extends PaginationInput {
  /** Only the songs shown on the landing page. */
  landing?: boolean;
}

/** A public landing-page sample. */
export interface SampleOutput {
  id: string;
  title: string;
  caption: string;
  lyrics: string;
  audio_url: string;
  duration_sec: number;
}

const ROOT = "/admin/playground-songs";
const byId = (id: string) => `${ROOT}/${encodeURIComponent(id)}`;
const noToken = { token: null };

export const playgroundApi = {
  async list(
    input: ListPlaygroundSongsInput = {},
    signal?: AbortSignal,
  ): Promise<ListOutput<PlaygroundSongOutput>> {
    return unwrap(
      await api.get<ListOutput<PlaygroundSongOutput>>(ROOT, {
        query: { ...input, landing: input.landing ? "true" : undefined },
        signal,
        ...noToken,
      }),
    );
  },

  async update(id: string, input: UpdatePlaygroundSongInput): Promise<PlaygroundSongOutput> {
    return unwrap(await api.patch<PlaygroundSongOutput>(byId(id), input, noToken));
  },

  /** Soft delete: hides it everywhere; the file stays in storage. */
  async archive(id: string): Promise<string> {
    return (await api.delete(byId(id), noToken)).message;
  },
};

export const sampleApi = {
  async list(signal?: AbortSignal): Promise<SampleOutput[]> {
    return unwrap(await api.get<SampleOutput[]>("/samples", { signal, ...noToken }));
  },
};
