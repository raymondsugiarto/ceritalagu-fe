"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarHeartIcon,
  CameraIcon,
  HeartIcon,
  Loader2Icon,
  MessageCircleHeartIcon,
  MusicIcon,
  SendIcon,
  SparklesIcon,
  StarIcon,
  TagIcon,
  XIcon,
  type LucideIcon,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { FieldError } from "@/components/ui/field-error";
import { ApiError } from "@/lib/api";
import { useApiError } from "@/hooks/use-api-error";
import {
  EMPTY_VALUES,
  QUESTIONNAIRE_STEPS,
  TOTAL_STEPS,
  createQuestionnaireSchema,
  isSongLanguageCode,
  loadDraft,
  saveDraft,
  staleChoices,
  startNewDraft,
  stepOfField,
  toCreateInput,
  type QuestionnaireField,
  type QuestionnaireValues,
} from "@/lib/questionnaire";
import { questionnaireApi } from "@/lib/questionnaire-api";
import { songApi } from "@/lib/song-api";
import { useQuestionnaireOptions } from "@/hooks/use-questionnaire-options";
import { AccountMenu } from "@/components/customer/account-menu";
import { CustomerShell } from "@/components/customer/customer-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { ReviewStep } from "./review-step";
import { StepFields } from "./step-fields";
import { SongPreviewCard } from "./song-preview-card";
import { StepProgress } from "./step-progress";

const REVIEW_STEP = TOTAL_STEPS + 1;

/** Icon per step (by number); the review screen uses SparklesIcon. */
const STEP_ICONS: Record<number, LucideIcon> = {
  1: HeartIcon,
  2: TagIcon,
  3: CalendarHeartIcon,
  4: MusicIcon,
  5: StarIcon,
  6: CameraIcon,
  7: MessageCircleHeartIcon,
  8: SendIcon,
};

/** The questionnaire: one step per screen, a review screen, then submit → job progress page. */
export function CreateView() {
  const t = useTranslations("create");
  const tCommon = useTranslations("common.actions");
  const tValidation = useTranslations("validation");
  const locale = useLocale();
  const { errorText, fieldText } = useApiError();
  const schema = React.useMemo(() => createQuestionnaireSchema(tValidation), [tValidation]);
  // The song language defaults to the UI locale; the guest can still change it on step 4.
  const defaultSongLanguage = isSongLanguageCode(locale) ? locale : EMPTY_VALUES.language;
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [restored, setRestored] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const { state: optionsState, retry: retryOptions } = useQuestionnaireOptions();

  const form = useForm<QuestionnaireValues>({
    resolver: zodResolver(schema),
    defaultValues: { ...EMPTY_VALUES, language: defaultSongLanguage },
    mode: "onTouched",
  });
  const { handleSubmit, trigger, reset, watch, setError, setValue, getValues, formState } = form;

  // Restore this tab's draft once on mount (sessionStorage is browser-only).
  // "Buat Lagu Baru" (/create?baru=1) starts over from step 1; the flag is then dropped so a refresh resumes.
  React.useEffect(() => {
    if (new URLSearchParams(window.location.search).has("baru")) {
      startNewDraft(defaultSongLanguage);
      router.replace("/create", { scroll: false });
    }
    const draft = loadDraft();
    if (draft) {
      reset(draft.values);
      setStep(draft.step);
    }
    setRestored(true);
  }, [reset, router, defaultSongLanguage]);

  // Save the draft on every change, after restoring so the empty defaults never overwrite it.
  React.useEffect(() => {
    if (!restored) return;
    saveDraft({ step, values: getValues() });
    const sub = watch((values) => saveDraft({ step, values: { ...EMPTY_VALUES, ...values } }));
    return () => sub.unsubscribe();
  }, [restored, step, watch, getValues]);

  // Once a field shows an error, re-check it on every change so the message clears as soon as it is fixed.
  React.useEffect(() => {
    const sub = watch((_values, { name }) => {
      if (name && form.getFieldState(name).error) void trigger(name);
    });
    return () => sub.unsubscribe();
  }, [watch, trigger, form]);

  // A restored draft may hold a choice an admin has since removed: clear it and go back to it.
  React.useEffect(() => {
    if (!restored || optionsState.kind !== "ok") return;
    const stale = staleChoices(getValues(), optionsState.options);
    for (const field of stale) setValue(field, "");
    const first = stale[0];
    if (first) setStep((s) => Math.min(s, stepOfField(first)));
  }, [restored, optionsState, getValues, setValue]);

  const current = QUESTIONNAIRE_STEPS[step - 1];

  async function next() {
    if (!current) return;
    if (await trigger(current.fields, { shouldFocus: true })) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0 });
    }
  }

  function back() {
    setStep((s) => Math.max(s - 1, 1));
  }

  async function onSubmit(values: QuestionnaireValues) {
    setServerError(null);
    try {
      const q = await questionnaireApi.create(toCreateInput(values));
      const job = await songApi.createJob({ questionnaire_id: q.id });
      router.push(`/jobs/${job.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.code === "VALIDATION_ERROR") {
        const fields = Object.entries(err.fieldMap);
        for (const [field, message] of fields) {
          setError(field as QuestionnaireField, {
            type: "server",
            message: fieldText(message, err.fieldReasons[field]),
          });
        }
        const first = fields[0];
        if (first) setStep(stepOfField(first[0]));
        return;
      }
      // 429 (quota) and 503 carry a customer-ready message from the API; anything else gets ours.
      setServerError(
        errorText(err, {
          trusted: ["TOO_MANY_REQUESTS", "SERVICE_UNAVAILABLE"],
          overrides: {
            TOO_MANY_REQUESTS: t("submitErrors.quota"),
            SERVICE_UNAVAILABLE: t("submitErrors.busy"),
          },
          fallback: t("submitError"),
        }),
      );
    }
  }

  if (!restored) return null;

  if (optionsState.kind !== "ok") {
    return (
      <CreateShell>
        {optionsState.kind === "loading" ? (
          <div className="space-y-4" aria-busy>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>{t("optionsError.title")}</CardTitle>
              <CardDescription>{optionsState.message}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={retryOptions}>
                {tCommon("tryAgain")}
              </Button>
            </CardContent>
          </Card>
        )}
      </CreateShell>
    );
  }
  const { options } = optionsState;

  const isReview = step === REVIEW_STEP;

  // Enter in a text input moves to the next step instead of submitting the whole form early.
  function onFormKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
    if (e.key !== "Enter" || isReview || e.target instanceof HTMLTextAreaElement) return;
    if (e.target instanceof HTMLInputElement) {
      e.preventDefault();
      void next();
    }
  }

  const Icon = isReview ? SparklesIcon : (STEP_ICONS[step] ?? SparklesIcon);

  return (
    <CreateShell
      progress={
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>
              {isReview
                ? t("progress.allAnswered")
                : t("progress.stepOf", { step, total: TOTAL_STEPS })}
            </span>
            <span className="tabular-nums">
              {Math.round(((isReview ? TOTAL_STEPS : step - 1) / TOTAL_STEPS) * 100)}%
            </span>
          </div>
          <StepProgress current={isReview ? TOTAL_STEPS : step} total={TOTAL_STEPS} />
        </div>
      }
    >
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <form
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          onKeyDown={onFormKeyDown}
          className="flex flex-col gap-6"
        >
          <Card className="rounded-3xl border bg-card/80 shadow-xl shadow-primary/5 backdrop-blur">
            <CardHeader className="gap-3">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-highlight text-primary-foreground shadow-lg shadow-primary/25">
                <Icon className="size-6" aria-hidden />
              </span>
              <p className="text-xs font-semibold tracking-wide text-highlight uppercase">
                {isReview ? t("last") : t("question", { step })}
              </p>
              <CardTitle className="text-2xl font-bold tracking-tight text-balance md:text-3xl">
                {isReview ? t("reviewTitle") : current && t(`steps.${current.id}.title`)}
              </CardTitle>
              <CardDescription className="text-base text-pretty">
                {isReview ? t("reviewHint") : current && t(`steps.${current.id}.hint`)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                key={step}
                className="motion-safe:animate-in motion-safe:duration-300 motion-safe:fade-in motion-safe:slide-in-from-bottom-2"
              >
                {isReview ? (
                  <ReviewStep values={getValues()} options={options} onEdit={setStep} />
                ) : (
                  <StepFields step={step} form={form} options={options} />
                )}
              </div>
            </CardContent>
          </Card>

          {serverError && <FieldError role="alert">{serverError}</FieldError>}

          <div className="flex gap-3">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-12 rounded-full px-6 text-base"
                onClick={back}
                disabled={formState.isSubmitting}
              >
                <ArrowLeftIcon aria-hidden />
                {tCommon("back")}
              </Button>
            )}
            {/* Distinct keys: React must not reuse the "Lanjut" element as the submit button, or the
                click that opens the review screen would also submit the form. */}
            {isReview ? (
              <Button
                key="submit"
                type="submit"
                size="lg"
                className="h-12 flex-1 rounded-full bg-linear-to-r from-primary to-highlight text-base shadow-lg shadow-primary/25 hover:opacity-95"
                disabled={formState.isSubmitting}
              >
                {formState.isSubmitting ? (
                  <Loader2Icon className="animate-spin" aria-hidden />
                ) : (
                  <SparklesIcon aria-hidden />
                )}
                {t("submit")}
              </Button>
            ) : (
              <Button
                key="next"
                type="button"
                size="lg"
                className="h-12 flex-1 rounded-full text-base shadow-lg shadow-primary/25"
                onClick={next}
              >
                {step === TOTAL_STEPS ? t("showSummary") : tCommon("next")}
                <ArrowRightIcon aria-hidden />
              </Button>
            )}
          </div>
          <p className="text-center text-xs text-muted-foreground">{t("autosave")}</p>
        </form>

        <aside className="hidden lg:sticky lg:top-24 lg:block">
          <p className="mb-4 text-center text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {t("forming")}
          </p>
          <SongPreviewCard values={watch()} options={options} />
        </aside>
      </div>
    </CreateShell>
  );
}

/** Questionnaire frame: the customer shell with the progress bar on top and a close link. */
function CreateShell({
  children,
  progress,
}: {
  children: React.ReactNode;
  progress?: React.ReactNode;
}) {
  const t = useTranslations("create");
  return (
    <CustomerShell
      actions={
        <div className="flex items-center gap-1">
          <AccountMenu />
          <Link
            href="/"
            aria-label={t("closeAria")}
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "rounded-full")}
          >
            <XIcon aria-hidden />
          </Link>
        </div>
      }
      top={progress && <div className="mx-auto w-full max-w-2xl lg:mx-0">{progress}</div>}
    >
      {children}
    </CustomerShell>
  );
}
