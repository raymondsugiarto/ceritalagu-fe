import { api, unwrap } from "@/lib/api";

// Mirrors backend internal/module/payment/handler.go.

export type OrderStatus = "pending" | "paid" | "failed" | "expired";

export interface PricingOutput {
  unlock_price: number;
  currency: string;
  /** false until DOKU is configured on the server. */
  enabled: boolean;
}

export interface CheckoutOutput {
  order_id: string;
  invoice_number: string;
  amount: number;
  currency: string;
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

  async checkout(songId: string): Promise<CheckoutOutput> {
    return unwrap(await api.post<CheckoutOutput>(`/songs/${encodeURIComponent(songId)}/checkout`));
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
