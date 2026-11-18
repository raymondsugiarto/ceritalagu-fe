import { describe, expect, it } from "vitest";
import { isLocale, matchAcceptLanguage, resolveLocale } from "./config";

describe("isLocale", () => {
  it.each([
    ["id", true],
    ["en", true],
    ["EN", false],
    ["fr", false],
    ["", false],
    [undefined, false],
  ])("%s → %s", (value, expected) => {
    expect(isLocale(value)).toBe(expected);
  });
});

describe("matchAcceptLanguage", () => {
  it.each([
    [null, undefined],
    ["", undefined],
    ["en-US,en;q=0.9", "en"],
    ["id-ID,id;q=0.9,en;q=0.8", "id"],
    ["fr-FR,fr;q=0.9,en;q=0.5", "en"],
    ["en;q=0.4,id;q=0.8", "id"],
    ["en;q=0,id;q=0", undefined],
    ["de,fr", undefined],
    ["*", undefined],
  ])("%s → %s", (header, expected) => {
    expect(matchAcceptLanguage(header)).toBe(expected);
  });
});

describe("resolveLocale", () => {
  it.each([
    { cookie: "en", accept: "id-ID", expected: "en", name: "cookie wins" },
    { cookie: "xx", accept: "en-US", expected: "en", name: "invalid cookie falls to header" },
    { cookie: undefined, accept: "en-GB,en;q=0.9", expected: "en", name: "header only" },
    { cookie: undefined, accept: "ja-JP", expected: "id", name: "unsupported header → default" },
    { cookie: undefined, accept: undefined, expected: "id", name: "nothing → default" },
  ])("$name", ({ cookie, accept, expected }) => {
    expect(resolveLocale(cookie, accept)).toBe(expected);
  });
});
