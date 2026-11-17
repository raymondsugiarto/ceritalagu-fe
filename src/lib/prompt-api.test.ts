import { describe, expect, it } from "vitest";
import { unknownPlaceholders } from "./prompt-api";

describe("unknownPlaceholders", () => {
  const known = ["name", "genre"];

  it("returns nothing when every placeholder is known", () => {
    expect(unknownPlaceholders("Hi {{name}}, {{genre}} {{name}}", known)).toEqual([]);
  });

  it("lists unknown and space-padded placeholders once, in order", () => {
    expect(unknownPlaceholders("{{nme}} {{ name }} {{nme}}", known)).toEqual(["nme", " name "]);
  });
});
