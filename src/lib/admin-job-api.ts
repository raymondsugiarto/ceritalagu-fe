import { api, unwrap, type ListOutput, type PaginationInput } from "@/lib/api";
import type { JobStatus } from "@/lib/song-api";

// Mirrors backend internal/module/song/admin.go.

export type JobFilter = "active" | "completed" | "failed" | "all";

export interface ListJobsInput extends PaginationInput {
  filter?: JobFilter;
  search?: string;
}

export interface AdminJobOutput {
  id: string;
  status: JobStatus;
  status_message: string;
  attempt: number;
  questionnaire_id: string;
  user_id?: string;
  user_email?: string;
  guest_session_id?: string;
  regenerate_of_job_id?: string;
  lyrics_provider?: string;
  music_provider?: string;
  error_code?: string;
  /** Internal provider detail, admin only. */
  error_message?: string;
  /** Step name → milliseconds. */
  timings: Record<string, number>;
  song_id?: string;
  song_title?: string;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  elapsed_ms: number;
}

export interface JobStatsOutput {
  counts: Partial<Record<JobStatus, number>>;
  active: number;
}

const ROOT = "/admin/song-jobs";

export const adminJobApi = {
  async list(input: ListJobsInput, signal?: AbortSignal): Promise<ListOutput<AdminJobOutput>> {
    return unwrap(await api.get<ListOutput<AdminJobOutput>>(ROOT, { query: { ...input }, signal }));
  },

  async stats(signal?: AbortSignal): Promise<JobStatsOutput> {
    return unwrap(await api.get<JobStatsOutput>(`${ROOT}/stats`, { signal }));
  },
};

/** "1m 05s", "850 ms". */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms} ms`;
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${String(s % 60).padStart(2, "0")}s`;
}
