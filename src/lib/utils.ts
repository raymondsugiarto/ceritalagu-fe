import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merges conditional classes and resolves Tailwind conflicts (`cn("p-2", big && "p-4")`). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
