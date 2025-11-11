// app/lib/seo.ts
// Minimal SEO helpers used across pages (robots, sitemap, dynamic city pages)

export type CityMeta = {
  title: string;
  description: string;
  imagePath: string; // relative to /public (e.g. "/og/tokyo.jpg")
};

// ---- Site URL (works on Vercel & local) ----
export const SITE_URL = (() => {
  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  const url = envUrl || "http://localhost:3000";
  return url.replace(/\/+$/, "");
})();

// Build absolute URL for images or paths
export const absoluteImage = (p: string) => {
  if (!p) return `${SITE_URL}/og-default.jpg`;
  if (/^https?:\/\//i.test(p)) return p;
  return `${SITE_URL}${p.startsWith("/") ? "" : "/"}${p}`;
};

// ---- City metadata (必要に応じて足してください) ----
export const CITY_META: Record<string, CityMeta> = {
  tokyo: {
    title: "東京 | Travoru",
    description: "東京の見どころを自動で最適ルートに。AIが日程と好みに合わせて旅程を提案します。",
    imagePath: "/og/tokyo.jpg",
  },
  osaka: {
    title: "大阪 | Travoru",
    description: "食とエンタメの街・大阪の王道から穴場まで。AI最適化の旅程で効率よく巡ろう。",
    imagePath: "/og/osaka.jpg",
  },
  kyoto: {
    title: "京都 | Travoru",
    description: "寺社・庭園・街歩き。混雑も考慮したAI旅程で、ゆとりある京都観光を。",
    imagePath: "/og/kyoto.jpg",
  },
};

// 安全な取得ヘルパ（足りない都市にデフォルトを返す）
export function getCityMeta(slug: string): CityMeta {
  const c = CITY_META[slug.toLowerCase()];
  if (c) return c;
  return {
    title: `${slug} | Travoru`,
    description: `${slug}の見どころをAIが自動で最適化。好みと日程から旅程を作成します。`,
    imagePath: "/og-default.jpg",
  };
}
