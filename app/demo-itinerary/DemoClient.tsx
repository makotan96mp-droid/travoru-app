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
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function roundToNextSlot(d = new Date(), slots = ["09:00", "11:30", "14:00", "16:30", "18:30"]) {
  const now = hhmm(d);
  return slots.find((t) => t >= now) ?? slots[0];
}

export default function DemoItineraryClient() {
  const sp = useSearchParams();
  const densityParam = (sp.get("density") as "compact" | "cozy" | "comfortable" | null) ?? "cozy";
  const showDistance = sp.get("dist") !== "0";
  const now = roundToNextSlot(new Date());
  const initialItems: Item[] = [
    { time: "09:00", title: "チェックイン / ホテル", tags: ["hotel"], meta: { distanceHint: 0 } },
    {
      time: "11:30",
      title: "道頓堀 食べ歩き",
      tags: ["food", "shopping"],
      note: "たこ焼き・串カツ",
      meta: { distanceHint: 450 },
      isMain: true,
    },
    {
      time: "14:00",
      title: "大阪城 天守閣",
      tags: ["castle", "観光"],
      meta: { distanceHint: 1800 },
    },
    { time: "16:30", title: "カフェで休憩", tags: ["cafe"], meta: { distanceHint: 250 } },
    {
      time: "18:30",
      title: "ユニバ・パレード",
      tags: ["usj", "show"],
      meta: { distanceHint: 3200 },
    },
  ].map((x: Item) => ({ ...x, isNow: x.time === now }));
  const [items, setItems] = useState<Item[]>(initialItems);

  const STORAGE_KEY = "travoru.demo.itinerary.v1";
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {}
  }, []);
  const handleReorder = useCallback((next: Item[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
    setItems(next);
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <ItineraryDayCard
        dayKey="1"
        baseDate={new Date().toISOString().slice(0, 10)}
        items={items}
        density={densityParam}
        showDistance={showDistance}
        draggable
        onReorder={handleReorder} /* ← ここはクライアントOK */
        onDateChange={(v) => console.log("date:", v)}
      />
      <div className="mt-6 text-sm opacity-70 space-y-1">
        <div>Try query params:</div>
        <code>?density=compact</code>, <code>?density=comfortable</code>, <code>?dist=0</code>
      </div>
    </main>
  );
}
