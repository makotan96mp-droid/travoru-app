export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3001";

export type CityMeta = {
  title: string;
  description: string;
  image: string; // absolute or path under /public
};

export const CITY_META: Record<string, CityMeta> = {
  tokyo: {
    title: "Tokyo — Old meets New",
    description: "夜景とカルチャー。東京タワーと摩天楼のきらめきで、東京の“古き良き×最新”を体験。",
    image: "/images/tokyo.jpeg",
  },
  kyoto: {
    title: "Kyoto — まるっと京都",
    description: "八坂の塔や石畳の路地。着物で街歩き、京都の魅力をぎゅっと凝縮。",
    image: "/images/kyoto.jpeg",
  },
  osaka: {
    title: "Osaka — オモロイがいっぱい大阪旅",
    description: "大阪城と街の活気。食いだおれの街で、笑いとグルメをハシゴしよう。",
    image: "/images/osaka.jpeg",
  },
};

export function absoluteImage(src: string) {
  return src.startsWith("http") ? src : `${SITE_URL}${src}`;
}
