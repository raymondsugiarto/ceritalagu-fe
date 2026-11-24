import { api, unwrap } from "@/lib/api";

// Mirrors backend internal/module/pricing/dto.go.

export interface PricesOutput {
  /** Shown struck through. */
  normal_price: number;
  /** What the customer pays without a voucher. */
  sale_price: number;
  /** A voucher never brings the total below this. */
  min_payable: number;
  currency: string;
}

export type UpdatePricesInput = Omit<PricesOutput, "currency">;

export type VoucherStatus = "active" | "inactive" | "expired" | "exhausted";

export interface VoucherOutput {
  id: string;
  code: string;
  discount_amount: number;
  quota: number;
  used: number;
  remaining: number;
  expires_at: string;
  is_active: boolean;
  /** Promoted on the landing page banner. */
  is_public: boolean;
  status: VoucherStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateVoucherInput {
  code: string;
  discount_amount: number;
  quota: number;
  /** ISO 8601. */
  expires_at: string;
  is_active?: boolean;
  /** Show this voucher on the landing page banner. */
  is_public?: boolean;
}

/** Only set fields change; the code is fixed after creation. */
export type UpdateVoucherInput = Partial<Omit<CreateVoucherInput, "code">>;

const noToken = { token: null };

export const pricingApi = {
  async get(signal?: AbortSignal): Promise<PricesOutput> {
    return unwrap(await api.get<PricesOutput>("/admin/pricing", { signal, ...noToken }));
  },

  async update(input: UpdatePricesInput): Promise<PricesOutput> {
    return unwrap(await api.put<PricesOutput>("/admin/pricing", input, noToken));
  },
};

export const voucherApi = {
  async list(signal?: AbortSignal): Promise<VoucherOutput[]> {
    return unwrap(await api.get<VoucherOutput[]>("/admin/vouchers", { signal, ...noToken }));
  },

  async create(input: CreateVoucherInput): Promise<VoucherOutput> {
    return unwrap(await api.post<VoucherOutput>("/admin/vouchers", input, noToken));
  },

  async update(id: string, input: UpdateVoucherInput): Promise<VoucherOutput> {
    return unwrap(
      await api.patch<VoucherOutput>(`/admin/vouchers/${encodeURIComponent(id)}`, input, noToken),
    );
  },

  /** Archives (soft-deletes) a voucher and returns the backend's message. */
  async archive(id: string): Promise<string> {
    return (await api.delete(`/admin/vouchers/${encodeURIComponent(id)}`, noToken)).message;
  },
};
