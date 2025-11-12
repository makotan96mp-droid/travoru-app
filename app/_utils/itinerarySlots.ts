// app/_utils/itinerarySlots.ts

/** 1日の行程スロット。start/end は "HH:mm" 24h 表記 */
export type ItinerarySlot = {
  key: "breakfast" | "morning" | "lunch" | "afternoon" | "tea" | "dinner" | "evening";
  label: string;
  start: string; // "09:30"
  end: string; // "11:00"
};

/** デフォルトの時間割（都市観光を想定 / 移動・入場の余白多め） */
export const DEFAULT_SLOTS: ItinerarySlot[] = [
  { key: "breakfast", label: "Breakfast", start: "07:30", end: "09:00" },
  { key: "morning", label: "Morning", start: "09:00", end: "12:00" },
  { key: "lunch", label: "Lunch", start: "12:00", end: "13:30" },
  { key: "afternoon", label: "Afternoon", start: "13:30", end: "17:00" },
  { key: "tea", label: "Cafe/Break", start: "17:00", end: "18:00" },
  { key: "dinner", label: "Dinner", start: "18:00", end: "20:00" },
  { key: "evening", label: "Evening", start: "20:00", end: "22:00" },
];

/** "HH:mm" を分に変換 */
function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** 分を "HH:mm" に変換（ゼロ詰め） */
function _toHHMM(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  const z = (n: number) => n.toString().padStart(2, "0");
  return `${z(h)}:${z(m)}`;
}

/** スロット定義を上書きしたい場合に使うユーティリティ */
export function getItinerarySlots(
  override?: Partial<Record<ItinerarySlot["key"], Partial<ItinerarySlot>>>,
): ItinerarySlot[] {
  if (!override) return DEFAULT_SLOTS;
  return DEFAULT_SLOTS.map((s) => {
    const ov = override[s.key];
    return ov
      ? {
          ...s,
          ...ov,
          // start/end は存在すればそのまま、無ければ既存値
          start: ov.start ?? s.start,
          end: ov.end ?? s.end,
          label: ov.label ?? s.label,
        }
      : s;
  });
}

/** 任意の時刻がどのスロットに入るかを取得 */
export function findSlotByTime(
  timeHHMM: string,
  slots: ItinerarySlot[] = DEFAULT_SLOTS,
): ItinerarySlot | null {
  const t = toMin(timeHHMM);
  for (const s of slots) {
    const a = toMin(s.start);
    const b = toMin(s.end);
    if (t >= a && t < b) return s;
  }
  return null;
}

/** スロットの長さ（分）を返す */
export function slotDurationMin(slot: ItinerarySlot): number {
  return Math.max(0, toMin(slot.end) - toMin(slot.start));
}

/** 便利: スロットを "HH:mm–HH:mm label" 表記にフォーマット */
export function formatSlot(slot: ItinerarySlot): string {
  return `${slot.start}–${slot.end} ${slot.label}`;
}

export default getItinerarySlots;
