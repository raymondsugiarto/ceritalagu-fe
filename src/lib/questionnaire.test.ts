import { describe, expect, it } from "vitest";
import {
  EMPTY_VALUES,
  OTHER,
  QUESTIONNAIRE_STEPS,
  TOTAL_STEPS,
  questionnaireSchema,
  staleChoices,
  stepOfField,
  toChoiceOptions,
  toCreateInput,
  type QuestionnaireValues,
} from "./questionnaire";

const valid: QuestionnaireValues = {
  ...EMPTY_VALUES,
  recipient_type: "partner",
  recipient_name: "Nadia",
  occasion: "birthday",
  genre: "pop",
  voice: "female",
  special: "senyumnya manis sekali",
  memory: "liburan di pantai bersama",
  message: "aku sayang kamu selalu",
  email: "nadia@example.com",
  phone: "0812 3456 7890",
};

describe("QUESTIONNAIRE_STEPS", () => {
  it("has 8 steps numbered 1..8 in order, contact last", () => {
    expect(TOTAL_STEPS).toBe(8);
    expect(QUESTIONNAIRE_STEPS.map((s) => s.step)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(QUESTIONNAIRE_STEPS.at(-1)?.fields).toEqual(["email", "phone"]);
  });

  it("maps fields back to their step", () => {
    expect(stepOfField("memory")).toBe(6);
    expect(stepOfField("voice")).toBe(4);
  });
});

describe("questionnaireSchema", () => {
  it("accepts a complete questionnaire", () => {
    expect(questionnaireSchema.safeParse(valid).success).toBe(true);
  });

  it("requires 10+ characters for the story fields", () => {
    const res = questionnaireSchema.safeParse({ ...valid, special: "baik" });
    expect(res.success).toBe(false);
  });

  it("requires a valid email and phone on the last step", () => {
    expect(questionnaireSchema.safeParse({ ...valid, email: "nadia" }).success).toBe(false);
    expect(questionnaireSchema.safeParse({ ...valid, phone: "12ab" }).success).toBe(false);
    expect(questionnaireSchema.safeParse({ ...valid, phone: "+62 812-3456-7890" }).success).toBe(
      true,
    );
  });

  it("requires the free text when Lainnya is chosen", () => {
    const res = questionnaireSchema.safeParse({ ...valid, recipient_type: OTHER });
    expect(res.success).toBe(false);
    expect(res.error?.issues[0]?.path).toEqual(["recipient_other"]);
  });
});

describe("toCreateInput", () => {
  it("sends code other plus the typed text for Lainnya and drops empty optionals", () => {
    const input = toCreateInput({
      ...valid,
      occasion: OTHER,
      occasion_other: "Ulang tahun kucing",
      recipient_other: "leftover from an earlier choice",
    });
    expect(input.occasion).toBe(OTHER);
    expect(input.occasion_other).toBe("Ulang tahun kucing");
    expect(input.recipient_other).toBeUndefined();
    expect(input.recipient_nickname).toBeUndefined();
    expect(input.mood).toBeUndefined();
  });
});

describe("toChoiceOptions / staleChoices", () => {
  const options = toChoiceOptions({
    recipient_types: [{ code: "partner", name: "Pasangan" }],
    occasions: [{ code: "birthday", name: "Ulang Tahun" }],
    genres: [{ code: "pop", name: "Pop" }],
    moods: [{ code: "warm", name: "Hangat" }],
  });

  it("adds Lainnya to recipient and occasion only", () => {
    expect(options.recipientTypes.map((o) => o.code)).toEqual(["partner", OTHER]);
    expect(options.occasions.at(-1)?.label).toBe("Lainnya");
    expect(options.genres).toEqual([{ code: "pop", label: "Pop" }]);
  });

  it("flags draft codes that are no longer offered", () => {
    expect(staleChoices(valid, options)).toEqual([]);
    expect(staleChoices({ ...valid, genre: "jazz", occasion: OTHER }, options)).toEqual(["genre"]);
    expect(staleChoices({ ...valid, mood: "warm" }, options)).toEqual([]);
    expect(staleChoices({ ...valid, mood: "gloomy" }, options)).toEqual(["mood"]);
    expect(staleChoices(EMPTY_VALUES, options)).toEqual([]);
  });
});
