import type { Days } from "./postprocess";

/**
 * 将来の地図API連携を見据えたインターフェース。
 * 現状は meta.distanceHint (数値小さいほど近い) がある場合のみ軽い並べ替え。
 */
export async function balanceByHotelCenter(days: Days, _hotel: { name?: string; lat?: number; lng?: number }){
  const keys = Object.keys(days).sort();
  for (const k of keys) {
    const arr = days[k];
    // 観光系のみ、distanceHint が付いていれば軽くバケツソート
    const visit = arr.filter(i => (i.type ?? "").match(/観光|スポット|体験/));
    if (visit.some(i => typeof i?.meta?.distanceHint === "number")) {
      const others = arr.filter(i => !visit.includes(i));
      visit.sort((a,b) => (a?.meta?.distanceHint ?? 999) - (b?.meta?.distanceHint ?? 999));
      days[k] = [...visit, ...others].sort((a,b)=> a.time.localeCompare(b.time)); // 最終的に時刻で整列
    }
  }
  return days;
}
