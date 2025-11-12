import { test, expect } from "@playwright/test";

const seed = {
  city: "大阪",
  startDate: "2025-11-06",
  endDate: "2025-11-10",
  purposes: ["観光", "グルメ", "宿泊"],
  hotelName: "ホテルモントレ大阪",
  mustSee: [
    "USJ",
    "カニ道楽 本店",
    "アメリカ村（アメ村）",
    "通天閣",
    "大阪城",
    "梅田スカイビル 空中庭園",
    "道頓堀",
    "黒門市場",
    "海遊館",
  ],
  policy: "nomal", // 誤記も normal として扱われるか
};

function isMain(i: any) {
  const t = i?.type ?? "";
  return !(t === "グルメ" || t === "移動" || t === "プレースホルダ");
}

test("B方針: 各日メイン2枠固定 & ランチ/夕食重複なし & 到着/出発移動あり", async ({
  request,
  baseURL,
}) => {
  const res = await request.post(`${baseURL}/api/plan`, {
    data: seed,
    headers: { "content-type": "application/json" },
  });
  expect(res.ok()).toBeTruthy();

  const json = await res.json();

  // dayキーを抽出・昇順
  const dayKeys = Object.keys(json)
    .filter((k) => /^day\d+$/.test(k))
    .sort((a, b) => Number(a.slice(3)) - Number(b.slice(3)));
  expect(dayKeys.length).toBeGreaterThan(0);

  // 1) 各日メイン2件
  for (const k of dayKeys) {
    const mainCount = (json[k] || []).filter(isMain).length;
    expect(mainCount, `${k} main count`).toBe(2);
  }

  // 2) ランチ/夕食の時刻重複なし
  for (const k of dayKeys) {
    const meals = (json[k] || []).filter((i: any) => /ランチ|夕食/.test(i?.title ?? ""));
    const times = meals.map((i: any) => i.time);
    const uniq = Array.from(new Set(times));
    expect(uniq.length, `${k} meal time unique`).toBe(times.length);
  }

  // 3) 到着/出発の移動行が入っている
  const day1 = json[dayKeys[0]] || [];
  const last = json[dayKeys[dayKeys.length - 1]] || [];
  expect(day1.some((i: any) => /移動（到着）/.test(i?.title ?? ""))).toBeTruthy();
  expect(last.some((i: any) => /移動（出発）/.test(i?.title ?? ""))).toBeTruthy();

  // 4) distanceHint が付与されている（観光系のどれかに数値）
  const hasHint = dayKeys.some((k) =>
    (json[k] || []).some((i: any) => (i?.meta?.distanceHint ?? 999) !== 999),
  );
  expect(hasHint).toBeTruthy();
});
