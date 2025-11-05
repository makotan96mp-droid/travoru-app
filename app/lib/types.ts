export type TravelMode = "walk" | "transit" | "drive";
export type Purpose = "観光" | "ショッピング" | "グルメ" | "宿泊" | "体験" | "写真" | "宿泊";
0
export interface PlanDay {
  date: string;
  items: { time: string; title: string; note?: string }[];
}
export interface PlanResponse {
  previewCountLeft: number; // 無料プレビュー残回数
  city: string;
  days: PlanDay[];
  notes?: string[];
}
