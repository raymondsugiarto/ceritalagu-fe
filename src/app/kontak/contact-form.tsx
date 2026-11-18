"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { CheckCircle2Icon, Loader2Icon, MailIcon, SendIcon, UserIcon } from "lucide-react";
import { ApiError } from "@/lib/api";
import { CONTACT_TOPIC_VALUES, contactApi } from "@/lib/contact-api";
import { useApiError } from "@/hooks/use-api-error";
import type { ValidationT } from "@/lib/questionnaire";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";

const MESSAGE_MAX = 2000;

function createContactSchema(t: ValidationT) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(2, t("nameMin", { min: 2 }))
      .max(80, t("nameMax", { max: 80 })),
    email: z.string().trim().email(t("emailValid")).max(254),
    topic: z.enum(CONTACT_TOPIC_VALUES),
    message: z
      .string()
      .trim()
      .min(10, t("messageMin", { min: 10 }))
      // As a string: "2000", not "2.000".
      .max(MESSAGE_MAX, t("messageMax", { max: String(MESSAGE_MAX) })),
    website: z.string().optional(),
  });
}

type Values = z.infer<ReturnType<typeof createContactSchema>>;

/** "Hubungi Kami" form; the backend emails it to the support inbox with Reply-To set to the visitor. */
export function ContactForm() {
  const t = useTranslations("contact");
  const tValidation = useTranslations("validation");
  const { errorText, fieldText } = useApiError();
  const schema = React.useMemo(() => createContactSchema(tValidation), [tValidation]);
  const [sentTo, setSentTo] = React.useState<string | null>(null);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", topic: "general", message: "", website: "" },
  });
  const messageLength = watch("message")?.length ?? 0;

  async function onSubmit(values: Values) {
    setServerError(null);
    try {
      await contactApi.send(values);
      setSentTo(values.email);
      reset();
    } catch (err) {
      if (err instanceof ApiError && err.code === "VALIDATION_ERROR") {
        for (const [field, message] of Object.entries(err.fieldMap)) {
          setError(field as keyof Values, {
            message: fieldText(message, err.fieldReasons[field]),
          });
        }
        return;
      }
      setServerError(
        errorText(err, {
          overrides: {
            TOO_MANY_REQUESTS: t("form.tooMany"),
            BAD_REQUEST: t("form.missing"),
            SERVICE_UNAVAILABLE: t("form.failed"),
          },
          fallback: t("form.failed"),
        }),
      );
    }
  }

  if (sentTo) {
    return (
      <div className="flex flex-col items-center py-10 text-center motion-safe:animate-in motion-safe:fade-in">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-success/10 text-success">
          <CheckCircle2Icon className="size-7" aria-hidden />
        </span>
        <h2 className="mt-5 text-xl font-semibold">{t("form.sentTitle")}</h2>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {t.rich("form.sentBody", {
            email: sentTo,
            b: (chunks) => <span className="font-medium text-foreground">{chunks}</span>,
          })}
        </p>
        <Button variant="outline" className="mt-6 rounded-full" onClick={() => setSentTo(null)}>
          {t("form.sendAnother")}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="relative space-y-5">
      <div>
        <h2 className="text-xl font-semibold">{t("form.title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("form.allRequired")}</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">{t("form.name")}</Label>
          <Input
            id="name"
            autoComplete="name"
            placeholder={t("form.namePlaceholder")}
            startAdornment={<UserIcon />}
            className="h-11 rounded-xl"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
            {...register("name")}
          />
          <FieldError id="name-error">{errors.name?.message}</FieldError>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">{t("form.email")}</Label>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={t("form.emailPlaceholder")}
            startAdornment={<MailIcon />}
            className="h-11 rounded-xl"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
          />
          <FieldError id="email-error">{errors.email?.message}</FieldError>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="topic">{t("form.topic")}</Label>
        <NativeSelect
          id="topic"
          className="[&_select]:h-11 [&_select]:rounded-xl"
          {...register("topic")}
        >
          {CONTACT_TOPIC_VALUES.map((topic) => (
            <option key={topic} value={topic}>
              {t(`topics.${topic}`)}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="message">{t("form.message")}</Label>
          <span className="text-xs text-muted-foreground tabular-nums">
            {messageLength}/{MESSAGE_MAX}
          </span>
        </div>
        <Textarea
          id="message"
          rows={6}
          maxLength={MESSAGE_MAX}
          placeholder={t("form.messagePlaceholder")}
          className="rounded-xl"
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "message-error" : undefined}
          {...register("message")}
        />
        <FieldError id="message-error">{errors.message?.message}</FieldError>
      </div>

      {/* Honeypot: hidden from people and screen readers; bots that fill it are dropped server-side. */}
      <div aria-hidden className="pointer-events-none absolute size-0 overflow-hidden opacity-0">
        <label htmlFor="website">Website</label>
        <input id="website" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>

      <FieldError role="alert">{serverError}</FieldError>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-12 w-full rounded-full bg-linear-to-r from-primary to-highlight text-base shadow-lg shadow-primary/25 hover:opacity-95"
      >
        {isSubmitting ? (
          <Loader2Icon className="size-4 animate-spin" aria-hidden />
        ) : (
          <SendIcon className="size-4" aria-hidden />
        )}
        {isSubmitting ? t("form.sending") : t("form.send")}
      </Button>
    </form>
  );
}
