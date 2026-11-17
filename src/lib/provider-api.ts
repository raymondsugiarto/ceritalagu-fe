import { api, unwrap } from "@/lib/api";

// Types mirror the backend DTOs in internal/module/aiprovider/dto.go (names and snake_case fields).

export type ProviderCategory = "lyrics_style" | "music";

export const CATEGORY_LABELS: Record<ProviderCategory, string> = {
  lyrics_style: "Lyrics & Style Generator",
  music: "Music Generator",
};

export interface ProviderOutput {
  id: string;
  category: ProviderCategory;
  adapter_type: string;
  name: string;
  base_url: string;
  model: string;
  /** e.g. "****abcd"; the full key never leaves the server. */
  api_key_masked: string;
  params: Record<string, unknown>;
  timeout_sec: number;
  max_retries: number;
  /** 1 is tried first; active providers with the same number share jobs at random. */
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdapterOutput {
  type: string;
  category: ProviderCategory;
  label: string;
  /** Short setup note (where to get a key, billing), shown under the adapter picker. */
  help?: string;
  default_base_url: string;
  default_model: string;
  models: string[];
  /** Adapter-specific settings stored in `params`. */
  params: ParamSpec[];
}

/** How a param is stored in JSON: string/text as a string, int/float as a number. */
export type ParamKind = "string" | "text" | "int" | "float";

export interface ParamSpec {
  key: string;
  label: string;
  kind: ParamKind;
  /** When set, the form shows a dropdown of these values. */
  options?: string[];
  min?: number;
  max?: number;
  /** Shown when empty; describes the adapter default. */
  placeholder?: string;
  help?: string;
}

export interface CreateProviderInput {
  category: ProviderCategory;
  adapter_type: string;
  name: string;
  base_url?: string;
  model?: string;
  api_key: string;
  params?: Record<string, unknown>;
  timeout_sec?: number;
  max_retries?: number;
  priority?: number;
  is_active?: boolean;
}

/** Only set fields change. Send `api_key` only to replace the stored key. */
export type UpdateProviderInput = Partial<
  Pick<
    CreateProviderInput,
    | "name"
    | "base_url"
    | "model"
    | "api_key"
    | "params"
    | "timeout_sec"
    | "max_retries"
    | "priority"
  >
>;

export interface ListProvidersInput {
  category?: ProviderCategory;
}

export interface TestConnectionOutput {
  ok: boolean;
  kind?: string;
  message: string;
  latency_ms: number;
}

const ROOT = "/admin/providers";
const byId = (id: string) => `${ROOT}/${encodeURIComponent(id)}`;
const noToken = { token: null };

export const providerApi = {
  async adapters(): Promise<AdapterOutput[]> {
    return unwrap(await api.get<AdapterOutput[]>(`${ROOT}/adapters`, noToken));
  },

  async list(input: ListProvidersInput = {}, signal?: AbortSignal): Promise<ProviderOutput[]> {
    return unwrap(
      await api.get<ProviderOutput[]>(ROOT, { query: { ...input }, signal, ...noToken }),
    );
  },

  async create(input: CreateProviderInput): Promise<ProviderOutput> {
    return unwrap(await api.post<ProviderOutput>(ROOT, input, noToken));
  },

  async update(id: string, input: UpdateProviderInput): Promise<ProviderOutput> {
    return unwrap(await api.patch<ProviderOutput>(byId(id), input, noToken));
  },

  async activate(id: string): Promise<ProviderOutput> {
    return unwrap(await api.post<ProviderOutput>(`${byId(id)}/activate`, undefined, noToken));
  },

  async deactivate(id: string): Promise<ProviderOutput> {
    return unwrap(await api.post<ProviderOutput>(`${byId(id)}/deactivate`, undefined, noToken));
  },

  async test(id: string): Promise<TestConnectionOutput> {
    return unwrap(await api.post<TestConnectionOutput>(`${byId(id)}/test`, undefined, noToken));
  },

  /** Archives (soft-deletes) an inactive provider and returns the backend's message. */
  async archive(id: string): Promise<string> {
    return (await api.delete(byId(id), noToken)).message;
  },
};
