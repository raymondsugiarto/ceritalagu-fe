import { api, unwrap, type ListOutput, type PaginationInput } from "@/lib/api";

// Mirrors backend internal/module/song/admin_songs.go.

export type SongAccess = "all" | "unlocked" | "locked";

export interface ListSongsInput extends PaginationInput {
  access?: SongAccess;
  search?: string;
}

export interface AdminSongOutput {
  id: string;
  job_id: string;
  questionnaire_id: string;
  title: string;
  lyrics: string;
  style_prompt: string;
  genre: string;
  vocal_gender: string;
  language: string;
  mood: string;
  duration_sec: number;
  preview_duration_sec: number;
  user_id?: string;
  user_email?: string;
  guest_session_id?: string;
  is_unlocked: boolean;
  unlocked_at: string | null;
  expires_at: string | null;
  /** Admin preview stream (no purchase check). */
  preview_url: string;
  /** Admin full-song stream (no purchase check). Append "&download=1" to save it. */
  audio_url: string;
  created_at: string;
}

export interface SongStatsOutput {
  total: number;
  unlocked: number;
  guest: number;
}

/** Questionnaire answers (steps 1-8) behind a song. *_name are master-data labels. */
export interface AdminSongAnswersOutput {
  questionnaire_id: string;
  recipient_type: string;
  recipient_type_name: string;
  recipient_other: string;
  recipient_name: string;
  recipient_nickname: string;
  occasion: string;
  occasion_name: string;
  occasion_other: string;
  genre: string;
  genre_name: string;
  voice: string;
  language: string;
  mood: string;
  mood_name: string;
  special: string;
  memory: string;
  message: string;
  email: string;
  phone: string;
  submitted_at: string | null;
}

const ROOT = "/admin/songs";

export const adminSongApi = {
  async list(input: ListSongsInput, signal?: AbortSignal): Promise<ListOutput<AdminSongOutput>> {
    return unwrap(
      await api.get<ListOutput<AdminSongOutput>>(ROOT, { query: { ...input }, signal }),
    );
  },

  async stats(signal?: AbortSignal): Promise<SongStatsOutput> {
    return unwrap(await api.get<SongStatsOutput>(`${ROOT}/stats`, { signal }));
  },

  async answers(id: string, signal?: AbortSignal): Promise<AdminSongAnswersOutput> {
    return unwrap(
      await api.get<AdminSongAnswersOutput>(`${ROOT}/${encodeURIComponent(id)}/answers`, {
        signal,
      }),
    );
  },
};

/** "3:05". */
export function formatSeconds(sec: number): string {
  if (!sec) return "—";
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}
