import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Shortens a title to a maximum length, adding ellipsis if needed
 * Ensures titles never wrap to multiple lines
 * @param title - The title to shorten
 * @param maxLength - Maximum length before truncation (default: 25)
 * @returns Shortened title with ellipsis if needed
 */
export function shortenTitle(title: string, maxLength: number = 25): string {
  if (!title || title.length <= maxLength) {
    return title;
  }

  // Always truncate at maxLength to prevent wrapping
  return title.substring(0, maxLength) + "...";
}
