import { describe, expect, it } from "vitest";
import { ApiError, type ApiCode } from "@/lib/api";
import en from "../../messages/en.json";
import id from "../../messages/id.json";
import { apiErrorText, fieldErrorText, type ErrorTextKey } from "./api-error";

const err = (code: ApiCode, message = "Pesan dari server.") => new ApiError(400, code, message);
const codeText = (key: ErrorTextKey) => `errors.${key}`;

describe("apiErrorText", () => {
  it.each([
    {
      name: "id + trusted code → backend message",
      error: err("UNAUTHORIZED"),
      locale: "id" as const,
      want: "Pesan dari server.",
    },
    {
      name: "en + trusted code → generic errors.<code>",
      error: err("UNAUTHORIZED"),
      locale: "en" as const,
      want: "errors.UNAUTHORIZED",
    },
    {
      name: "en + trusted code with override → override",
      error: err("UNAUTHORIZED"),
      locale: "en" as const,
      overrides: { UNAUTHORIZED: "Wrong email or password." },
      want: "Wrong email or password.",
    },
    {
      name: "id + untrusted generic code → fallback",
      error: err("INTERNAL_ERROR", "boom"),
      locale: "id" as const,
      fallback: "Coba lagi.",
      want: "Coba lagi.",
    },
    {
      name: "validation error is not trusted (backend text is technical)",
      error: err("VALIDATION_ERROR", "request validation failed"),
      locale: "id" as const,
      fallback: "Coba lagi.",
      want: "Coba lagi.",
    },
    {
      name: "untrusted without fallback → errors.<code>",
      error: err("NETWORK_ERROR"),
      locale: "en" as const,
      want: "errors.NETWORK_ERROR",
    },
    {
      name: "custom trusted list: code outside it → fallback in id",
      error: err("NOT_FOUND"),
      locale: "id" as const,
      trusted: ["TOO_MANY_REQUESTS"] as ApiCode[],
      fallback: "Gagal.",
      want: "Gagal.",
    },
    {
      name: "non-ApiError → fallback",
      error: new Error("x"),
      locale: "en" as const,
      fallback: "Failed.",
      want: "Failed.",
    },
    {
      name: "non-ApiError without fallback → errors.unknown",
      error: "x",
      locale: "id" as const,
      want: "errors.unknown",
    },
  ])("$name", ({ error, locale, fallback, overrides, trusted, want }) => {
    expect(apiErrorText(error, { locale, codeText, fallback, overrides, trusted })).toBe(want);
  });
});

describe("apiErrorText with reasons", () => {
  const reasonText = (r: string) =>
    r === "voucher_expired" ? "This voucher has expired." : undefined;
  const withReason = (code: ApiCode, reason: string) =>
    new ApiError(400, code, "Voucher ini sudah kedaluwarsa.", [], undefined, reason);

  it.each([
    {
      name: "en: known reason beats override and code",
      error: withReason("BAD_REQUEST", "voucher_expired"),
      locale: "en" as const,
      overrides: { BAD_REQUEST: "Override." },
      want: "This voucher has expired.",
    },
    {
      name: "en: unknown reason falls back to override",
      error: withReason("BAD_REQUEST", "brand_new_reason"),
      locale: "en" as const,
      overrides: { BAD_REQUEST: "Override." },
      want: "Override.",
    },
    {
      name: "en: unknown reason, no override → errors.<code>",
      error: withReason("BAD_REQUEST", "brand_new_reason"),
      locale: "en" as const,
      want: "errors.BAD_REQUEST",
    },
    {
      name: "id: backend message stays (reason ignored)",
      error: withReason("BAD_REQUEST", "voucher_expired"),
      locale: "id" as const,
      want: "Voucher ini sudah kedaluwarsa.",
    },
    {
      name: "en: reason on an untrusted code still wins over the fallback",
      error: withReason("BAD_REQUEST", "voucher_expired"),
      locale: "en" as const,
      trusted: [] as ApiCode[],
      fallback: "Failed.",
      want: "This voucher has expired.",
    },
  ])("$name", ({ error, locale, overrides, trusted, fallback, want }) => {
    expect(
      apiErrorText(error, { locale, codeText, reasonText, overrides, trusted, fallback }),
    ).toBe(want);
  });

  it("exposes field reasons", () => {
    const e = new ApiError(422, "VALIDATION_ERROR", "request validation failed", [
      { field: "genre", message: "pilihan ini sudah tidak tersedia", reason: "option_unavailable" },
      { field: "email", message: "is required" },
    ]);
    expect(e.fieldReasons).toEqual({ genre: "option_unavailable" });
  });
});

describe("fieldErrorText", () => {
  it("keeps the backend wording in id and goes generic elsewhere", () => {
    expect(fieldErrorText("pilihan ini sudah tidak tersedia", "id", "g")).toBe(
      "pilihan ini sudah tidak tersedia",
    );
    expect(fieldErrorText("pilihan ini sudah tidak tersedia", "en", "g")).toBe("g");
    expect(
      fieldErrorText("pilihan ini sudah tidak tersedia", "en", "g", "No longer available."),
    ).toBe("No longer available.");
    expect(
      fieldErrorText("pilihan ini sudah tidak tersedia", "id", "g", "No longer available."),
    ).toBe("pilihan ini sudah tidak tersedia");
  });
});

describe("errors namespace", () => {
  const codes: ErrorTextKey[] = [
    "BAD_REQUEST",
    "VALIDATION_ERROR",
    "UNAUTHORIZED",
    "FORBIDDEN",
    "NOT_FOUND",
    "CONFLICT",
    "TOO_MANY_REQUESTS",
    "SERVICE_UNAVAILABLE",
    "INTERNAL_ERROR",
    "NETWORK_ERROR",
    "ABORTED",
    "unknown",
  ];
  it.each(codes)("has a message for %s in every locale", (code) => {
    expect(id.errors[code]).toBeTruthy();
    expect(en.errors[code]).toBeTruthy();
  });
});
