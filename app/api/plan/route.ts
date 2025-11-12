import { NextRequest, NextResponse } from "next/server";
import type { PlanRequest, _PlanResponse as PlanResponse } from "@/lib/types";

export const runtime = "edge";

/**
 * 安全な文字トリム
 */
function trimOrNull(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t || ["未定", "tbd", "TBD", "null", "undefined"].includes(t)) return null;
  return t;
}

/**
 * "HH:MM" を返すだけ（実際の日付結合はクライアント側で行う想定）
 */
function hhmm(h: number, m: number = 0): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}`;
}

// 開始日と終了日の日数差（>=0）
function daysBetween(a: string, b: string): number {
  try {
    const d1 = new Date(a + "T00:00:00");
    const d2 = new Date(b + "T00:00:00");
    const t1 = d1.getTime(),
      t2 = d2.getTime();
    if (Number.isNaN(t1) || Number.isNaN(t2)) return 0;
    const diff = Math.floor((t2 - t1) / 86400000);
    return diff < 0 ? 0 : diff;
  } catch {
    return 0;
  }
}

/**
 * 目的から簡易フラグ導出
 */
function deriveWants(purposes: string[] | undefined) {
  const ps = (purposes ?? []).map((s) => String(s).toLowerCase());
  const wantsFood = ps.some((p) => ["グルメ", "food", "eat", "gourmet"].includes(p));
  const wantsStay = ps.some((p) => ["宿泊", "stay", "hotel"].includes(p));
  const wantsShop = ps.some((p) => ["ショッピング", "shopping", "shop"].includes(p));
  const wantsSight = ps.some((p) => ["観光", "sightseeing", "tour"].includes(p));
  return { wantsFood, wantsStay, wantsShop, wantsSight };
}

/**
 * 到着/出発・ホテルIN/OUTのダミースロットを作る
 * - options.autoTransfer が未指定なら true 扱い（初期体験を親切に）
 * - hotelName が未定ならホテル系は生成しない
 */
function seedSystemSlots(req: PlanRequest) {
  type Slot = {
    time: string;
    title: string;
    tags?: string[];
    isMain?: boolean;
    meta?: { dayOffset?: number };
  };
  const slots: Slot[] = [];
  const autoTransfer = (req as any)?.options?.autoTransfer ?? true;
  const hotelName = trimOrNull((req as any)?.hotelName);
  const start = String((req as any)?.startDate || "");
  const end = String((req as any)?.endDate || "");
  const lastOffset = daysBetween(start, end); // 0=同日, 1=翌日...

  if (autoTransfer) {
    // 到着: 初日
    slots.push({
      time: hhmm(9, 0),
      title: "到着 / トランスファ",
      tags: ["transfer"],
      meta: { dayOffset: 0 },
    });
  }
  if (hotelName) {
    // チェックイン: 初日
    slots.push({
      time: hhmm(15, 0),
      title: `チェックイン / ${hotelName}`,
      tags: ["hotel"],
      meta: { dayOffset: 0 },
    });
  }
  if (hotelName) {
    // チェックアウト: 最終日
    slots.push({
      time: hhmm(10, 0),
      title: `チェックアウト / ${hotelName}`,
      tags: ["hotel"],
      meta: { dayOffset: lastOffset },
    });
  }
  if (autoTransfer) {
    // 出発: 最終日
    slots.push({
      time: hhmm(17, 0),
      title: "出発 / トランスファ",
      tags: ["transfer"],
      meta: { dayOffset: lastOffset },
    });
  }
  return slots;
}

/**
 * 固定POIをシンプルに時刻割り当てしてマージ
 * - 指定 time があれば尊重、無ければ [11:30, 14:00, 16:30] を循環で付与
 */
function mergeFixedPOIs(
  req: any,
  slots: Array<{
    time: string;
    title: string;
    tags?: string[];
    isMain?: boolean;
    meta?: { dayOffset?: number };
  }>,
) {
  const fixed = Array.isArray(req?.fixedPois) ? req.fixedPois : [];
  if (!fixed.length) return slots;

  const times = ["11:30", "14:00", "16:30"];
  let i = 0;
  const normalized = fixed.map((p: any) => ({
    time:
      typeof p?.time === "string" && /\d{2}:\d{2}/.test(p.time)
        ? p.time
        : times[i++ % times.length],
    title: String(p?.title || "スポット"),
    tags: Array.isArray(p?.tags) ? p.tags : [],
    isMain: !!p?.isMain,
    meta: p && typeof p.meta === "object" ? p.meta : undefined, // 例: { dayOffset: 1 }
  }));

  const merged = [...slots, ...normalized];
  merged.sort((a, b) => {
    const ao = a?.meta?.dayOffset ?? 0;
    const bo = b?.meta?.dayOffset ?? 0;
    return ao !== bo ? ao - bo : a.time < b.time ? -1 : a.time > b.time ? 1 : 0;
  });
  return merged;
}

export async function POST(req: NextRequest) {
  let body: PlanRequest;
  try {
    body = (await req.json()) as PlanRequest;
  } catch {
    return NextResponse.json({ error: "JSONの解析に失敗しました" }, { status: 400 });
  }

  // 必須チェック
  if (!(body as any)?.city || !(body as any)?.startDate || !(body as any)?.endDate) {
    return NextResponse.json(
      { error: "必須項目が不足しています（city/startDate/endDate）" },
      { status: 400 },
    );
  }

  // 目的フラグ
  const flags = deriveWants((body as any)?.purposes);

  // ダミースロット生成
  let systemItems = seedSystemSlots(body);
  systemItems = mergeFixedPOIs(body, systemItems);
  // ここでは「最小の応答」を返す（後でPOI生成/最適化に接続）
  // PlanResponse の形状差異はキャストで許容（開発中フェーズ）
  const resp = {
    city: (body as any).city,
    startDate: (body as any).startDate,
    endDate: (body as any).endDate,
    items: systemItems,
    flags,
  } as any as PlanResponse;

  return NextResponse.json(resp, { status: 200 });
}
