"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useApiError } from "@/hooks/use-api-error";
import { questionnaireOptionsApi } from "@/lib/masterdata-api";
import { toChoiceOptions, type ChoiceOptions } from "@/lib/questionnaire";

export type OptionsState =
  { kind: "loading" } | { kind: "ok"; options: ChoiceOptions } | { kind: "error"; message: string };

/** The admin-managed questionnaire options (recipient types, occasions, genres). */
export function useQuestionnaireOptions(): { state: OptionsState; retry: () => void } {
  const t = useTranslations();
  const { errorText } = useApiError();
  // Latest translators without refetching when their identity changes (only `attempt` refetches).
  const text = React.useRef({ t, errorText });
  React.useEffect(() => {
    text.current = { t, errorText };
  });
  const [state, setState] = React.useState<OptionsState>({ kind: "loading" });
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    const ctrl = new AbortController();
    setState({ kind: "loading" });
    questionnaireOptionsApi
      .get(ctrl.signal)
      .then(
        (out) =>
          !ctrl.signal.aborted &&
          setState({
            kind: "ok",
            options: toChoiceOptions(out, text.current.t("common.other")),
          }),
      )
      .catch((err: unknown) => {
        if (!ctrl.signal.aborted) {
          setState({
            kind: "error",
            message: text.current.errorText(err, {
              fallback: text.current.t("create.optionsError.message"),
            }),
          });
        }
      });
    return () => ctrl.abort();
  }, [attempt]);

  const retry = React.useCallback(() => setAttempt((a) => a + 1), []);
  return { state, retry };
}
