import type { useTranslations } from "next-intl";
import { z } from "zod";
import type { OptionOutput, QuestionnaireOptionsOutput } from "@/lib/masterdata-api";
import type { CreateQuestionnaireInput } from "@/lib/questionnaire-api";

/** One selectable option. `code` is what the API receives. */
export interface Option {
  code: string;
  label: string;
}

/** Code that switches a choice to free text ("Lainnya"). */
export const OTHER = "other";

/** The admin-managed option lists (GET /questionnaire-options), ready for the choice chips. */
export interface ChoiceOptions {
  recipientTypes: Option[];
  occasions: Option[];
  genres: Option[];
  moods: Option[];
}

/**
 * API options → chips. Recipient and occasion end with "Lainnya" / "Other" (free text, label from
 * `common.other`); genre and mood do not. Master-data names come from the API as-is (plan Phase 2/3).
 */
export function toChoiceOptions(
  out: QuestionnaireOptionsOutput,
  otherLabel: string,
): ChoiceOptions {
  const map = (list: OptionOutput[]) => list.map((o) => ({ code: o.code, label: o.name }));
  const other: Option = { code: OTHER, label: otherLabel };
  return {
    recipientTypes: [...map(out.recipient_types), other],
    occasions: [...map(out.occasions), other],
    genres: map(out.genres),
    moods: map(out.moods ?? []),
  };
}

/**
 * Fields of a restored draft whose code an admin has since removed or turned off. The form clears
 * them so the guest picks again instead of hitting a server error at the end.
 */
export function staleChoices(
  v: QuestionnaireValues,
  o: ChoiceOptions,
): ("recipient_type" | "occasion" | "genre" | "mood")[] {
  const has = (list: Option[], code: string) => code === "" || list.some((x) => x.code === code);
  const out: ("recipient_type" | "occasion" | "genre" | "mood")[] = [];
  if (!has(o.recipientTypes, v.recipient_type)) out.push("recipient_type");
  if (!has(o.occasions, v.occasion)) out.push("occasion");
  if (!has(o.genres, v.genre)) out.push("genre");
  if (!has(o.moods, v.mood)) out.push("mood");
  return out;
}

/** Singer voice codes (labels: `common.voices.<code>`). */
export const VOICE_CODES = ["male", "female", "surprise"] as const;
export type VoiceCode = (typeof VOICE_CODES)[number];

/** Song (lyrics) language codes — not the UI locale (labels: `common.songLanguages.<code>`). */
export const SONG_LANGUAGE_CODES = ["id", "en"] as const;
export type SongLanguageCode = (typeof SONG_LANGUAGE_CODES)[number];

export function isVoiceCode(code: string): code is VoiceCode {
  return (VOICE_CODES as readonly string[]).includes(code);
}

export function isSongLanguageCode(code: string): code is SongLanguageCode {
  return (SONG_LANGUAGE_CODES as readonly string[]).includes(code);
}

export function labelOf(options: Option[], code: string): string {
  return options.find((o) => o.code === code)?.label ?? code;
}

/** Translator for the `validation` namespace (from `useTranslations("validation")`). */
export type ValidationT = ReturnType<typeof useTranslations<"validation">>;

/**
 * The questionnaire schema with messages in the viewer's locale (plan §3.5).
 * Mirrors the backend validate tags (questionnaire/dto.go); the server stays the source of truth.
 */
export function createQuestionnaireSchema(t: ValidationT) {
  const max = (n: number) => t("maxChars", { max: n });
  const text = (min: number, maxLength: number) =>
    z
      .string()
      .trim()
      .min(min, min <= 1 ? t("required") : t("minChars", { min }))
      .max(maxLength, max(maxLength));

  return z
    .object({
      recipient_type: z.string().min(1, t("pickOne")),
      recipient_other: z.string().trim().max(50, max(50)),
      recipient_name: text(1, 50),
      recipient_nickname: z.string().trim().max(50, max(50)),
      occasion: z.string().min(1, t("pickOne")),
      occasion_other: z.string().trim().max(50, max(50)),
      genre: z.string().min(1, t("pickGenre")),
      voice: z.enum(VOICE_CODES, { message: t("pickVoice") }),
      language: z.enum(SONG_LANGUAGE_CODES),
      mood: z.string(),
      special: text(10, 500),
      memory: text(10, 800),
      message: text(10, 500),
      email: z.string().trim().min(1, t("required")).max(254).email(t("emailFormat")),
      phone: z
        .string()
        .trim()
        .min(1, t("required"))
        .max(30, max(30))
        .regex(/^\+?[0-9\s\-()]{8,}$/, t("phoneFormat")),
    })
    .superRefine((v, ctx) => {
      if (v.recipient_type === OTHER && v.recipient_other.length === 0) {
        ctx.addIssue({ code: "custom", path: ["recipient_other"], message: t("recipientOther") });
      }
      if (v.occasion === OTHER && v.occasion_other.length === 0) {
        ctx.addIssue({ code: "custom", path: ["occasion_other"], message: t("occasionOther") });
      }
    });
}

export type QuestionnaireValues = z.infer<ReturnType<typeof createQuestionnaireSchema>>;
export type QuestionnaireField = keyof QuestionnaireValues;

export const EMPTY_VALUES: QuestionnaireValues = {
  recipient_type: "",
  recipient_other: "",
  recipient_name: "",
  recipient_nickname: "",
  occasion: "",
  occasion_other: "",
  genre: "",
  voice: "surprise",
  language: "id",
  mood: "",
  special: "",
  memory: "",
  message: "",
  email: "",
  phone: "",
};

/** Message key of a step: title and hint live in `create.steps.<id>`. */
export type QuestionnaireStepId =
  "recipient" | "name" | "occasion" | "music" | "special" | "memory" | "message" | "contact";

/** One step of the song questionnaire (PRD §5.1). */
export interface QuestionnaireStep {
  step: number;
  id: QuestionnaireStepId;
  fields: QuestionnaireField[];
}

/** The questionnaire steps, in order. The last one (contact) creates the user on submit. The review screen comes after it. */
export const QUESTIONNAIRE_STEPS: QuestionnaireStep[] = [
  {
    step: 1,
    id: "recipient",
    fields: ["recipient_type", "recipient_other"],
  },
  {
    step: 2,
    id: "name",
    fields: ["recipient_name", "recipient_nickname"],
  },
  {
    step: 3,
    id: "occasion",
    fields: ["occasion", "occasion_other"],
  },
  {
    step: 4,
    id: "music",
    fields: ["genre", "voice", "language", "mood"],
  },
  {
    step: 5,
    id: "special",
    fields: ["special"],
  },
  {
    step: 6,
    id: "memory",
    fields: ["memory"],
  },
  {
    step: 7,
    id: "message",
    fields: ["message"],
  },
  {
    step: 8,
    id: "contact",
    fields: ["email", "phone"],
  },
];

export const TOTAL_STEPS = QUESTIONNAIRE_STEPS.length;

/** The step (1-based) that holds a field, so server errors can jump back to it. */
export function stepOfField(field: string): number {
  return QUESTIONNAIRE_STEPS.find((s) => (s.fields as string[]).includes(field))?.step ?? 1;
}

/** Form values → API payload. "Lainnya" sends code "other" plus the typed text. */
export function toCreateInput(v: QuestionnaireValues): CreateQuestionnaireInput {
  return {
    recipient_type: v.recipient_type,
    recipient_other: v.recipient_type === OTHER ? v.recipient_other : undefined,
    recipient_name: v.recipient_name,
    recipient_nickname: v.recipient_nickname || undefined,
    occasion: v.occasion,
    occasion_other: v.occasion === OTHER ? v.occasion_other : undefined,
    genre: v.genre,
    voice: v.voice,
    special: v.special,
    memory: v.memory,
    message: v.message,
    language: v.language,
    mood: v.mood || undefined,
    email: v.email,
    phone: v.phone,
  };
}

// ---- Draft persistence (survives a refresh; PRD §5.1) ----
// Kept in sessionStorage so every browser tab has its own draft: a second tab on /create starts empty
// instead of mirroring the first tab's answers. A refresh in the same tab still resumes.

const DRAFT_KEY = "song.questionnaire.draft";

function draftStorage(): Storage {
  // One-time cleanup of the old shared draft that lived in localStorage.
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
  return window.sessionStorage;
}

export interface Draft {
  step: number;
  values: QuestionnaireValues;
}

export function loadDraft(): Draft | null {
  try {
    const raw = draftStorage().getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Draft>;
    const step = typeof parsed.step === "number" ? parsed.step : 1;
    return {
      step: Math.min(Math.max(step, 1), TOTAL_STEPS + 1),
      values: { ...EMPTY_VALUES, ...(parsed.values ?? {}) },
    };
  } catch {
    return null;
  }
}

/** Link that opens the questionnaire from step 1 with empty answers (contact details are kept). */
export const NEW_SONG_HREF = "/create?baru=1";

/**
 * Starts a fresh draft for a new song with different answers. Email and phone stay, so a returning
 * guest does not type their contact again. `language` is the default song language (the UI locale).
 */
export function startNewDraft(language: SongLanguageCode = EMPTY_VALUES.language): void {
  const prev = loadDraft();
  saveDraft({
    step: 1,
    values: {
      ...EMPTY_VALUES,
      language,
      email: prev?.values.email ?? "",
      phone: prev?.values.phone ?? "",
    },
  });
}

export function saveDraft(draft: Draft): void {
  try {
    draftStorage().setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Storage full or blocked (private mode): the form still works, only refresh-safety is lost.
  }
}
