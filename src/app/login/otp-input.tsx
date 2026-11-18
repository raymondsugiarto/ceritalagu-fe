"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Called once all digits are filled. */
  onComplete?: (value: string) => void;
  length?: number;
  disabled?: boolean;
  invalid?: boolean;
  autoFocus?: boolean;
  "aria-describedby"?: string;
}

/** One box per digit. Typing moves forward, Backspace moves back, pasting fills every box. */
export function OtpInput({
  value,
  onChange,
  onComplete,
  length = 6,
  disabled,
  invalid,
  autoFocus,
  "aria-describedby": describedBy,
}: OtpInputProps) {
  const t = useTranslations("auth.code");
  const refs = React.useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  function set(next: string) {
    const clean = next.replace(/\D/g, "").slice(0, length);
    onChange(clean);
    if (clean.length === length) onComplete?.(clean);
    return clean;
  }

  function focus(i: number) {
    refs.current[Math.max(0, Math.min(i, length - 1))]?.focus();
  }

  function onInput(i: number, e: React.ChangeEvent<HTMLInputElement>) {
    const typed = e.target.value.replace(/\D/g, "");
    if (!typed) return;
    // Autofill / paste into one box can deliver the whole code.
    if (typed.length > 1) {
      const clean = set(typed);
      focus(clean.length);
      return;
    }
    const chars = digits.slice();
    chars[i] = typed;
    set(chars.join("").slice(0, Math.max(i + 1, value.length)));
    focus(i + 1);
  }

  function onKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[i]) {
        set(value.slice(0, i));
      } else if (i > 0) {
        set(value.slice(0, i - 1));
        focus(i - 1);
      }
    } else if (e.key === "ArrowLeft") {
      focus(i - 1);
    } else if (e.key === "ArrowRight") {
      focus(i + 1);
    }
  }

  function onPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const clean = set(e.clipboardData.getData("text"));
    focus(clean.length);
  }

  return (
    <div className="flex justify-between gap-2" role="group" aria-label={t("group")}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={d}
          onChange={(e) => onInput(i, e)}
          onKeyDown={(e) => onKeyDown(i, e)}
          onPaste={onPaste}
          onFocus={(e) => e.target.select()}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={length}
          disabled={disabled}
          autoFocus={autoFocus && i === 0}
          aria-label={t("digit", { n: i + 1 })}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cn(
            "size-12 min-w-0 flex-1 rounded-xl border bg-background text-center text-xl font-semibold tabular-nums shadow-xs transition-colors outline-none sm:size-14 sm:text-2xl",
            "focus:border-primary focus:ring-4 focus:ring-primary/15",
            d && "border-primary/50 bg-primary/5",
            invalid && "border-destructive focus:border-destructive focus:ring-destructive/15",
            "disabled:opacity-50",
          )}
        />
      ))}
    </div>
  );
}
