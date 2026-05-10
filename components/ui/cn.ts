import { twMerge } from "tailwind-merge";

/** Join class names; later Tailwind utilities override earlier conflicting ones. */
export function cn(...parts: Array<string | undefined | null | false>): string {
  return twMerge(parts.filter(Boolean) as string[]);
}
