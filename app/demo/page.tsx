import { headers } from "next/headers";
// app/demo/page.tsx (Next.js 16: サーバーコンポーネントでSSR fetch)
import ItineraryDayCard from "@/_components/ItineraryDayCard";

async function fetchPlan(baseURL: string) {
  const seed = {
    city: "大阪",
    startDate: "2025-11-06",
    endDate: "2025-11-10",
    purposes: ["観光", "グルメ", "宿泊"],
    hotelName: "ホテルモントレ大阪",
    mustSee: [
      "USJ",
      "カニ道楽 本店",
      "アメリカ村（アメ村）",
      "通天閣",
      "大阪城",
      "梅田スカイビル 空中庭園",
      "道頓堀",
      "黒門市場",
      "海遊館",
    ],
    policy: "nomal", // 誤記も normal 扱い
  };
  const res = await fetch(baseURL + "/api/plan", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(seed),
    // 開発時のみ: キャッシュ無効化
    cache: "no-store",
  });
  if (!res.ok) throw new Error("failed to fetch plan");
  return res.json();
}

export default async function DemoPage() {
  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host") ?? "localhost:3000";
  const proto =
    hdrs.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "production" ? "https" : "http");
  const baseURL =
    process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_SITE_URL
      ? process.env.NEXT_PUBLIC_SITE_URL
      : `${proto}://${host}`;

  const data = await fetchPlan(baseURL);

  const dayKeys = Object.keys(data)
    .filter((k) => /^day\d+$/.test(k))
    .sort((a, b) => Number(a.slice(3)) - Number(b.slice(3)));

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-6 space-y-4">
      <h1 className="text-2xl font-bold mb-2">デモ: 旅程カードUI</h1>
      {dayKeys.map((k) => (
        <ItineraryDayCard
          key={k}
          dayKey={k}
          items={data[k]}
          baseDate={"2025-11-06"}
          mainCap={2}
          density="compact"
        />
      ))}
    </main>
  );
}
