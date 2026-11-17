import { api, unwrap } from "@/lib/api";

// Mirrors backend internal/module/questionnaire/dto.go.

export type Voice = "male" | "female" | "surprise";
export type SongLanguage = "id" | "en";

export interface CreateQuestionnaireInput {
  /** recipient_type code, or "other" with recipient_other. */
  recipient_type: string;
  recipient_other?: string;
  recipient_name: string;
  recipient_nickname?: string;
  /** occasion code, or "other" with occasion_other. */
  occasion: string;
  occasion_other?: string;
  genre: string;
  voice: Voice;
  special: string;
  memory: string;
  message: string;
  language: SongLanguage;
  mood?: string;
  /** Last step: creates (or finds) the user by email. */
  email: string;
  phone: string;
}

export interface QuestionnaireOutput extends Required<
  Omit<CreateQuestionnaireInput, "email" | "phone">
> {
  id: string;
  submitted_at: string | null;
  created_at: string;
}

const ROOT = "/questionnaires";

export const questionnaireApi = {
  async create(input: CreateQuestionnaireInput): Promise<QuestionnaireOutput> {
    return unwrap(await api.post<QuestionnaireOutput>(ROOT, input));
  },

  async get(id: string): Promise<QuestionnaireOutput> {
    return unwrap(await api.get<QuestionnaireOutput>(`${ROOT}/${encodeURIComponent(id)}`));
  },
};
