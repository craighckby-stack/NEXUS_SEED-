// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class names into a single string.
 * 
 * @param inputs - Variable number of class names to combine.
 * @returns A single string containing all class names.
 */
export function combineClassNames(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}