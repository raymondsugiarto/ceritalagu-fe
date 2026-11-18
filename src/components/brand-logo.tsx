import Image from "next/image";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

export const BRAND_NAME = SITE.name;

type BrandLogoProps = {
  /** Mark size in px. */
  size?: number;
  /** Hide the "ceritalagu" wordmark and show only the C mark. */
  markOnly?: boolean;
  className?: string;
};

/**
 * Cerita Lagu mark + wordmark (the lowercase "ceritalagu" wordmark is part of the logo artwork). The mark is a transparent PNG cut from
 * public/brand/logo-ceritalagu.png; the wordmark is live text so it follows
 * the theme's foreground color in light and dark mode.
 */
export function BrandLogo({ size = 32, markOnly = false, className }: BrandLogoProps) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <Image
        src="/brand/ceritalagu-mark.png"
        alt={markOnly ? BRAND_NAME : ""}
        width={size}
        height={size}
        priority
        className="shrink-0"
      />
      {!markOnly && <span className="text-lg font-bold tracking-tight lowercase">ceritalagu</span>}
    </span>
  );
}
