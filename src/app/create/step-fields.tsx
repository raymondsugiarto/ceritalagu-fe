"use client";

import * as React from "react";
import { Controller, type UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";
import { LockIcon } from "lucide-react";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  OTHER,
  SONG_LANGUAGE_CODES,
  VOICE_CODES,
  type ChoiceOptions,
  type Option,
  type QuestionnaireField,
  type QuestionnaireValues,
} from "@/lib/questionnaire";
import { cn } from "@/lib/utils";
import { ChoiceGroup } from "./choice-group";

/** Story fields need at least this many characters (mirrors the schema). */
const MIN_STORY = 10;

interface StepFieldsProps {
  step: number;
  form: UseFormReturn<QuestionnaireValues>;
  /** Admin-managed recipient, occasion and genre options. */
  options: ChoiceOptions;
}

/** The inputs of one questionnaire step. */
export function StepFields({ step, form, options }: StepFieldsProps) {
  const t = useTranslations("create.fields");
  const tc = useTranslations("common");
  const { watch } = form;
  const name = watch("recipient_nickname") || watch("recipient_name") || t("fallbackName");
  const voices: Option[] = VOICE_CODES.map((code) => ({ code, label: tc(`voices.${code}`) }));
  const languages: Option[] = SONG_LANGUAGE_CODES.map((code) => ({
    code,
    label: tc(`songLanguages.${code}`),
  }));

  switch (step) {
    case 1:
      return (
        <div className="space-y-4">
          <Choice
            form={form}
            field="recipient_type"
            label={t("recipientType")}
            options={options.recipientTypes}
          />
          {watch("recipient_type") === OTHER && (
            <TextField
              form={form}
              field="recipient_other"
              label={t("recipientOther.label")}
              placeholder={t("recipientOther.placeholder")}
            />
          )}
        </div>
      );
    case 2:
      return (
        <div className="space-y-4">
          <TextField
            form={form}
            field="recipient_name"
            label={t("recipientName.label")}
            placeholder={t("recipientName.placeholder")}
            autoFocus
          />
          <TextField
            form={form}
            field="recipient_nickname"
            label={t("recipientNickname.label")}
            placeholder={t("recipientNickname.placeholder")}
          />
        </div>
      );
    case 3:
      return (
        <div className="space-y-4">
          <Choice
            form={form}
            field="occasion"
            label={t("occasion")}
            options={options.occasions}
            columns={2}
          />
          {watch("occasion") === OTHER && (
            <TextField
              form={form}
              field="occasion_other"
              label={t("occasionOther.label")}
              placeholder={t("occasionOther.placeholder")}
            />
          )}
        </div>
      );
    case 4:
      return (
        <div className="space-y-6">
          <section className="space-y-2.5">
            <h3 className="text-sm font-semibold">{t("genre")}</h3>
            <Choice
              form={form}
              field="genre"
              label={t("genre")}
              options={options.genres}
              columns={3}
            />
          </section>
          <section className="space-y-2.5">
            <h3 className="text-sm font-semibold">{t("voice")}</h3>
            <Choice form={form} field="voice" label={t("voice")} options={voices} columns={3} />
          </section>
          <section className="space-y-2.5">
            <h3 className="text-sm font-semibold">{t("language")}</h3>
            <Choice form={form} field="language" label={t("language")} options={languages} />
          </section>
          <section className="space-y-2.5">
            <h3 className="text-sm font-semibold">{t("mood.heading")}</h3>
            <Choice
              form={form}
              field="mood"
              label={t("mood.label")}
              options={options.moods}
              columns={3}
            />
          </section>
        </div>
      );
    case 5:
      return (
        <StoryField
          form={form}
          field="special"
          max={500}
          label={t("special.label", { name })}
          placeholder={t("special.placeholder")}
        />
      );
    case 6:
      return (
        <StoryField
          form={form}
          field="memory"
          max={800}
          label={t("memory.label")}
          placeholder={t("memory.placeholder")}
        />
      );
    case 7:
      return (
        <StoryField
          form={form}
          field="message"
          max={500}
          label={t("message.label", { name })}
          placeholder={t("message.placeholder")}
        />
      );
    case 8:
      return (
        <div className="space-y-4">
          <TextField
            form={form}
            field="email"
            label={t("email.label")}
            placeholder={t("email.placeholder")}
            type="email"
            inputMode="email"
            autoComplete="email"
            autoFocus
          />
          <TextField
            form={form}
            field="phone"
            label={t("phone.label")}
            placeholder={t("phone.placeholder")}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
          />
          <p className="flex items-start gap-2 rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
            <LockIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {t("privacy")}
          </p>
        </div>
      );
    default:
      return null;
  }
}

interface FieldProps {
  form: UseFormReturn<QuestionnaireValues>;
  field: QuestionnaireField;
  label: string;
}

function Choice({
  form,
  field,
  label,
  options,
  columns,
}: FieldProps & { options: Option[]; columns?: 2 | 3 }) {
  const error = form.formState.errors[field]?.message;
  const errorId = `${field}-error`;
  return (
    <div className="space-y-2">
      <Controller
        control={form.control}
        name={field}
        render={({ field: f }) => (
          <ChoiceGroup
            label={label}
            options={options}
            value={String(f.value ?? "")}
            onChange={(code) => f.onChange(field === "mood" && code === f.value ? "" : code)}
            invalid={!!error}
            describedBy={error ? errorId : undefined}
            columns={columns}
          />
        )}
      />
      <FieldError id={errorId}>{error}</FieldError>
    </div>
  );
}

function TextField({
  form,
  field,
  label,
  placeholder,
  autoFocus,
  type,
  inputMode,
  autoComplete,
}: FieldProps & {
  placeholder?: string;
  autoFocus?: boolean;
  type?: React.HTMLInputTypeAttribute;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
}) {
  const error = form.formState.errors[field]?.message;
  const errorId = `${field}-error`;
  return (
    <div className="space-y-2">
      <Label htmlFor={field} className="font-semibold">
        {label}
      </Label>
      <Input
        className="h-12 rounded-xl bg-background/70 px-4 text-base md:text-sm"
        id={field}
        placeholder={placeholder}
        autoFocus={autoFocus}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        {...form.register(field)}
      />
      <FieldError id={errorId}>{error}</FieldError>
    </div>
  );
}

function StoryField({
  form,
  field,
  label,
  placeholder,
  max,
}: FieldProps & { placeholder: string; max: number }) {
  const t = useTranslations("create.fields");
  const error = form.formState.errors[field]?.message;
  const errorId = `${field}-error`;
  const length = String(form.watch(field) ?? "").trim().length;
  return (
    <div className="space-y-2">
      <Label htmlFor={field} className="font-semibold">
        {label}
      </Label>
      <Textarea
        className="min-h-40 rounded-xl bg-background/70 px-4 py-3 text-base leading-relaxed md:text-sm"
        id={field}
        placeholder={placeholder}
        rows={6}
        maxLength={max}
        autoFocus
        aria-invalid={!!error}
        aria-describedby={`${field}-count${error ? ` ${errorId}` : ""}`}
        {...form.register(field)}
      />
      <div className="flex items-start justify-between gap-2">
        <FieldError id={errorId}>{error}</FieldError>
        <p
          id={`${field}-count`}
          className={cn(
            "ml-auto text-xs tabular-nums",
            length >= MIN_STORY ? "text-success" : "text-muted-foreground",
          )}
        >
          {length < MIN_STORY
            ? t("counterMin", { length, max, min: MIN_STORY })
            : t("counter", { length, max })}
        </p>
      </div>
    </div>
  );
}
