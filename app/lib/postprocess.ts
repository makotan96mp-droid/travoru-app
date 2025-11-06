export type DayPlanItem = {
  time: string; // "HH:MM"
  title: string;
  type?: string; // "観光" | "グルメ" | "移動" | "プレースホルダ" など
  note?: string;
  meta?: Record<string, any>;
};
export type Days = Record<string, DayPlanItem[]>; // { day1: [...], day2: [...] }

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const fromMinutes = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};
const nearestFreeSlot = (items: DayPlanItem[], target: string) => {
  // 15分刻みで±2時間スキャンして最初の空きを返す
  const taken = new Set(items.map((i) => i.time));
  const base = toMinutes(target);
  for (let d = 0; d <= 8; d++) {
    // 0,15,30,...,120
    for (const s of [+d, -d]) {
      const t = base + s * 15;
      if (t < 6 * 60 || t > 22 * 60) continue; // 営業時間の想定帯
      const hhmm = fromMinutes(t);
      if (!taken.has(hhmm)) return hhmm;
    }
  }
  // どうしても空きが無ければ末尾の最後に
  const last = items.length ? items[items.length - 1].time : "10:00";
  return fromMinutes(Math.min(22 * 60, toMinutes(last) + 15));
};

export function addArrivalDepartureTransfers(days: Days, hotelName?: string) {
  if (!days) return days;
  const keys = Object.keys(days).sort(); // day1, day2, ...
  if (keys.length === 0) return days;

  const first = keys[0];
  const last = keys[keys.length - 1];

  // 既に移動が入っている場合は追加しない（重複回避）
  const hasMove = (arr: DayPlanItem[], kw: string) =>
    arr.some((i) => i.type === "移動" || (i.title && i.title.includes(kw)));

  // 到着
  if (!hasMove(days[first], "到着")) {
    const at = nearestFreeSlot(days[first], "09:00");
    days[first].push({
      time: at,
      title: `移動（到着）駅/空港 → ${hotelName ?? "ホテル"}`,
      type: "移動",
      note: "チェックイン時刻前の導線を確保（調整可）",
      meta: { auto: true, kind: "arrival" },
    });
  }

  // 出発
  if (!hasMove(days[last], "出発")) {
    const at = nearestFreeSlot(days[last], "16:00");
    days[last].push({
      time: at,
      title: `移動（出発）${hotelName ?? "ホテル"} → 駅/空港`,
      type: "移動",
      note: "出発前の移動バッファ（調整可）",
      meta: { auto: true, kind: "departure" },
    });
  }

  // 時刻順に整列（安定ソート）
  for (const k of keys) {
    days[k].sort((a, b) => toMinutes(a.time) - toMinutes(b.time));
  }
  return days;
}

// --- 安全ネット：各日のメイン枠を上限（既定2）にクランプ ---
const isMain = (i: DayPlanItem) => {
  const t = i.type ?? "";
  return !(t === "グルメ" || t === "移動" || t === "プレースホルダ");
};

export function clampMainPerDay(days: Days, caps: { [k: string]: number } = {}) {
  if (!days) return days;
  // day1, day2, ... のみ対象（非配列キーは無視）
  const keys = Object.keys(days)
    .filter((k) => /^day\d+$/.test(k))
    .sort((a, b) => Number(a.slice(3)) - Number(b.slice(3)));
  for (let idx = 0; idx < keys.length; idx++) {
    const k = keys[idx];
    // 値が配列じゃない場合はスキップ
    const arr = Array.isArray((days as any)[k]) ? ((days as any)[k] as DayPlanItem[]) : null;
    if (!arr) continue;

    const isFirst = idx === 0;
    const isLast = idx === keys.length - 1;
    const cap = caps[k] ?? (isFirst ? 2 : isLast ? 2 : 2); // 既定=2枠固定（B方針）

    const main = arr.filter(isMain);
    if (main.length > cap) {
      let kept = 0;
      const out: DayPlanItem[] = [];
      for (const it of arr) {
        if (isMain(it)) {
          if (kept < cap) {
            out.push(it);
            kept++;
          } else {
            out.push({
              time: it.time,
              title: (it.title ?? "") + "（候補）",
              type: "プレースホルダ",
              note: "上限超過のため候補化（編集で昇格可）",
              meta: { demotedFrom: it.type, auto: true },
            });
          }
        } else {
          out.push(it);
        }
      }
      (days as any)[k] = out.sort((a, b) => a.time.localeCompare(b.time));
    }
  }
  return days;
}
