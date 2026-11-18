import { ApiError, api, unwrap } from "@/lib/api";

// Mirrors backend internal/module/song/dto.go.

export type JobStatus =
  "queued" | "generating_lyrics" | "generating_music" | "processing_audio" | "completed" | "failed";

export interface CreateSongJobInput {
  questionnaire_id: string;
}

export interface SongJobOutput {
  id: string;
  questionnaire_id: string;
  status: JobStatus;
  status_message: string;
  error_code?: string;
  error_message?: string;
  song_id?: string;
  regenerate_of_job_id?: string;
  regenerates_left: number;
  created_at: string;
  finished_at: string | null;
}

export interface SongOutput {
  id: string;
  job_id: string;
  title: string;
  genre: string;
  vocal_gender: string;
  language: string;
  mood: string;
  duration_sec: number;
  preview_duration_sec: number;
  /** Same-origin URL of the preview audio (ends after the first chorus). */
  preview_url: string;
  lyrics_preview: string;
  /** Full song audio; only present once the song is unlocked (bought). */
  audio_url?: string;
  /** Only present once the song is unlocked. */
  lyrics?: string;
  is_unlocked: boolean;
  expires_at: string | null;
  created_at: string;
}

const JOBS = "/song-jobs";
const job = (id: string) => `${JOBS}/${encodeURIComponent(id)}`;

/** Pipeline steps in order, for the progress indicator. */
export const JOB_STEPS: JobStatus[] = [
  "queued",
  "generating_lyrics",
  "generating_music",
  "processing_audio",
  "completed",
];

export function isFinal(status: JobStatus): boolean {
  return status === "completed" || status === "failed";
}

export const songApi = {
  async createJob(input: CreateSongJobInput): Promise<SongJobOutput> {
    return unwrap(await api.post<SongJobOutput>(JOBS, input));
  },

  async getJob(id: string, signal?: AbortSignal): Promise<SongJobOutput> {
    return unwrap(await api.get<SongJobOutput>(job(id), { signal }));
  },

  async regenerate(jobId: string): Promise<SongJobOutput> {
    return unwrap(await api.post<SongJobOutput>(`${job(jobId)}/regenerate`));
  },

  async getSong(id: string, signal?: AbortSignal): Promise<SongOutput> {
    return unwrap(await api.get<SongOutput>(`/songs/${encodeURIComponent(id)}`, { signal }));
  },
};

/** Which load error to show for a failed song/job load (`common.loadError.<kind>`). */
export type LoadErrorKind = "notFound" | "failed";

export function loadErrorKind(err: unknown): LoadErrorKind {
  return err instanceof ApiError && err.code === "NOT_FOUND" ? "notFound" : "failed";
}

/** Customer message for a failed job, from its stable `error_code` (`job.failure.<kind>`). */
export type JobFailureKind = "contentFlagged" | "busy" | "generic";

/** Mirrors backend song.UserMessage (aiprovider.ErrorKind → customer text). */
export function jobFailureKind(errorCode: string | undefined): JobFailureKind {
  switch (errorCode) {
    case "content_flagged":
      return "contentFlagged";
    case "rate_limited":
    case "timeout":
    case "unavailable":
    case "invalid_output":
      return "busy";
    default:
      return "generic";
  }
}
