/** Known section kinds; the label comes from `song.lyrics.sections.<kind>`. */
export type LyricsSectionKind =
  "preChorus" | "chorus" | "verse" | "bridge" | "intro" | "outro" | "hook";

/** One block of a song's lyrics, e.g. a verse or the chorus. */
export interface LyricsSection {
  /** Section kind for a known tag; null for an unknown tag (shown as written) or no tag. */
  kind: LyricsSectionKind | null;
  /** Number in the tag ("[Verse 2]" → "2"), or null. */
  number: string | null;
  /** The raw tag for an unknown kind ("[Rap]" → "Rap"); null otherwise. */
  label: string | null;
  /** True for the chorus, which the song page highlights. */
  chorus: boolean;
  lines: string[];
}

const TAG = /^\[(.+)\]$/;

type SectionHead = Omit<LyricsSection, "lines">;

/** Section tag (as the lyrics model writes it) → section kind; the page translates the label. */
function sectionFor(tag: string): SectionHead {
  const t = tag.trim().toLowerCase();
  const number = t.match(/\d+/)?.[0] ?? null;
  const known = (kind: LyricsSectionKind, chorus = false): SectionHead => ({
    kind,
    number,
    label: null,
    chorus,
  });
  if (t.includes("pre") && t.includes("chorus")) return known("preChorus");
  if (t.includes("chorus") || t.includes("reff") || t.includes("refrain"))
    return known("chorus", true);
  if (t.includes("verse") || t.includes("bait")) return known("verse");
  if (t.includes("bridge")) return { ...known("bridge"), number: null };
  if (t.includes("intro")) return { ...known("intro"), number: null };
  if (t.includes("outro")) return { ...known("outro"), number: null };
  if (t.includes("hook")) return { ...known("hook"), number: null };
  return { kind: null, number: null, label: tag.trim(), chorus: false };
}

/**
 * Splits lyrics written with section tags ("[Verse 1]", "[Chorus]") into labelled blocks, so the
 * page can show "Bait 1" / "Reff" (or "Verse 1" / "Chorus") headings instead of the raw tags. Blank lines are dropped;
 * sections without any lyric lines (e.g. an instrumental "[Intro]") are skipped.
 */
export function parseLyrics(lyrics: string): LyricsSection[] {
  const sections: LyricsSection[] = [];
  let current: LyricsSection = { kind: null, number: null, label: null, chorus: false, lines: [] };
  for (const raw of lyrics.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const tag = line.match(TAG);
    if (tag) {
      if (current.lines.length > 0) sections.push(current);
      current = { ...sectionFor(tag[1] ?? ""), lines: [] };
      continue;
    }
    current.lines.push(line);
  }
  if (current.lines.length > 0) sections.push(current);
  return sections;
}

/** "m:ss" for the player; "0:00" for unknown or invalid values. */
export function formatClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const s = Math.floor(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
