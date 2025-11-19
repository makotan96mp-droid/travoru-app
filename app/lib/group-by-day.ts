import type { PlanItem } from "./plan-types";

export type PlanDay = {
  /** 0-based day offset (Day1 => 0) */
  dayOffset: number;
  items: PlanItem[];
};

/**
 * dayOffset を見て 0 日目〜最終日までの配列を必ず返す。
 * 途中の日にアイテムが無い場合も空配列で埋める。
 */
export function groupByDay(items: PlanItem[]): PlanDay[] {
  if (!items.length) return [];

  const map = new Map<number, PlanItem[]>();

  for (const item of items) {
    const day = item.meta?.dayOffset ?? 0;
    if (!map.has(day)) {
      map.set(day, []);
    }
    map.get(day)!.push(item);
  }

  // アイテムが存在する最大 dayOffset までを「連続の日」とみなす
  let maxDay = 0;
  for (const d of map.keys()) {
    if (d > maxDay) maxDay = d;
  }

  const result: PlanDay[] = [];
  for (let dayOffset = 0; dayOffset <= maxDay; dayOffset++) {
    result.push({
      dayOffset,
      items: map.get(dayOffset) ?? [],
    });
  }

  return result;
}


// Backwards-compat alias (古い呼び出し用)
export const groupItemsByDay = groupByDay;


/**
 * Dayごとに必ず1件はアイテムがある状態にするヘルパー。
 * アイテムが0件のDayには「予備日です」のダミー PlanItem を1件だけ挿入する。
 */
export function groupByDayWithPlaceholder(items: PlanItem[]): PlanDay[] {
  return groupByDay(items).map((day) => {
    if (day.items.length > 0) return day;
    return {
      ...day,
      items: [{
        time: "",
        title: "この日はまだスポットがありません（予備日として使えます）。",
        note: "",
        tags: [],
        meta: { dayOffset: day.dayOffset },
        isMain: false,
      }],
    };
  });
}
