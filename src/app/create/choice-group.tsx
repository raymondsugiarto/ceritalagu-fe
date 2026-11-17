"use client";

import * as React from "react";
import { CheckIcon } from "lucide-react";
import type { Option } from "@/lib/questionnaire";
import { cn } from "@/lib/utils";

interface ChoiceGroupProps {
  /** Accessible name of the group (the question). */
  label: string;
  options: Option[];
  value: string;
  onChange: (code: string) => void;
  invalid?: boolean;
  /** id of the error message, linked with aria-describedby. */
  describedBy?: string;
  /** Number of columns from the sm breakpoint up. */
  columns?: 2 | 3;
}

/** Single-choice chips (radio semantics). Arrow keys move between options. */
export function ChoiceGroup({
  label,
  options,
  value,
  onChange,
  invalid,
  describedBy,
  columns = 2,
}: ChoiceGroupProps) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: React.KeyboardEvent, index: number) {
    const delta =
      e.key === "ArrowRight" || e.key === "ArrowDown"
        ? 1
        : e.key === "ArrowLeft" || e.key === "ArrowUp"
          ? -1
          : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (index + delta + options.length) % options.length;
    const option = options[next];
    if (!option) return;
    onChange(option.code);
    refs.current[next]?.focus();
  }

  const activeIndex = Math.max(
    options.findIndex((o) => o.code === value),
    0,
  );

  return (
    <div
      role="radiogroup"
      aria-label={label}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      className={cn("grid grid-cols-2 gap-2.5", columns === 3 && "sm:grid-cols-3")}
    >
      {options.map((option, i) => {
        const selected = option.code === value;
        return (
          <button
            key={option.code}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={i === activeIndex ? 0 : -1}
            onClick={() => onChange(option.code)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "group flex min-h-12 cursor-pointer items-center justify-between gap-2 rounded-xl border px-4 py-2.5 text-left text-sm font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-safe:active:scale-[0.98]",
              selected
                ? "border-transparent bg-linear-to-br from-primary to-highlight text-primary-foreground shadow-lg shadow-primary/25"
                : "border-border bg-background/70 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 hover:shadow-md",
              invalid && !value && "border-destructive",
            )}
          >
            <span>{option.label}</span>
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                selected
                  ? "border-primary-foreground/60 bg-primary-foreground/20"
                  : "border-border group-hover:border-primary/40",
              )}
            >
              {selected && <CheckIcon className="size-3.5" aria-hidden />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
