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
  /** Second take of the same music request (Suno returns two); null when there is none. */
  alternate: AdminAlternateOutput | null;
  created_at: string;
}

/** Spare take kept for "Buat Ulang". Mirrors backend AdminAlternateOutput. */
export interface AdminAlternateOutput {
  id: string;
  duration_sec: number;
  preview_duration_sec: number;
  /** Set once a "Buat Ulang" turned this take into a song. */
  used_by_job_id?: string;
  /** The song it became, when used. */
  used_song_id?: string;
  /** Admin preview stream of the take. */
  preview_url: string;
  /** Admin full stream of the take. Append "&download=1" to save it. */
  audio_url: string;
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

/** Which customer email the admin sends. Mirrors backend notification.EmailKind. */
export type SongEmailKind = "song_ready" | "payment_receipt";

export interface SendSongEmailInput {
  kind: SongEmailKind;
  /** Test inbox; empty sends to the customer. */
  to?: string;
}

/** Mirrors backend notification.SendEmailOutput. */
export interface SendSongEmailOutput {
  kind: SongEmailKind;
  to: string;
  template_id?: number;
  attached: boolean;
  /** Sent to the override address instead of the customer. */
  test: boolean;
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

  async sendEmail(id: string, input: SendSongEmailInput): Promise<SendSongEmailOutput> {
    return unwrap(
      await api.post<SendSongEmailOutput>(`${ROOT}/${encodeURIComponent(id)}/email`, input),
    );
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
