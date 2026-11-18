"use client";

import * as React from "react";
import { useLocale, useTranslations, type Messages } from "next-intl";
import { apiErrorText, fieldErrorText, type ApiErrorTextOptions } from "@/i18n/api-error";

type CallOptions = Omit<ApiErrorTextOptions, "locale" | "codeText" | "reasonText">;
type ErrorKey = keyof Messages["errors"];

/**
 * `errorText(err, opts)` and `fieldText(message, reason?)` bound to the viewer's locale. Backend
 * reasons map to `errors.<reason>` when the catalogue has that key.
 */
export function useApiError() {
  const locale = useLocale();
  const t = useTranslations("errors");
  return React.useMemo(() => {
    const reasonText = (reason: string) =>
      t.has(reason as ErrorKey) ? t(reason as ErrorKey) : undefined;
    return {
      errorText: (err: unknown, opts: CallOptions = {}) =>
        apiErrorText(err, { ...opts, locale, codeText: (key) => t(key), reasonText }),
      fieldText: (serverMessage: string, reason?: string) =>
        fieldErrorText(
          serverMessage,
          locale,
          t("fieldInvalid"),
          reason ? reasonText(reason) : undefined,
        ),
    };
  }, [locale, t]);
}
