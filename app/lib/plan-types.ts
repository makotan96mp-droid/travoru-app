export type PlanItemMeta = {
  /** 0-based day offset from startDate */
  dayOffset?: number;

  /** 距離や移動時間のヒント（例: "徒歩 10 分"） */
  distanceHint?: string;

  /** 距離テキストの別名（旧フィールドとの互換用） */
  distanceText?: string;

  /** 予備のメタデータ（拡張用） */
  [key: string]: unknown;
};

export type PlanItem = {
  /** "09:00" などの時刻 */
  time: string;

  /** 表示タイトル（スポット名など） */
  title: string;

  /** 補足メモ（任意） */
  note?: string;

  /** タグ（"hotel" / "transfer" など） */
  tags?: string[];

  /** 日付オフセットや距離情報など */
  meta?: PlanItemMeta;

  /** メインの立ち寄りかどうか（ハイライト用） */
  isMain?: boolean;

  /** 「今ここ」表示用フラグ（将来拡張用） */
  isNow?: boolean;
};

export type PlanFlags = {
  wantsFood: boolean;
  wantsStay: boolean;
  wantsShop: boolean;
  wantsSight: boolean;
};

export type PlanResponse = {
  city: string;
  /** YYYY-MM-DD */
  startDate: string;
  /** YYYY-MM-DD */
  endDate: string;
  items: PlanItem[];
  flags: PlanFlags;
};
