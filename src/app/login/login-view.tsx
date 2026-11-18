"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  EyeIcon,
  EyeOffIcon,
  KeyRoundIcon,
  Loader2Icon,
  LockKeyholeIcon,
  MailIcon,
  MailCheckIcon,
  PencilIcon,
  ShieldCheckIcon,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomerShell } from "@/components/customer/customer-shell";
import { ApiError, type ApiCode } from "@/lib/api";
import { useApiError } from "@/hooks/use-api-error";
import type { ValidationT } from "@/lib/questionnaire";
import { authApi, safeNext } from "@/lib/auth-api";
import { cn } from "@/lib/utils";
import { OtpInput } from "./otp-input";

const MIN_PASSWORD = 8;
const CODE_LENGTH = 6;

type Stage =
  | { kind: "email" }
  | { kind: "password"; email: string }
  | { kind: "code"; email: string; resendAt: number }
  | { kind: "set-password"; email: string; setupToken: string }
  | { kind: "done"; email: string };

function createEmailSchema(t: ValidationT) {
  return z.object({
    email: z
      .string()
      .trim()
      .max(254)
      .pipe(z.email(t("emailValid"))),
    password: z.string().max(72),
  });
}
type EmailValues = z.infer<ReturnType<typeof createEmailSchema>>;

function createNewPasswordSchema(t: ValidationT) {
  return z
    .object({
      password: z
        .string()
        .min(MIN_PASSWORD, t("minChars", { min: MIN_PASSWORD }))
        .max(72, t("maxChars", { max: 72 })),
      confirm: z.string(),
    })
    .refine((v) => v.password === v.confirm, {
      path: ["confirm"],
      message: t("passwordMismatch"),
    });
}
type NewPasswordValues = z.infer<ReturnType<typeof createNewPasswordSchema>>;

/**
 * Customer wording per envelope code for the auth endpoints, used outside the default locale
 * (in `id` the backend's own message is shown; see apiErrorText).
 */
function useAuthErrorOverrides(): Partial<Record<ApiCode, string>> {
  const t = useTranslations("auth.errors");
  return React.useMemo(
    () => ({
      NOT_FOUND: t("notRegistered"),
      FORBIDDEN: t("suspended"),
      TOO_MANY_REQUESTS: t("tooMany"),
      SERVICE_UNAVAILABLE: t("sendUnavailable"),
    }),
    [t],
  );
}

const HEADINGS: Record<
  Stage["kind"],
  { icon: LucideIcon; key: "email" | "password" | "code" | "setPassword" | "done" }
> = {
  email: { icon: MailIcon, key: "email" },
  password: { icon: LockKeyholeIcon, key: "password" },
  code: { icon: MailCheckIcon, key: "code" },
  "set-password": { icon: KeyRoundIcon, key: "setPassword" },
  done: { icon: CheckCircle2Icon, key: "done" },
};

/**
 * Customer sign-in. Email first; then a password field appears below it when the account has a
 * password, or a 6-digit code is emailed (first sign-in) followed by "set password".
 */
export function LoginView() {
  const t = useTranslations("auth");
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [stage, setStage] = React.useState<Stage>({ kind: "email" });
  const [serverError, setServerError] = React.useState<string | null>(null);

  // Already signed in (e.g. opened /login in a new tab).
  React.useEffect(() => {
    const controller = new AbortController();
    authApi
      .me(controller.signal)
      .then(() => !controller.signal.aborted && router.replace(next))
      .catch(() => undefined);
    return () => controller.abort();
  }, [next, router]);

  function finish(email: string) {
    setStage({ kind: "done", email });
    router.replace(next);
    router.refresh();
  }

  function restart() {
    setServerError(null);
    setStage({ kind: "email" });
  }

  const heading = HEADINGS[stage.kind];
  const Icon = heading.icon;

  return (
    <CustomerShell width="md" centered>
      <div className="rounded-3xl border bg-card/80 p-6 shadow-xl shadow-primary/5 backdrop-blur sm:p-8">
        <div className="mb-6 space-y-3">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-highlight text-primary-foreground shadow-lg shadow-primary/25">
            <Icon className="size-6" aria-hidden />
          </span>
          <h1 className="text-2xl font-bold tracking-tight">
            {t(`headings.${heading.key}.title`)}
          </h1>
          <p className="text-pretty text-muted-foreground">{t(`headings.${heading.key}.hint`)}</p>
        </div>

        <div
          key={stage.kind}
          className="motion-safe:animate-in motion-safe:duration-300 motion-safe:fade-in motion-safe:slide-in-from-bottom-2"
        >
          {(stage.kind === "email" || stage.kind === "password") && (
            <EmailPasswordForm
              stage={stage}
              serverError={serverError}
              setServerError={setServerError}
              onPassword={(email) => setStage({ kind: "password", email })}
              onCodeSent={(email, resendAfter) =>
                setStage({ kind: "code", email, resendAt: Date.now() + resendAfter * 1000 })
              }
              onChangeEmail={restart}
              onSignedIn={finish}
            />
          )}
          {stage.kind === "code" && (
            <CodeForm
              stage={stage}
              onResent={(resendAfter) =>
                setStage({ ...stage, resendAt: Date.now() + resendAfter * 1000 })
              }
              onVerified={(setupToken) =>
                setStage({ kind: "set-password", email: stage.email, setupToken })
              }
              onChangeEmail={restart}
            />
          )}
          {stage.kind === "set-password" && (
            <SetPasswordForm stage={stage} onRestart={restart} onSignedIn={finish} />
          )}
          {stage.kind === "done" && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2Icon className="size-4 animate-spin" aria-hidden />
              {t("signedInAs", { email: stage.email })}
            </div>
          )}
        </div>
      </div>
      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <ShieldCheckIcon className="size-3.5" aria-hidden />
        {t("safety")}
      </p>
    </CustomerShell>
  );
}

// ---- Step 1: email (+ password when the account has one) ----

interface EmailPasswordFormProps {
  stage: Extract<Stage, { kind: "email" | "password" }>;
  serverError: string | null;
  setServerError: (msg: string | null) => void;
  onPassword: (email: string) => void;
  onCodeSent: (email: string, resendAfterSec: number) => void;
  onChangeEmail: () => void;
  onSignedIn: (email: string) => void;
}

function EmailPasswordForm({
  stage,
  serverError,
  setServerError,
  onPassword,
  onCodeSent,
  onChangeEmail,
  onSignedIn,
}: EmailPasswordFormProps) {
  const t = useTranslations("auth");
  const tValidation = useTranslations("validation");
  const { errorText } = useApiError();
  const overrides = useAuthErrorOverrides();
  const emailSchema = React.useMemo(() => createEmailSchema(tValidation), [tValidation]);
  const [showPassword, setShowPassword] = React.useState(false);
  const withPassword = stage.kind === "password";
  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: withPassword ? stage.email : "", password: "" },
  });

  React.useEffect(() => {
    setFocus(withPassword ? "password" : "email");
  }, [withPassword, setFocus]);

  async function onSubmit({ email, password }: EmailValues) {
    setServerError(null);
    if (withPassword) {
      if (!password) {
        setError("password", { message: tValidation("passwordRequired") });
        return;
      }
      try {
        const me = await authApi.login(stage.email, password);
        onSignedIn(me.email);
      } catch (err) {
        setServerError(
          errorText(err, {
            overrides: { ...overrides, UNAUTHORIZED: t("errors.badLogin") },
            fallback: t("failed.signIn"),
          }),
        );
      }
      return;
    }
    try {
      const look = await authApi.lookup(email);
      if (look.method === "password") {
        onPassword(look.email);
        return;
      }
      const sent = await authApi.requestOtp(look.email);
      onCodeSent(sent.email, sent.resend_after_sec);
    } catch (err) {
      if (err instanceof ApiError && err.code === "VALIDATION_ERROR") {
        setError("email", { message: tValidation("emailValid") });
        return;
      }
      setServerError(
        errorText(err, {
          overrides: { ...overrides, CONFLICT: t("errors.hasPassword") },
          fallback: t("failed.continue"),
        }),
      );
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="email">{t("email")}</Label>
          {withPassword && (
            <button
              type="button"
              onClick={onChangeEmail}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <PencilIcon className="size-3" aria-hidden />
              {t("changeEmail")}
            </button>
          )}
        </div>
        <Input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="username"
          placeholder={t("emailPlaceholder")}
          startAdornment={<MailIcon />}
          readOnly={withPassword}
          className={cn("h-12 rounded-xl", withPassword && "bg-muted/50")}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
        />
        <FieldError id="email-error">{errors.email?.message}</FieldError>
      </div>

      {withPassword && (
        <div className="space-y-2 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1">
          <Label htmlFor="password">{t("password")}</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              startAdornment={<LockKeyholeIcon />}
              className="h-12 rounded-xl pr-11"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              {...register("password")}
            />
            <PasswordToggle shown={showPassword} onToggle={() => setShowPassword((s) => !s)} />
          </div>
          <FieldError id="password-error">{errors.password?.message}</FieldError>
        </div>
      )}

      <FieldError role="alert">{serverError}</FieldError>

      <SubmitButton busy={isSubmitting}>{withPassword ? t("signIn") : t("continue")}</SubmitButton>
    </form>
  );
}

// ---- Step 2 (first sign-in): emailed code ----

interface CodeFormProps {
  stage: Extract<Stage, { kind: "code" }>;
  onResent: (resendAfterSec: number) => void;
  onVerified: (setupToken: string) => void;
  onChangeEmail: () => void;
}

function CodeForm({ stage, onResent, onVerified, onChangeEmail }: CodeFormProps) {
  const t = useTranslations("auth");
  const { errorText, fieldText } = useApiError();
  const overrides = useAuthErrorOverrides();
  const [code, setCode] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [resending, setResending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const secondsLeft = useCountdown(stage.resendAt);

  async function verify(value: string) {
    if (value.length !== CODE_LENGTH || busy) return;
    setBusy(true);
    setError(null);
    try {
      const out = await authApi.verifyOtp(stage.email, value);
      onVerified(out.setup_token);
    } catch (err) {
      setError(
        err instanceof ApiError && err.code === "VALIDATION_ERROR"
          ? err.fieldMap.code
            ? fieldText(err.fieldMap.code, err.fieldReasons.code)
            : t("failed.wrongCode")
          : errorText(err, {
              overrides: { ...overrides, BAD_REQUEST: t("errors.codeExpired") },
              fallback: t("failed.verify"),
            }),
      );
      setCode("");
      setBusy(false);
    }
  }

  async function resend() {
    setResending(true);
    setError(null);
    try {
      const sent = await authApi.requestOtp(stage.email);
      setCode("");
      onResent(sent.resend_after_sec);
    } catch (err) {
      setError(
        errorText(err, {
          overrides: { ...overrides, CONFLICT: t("errors.hasPassword") },
          fallback: t("failed.resend"),
        }),
      );
    } finally {
      setResending(false);
    }
  }

  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        void verify(code);
      }}
    >
      <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/60 px-4 py-3 text-sm">
        <span className="min-w-0 truncate">
          {t.rich("code.sentTo", {
            email: stage.email,
            b: (chunks) => <span className="font-medium">{chunks}</span>,
          })}
        </span>
        <button
          type="button"
          onClick={onChangeEmail}
          className="shrink-0 text-xs font-medium text-primary hover:underline"
        >
          {t("code.change")}
        </button>
      </div>

      <div className="space-y-2">
        <Label>{t("code.label")}</Label>
        <OtpInput
          value={code}
          onChange={(v) => {
            setCode(v);
            if (error) setError(null);
          }}
          onComplete={(v) => void verify(v)}
          disabled={busy}
          invalid={!!error}
          autoFocus
          aria-describedby={error ? "code-error" : undefined}
        />
        <FieldError id="code-error" role="alert">
          {error}
        </FieldError>
      </div>

      <SubmitButton busy={busy} disabled={code.length !== CODE_LENGTH}>
        {t("code.verify")}
      </SubmitButton>

      <p className="text-center text-sm text-muted-foreground">
        {t("code.noCode")}{" "}
        {secondsLeft > 0 ? (
          <span className="tabular-nums">{t("code.resendIn", { seconds: secondsLeft })}</span>
        ) : (
          <button
            type="button"
            onClick={() => void resend()}
            disabled={resending}
            className="font-medium text-primary hover:underline disabled:opacity-50"
          >
            {resending ? t("code.sending") : t("code.resend")}
          </button>
        )}
      </p>
    </form>
  );
}

// ---- Step 3 (first sign-in): choose a password ----

interface SetPasswordFormProps {
  stage: Extract<Stage, { kind: "set-password" }>;
  onRestart: () => void;
  onSignedIn: (email: string) => void;
}

function SetPasswordForm({ stage, onRestart, onSignedIn }: SetPasswordFormProps) {
  const t = useTranslations("auth");
  const tValidation = useTranslations("validation");
  const { errorText, fieldText } = useApiError();
  const overrides = useAuthErrorOverrides();
  const newPasswordSchema = React.useMemo(
    () => createNewPasswordSchema(tValidation),
    [tValidation],
  );
  const [show, setShow] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [expired, setExpired] = React.useState(false);
  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<NewPasswordValues>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: "", confirm: "" },
  });
  const password = watch("password");

  async function onSubmit({ password }: NewPasswordValues) {
    setServerError(null);
    try {
      const me = await authApi.setPassword(stage.setupToken, password);
      onSignedIn(me.email);
    } catch (err) {
      if (err instanceof ApiError && err.code === "VALIDATION_ERROR" && err.fieldMap.password) {
        setError("password", {
          message: fieldText(err.fieldMap.password, err.fieldReasons.password),
        });
        return;
      }
      if (err instanceof ApiError && (err.code === "UNAUTHORIZED" || err.code === "CONFLICT")) {
        setExpired(true);
      }
      setServerError(
        errorText(err, {
          overrides: {
            ...overrides,
            UNAUTHORIZED: t("errors.setupExpired"),
            CONFLICT: t("errors.hasPassword"),
          },
          fallback: t("failed.savePassword"),
        }),
      );
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div className="flex items-center gap-2 rounded-xl bg-primary/5 px-4 py-3 text-sm">
        <CheckCircle2Icon className="size-4 shrink-0 text-primary" aria-hidden />
        <span className="min-w-0 truncate">
          {t.rich("setPassword.verified", {
            email: stage.email,
            b: (chunks) => <span className="font-medium">{chunks}</span>,
          })}
        </span>
      </div>

      {/* Lets password managers save the pair. */}
      <input type="email" value={stage.email} autoComplete="username" readOnly hidden />

      <div className="space-y-2">
        <Label htmlFor="new-password">{t("setPassword.newPassword")}</Label>
        <div className="relative">
          <Input
            id="new-password"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            autoFocus
            startAdornment={<LockKeyholeIcon />}
            className="h-12 rounded-xl pr-11"
            aria-invalid={!!errors.password}
            aria-describedby="new-password-hint"
            {...register("password")}
          />
          <PasswordToggle shown={show} onToggle={() => setShow((s) => !s)} />
        </div>
        <PasswordStrength value={password} />
        {errors.password ? (
          <FieldError id="new-password-hint">{errors.password.message}</FieldError>
        ) : (
          <p id="new-password-hint" className="text-xs text-muted-foreground">
            {t("setPassword.hint", { min: MIN_PASSWORD })}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password">{t("setPassword.confirm")}</Label>
        <Input
          id="confirm-password"
          type={show ? "text" : "password"}
          autoComplete="new-password"
          startAdornment={<LockKeyholeIcon />}
          className="h-12 rounded-xl"
          aria-invalid={!!errors.confirm}
          aria-describedby={errors.confirm ? "confirm-error" : undefined}
          {...register("confirm")}
        />
        <FieldError id="confirm-error">{errors.confirm?.message}</FieldError>
      </div>

      <FieldError role="alert">{serverError}</FieldError>

      {expired ? (
        <Button
          type="button"
          size="lg"
          variant="outline"
          className="h-12 w-full rounded-full"
          onClick={onRestart}
        >
          {t("setPassword.signInAgain")}
        </Button>
      ) : (
        <SubmitButton busy={isSubmitting}>{t("setPassword.save")}</SubmitButton>
      )}
    </form>
  );
}

// ---- Small pieces ----

function SubmitButton({
  busy,
  disabled,
  children,
}: {
  busy: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="submit"
      size="lg"
      className="h-12 w-full rounded-full bg-linear-to-r from-primary to-highlight text-base shadow-lg shadow-primary/25 hover:opacity-95"
      disabled={busy || disabled}
    >
      {busy ? <Loader2Icon className="animate-spin" aria-hidden /> : null}
      {children}
      {!busy && <ArrowRightIcon aria-hidden />}
    </Button>
  );
}

function PasswordToggle({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  const t = useTranslations("auth");
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={shown ? t("hidePassword") : t("showPassword")}
      aria-pressed={shown}
      className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      {shown ? (
        <EyeOffIcon className="size-4" aria-hidden />
      ) : (
        <EyeIcon className="size-4" aria-hidden />
      )}
    </button>
  );
}

/** Rough strength meter: length plus character variety. */
const STRENGTH = ["weak", "fair", "strong", "veryStrong"] as const;

function PasswordStrength({ value }: { value: string }) {
  const t = useTranslations("auth.strength");
  if (!value) return null;
  const variety = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(value)).length;
  const score =
    value.length < MIN_PASSWORD ? 1 : Math.min(4, variety + (value.length >= 12 ? 1 : 0));
  const strength = STRENGTH[score - 1];
  return (
    <div className="flex items-center gap-2" aria-live="polite">
      <div className="flex flex-1 gap-1" aria-hidden>
        {[1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full bg-muted transition-colors",
              i <= score &&
                (score <= 1 ? "bg-destructive" : score === 2 ? "bg-amber-500" : "bg-primary"),
            )}
          />
        ))}
      </div>
      <span className="w-20 text-right text-xs text-muted-foreground">
        {strength && t(strength)}
      </span>
    </div>
  );
}

/** Whole seconds until `at` (epoch ms), ticking every second; 0 once passed. */
function useCountdown(at: number): number {
  const calc = React.useCallback(() => Math.max(0, Math.ceil((at - Date.now()) / 1000)), [at]);
  const [left, setLeft] = React.useState(calc);
  React.useEffect(() => {
    setLeft(calc());
    const id = setInterval(() => setLeft(calc()), 1000);
    return () => clearInterval(id);
  }, [calc]);
  return left;
}
