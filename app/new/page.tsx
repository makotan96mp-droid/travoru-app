import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '新規プラン作成 — Travoru',
  description: '行き先・日程・目的を入れて旅程を自動生成。',
  alternates: { canonical: '/new' },
  openGraph: {
    type: 'website',
    url: '/new',
    siteName: 'Travoru',
    title: '新規プラン作成 — Travoru',
    description: '行き先・日程・目的を入れて旅程を自動生成。',
    images: ['/favicon.ico']
  },
  twitter: {
    card: 'summary_large_image',
    title: '新規プラン作成 — Travoru',
    description: '行き先・日程・目的を入れて旅程を自動生成。',
    images: ['/favicon.ico']
  }
};
"use client";
import { useState } from "react";

type Purposes = Array<"観光" | "ショッピング" | "グルメ" | "宿泊">;

function toUrlSafeBase64(str: string): string {
  const b64 = btoa(unescape(encodeURIComponent(str)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function parseFixedPois(input: string) {
  return input
    .split(/[\n,、]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((raw) => {
      let time: string | undefined;
      let rest = raw;

      // 先頭の時刻 (HH:MM)
      const mTime = rest.match(/^\s*(\d{1,2}:\d{2})\s*(.*)$/);
      if (mTime) {
        time = mTime[1];
        rest = mTime[2].trim();
      }

      // 末尾の @<日> / @d<日>（1始まり）→ 0始まり dayOffset
      let dayOffset: number | undefined;
      const mDay = rest.match(/^(.*?)(?:@(?:d)?(\d+))$/i);
      let title = rest;
      if (mDay) {
        title = mDay[1].trim();
        const n = parseInt(mDay[2], 10);
        if (!Number.isNaN(n)) dayOffset = Math.max(0, n - 1);
      }

      const obj: any = { title };
      if (time) obj.time = time;
      if (dayOffset != null) obj.meta = { dayOffset };
      return obj;
    });
}

export default function NewPlanPage() {
  const [city, setCity] = useState("osaka");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 86400000).toISOString().slice(0, 10),
  );
  const [hotelName, setHotelName] = useState("");
  const [autoTransfer, setAutoTransfer] = useState(true);
  const [purposes, setPurposes] = useState<Purposes>(["観光", "グルメ"]);
  const [fixedText, setFixedText] = useState("USJ, カニ道楽, アメリカ村"); // 例
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const togglePurpose = (p: Purposes[number]) => {
    setPurposes((prev) =>
      prev.includes(p) ? (prev.filter((x) => x !== p) as Purposes) : ([...prev, p] as Purposes),
    );
  };

  const submit = async () => {
    setBusy(true);
    setErr(null);
    try {
      const fixedPois = parseFixedPois(fixedText);
      const body = {
        city,
        startDate,
        endDate,
        hotelName: hotelName.trim() || undefined,
        purposes,
        options: { autoTransfer },
        fixedPois: fixedPois.length ? fixedPois : undefined,
      };
      const r = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error("API error: " + r.status);
      const json = await r.json();

      // Demo 用の共有フォーマットに変換して /demo-itinerary へ遷移
      const payload = {
        date: startDate,
        items: json.items,
        ui: { density: "cozy", showDistance: true },
      };
      const u = new URL(location.origin + "/demo-itinerary");
      u.searchParams.set("plan", toUrlSafeBase64(JSON.stringify(payload)));
      location.href = u.toString();
    } catch (e: any) {
      setErr(e?.message || "エラーが発生しました");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">新しい旅程を作る</h1>

      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm opacity-70">都市</span>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="rounded-md border px-3 py-2"
            >
              <option value="osaka">大阪</option>
              <option value="tokyo">東京</option>
              <option value="kyoto">京都</option>
              <option value="kobe">神戸</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm opacity-70">開始日</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-md border px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm opacity-70">終了日</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-md border px-3 py-2"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-sm opacity-70">ホテル名（未定なら空のままOK）</span>
          <input
            value={hotelName}
            onChange={(e) => setHotelName(e.target.value)}
            placeholder="例）ホテル日航大阪"
            className="rounded-md border px-3 py-2"
          />
        </label>

        <div>
          <div className="text-sm opacity-70 mb-2">ざっくり目的</div>
          <div className="flex flex-wrap gap-2">
            {(["観光", "ショッピング", "グルメ", "宿泊"] as Purposes).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => togglePurpose(p)}
                aria-pressed={purposes.includes(p)}
                className={`rounded-full border px-3 py-1 text-sm ${purposes.includes(p) ? "bg-black/80 text-white" : "hover:bg-black/5"}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-sm opacity-70">行きたい場所（カンマ/改行区切り）</span>
          <textarea
            value={fixedText}
            onChange={(e) => setFixedText(e.target.value)}
            rows={3}
            className="rounded-md border px-3 py-2"
          />
          <span className="text-xs opacity-60">
            例: <code>USJ@2</code>, <code>14:30 カニ道楽@1</code>, <code>アメリカ村</code>（@2
            は2日目を意味）
          </span>
        </label>

        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={autoTransfer}
            onChange={(e) => setAutoTransfer(e.target.checked)}
          />
          <span>到着/出発トランスファを自動で入れる</span>
        </label>

        {err ? <div className="text-red-600 text-sm">{err}</div> : null}

        <div className="pt-2">
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className="rounded-lg border px-4 py-2 text-[14px] hover:bg-black/5 disabled:opacity-60"
          >
            {busy ? "生成中..." : "この条件で行程を作る"}
          </button>
        </div>

        <p className="text-xs opacity-60 pt-2">
          生成後、/demo-itinerary に遷移します（距離表示ON・密度cozy）。
        </p>
      </div>
    </main>
  );
}
