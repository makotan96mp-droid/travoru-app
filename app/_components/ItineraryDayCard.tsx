// app/_components/ItineraryDayCard.tsx
import React from "react";

export type DayPlanItem = {
  time: string;
  title: string;
  type?: string; // "観光" | "グルメ" | "移動" | "プレースホルダ" など
  note?: string;
  meta?: Record<string, any>;
};

type Props = {
  dayKey: string;       // "day1" など
  items: DayPlanItem[];
  baseDate?: string;    // "YYYY-MM-DD"（任意：曜日表示に使用）
  mainCap?: number;     // 既定2
  density?: "normal" | "compact"; };

const isMain = (i: DayPlanItem) => {
  const t = i.type ?? "";
  return !(t === "グルメ" || t === "移動" || t === "プレースホルダ");
};

const typeBadge = (t?: string, title?: string) => {
  const type = t ?? "";
  const isBreak = /休憩/.test(title ?? "") || type === "プレースホルダ";
  if (isBreak) return { icon: "🫖", color: "bg-gray-100 text-gray-700 ring-1 ring-gray-200" };
  if (type === "観光") return { icon: "🗺️", color: "bg-blue-100 text-blue-700 ring-1 ring-blue-200" };
  if (type === "グルメ") return { icon: "🍽️", color: "bg-amber-100 text-amber-800 ring-1 ring-amber-200" };
  if (type === "移動") return { icon: "🚉", color: "bg-slate-100 text-slate-700 ring-1 ring-slate-200" };
  return { icon: "📍", color: "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200" };

const mealIcon = (title?: string) => {
  const t = title ?? "";
  if (/朝食|ブレックファスト/.test(t)) return "🍞";
  if (/ランチ|昼食/.test(t)) return "🍜";
  if (/夕食|ディナー/.test(t)) return "🍛";
  return "🍽️";
};
};

const wday = (date: string | undefined, idx: number) => {
  if (!date) return "";
  const base = new Date(date);
  const d = new Date(base.getTime() + idx * 24 * 60 * 60 * 1000);
  return ["日","月","火","水","木","金","土"][d.getDay()];
};

export default function ItineraryDayCard({ dayKey, items, baseDate, mainCap = 2, density = "normal" }: Props) {
  const dayIdx = Number(dayKey.replace("day","")) || 1;
  const dayMainCount = items.filter(isMain).length;

  return (
    <section className="rounded-2xl border border-black/10 bg-white shadow-md p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3 sticky top-0 z-10 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 rounded-xl px-2 py-2">
        <h3 className="text-lg sm:text-xl font-semibold tracking-tight">
          Day {dayIdx}{baseDate ? `（${wday(baseDate, dayIdx-1)}）` : ""}
        </h3>
        {/* cap バッジ（超過で警告色） */}
<span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${dayMainCount>mainCap ? "bg-rose-50 text-rose-700 ring-rose-200" : "bg-sky-50 text-sky-700 ring-sky-200"}`}>
  メイン {dayMainCount}/{mainCap}
</span>
      </div>

      <ol className="space-y-2">
        {items.map((it, i) => {
          const badge = typeBadge(it.type, it.title);
          const auto = it.meta?.auto === true;
          const isPlaceholder = it.type === "プレースホルダ";
          const hint = typeof it?.meta?.distanceHint === "number" ? it.meta!.distanceHint : undefined;

          return (
            <li key={`${it.time}-${i}`} className={`group flex items-start gap-3 rounded-xl border border-gray-200 hover:border-gray-200 bg-white/80 ${density==="compact" ? "p-2.5" : "p-3"}`}>
              <div className={`shrink-0 w-14 ${density==="compact"?"text-[13px]":"text-sm"} font-semibold text-gray-800 tabular-nums mt-0.5`}>{it.time}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${badge.color}`}>
                    <span>{it.type==="グルメ" ? mealIcon(it.title) : badge.icon}</span><span>{it.type ?? "スポット"}</span>
                  </span>
                  {auto && (
                    <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium bg-fuchsia-50 text-fuchsia-700 ring-1 ring-fuchsia-200">
                      AUTO
                    </span>
                  )}
                  {typeof hint === "number" && hint !== 999 && (
                    <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" title="ホテルからの相対距離の目安（小さいほど近い）">
                      距離ヒント: {hint}
                    </span>
                  )}
                </div>
                <div className={`mt-1 text-sm sm:text-base leading-snug ${isPlaceholder ? "text-gray-600" : "text-gray-900"}`}>
                  {it.title}
                </div>
                {it.note && <p className="mt-0.5 text-xs text-gray-500">{it.note}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
