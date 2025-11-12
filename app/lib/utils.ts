import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** tailwindのクラス結合ヘルパー（shadcn/ui互換） */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
