import { cn } from "@/lib/utils";

// Delays stagger the bars so they never move in sync. Static classes so Tailwind can see them.
const BARS = [
  "[animation-delay:-0.9s]",
  "[animation-delay:-0.2s]",
  "[animation-delay:-0.6s]",
  "[animation-delay:-0.4s]",
  "[animation-delay:-1s]",
  "[animation-delay:-0.1s]",
  "[animation-delay:-0.7s]",
  "[animation-delay:-0.3s]",
  "[animation-delay:-0.8s]",
  "[animation-delay:-0.5s]",
  "[animation-delay:-0.15s]",
  "[animation-delay:-0.65s]",
];

interface EqualizerProps {
  className?: string;
  /** Number of bars (max 12). */
  bars?: number;
  /** "brand" = gradient bars; "inverse" = solid bars for use on a gradient background. */
  tone?: "brand" | "inverse";
  /** Freeze the bars (e.g. while the song is paused). */
  paused?: boolean;
}

/** Decorative animated equalizer. Still bars when the user prefers reduced motion. */
export function Equalizer({
  className,
  bars = 12,
  tone = "brand",
  paused = false,
}: EqualizerProps) {
  return (
    <div className={cn("flex h-10 items-end gap-1", className)} aria-hidden>
      {BARS.slice(0, bars).map((delay, i) => (
        <span
          key={i}
          className={cn(
            "h-full w-1.5 origin-bottom scale-y-50 rounded-full motion-safe:animate-equalize",
            tone === "brand"
              ? "bg-linear-to-t from-primary to-highlight"
              : "bg-primary-foreground/80",
            paused && "[animation-play-state:paused]",
            delay,
          )}
        />
      ))}
    </div>
  );
}
