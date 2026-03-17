import { css } from "clsx";
import { merge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return merge(css(inputs));
}