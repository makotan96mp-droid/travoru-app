import type { ComponentType, ReactNode } from "react";

export type IconComp = ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
export type Iconish = string | IconComp | null | undefined;

/** string ならバッジ、ComponentType なら <Icon /> に正規化して返す */
export function renderIconNode(iconish: Iconish, size = "h-4 w-4"): ReactNode {
  if (!iconish) return null;
  if (typeof iconish === "string") {
    return <span className="inline-block text-[10px] font-semibold leading-none">{iconish}</span>;
  }
  const Icon = iconish;
  return <Icon className={size} aria-hidden />;
}
