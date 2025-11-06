export type CityKey = "tokyo" | "kyoto" | "osaka";

export const SITE_URL = "https://travoru.example.com";

export const CITY_META: Record<
  CityKey,
  {
    path: string;
    title: string;
    description: string;
    image: string;
    alt: string;
  }
> = {
  tokyo: {
    path: "/i/tokyo",
    title: "Tokyo — まるっと東京",
    description: "夜景とカルチャー。展望・アート・ショッピングまで幅広く楽しむ東京の定番体験。",
    image: "/images/tokyo.jpeg",
    alt: "夜の東京タワーと高層ビル群の夜景",
  },
  kyoto: {
    path: "/i/kyoto",
    title: "Kyoto — まるっと京都",
    description: "八坂の塔や石畳の路地。着物で街歩き、京都の魅力をぎゅっと凝縮。",
    image: "/images/kyoto.jpeg",
    alt: "京都・八坂の塔へ続く石畳の路地を歩く着物姿の2人",
  },
  osaka: {
    path: "/i/osaka",
    title: "Osaka — まるっと大阪",
    description: "グルメとエネルギー。道頓堀からUSJまで勢いよく満喫する大阪旅。",
    image: "/images/osaka.jpeg",
    alt: "青空の下の大阪城と桜並木",
  },
};

export const SITE_ORIGIN = SITE_URL.replace(/\/+$/, "");

export const absoluteImage = (src: string) =>
  /^https?:\/\//.test(src) ? src : `${SITE_ORIGIN}${src}`;

// UI用のラベル（必要なら利用）
export const CITY_LABEL: Record<CityKey, string> = {
  tokyo: "東京",
  kyoto: "京都",
  osaka: "大阪",
};
