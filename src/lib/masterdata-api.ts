import { api, unwrap } from "@/lib/api";

// Mirrors backend internal/module/masterdata/dto.go.

export type MasterDataKind = "recipient_type" | "occasion" | "genre" | "mood";

export interface MasterDataKindInfo {
  kind: MasterDataKind;
  title: string;
  /** Questionnaire step that shows this list. */
  step: number;
  hintLabel: string;
  hintHelp: string;
}

export const MASTER_DATA_KINDS: MasterDataKindInfo[] = [
  {
    kind: "recipient_type",
    title: "Penerima",
    step: 1,
    hintLabel: "Prompt hint",
    hintHelp: "Sudut pandang lagu untuk AI lirik, mis. “Sung by a child to their mother”.",
  },
  {
    kind: "occasion",
    title: "Momen",
    step: 3,
    hintLabel: "Prompt hint",
    hintHelp: "Nuansa yang diminta ke AI lirik, mis. “Birthday celebration: joyful”.",
  },
  {
    kind: "genre",
    title: "Genre",
    step: 4,
    hintLabel: "Style hint",
    hintHelp: "Ditambahkan ke style prompt musik, mis. “acoustic guitar, warm vocals”.",
  },
  {
    kind: "mood",
    title: "Mood",
    step: 4,
    hintLabel: "Prompt hint",
    hintHelp: "Nuansa lagu untuk AI lirik, mis. “Warm: cozy and comforting, heartfelt”.",
  },
];

export interface MasterDataItemOutput {
  id: string;
  kind: MasterDataKind;
  code: string;
  name: string;
  description: string;
  icon: string;
  hint: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  /** Every non-default locale, e.g. `{ en: { name: "Mom", description: "" } }`; "" = not filled. */
  translations: Record<string, MasterDataTranslationOutput>;
}

export interface MasterDataTranslationOutput {
  name: string;
  description: string;
}

/** One locale's text; an omitted field is unchanged, "" clears it (falls back to the base text). */
export interface MasterDataTranslationInput {
  name?: string;
  description?: string;
}

export interface CreateItemInput {
  code: string;
  name: string;
  description?: string;
  icon?: string;
  hint?: string;
  sort_order?: number;
  is_active?: boolean;
  /** Per non-default locale (only `en` today). */
  translations?: Record<string, MasterDataTranslationInput>;
}

/** Only set fields change; the code is fixed after creation. */
export type UpdateItemInput = Partial<Omit<CreateItemInput, "code">>;

/** A public questionnaire option (no prompt hint). */
export interface OptionOutput {
  code: string;
  /** Resolved for the request locale (NEXT_LOCALE cookie → Accept-Language → id). */
  name: string;
  description?: string;
  icon?: string;
  /** Locale the name came from; "id" when an `en` request fell back to the base text. */
  locale: "id" | "en";
}

export interface QuestionnaireOptionsOutput {
  recipient_types: OptionOutput[];
  occasions: OptionOutput[];
  genres: OptionOutput[];
  moods: OptionOutput[];
}

const ROOT = "/admin/master-data";
const noToken = { token: null };

export const masterDataApi = {
  async list(kind: MasterDataKind, signal?: AbortSignal): Promise<MasterDataItemOutput[]> {
    return unwrap(await api.get<MasterDataItemOutput[]>(`${ROOT}/${kind}`, { signal, ...noToken }));
  },

  async create(kind: MasterDataKind, input: CreateItemInput): Promise<MasterDataItemOutput> {
    return unwrap(await api.post<MasterDataItemOutput>(`${ROOT}/${kind}`, input, noToken));
  },

  async update(
    kind: MasterDataKind,
    id: string,
    input: UpdateItemInput,
  ): Promise<MasterDataItemOutput> {
    return unwrap(
      await api.patch<MasterDataItemOutput>(
        `${ROOT}/${kind}/${encodeURIComponent(id)}`,
        input,
        noToken,
      ),
    );
  },

  /** Archives (soft-deletes) a row and returns the backend's message. */
  async archive(kind: MasterDataKind, id: string): Promise<string> {
    return (await api.delete(`${ROOT}/${kind}/${encodeURIComponent(id)}`, noToken)).message;
  },
};

export const questionnaireOptionsApi = {
  async get(signal?: AbortSignal): Promise<QuestionnaireOptionsOutput> {
    return unwrap(await api.get<QuestionnaireOptionsOutput>("/questionnaire-options", { signal }));
  },
};
