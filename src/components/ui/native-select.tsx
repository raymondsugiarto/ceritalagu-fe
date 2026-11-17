import * as React from "react";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** A styled native <select>, matching Input. Accessible and form-friendly (works with register()). */
function NativeSelect({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className={cn("relative w-full", className)}>
      <select
        data-slot="native-select"
        className="flex h-10 w-full appearance-none rounded-md border border-input bg-background pr-9 pl-3 text-sm transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive"
        {...props}
      >
        {children}
      </select>
      <ChevronDownIcon
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
    </div>
  );
}

export { NativeSelect };
