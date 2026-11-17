import * as React from "react";
import { AlertCircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Inline field error. Link it to its input with `aria-describedby={id}`. Renders nothing when empty. */
function FieldError({ className, children, ...props }: React.ComponentProps<"p">) {
  if (!children) return null;
  return (
    <p
      data-slot="field-error"
      aria-live="polite"
      className={cn("flex items-start gap-1.5 text-sm text-destructive", className)}
      {...props}
    >
      <AlertCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

export { FieldError };
