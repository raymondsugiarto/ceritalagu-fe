import { api, unwrap } from "@/lib/api";

// Mirrors backend internal/module/payment/handler.go.

export type OrderStatus = "pending" | "paid" | "failed" | "expired";

export interface PricingOutput {
  /** Same as sale_price (kept for older code). */
  unlock_price: number;
  /** Shown struck through; equal to sale_price when there is no promo. */
  normal_price: number;
  /** What is charged without a voucher. */
  sale_price: number;
  currency: string;
  /** false until DOKU is configured on the server. */
  enabled: boolean;
}

/** POST /songs/:id/voucher-check: what a checkout would charge. */
export interface QuoteOutput {
  normal_price: number;
  sale_price: number;
  voucher_code?: string;
  voucher_discount: number;
  total: number;
  currency: string;
}

export interface CheckoutOutput {
  order_id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  voucher_code?: string;
  /** DOKU Checkout page; send the browser there. */
  payment_url: string;
  expires_at: string | null;
}

export interface OrderOutput {
  id: string;
  invoice_number: string;
  song_id: string;
  amount: number;
  currency: string;
  status: OrderStatus;
  payment_method?: string;
  /** Only while pending, to resume paying. */
  payment_url?: string;
  expires_at: string | null;
  paid_at: string | null;
  created_at: string;
}

export const paymentApi = {
  async pricing(signal?: AbortSignal): Promise<PricingOutput> {
    return unwrap(await api.get<PricingOutput>("/payments/pricing", { signal }));
  },

  /** Checks a voucher code against the song's price; no order is created. */
  async quote(songId: string, voucherCode: string): Promise<QuoteOutput> {
    return unwrap(
      await api.post<QuoteOutput>(`/songs/${encodeURIComponent(songId)}/voucher-check`, {
        voucher_code: voucherCode,
      }),
    );
  },

  async checkout(songId: string, voucherCode?: string): Promise<CheckoutOutput> {
    return unwrap(
      await api.post<CheckoutOutput>(
        `/songs/${encodeURIComponent(songId)}/checkout`,
        voucherCode ? { voucher_code: voucherCode } : undefined,
      ),
    );
  },

  async getOrder(id: string, signal?: AbortSignal): Promise<OrderOutput> {
    return unwrap(
      await api.get<OrderOutput>(`/payment-orders/${encodeURIComponent(id)}`, { signal }),
    );
  },
};

/** "Rp49.000" */
export function formatIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}
