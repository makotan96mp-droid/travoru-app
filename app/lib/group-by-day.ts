import type { PlanItem } from "./plan-types";

export type PlanDay = {
  dayOffset: number;   // 0-based from startDate
  items: PlanItem[];
};

export function groupItemsByDay(items: PlanItem[]): PlanDay[] {
  const map = new Map<number, PlanItem[]>();

  for (const it of items) {
    const day = it.meta?.dayOffset ?? 0;
    if (!map.has(day)) map.set(day, []);
    map.get(day)!.push(it);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([dayOffset, items]) => ({ dayOffset, items }));
}
