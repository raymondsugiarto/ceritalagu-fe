import { describe, expect, it } from "vitest";
import { safeNext } from "./auth-api";

describe("safeNext", () => {
  it("keeps same-site paths", () => {
    expect(safeNext("/jobs/abc")).toBe("/jobs/abc");
    expect(safeNext("/songs/1?x=2")).toBe("/songs/1?x=2");
  });

  it("falls back to home for anything that could leave the site", () => {
    for (const bad of [
      null,
      undefined,
      "",
      "https://evil.test",
      "//evil.test",
      "/\\evil.test",
      "jobs",
    ]) {
      expect(safeNext(bad)).toBe("/");
    }
  });
});
