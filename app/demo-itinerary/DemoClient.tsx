"use client";

import React, { useEffect, useMemo, useState } from "react";
import Toolbar from "./Toolbar";
import ItineraryDayCard from "../_components/ItineraryDayCard";

type Density = "compact" | "cozy";

type Item = {
  time?: string;
  title: string;
  tags?: string[];
  isMain?: boolean;
  meta?: { dayOffset?: number };
};

export default function DemoClient() {
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState<Item[]>([
    { time: "09:00", title: "チェックイン / ガイダンス", tags: ["transfer"] },
    { time: "11:30", title: "USJ" },
    { time: "15:00", title: "カフェ休憩" },
  ]);
  const [density, setDensity] = useState<Density>("cozy");
  const [showDistance, setShowDistance] = useState<boolean>(true);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);

  // ===== helpers =====
  function encodeB64(s: string) {
    return btoa(unescape(encodeURIComponent(s)));
  }
  function decodeB64(s: string) {
    return decodeURIComponent(escape(atob(s)));
  }

  function currentPlan() {
    return { date, items, density, dist: showDistance ? 1 : 0 };
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // フォールバック: execCommand
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    try {
      setToast("共有リンクをコピーしました");
      setTimeout(() => setToast(""), 1500);
    } catch {}
  }

  function makeShareUrl() {
    const b64 = encodeB64(JSON.stringify(currentPlan()));
    return `${window.location.origin}/demo-itinerary?plan=${b64}`;
  }

  // ===== restore from ?plan =====
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const p = url.searchParams.get("plan");
      if (p) {
        try {
          const raw = decodeB64(p);
          const obj = JSON.parse(raw || "{}");
          if (obj?.date) setDate(obj.date);
          if (Array.isArray(obj?.items)) setItems(obj.items);
          if (obj?.density === "compact" || obj?.density === "cozy") setDensity(obj.density);
          if ("dist" in obj) setShowDistance(!!+obj.dist);
        } catch {}
      }
      // density, dist の単独指定にも対応
      const qDensity = url.searchParams.get("density");
      if (qDensity === "compact" || qDensity === "cozy") setDensity(qDensity);
      const qDist = url.searchParams.get("dist");
      if (qDist != null) setShowDistance(!!+qDist);
    } catch {}
  }, []);

  // ===== close menu on ESC / outside click =====
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    const onDocClick = (e: MouseEvent) => {
      const root = document.getElementById("menu-panel-root");
      if (root && !root.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDocClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDocClick);
    };
  }, [menuOpen]);

  // ===== actions =====
  function handleReset() {
    setItems([]);
    setToast("リセットしました");
    setTimeout(() => setToast(""), 800);
  }
  function handleAdd() {
    setItems((arr) => [...arr, { time: "12:00", title: "新しい予定" }]);
  }
  function handleReorder(next: Item[]) {
    setItems(next);
  }
  function handlePrint() {
    try {
      window.print();
    } catch {}
  }
  function handleShareLink() {
    copy(makeShareUrl());
  }
  function triggerImport() {
    (document.getElementById("json-import-input") as HTMLInputElement | null)?.click();
  }

  async function handleShareCalendar() {
    const plan = currentPlan();
    // 1) Googleカレンダー（終日イベント）を新規タブで開く
    try {
      const ymd = String(plan.date || "").replace(/-/g, "");
      const text = encodeURIComponent(`Travoru 計画 (${plan.date || ""})`);
      const details = encodeURIComponent(
        (plan.items || [])
          .map((it: any, i: number) => `・${it?.title || "Item " + (i + 1)}`)
          .join("\n"),
      );
      const end = ymd ? String(Number(ymd) + 1) : "";
      const gc = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${ymd}/${end}&details=${details}&sf=true&output=xml`;
      window.open(gc, "_blank");
    } catch {}

    // 2) ICS も同時ダウンロード
    try {
      const dt = String(plan.date || "").replace(/-/g, "");
      const lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Travoru//Demo//JP",
        "BEGIN:VEVENT",
        `UID:travoru-${dt}@local`,
        `DTSTAMP:${dt || "20250101"}T000000Z`,
        dt ? `DTSTART;VALUE=DATE:${dt}` : "DTSTART;VALUE=DATE:20250101",
        dt ? `DTEND;VALUE=DATE:${String(Number(dt || "") + 1)}` : "DTEND;VALUE=DATE:20250102",
        `SUMMARY:Travoru 計画 (${plan.date || ""})`,
        "DESCRIPTION:" +
          (Array.isArray(plan.items)
            ? plan.items
                .map((it: any, i: number) => `・${it?.title || "Item " + (i + 1)}`)
                .join("\\n")
            : ""),
        "END:VEVENT",
        "END:VCALENDAR",
      ];
      const ics = lines.join("\r\n");
      const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `travoru-${plan.date || "plan"}.ics`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(a.href);
        a.remove();
      }, 0);

      try {
        setToast("カレンダー共有を開始しました（Google/ICS）");
        setTimeout(() => setToast(""), 1500);
      } catch {}
    } catch {}
    try {
      setMenuOpen(false);
    } catch {}
  }

  const totalDistLabel = useMemo(() => "", [items, showDistance]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      {/* Toolbar */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <Toolbar
          onReset={handleReset}
          onAdd={handleAdd}
          onToday={() => setDate(new Date().toISOString().slice(0, 10))}
          density={density}
          onToggleDensity={() => setDensity(density === "compact" ? "cozy" : "compact")}
          showDistance={showDistance}
          onToggleDistance={() => setShowDistance((v) => !v)}
          distanceLabel={totalDistLabel}
          onToggleMenu={() => setMenuOpen((v) => !v)}
          menuOpen={menuOpen}
        />

        {/* menu panel */}
        {menuOpen && (
          <div id="menu-panel-root" role="menu" className="relative" data-testid="menu-panel-root">
            <div
              className="absolute right-0 z-50 mt-2 w-64 rounded-lg border border-white/10 bg-black/80 backdrop-blur p-3 text-white/90 shadow-lg"
              data-testid="menu-panel"
              id="menu-panel-content"
              tabIndex={-1}
            >
              <div className="text-sm font-medium mb-2">メニュー</div>
              <ul className="space-y-1 text-sm">
                <li>
                  <button
                    data-testid="menu-share-link"
                    type="button"
                    className="px-2 py-1 rounded hover:bg-white/10 w-full text-left"
                    onClick={() => {
                      try {
                        handleShareLink();
                      } catch {}
                    }}
                  >
                    共有リンクをコピー
                  </button>
                </li>
                <li>
                  <button
                    data-testid="menu-calendar"
                    type="button"
                    className="px-2 py-1 rounded hover:bg-white/10 w-full text-left"
                    onClick={() => {
                      try {
                        handleShareCalendar();
                      } catch {}
                    }}
                  >
                    カレンダーに追加（Google/ICS）
                  </button>
                </li>
                <li>
                  <button
                    data-testid="menu-print"
                    type="button"
                    className="px-2 py-1 rounded hover:bg-white/10 w-full text-left"
                    onClick={() => {
                      try {
                        handlePrint();
                      } catch {}
                    }}
                  >
                    印刷/PDF
                  </button>
                </li>
                <li>
                  <button
                    data-testid="menu-json-import"
                    type="button"
                    className="px-2 py-1 rounded hover:bg-white/10 w-full text-left"
                    onClick={() => {
                      try {
                        // triggerImport がグローバルにあるならそれを、無ければ input#json-import-input をクリック
                        typeof (globalThis as any).triggerImport === "function"
                          ? (globalThis as any).triggerImport()
                          : triggerImport();
                      } catch {}
                    }}
                  >
                    JSON読み込み
                  </button>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* 内容 */}
      <ItineraryDayCard
        dayKey="1"
        baseDate={date}
        items={items as any}
        density={density}
        showDistance={showDistance}
        draggable
        onReorder={handleReorder}
        onDateChange={(v) => console.log("date:", v)}
      />

      <div className="mt-6 text-sm opacity-70 space-y-1">
        <div>Try query params:</div>
        <code>?density=compact</code>, <code>?density=cozy</code>, <code>?dist=0</code>
      </div>

      {toast ? (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 rounded-xl bg-black/80 text-white text-sm px-4 py-2 shadow-lg z-50"
          role="status"
          data-testid="toast"
          aria-live="polite"
        >
          {toast}
        </div>
      ) : null}

      {/* JSON import input (hidden) */}
      <input
        id="json-import-input"
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(e) => {
          try {
            const file = e.target.files?.[0];
            if (!file) return;
            const r = new FileReader();
            r.onload = () => {
              try {
                const data = JSON.parse(String(r.result) || "{}") as any;
                if (Array.isArray(data?.items)) setItems(data.items);
                if (typeof data?.date === "string") setDate(data.date);
                setToast("JSONを読み込みました");
                setTimeout(() => setToast(null), 1000);
              } catch (e) {
                alert("JSONの読み込みに失敗しました");
              }
            };
            r.readAsText(file);
          } catch {}
        }}
      />
    </main>
  );
}
