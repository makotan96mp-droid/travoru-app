import fs from "fs";

const f = "app/demo-itinerary/DemoClient.tsx";
const code = `\
"use client";
import { useState, useEffect, useCallback } from "react";
import ItineraryDayCard from "@/_components/ItineraryDayCard";
import { useSearchParams } from "next/navigation";

type Item = {
  time?: string;
  title?: string;
  name?: string;
  note?: string;
  tags?: string[];
  isMain?: boolean;
  isNow?: boolean;
  meta?: { distanceHint?: number };
};

function hhmm(d: Date) {
  return \`\${String(d.getHours()).padStart(2, "0")}:\${String(d.getMinutes()).padStart(2, "0")}\`;
}
function roundToNextSlot(d = new Date(), slots = ["09:00","11:30","14:00","16:30","18:30"]) {
  const now = hhmm(d);
  return slots.find((t) => t >= now) ?? slots[0];
}
function parseDensity(v: string | null): "compact" | "cozy" | "comfortable" | null {
  switch ((v || "").toLowerCase()) {
    case "compact": case "コンパクト": case "small": case "s": return "compact";
    case "cozy": case "標準": case "standard": case "medium": case "m": return "cozy";
    case "comfortable": case "ゆったり": case "large": case "l": return "comfortable";
    default: return null;
  }
}

export default function DemoItineraryClient() {
  const sp = useSearchParams();
  const densityParam = parseDensity(sp.get("density")) ?? "cozy";
  const paramDist = sp.get("dist"); // "0" なら距離表示OFF

  const now = roundToNextSlot(new Date());
  const initialItems: Item[] = [
    { time: "09:00", title: "チェックイン / ホテル", tags: ["hotel"], meta: { distanceHint: 0 } },
    { time: "11:30", title: "道頓堀 食べ歩き", tags: ["food","shopping"], note: "たこ焼き・串カツ", meta: { distanceHint: 450 }, isMain: true },
    { time: "14:00", title: "大阪城 天守閣", tags: ["castle","観光"], meta: { distanceHint: 1800 } },
    { time: "16:30", title: "カフェで休憩", tags: ["cafe"], meta: { distanceHint: 250 } },
    { time: "18:30", title: "ユニバ・パレード", tags: ["usj","show"], meta: { distanceHint: 3200 } },
  ].map((x) => ({ ...x, isNow: x.time === now }));

  const [items, setItems] = useState<Item[]>(initialItems);
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0,10));
  const [density, setDensity] = useState<"compact"|"cozy"|"comfortable">(densityParam);
  const [showDistance, setShowDistance] = useState<boolean>(paramDist == null ? true : paramDist !== "0");

  const STORAGE_KEY = "travoru.demo.itinerary.v1";
  const STORAGE_KEY_DATE = "travoru.demo.itinerary.date.v1";
  const STORAGE_KEY_UI_DENSITY = "travoru.demo.itinerary.ui.density.v1";
  const STORAGE_KEY_UI_DIST = "travoru.demo.itinerary.ui.dist.v1";

  // 初期ロード（URL指定 > 保存値）
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed);
      }
      const d = localStorage.getItem(STORAGE_KEY_DATE);
      if (d) setDate(d);
      // density/showDistance は URLが未指定のときだけ保存値を反映
      if (!parseDensity(sp.get("density"))) {
        const saved = parseDensity(localStorage.getItem(STORAGE_KEY_UI_DENSITY));
        if (saved) setDensity(saved);
      }
      if (paramDist == null) {
        const dist = localStorage.getItem(STORAGE_KEY_UI_DIST);
        if (dist != null) setShowDistance(dist !== "0");
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 変更を永続化
  useEffect(() => { try { localStorage.setItem(STORAGE_KEY_UI_DENSITY, density); } catch {} }, [density]);
  useEffect(() => { try { localStorage.setItem(STORAGE_KEY_UI_DIST, showDistance ? "1" : "0"); } catch {} }, [showDistance]);

  const handleReorder = useCallback((next: Item[]) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
    setItems(next);
  }, []);

  const handleReset = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    try { localStorage.removeItem(STORAGE_KEY_DATE); } catch {}
    setItems(initialItems);
    setDate(new Date().toISOString().slice(0,10));
  }, [initialItems]);

  const handleAdd = useCallback(() => {
    const newItem: Item = {
      time: roundToNextSlot(new Date()),
      title: "新規スポット",
      note: "メモ（例：入場料・予約URL・滞在目安）",
      tags: ["todo","new"],
      isMain: false,
      meta: { distanceHint: 0 },
    };
    setItems((prev) => {
      const next = [...prev, newItem];
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button onClick={handleReset} className="rounded-lg border px-3 py-1 text-sm hover:bg-black/5">Reset</button>
        <label className="text-sm flex items-center gap-2">
          表示サイズ:
          <select
            name="density-select"
            className="rounded border px-2 py-1 text-sm"
            value={density}
            onChange={(e)=>setDensity(e.target.value as "compact"|"cozy"|"comfortable")}
          >
            <option value="compact" title="一覧性重視（情報多め・余白少なめ）">コンパクト</option>
            <option value="cozy" title="標準（バランス）">標準</option>
            <option value="comfortable" title="見やすさ重視（文字大・余白ひろめ）">ゆったり</option>
          </select>
        </label>
        <label className="text-sm flex items-center gap-2">
          <input type="checkbox" checked={showDistance} onChange={(e)=>setShowDistance(e.target.checked)} />
          距離表示
        </label>
      </div>

      <ItineraryDayCard
        dayKey="1"
        baseDate={date}
        items={items}
        date={date}
        density={density}
        showDistance={showDistance}
        draggable
        onReorder={handleReorder}
        onAdd={handleAdd}
        onDateChange={(v) => { setDate(v); try { localStorage.setItem(STORAGE_KEY_DATE, v); } catch {} }}
      />
    </main>
  );
}
`;
fs.writeFileSync(f, code);
console.log("✅ DemoClient.tsx を安全テンプレで再生成しました");
