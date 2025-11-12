// Minimal types for API route. Adjust as the schema evolves.

/** ユーザー入力の目的カテゴリ */
export type Purpose = "観光" | "ショッピング" | "グルメ" | "宿泊" | string;

/** 旅程自動生成のリクエスト型（必要項目は code 側のバリデーションに揃える） */
export interface PlanRequest {
  city: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  purposes: Purpose[];
  poiIds?: string[]; // 任意選択されたPOIのID群
  hotelName?: string; // 任意のホテル名（自由入力）
  adults?: number;
  children?: number;
}

/** 1つの訪問アイテム */
export type PlanItem = {
  id: string;
  name: string;
  title?: string;
  tags?: string[];
  time?: string | number; // "10:30" など / 分数
  durationMin?: number;
  distanceKm?: number;
  lat?: number;
  lng?: number;
};

/** 1日分の計画 */
export interface PlanDay {
  date: string; // YYYY-MM-DD
  items: PlanItem[];
}

/** APIが返す全体構造（内部名 _PlanResponse を外側で as PlanResponse で使う） */
export interface _PlanResponse {
  city: string;
  startDate: string;
  endDate: string;
  days: PlanDay[];
  notes?: string[];
}
