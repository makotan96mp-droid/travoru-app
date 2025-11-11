export type IconGroup = { icon: string; anyOf: string[] };

/** 優先度の高い順（先勝ち） */
export const ICON_GROUPS: IconGroup[] = [
  {
    icon: "🚉",
    anyOf: ["transfer", "移動", "乗換", "train", "駅", "subway", "bus", "空港", "airport"],
  },
  {
    icon: "🏨",
    anyOf: ["hotel", "宿", "宿泊", "チェックイン", "checkin", "チェックアウト", "checkout"],
  },
  {
    icon: "🍜",
    anyOf: [
      "food",
      "グルメ",
      "restaurant",
      "レストラン",
      "ランチ",
      "ディナー",
      "ramen",
      "寿司",
      "寿し",
      "すし",
      "焼肉",
      "yakiniku",
    ],
  },
  { icon: "☕", anyOf: ["cafe", "coffee", "カフェ", "喫茶", "tea", "ティー"] },
  {
    icon: "🛍️",
    anyOf: ["shopping", "買い物", "ショッピング", "market", "市場", "モール", "百貨店"],
  },
  {
    icon: "🏛️",
    anyOf: ["museum", "美術館", "博物館", "観光", "寺", "神社", "temple", "shrine", "castle", "城"],
  },
  { icon: "🌳", anyOf: ["park", "公園", "庭園", "garden"] },
  {
    icon: "🎭",
    anyOf: ["show", "ライブ", "concert", "演劇", "舞台", "イベント", "festival", "フェス"],
  },
  { icon: "📷", anyOf: ["photo", "撮影", "フォト", "インスタ", "映え", "view", "展望", "タワー"] },
  { icon: "🧖", anyOf: ["温泉", "spa", "銭湯", "sauna", "サウナ"] },
  { icon: "🚶", anyOf: ["walk", "散策", "徒歩", "ハイキング", "hike", "trail"] },
];

/** 追加カスタム： { "キーワード(小文字推奨)": "emoji" } */
export const ICON_CUSTOM: Record<string, string> = {
  aquarium: "🐟",
  水族館: "🐟",
  海遊館: "🐟",

  // 例: "usj": "🎢", "ユニバ": "🎢"
  usj: "🎢",
  ユニバ: "🎢",
  ユニバーサル: "🎢",
};

export function pickIconFrom(text: string, tags: string[] = []): string | null {
  const hay = `${tags.join(" ")} ${text}`.toLowerCase();

  // 1) カスタム優先（部分一致）
  for (const [k, v] of Object.entries(ICON_CUSTOM)) {
    if (hay.includes(k.toLowerCase())) return v;
  }

  // 2) 優先グループ（部分一致）
  for (const g of ICON_GROUPS) {
    if (g.anyOf.some((kw) => hay.includes(kw.toLowerCase()))) return g.icon;
  }
  return null;
}
