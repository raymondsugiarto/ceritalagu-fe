import * as React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.ComponentProps<"input"> {
  /** Optional icon rendered inside the input on the left. */
  startAdornment?: React.ReactNode;
}

function Input({ className, type = "text", startAdornment, ...props }: InputProps) {
  const base =
    "placeholder:text-muted-foreground flex h-10 w-full bg-transparent px-3 text-sm outline-none disabled:cursor-not-allowed";
  const frame =
    "border-input bg-background focus-within:outline-ring has-aria-invalid:border-destructive aria-invalid:border-destructive rounded-md border transition-colors focus-within:outline-2 focus-within:outline-offset-2 has-disabled:opacity-50";

  if (!startAdornment) {
    return (
      <input type={type} data-slot="input" className={cn(base, frame, className)} {...props} />
    );
  }
  return (
    <div data-slot="input" className={cn("flex h-10 w-full items-center", frame, className)}>
      <span className="flex h-full w-10 shrink-0 items-center justify-center text-muted-foreground [&_svg:not([class*='size-'])]:size-4">
        {startAdornment}
      </span>
      <input type={type} className={cn(base, "pl-0")} {...props} />
    </div>
  );
}

export { Input };
