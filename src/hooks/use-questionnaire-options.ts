"use client";

import * as React from "react";
import { errorMessage } from "@/lib/api";
import { questionnaireOptionsApi } from "@/lib/masterdata-api";
import { toChoiceOptions, type ChoiceOptions } from "@/lib/questionnaire";

export type OptionsState =
  { kind: "loading" } | { kind: "ok"; options: ChoiceOptions } | { kind: "error"; message: string };

/** The admin-managed questionnaire options (recipient types, occasions, genres). */
export function useQuestionnaireOptions(): { state: OptionsState; retry: () => void } {
  const [state, setState] = React.useState<OptionsState>({ kind: "loading" });
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    const ctrl = new AbortController();
    setState({ kind: "loading" });
    questionnaireOptionsApi
      .get(ctrl.signal)
      .then(
        (out) => !ctrl.signal.aborted && setState({ kind: "ok", options: toChoiceOptions(out) }),
      )
      .catch((err: unknown) => {
        if (!ctrl.signal.aborted) {
          setState({
            kind: "error",
            message: errorMessage(err, "Pilihan lagu belum bisa dimuat."),
          });
        }
      });
    return () => ctrl.abort();
  }, [attempt]);

  const retry = React.useCallback(() => setAttempt((a) => a + 1), []);
  return { state, retry };
}
