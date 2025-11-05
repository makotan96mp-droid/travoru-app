/**
 * 距離ヒントのダミー辞書（小さいほどホテルから近い想定）
 * 将来は地図APIで置換。未登録は 999。
 */
const OSAKA_HINT: Record<string, number> = {
  "梅田スカイビル 空中庭園": 10,
  "大阪城": 20,
  "道頓堀": 30,
  "黒門市場": 35,
  "アメリカ村（アメ村）": 40,
  "通天閣": 50,
  "海遊館": 70,
  "カニ道楽 本店": 32,
  "USJ": 80
};

export function getDistanceHint(city: string | undefined, title: string | undefined): number {
  if (!title) return 999;
  if ((city ?? "").includes("大阪")) {
    // 完全一致優先、部分一致の簡易対応
    if (OSAKA_HINT[title] != null) return OSAKA_HINT[title];
    const hit = Object.entries(OSAKA_HINT).find(([k]) => title.includes(k));
    if (hit) return hit[1];
  }
  return 999;
}
