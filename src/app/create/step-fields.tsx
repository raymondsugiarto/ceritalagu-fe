"use client";

import * as React from "react";
import { Controller, type UseFormReturn } from "react-hook-form";
import { LockIcon } from "lucide-react";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  LANGUAGES,
  OTHER,
  VOICES,
  type ChoiceOptions,
  type Option,
  type QuestionnaireField,
  type QuestionnaireValues,
} from "@/lib/questionnaire";
import { cn } from "@/lib/utils";
import { ChoiceGroup } from "./choice-group";

interface StepFieldsProps {
  step: number;
  form: UseFormReturn<QuestionnaireValues>;
  /** Admin-managed recipient, occasion and genre options. */
  options: ChoiceOptions;
}

/** The inputs of one questionnaire step. */
export function StepFields({ step, form, options }: StepFieldsProps) {
  const { watch } = form;
  const name = watch("recipient_nickname") || watch("recipient_name") || "dia";

  switch (step) {
    case 1:
      return (
        <div className="space-y-4">
          <Choice
            form={form}
            field="recipient_type"
            label="Lagu ini untuk siapa?"
            options={options.recipientTypes}
          />
          {watch("recipient_type") === OTHER && (
            <TextField
              form={form}
              field="recipient_other"
              label="Untuk siapa?"
              placeholder="mis. Guru favoritku"
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
            label="Nama"
            placeholder="mis. Nadia"
            autoFocus
          />
          <TextField
            form={form}
            field="recipient_nickname"
            label="Panggilan sayang (opsional)"
            placeholder="mis. Nad, Sayang, Bunda"
          />
        </div>
      );
    case 3:
      return (
        <div className="space-y-4">
          <Choice
            form={form}
            field="occasion"
            label="Apa momennya?"
            options={options.occasions}
            columns={2}
          />
          {watch("occasion") === OTHER && (
            <TextField
              form={form}
              field="occasion_other"
              label="Momennya"
              placeholder="mis. Ulang tahun pertama si kecil"
            />
          )}
        </div>
      );
    case 4:
      return (
        <div className="space-y-6">
          <section className="space-y-2.5">
            <h3 className="text-sm font-semibold">Genre</h3>
            <Choice form={form} field="genre" label="Genre" options={options.genres} columns={3} />
          </section>
          <section className="space-y-2.5">
            <h3 className="text-sm font-semibold">Suara penyanyi</h3>
            <Choice form={form} field="voice" label="Suara penyanyi" options={VOICES} columns={3} />
          </section>
          <section className="space-y-2.5">
            <h3 className="text-sm font-semibold">Bahasa lagu</h3>
            <Choice form={form} field="language" label="Bahasa lagu" options={LANGUAGES} />
          </section>
          <section className="space-y-2.5">
            <h3 className="text-sm font-semibold">Mood (opsional)</h3>
            <Choice form={form} field="mood" label="Mood" options={options.moods} columns={3} />
          </section>
        </div>
      );
    case 5:
      return (
        <StoryField
          form={form}
          field="special"
          max={500}
          label={`Apa yang membuat ${name} spesial?`}
          placeholder="mis. Dia selalu tertawa paling keras di film komedi, dan selalu ingat kopi favoritku."
        />
      );
    case 6:
      return (
        <StoryField
          form={form}
          field="memory"
          max={800}
          label="Kenangan favoritmu bersamanya"
          placeholder="mis. Kehujanan di Braga lalu berteduh di toko buku sampai tutup."
        />
      );
    case 7:
      return (
        <StoryField
          form={form}
          field="message"
          max={500}
          label={`Pesan untuk ${name}`}
          placeholder="mis. Terima kasih sudah selalu ada. Aku bangga jadi bagian hidupmu."
        />
      );
    case 8:
      return (
        <div className="space-y-4">
          <TextField
            form={form}
            field="email"
            label="Email"
            placeholder="nama@email.com"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoFocus
          />
          <TextField
            form={form}
            field="phone"
            label="Nomor HP / WhatsApp"
            placeholder="0812 3456 7890"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
          />
          <p className="flex items-start gap-2 rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
            <LockIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            Kami hanya memakai kontak ini untuk mengirim lagumu. Tanpa spam.
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
            length >= 10 ? "text-success" : "text-muted-foreground",
          )}
        >
          {length < 10 ? `${length}/${max} · minimal 10` : `${length}/${max}`}
        </p>
      </div>
    </div>
  );
}
