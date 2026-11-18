import { describe, expect, it } from "vitest";
import en from "../../messages/en.json";
import id from "../../messages/id.json";

/** Namespaces only filled in `id.json` (admin stays Bahasa Indonesia, plan §9.2). */
const EXCLUDED_NAMESPACES = new Set(["admin"]);

/** Every leaf as [path, value]. Arrays (legal paragraphs) are indexed, so their length must match. */
function leaves(value: unknown, prefix: string): [string, unknown][] {
  if (Array.isArray(value)) {
    return value.flatMap((child, i) => leaves(child, `${prefix}[${i}]`));
  }
  if (value !== null && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) => leaves(child, `${prefix}.${key}`));
  }
  return [[prefix, value]];
}

function customerLeaves(messages: Record<string, unknown>): [string, unknown][] {
  return Object.entries(messages)
    .filter(([namespace]) => !EXCLUDED_NAMESPACES.has(namespace))
    .flatMap(([namespace, child]) => leaves(child, namespace));
}

const keysOf = (messages: Record<string, unknown>) =>
  customerLeaves(messages)
    .map(([path]) => path)
    .sort();

describe("message files", () => {
  it("id.json and en.json have the same key set (excluding admin)", () => {
    const idKeys = keysOf(id);
    const enKeys = keysOf(en);
    expect(enKeys.filter((k) => !idKeys.includes(k))).toEqual([]);
    expect(idKeys.filter((k) => !enKeys.includes(k))).toEqual([]);
  });

  it("has no empty messages", () => {
    const empty = [...customerLeaves(id), ...customerLeaves(en)].filter(
      ([, value]) => typeof value !== "string" || value.trim() === "",
    );
    expect(empty).toEqual([]);
  });

  it("uses the official brand spelling", () => {
    const misspelled = [...customerLeaves(id), ...customerLeaves(en)].filter(
      ([, value]) => typeof value === "string" && value.includes("CeritaLagu"),
    );
    expect(misspelled).toEqual([]);
  });
});
