import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, api } from "./api";

function mockFetch(status: number, body: unknown, headers: Record<string, string> = {}) {
  const fn = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json", ...headers },
    }),
  );
  vi.stubGlobal("fetch", fn);
  return fn;
}

const ts = "2026-11-01T00:00:00Z";

afterEach(() => vi.unstubAllGlobals());

describe("api", () => {
  it("returns the envelope on success and drops empty query params", async () => {
    const fetchFn = mockFetch(200, {
      code: "SUCCESS",
      message: "success",
      errors: [],
      data: { id: "1" },
      timestamp: ts,
    });

    const res = await api.get<{ id: string }>("/users/1", { query: { page: 1, search: "" } });

    expect(res.data).toEqual({ id: "1" });
    const url = new URL(fetchFn.mock.calls[0]![0] as string);
    expect(url.pathname).toBe("/api/v1/users/1");
    expect(url.searchParams.get("page")).toBe("1");
    expect(url.searchParams.has("search")).toBe(false);
  });

  it("throws ApiError with field map and request id on validation errors", async () => {
    mockFetch(
      422,
      {
        code: "VALIDATION_ERROR",
        message: "request validation failed",
        errors: [{ field: "email", message: "must be a valid email address" }],
        timestamp: ts,
      },
      { "X-Request-ID": "req-1" },
    );

    const err = await api.post("/users", { email: "x" }).catch((e: unknown) => e);

    expect(err).toBeInstanceOf(ApiError);
    const apiErr = err as ApiError;
    expect(apiErr.status).toBe(422);
    expect(apiErr.code).toBe("VALIDATION_ERROR");
    expect(apiErr.fieldMap).toEqual({ email: "must be a valid email address" });
    expect(apiErr.requestId).toBe("req-1");
  });

  it("maps network failures to NETWORK_ERROR", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    await expect(api.get("/users")).rejects.toMatchObject({ code: "NETWORK_ERROR", status: 0 });
  });

  it("returns message-only responses without data", async () => {
    mockFetch(200, { code: "SUCCESS", message: "user deleted", errors: [], timestamp: ts });

    const res = await api.delete("/users/1");

    expect(res.message).toBe("user deleted");
    expect(res.data).toBeUndefined();
  });
});
