import { describe, expect, it } from "vitest";
import { formatClock, parseLyrics } from "./lyrics";

describe("parseLyrics", () => {
  it("labels sections and marks the chorus", () => {
    const got = parseLyrics(
      "[Intro]\n\n[Verse 1]\nsatu\ndua\n\n[Pre-Chorus]\nnaik\n[Chorus]\nNadia\nsayang",
    );
    expect(got).toEqual([
      { kind: "verse", number: "1", label: null, chorus: false, lines: ["satu", "dua"] },
      { kind: "preChorus", number: null, label: null, chorus: false, lines: ["naik"] },
      { kind: "chorus", number: null, label: null, chorus: true, lines: ["Nadia", "sayang"] },
    ]);
  });

  it("keeps untagged text as one unlabelled section", () => {
    expect(parseLyrics("a\nb")).toEqual([
      { kind: null, number: null, label: null, chorus: false, lines: ["a", "b"] },
    ]);
  });

  it("keeps unknown tags as written", () => {
    expect(parseLyrics("[Rap]\nyo")[0]).toMatchObject({ kind: null, label: "Rap" });
  });
});

describe("formatClock", () => {
  it.each([
    [0, "0:00"],
    [65.9, "1:05"],
    [NaN, "0:00"],
    [Infinity, "0:00"],
  ])("%s → %s", (s, want) => expect(formatClock(s)).toBe(want));
});
