import { api, unwrap, type ListOutput, type PaginationInput } from "@/lib/api";

// Types mirror the backend DTOs exactly (names and snake_case fields):
//   <Action><Entity>Input = request payload, <Entity>Output = response data.

/** Customer lifecycle stage. "guest" visitors have no user row (counted in stats only). */
export type CustomerType = "lead" | "prospect" | "customer" | "repeat_customer";

export const CUSTOMER_TYPES: { value: CustomerType; label: string; hint: string }[] = [
  { value: "lead", label: "Lead", hint: "Sudah isi email/HP, belum atur password" },
  { value: "prospect", label: "Prospect", hint: "Sudah atur password atau mulai checkout" },
  { value: "customer", label: "Customer", hint: "Sudah bayar 1 kali" },
  { value: "repeat_customer", label: "Repeat / Advocate", hint: "Sudah bayar 2 kali atau lebih" },
];

export interface UserStatsOutput {
  /** Visitor sessions that never left a contact. */
  guests: number;
  types: Partial<Record<CustomerType | "", number>>;
}

export interface UserOutput {
  id: string;
  name: string;
  email: string;
  phone: string;
  /** draft = came from the questionnaire contact step (no password yet); active; suspended. */
  status: "draft" | "active" | "suspended";
  /** Funnel stage; only moves forward. */
  type: CustomerType | "";
  /** Set a password (registered) — leads have not. */
  has_password: boolean;
  paid_orders: number;
  created_at: string;
  updated_at: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
}

export type UpdateUserInput = Partial<CreateUserInput>;

export interface ListUsersInput extends PaginationInput {
  search?: string;
  type?: CustomerType | "";
}

const ROOT = "/admin/users";
const byId = (id: string) => `${ROOT}/${encodeURIComponent(id)}`;

export const userApi = {
  async list(input: ListUsersInput = {}, signal?: AbortSignal): Promise<ListOutput<UserOutput>> {
    return unwrap(await api.get<ListOutput<UserOutput>>(ROOT, { query: { ...input }, signal }));
  },

  async stats(signal?: AbortSignal): Promise<UserStatsOutput> {
    return unwrap(await api.get<UserStatsOutput>(`${ROOT}/stats`, { signal }));
  },

  async get(id: string): Promise<UserOutput> {
    return unwrap(await api.get<UserOutput>(byId(id)));
  },

  async create(input: CreateUserInput): Promise<UserOutput> {
    return unwrap(await api.post<UserOutput>(ROOT, input));
  },

  async update(id: string, input: UpdateUserInput): Promise<UserOutput> {
    return unwrap(await api.patch<UserOutput>(byId(id), input));
  },

  /** Returns the backend's confirmation message. */
  async remove(id: string): Promise<string> {
    return (await api.delete(byId(id))).message;
  },
};
