import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/en.json";
import { paymentApi } from "@/lib/payment-api";
import { PromoBanner, readPromoCode } from "./promo-banner";

vi.mock("@/lib/payment-api", () => ({
  paymentApi: { pricing: vi.fn() },
  IDR_FORMAT: { style: "currency", currency: "IDR", maximumFractionDigits: 0 },
}));

const promo = {
  code: "HEMAT10",
  discount_amount: 10000,
  total: 39000,
  normal_price: 99000,
  sale_price: 49000,
  currency: "IDR",
  expires_at: "2026-12-31T00:00:00Z",
};

describe("landing promo banner", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  async function render() {
    await act(async () => {
      root.render(
        <NextIntlClientProvider locale="en" messages={messages} timeZone="Asia/Jakarta">
          <PromoBanner />
        </NextIntlClientProvider>,
      );
    });
  }

  it("renders the promoted code and remembers it for checkout", async () => {
    vi.mocked(paymentApi.pricing).mockResolvedValue({
      unlock_price: 49000,
      normal_price: 99000,
      sale_price: 49000,
      currency: "IDR",
      enabled: true,
      promo,
    });
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    await render();

    expect(container.textContent).toContain("HEMAT10");
    // Intl renders IDR with a non-breaking space, so match loosely.
    expect(container.textContent).toMatch(/Get\s+IDR\s*10,000\s+off your first song/);
    expect(container.textContent).toMatch(/drops to\s+IDR\s*39,000/);

    await act(async () => {
      container.querySelector("button")?.click();
    });

    expect(writeText).toHaveBeenCalledWith("HEMAT10");
    expect(readPromoCode()).toBe("HEMAT10");
  });

  it("renders nothing when there is no promo", async () => {
    vi.mocked(paymentApi.pricing).mockResolvedValue({
      unlock_price: 49000,
      normal_price: 99000,
      sale_price: 49000,
      currency: "IDR",
      enabled: true,
    });

    await render();

    expect(container.textContent).toBe("");
  });
});
