import { cn } from "@/lib/utils";

interface StepProgressProps {
  /** Current step, 1-based. A value above total means every step is done (review). */
  current: number;
  total: number;
}

/**
 * One segment per step over a single primary → highlight gradient: finished segments let the
 * gradient show through, the rest are covered with the muted colour.
 */
export function StepProgress({ current, total }: StepProgressProps) {
  const done = Math.min(current, total);
  return (
    <div
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={done}
      aria-label="Progres pertanyaan"
      className="relative h-2 overflow-hidden rounded-full bg-linear-to-r from-primary to-highlight"
    >
      <div className="absolute inset-0 flex">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={cn(
              "h-full flex-1 border-r-4 border-background transition-colors duration-500 last:border-r-0",
              i < done ? "bg-transparent" : "bg-muted",
            )}
          />
        ))}
      </div>
    </div>
  );
}
