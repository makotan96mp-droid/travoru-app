"use client";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { pickIconFrom } from "@/lib/iconMap";

type Item = {
  time?: string;
  title?: string;
  name?: string;
  note?: string;
  tags?: string[];
  isMain?: boolean;
  isNow?: boolean;
  meta?: { distanceHint?: number };
function renderIconNode(it: Item) {
  const iconOrString = (getIconFor as any)(it);
  if (typeof iconOrString === "string") {
    return <span className="inline-block text-[10px] font-semibold leading-none">{iconOrString}</span>;
  }
  const IconComp = iconOrString as any; // ComponentType を要素化
  return IconComp ? <IconComp className="h-4 w-4" aria-hidden /> : null;
}

};

type Density = "compact" | "cozy" | "comfortable";

type Props = {
  dayKey: string;
  baseDate?: string;
  items: Item[];
  density?: Density;
  showDistance?: boolean;

  /** 並べ替えを有効化 */
  draggable?: boolean;
  /** 並べ替え後に親へ通知 */
  onReorder?: (next: any[]) => void;

  /** ヘッダー右の date ピッカー（省略時は内部 state で制御） */
  date?: string;
  onDateChange?: (v: string) => void;

  onDragEnd?: (result: DropResult) => void;
  onAdd?: () => void;
  mainCap?: number;
};

export default function ItineraryDayCard({
  dayKey,
  baseDate,
  items,
  density = "cozy",
  showDistance = true,
  draggable = false,
  onReorder,
  date,
  onDateChange,
  onDragEnd,
  onAdd,
}: Props) {
  // === 表示密度スケール ===
  const t = useMemo(() => {
    switch (density) {
      case "compact":
        return {
          gap: "gap-2",
          pad: "p-2",
          text: "text-[13px]",
          bullet: "h-2.5 w-2.5",
          iconBox: "size-8",
        };
      case "comfortable":
        return {
          gap: "gap-3.5",
          pad: "p-4",
          text: "text-[15px]",
          bullet: "h-3.5 w-3.5",
          iconBox: "size-11",
        };
      case "cozy":
      default:
        return { gap: "gap-3", pad: "p-3", text: "text-sm", bullet: "h-3 w-3", iconBox: "size-9" };
    }
  }, [density]);

  // === 並べ替えのための内部リスト ===
  const [list, setList] = useState<Item[]>(items);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const justAddedRef = useRef(false);

  // items/日付キーが変わったら取り込み
  useEffect(() => {
    setList(items);
  }, [dayKey, items]);

  // === date ピッカー（内部制御 & 親通知） ===
  const [internalDate, setInternalDate] = useState<string>(date ?? baseDate ?? "");
  useEffect(() => {
    if (date) setInternalDate(date);
  }, [date]);

  // === 現在地へ自動スクロール ===
  const listRef = useRef<HTMLOListElement | null>(null);
  useEffect(() => {
    const root = listRef.current;
    if (!root) return;
    const dot = root.querySelector('[data-now="1"]') as HTMLElement | null;
    (dot?.closest("li") as HTMLElement | null)?.scrollIntoView({
      block: "center",
      behavior: "smooth",
    });
  }, [list.length]);

  // === DnD ===

  // === ヘッダー ===
  const count = list.length;

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      try {
        onDragEnd?.(result);
      } catch {}
      const { destination, source } = result;
      if (!destination) return;
      if (destination.index === source.index) return;
      setList((prev) => {
        const next = prev.slice();
        const [moved] = next.splice(source.index, 1);
        next.splice(destination.index, 0, moved);
        try {
          onReorder?.(next);
        } catch {}
        return next;
      });
    },
    [onDragEnd, onReorder],
  );

  // 時刻表記（12/24h）を環境から推定

  const hour12 = (() => {
    try {
      const opt = new Intl.DateTimeFormat().resolvedOptions();
      if (typeof opt.hour12 === "boolean") return opt.hour12;
      const hc = opt.hourCycle;
      return hc ? /h11|h12/.test(String(hc)) : false;
    } catch {
      return false;
    }
  })();

  useEffect(() => {
    if (justAddedRef.current) {
      justAddedRef.current = false;
      try {
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      } catch {}
    }
  }, [list.length]);

  return (
    <section
      data-variant={density}
      className="rounded-2xl border border-white/10 bg-black/30 p-3 sm:p-4"
    >
      <header className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">
            Day {dayKey}
            {internalDate
              ? ` · ${internalDate}`
              : baseDate
                ? ` · ${fmtYMDWithWeekday(baseDate)}`
                : ""}
          </h3>
          <p className="text-xs opacity-70">{count} items</p>
        </div>

        {/* date ピッカー（内部制御しつつ onDateChange を通知） */}
        <input
          type="date"
          value={internalDate}
          onChange={(e) => {
            const v = e.currentTarget.value;
            setInternalDate(v);
            onDateChange?.(v);
          }}
          className="cursor-pointer rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-[13px] outline-none hover:bg-white/10"
          aria-label="日付を変更"
        />
        {/* 日付ピッカー（onDateChange がある時だけ表示） */}
        {typeof onDateChange === "function" && (
          <input
            type="date"
            name="day-date"
            value={(baseDate ?? "").slice(0, 10)}
            onChange={(e) => onDateChange(e.currentTarget.value)}
            className="ml-3 rounded-lg border border-white/20 bg-white/10 px-3 py-1 text-xs hover:bg-white/15"
          />
        )}
      </header>

      {/* タイムライン縦レール */}
      <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute left-[2.75rem] top-0 bottom-0 w-px bg-white/10 sm:left-16"
        />

        {draggable ? (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId={`day-${dayKey}`}>
              {(provided) => (
                <ol
                  ref={(n) => {
                    provided.innerRef(n);
                    listRef.current = n as HTMLOListElement | null;
                  }}
                  className="px-3 pb-3 sm:px-4"
                  {...provided.droppableProps}
                >
                  {list.length === 0 ? (
                    <li className="rounded-xl border border-dashed border-white/15 bg-white/5 p-4 text-sm text-center">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 hover:bg-white/15"
                        onClick={() =>
                          typeof onAdd === "function" ? onAdd() : console.log("add spot")
                        }
                      >
                        <span className="text-base">＋</span> スポットを追加
                      </button>
                    </li>
                  ) : (
                    list.map((it, i) => (
                      <Draggable
                        key={`${it.time ?? ""}-${i}`}
                        draggableId={`${dayKey}-${i}`}
                        index={i}
                      >
                        {(drag) => (
                          <div
                            ref={drag.innerRef}
                            {...drag.draggableProps}
                            {...drag.dragHandleProps}
                          >
                            {renderItem(it, i, t, showDistance, hour12)}
                          </div>
                        )}
                      </Draggable>
                    ))
                  )}
                  <div ref={bottomRef} />
                  {provided.placeholder}
                </ol>
              )}
            </Droppable>

            {onAdd ? (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => {
                    try {
                      justAddedRef.current = true;
                    } catch {}
                    onAdd?.();
                  }}
                  className="w-full rounded-xl border border-dashed border-black/20 py-2 text-sm hover:bg-black/5"
                >
                  ＋ 追加
                </button>
              </div>
            ) : null}
          </DragDropContext>
        ) : (
          <ol ref={listRef} className="px-3 pb-3 sm:px-4">
            {list.length === 0 ? (
              <li className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm opacity-80">
                この日の予定はまだありません
              </li>
            ) : (
              list.map((it, i) => renderItem(it, i, t, showDistance, hour12))
            )}
          </ol>
        )}
      </div>
    </section>
  );
}

/* ============== 小物 ============== */

function renderItem(it: Item, i: number, t: any, showDistance: boolean, hour12: boolean) {
  const title = it.title ?? it.name ?? "（無題）";
  const time = it.time ?? "";
  const tp = formatTimeParts(time, hour12);
  const dist = typeof it.meta?.distanceHint === "number" ? fmtDist(it.meta.distanceHint) : "";
  const isMain = !!it.isMain;
  const isNow = !!it.isNow;

  const tagsArr = Array.isArray(it.tags) ? it.tags.filter(Boolean) : [];
  const visTags = tagsArr.slice(0, 2);
  const extraTagCount = Math.max(0, tagsArr.length - visTags.length);

  const _useExtraTagCount = extraTagCount; // eslint対策（必要なら下の JSX を消す）

  return (
    <li
      key={`${time}-${i}`}
      className={`group grid grid-cols-[2.25rem,auto,1fr,auto] sm:grid-cols-[3.5rem,auto,1fr,auto] ${t.gap} ${t.pad} ${t.text}
      rounded-xl border border-white/10 bg-black/15 hover:bg-black/25 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40 relative`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          (e.currentTarget as HTMLElement).click();
          e.preventDefault();
        }
      }}
    >
      {/* 時刻 */}
      <div className="pt-0.5 text-xs opacity-75">
        {hour12 ? (
          <>
            <span>{tp.main}</span>
            {tp.ampm && <span className="ml-1 opacity-60">{tp.ampm}</span>}
          </>
        ) : (
          time
        )}
      </div>

      {/* 丸（現在はリング色を変更） */}
      <div className="relative grid place-items-center">
        <span
          aria-hidden
          data-now={isNow ? "1" : undefined}
          className={`z-10 rounded-full bg-white ${t.bullet} ring-2 ${
            isNow ? "ring-emerald-400" : "ring-white/20"
          }`}
        />
      </div>

      {/* アイコン＋本文 */}
      <div className="flex items-start gap-3">
        <IconBubble
          className={`${t.iconBox} ${isMain ? "bg-emerald-500/15 ring-emerald-400/30" : ""}`}
          dataMain={isMain}
        >
          {renderIconNode(it)}
        </IconBubble>

        <div className="min-w-0">
          <div className={`truncate leading-tight ${isMain ? "font-semibold" : "font-medium"}`}>
            {title}
          </div>
          {it.note ? (
            <div className="mt-0.5 line-clamp-2 text-[13px] opacity-75">{it.note}</div>
          ) : null}
        </div>
      </div>

      {/* 右端メタ（距離＋タグ） */}
      <div className="ml-auto flex items-center gap-2">
        {Array.isArray(it.tags) &&
          it.tags.slice(0, 2).map((t, idx) => (
            <span
              key={idx}
              className="rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[11px] leading-none opacity-85"
            >
              {t}
            </span>
          ))}
        {extraTagCount > 0 && (
          <span className="rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[11px] leading-none opacity-75">
            +{extraTagCount}
          </span>
        )}
        {showDistance && dist && (
          <span className="rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[11px] leading-none opacity-80">
            {dist}
          </span>
        )}
      </div>
    </li>
  );
}

function IconBubble({
  className = "",
  children,
  dataMain = false,
}: {
  className?: string;
  children?: React.ReactNode;
  dataMain?: boolean;
}) {
  const base =
    "relative grid place-items-center rounded-full ring-1 bg-gradient-to-br transition-all duration-200 " +
    "ring-white/15 from-white/10 to-white/5 shadow-[0_2px_10px_rgba(0,0,0,0.25)] " +
    "group-hover:shadow-[0_6px_20px_rgba(0,0,0,0.35)] group-hover:translate-y-[-1px]";
  const accent = dataMain
    ? " ring-emerald-300/40 from-emerald-400/25 to-teal-500/15 shadow-[0_6px_20px_rgba(16,185,129,0.35)]"
    : "";
  return (
    <span className={base + accent + " " + className} aria-hidden data-main={dataMain}>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-35 bg-[radial-gradient(140%_100%_at_30%_20%,#fff_8%,transparent_42%)]"
      />
      <span className="relative z-10 text-base sm:text-lg opacity-90">{children}</span>
    </span>
  );
}

function getIconFor(it: Item) {
  const text = (it.title || it.name || "").toString();
  const tags = Array.isArray(it.tags) ? it.tags : [];
  const mapped = pickIconFrom(text, tags);
  if (mapped) return mapped;

  const mins = toMinutes(it.time);
  if (mins != null) {
    if (mins < 11 * 60) return "☕";
    if (mins >= 11 * 60 && mins <= 14 * 60) return "🍜";
    if (mins >= 18 * 60 && mins <= 22 * 60) return "🍜";
  }
  const t = `${tags.join(" ")} ${text}`.toLowerCase();
  const has = (s: string) => t.includes(s);
  if (has("hotel") || has("宿") || has("チェックイン") || has("チェックアウト")) return "🏨";
  if (has("food") || has("グルメ") || has("restaurant") || has("ランチ") || has("ディナー"))
    return "🍜";
  if (has("cafe") || has("coffee") || has("カフェ")) return "☕";
  if (has("shopping") || has("買い物") || has("ショッピング")) return "🛍️";
  if (has("museum") || has("美術館") || has("観光") || has("寺") || has("神社")) return "🏛️";
  if (has("park") || has("公園")) return "🌳";
  if (has("transfer") || has("移動") || has("train") || has("駅")) return "🚉";
  return "📍";
}
function toMinutes(hhmm?: string) {
  if (!hhmm) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]),
    n = Number(m[2]);
  if (Number.isNaN(h) || Number.isNaN(n)) return null;
  return h * 60 + n;
}

/** 12/24h 表示用パーツ */
function formatTimeParts(hhmm?: string, hour12?: boolean): { main: string; ampm: string } {
  if (!hhmm) return { main: "", ampm: "" };
  if (!hour12) return { main: hhmm, ampm: "" };
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return { main: hhmm, ampm: "" };
  let h = Number(m[1]);
  const mm = m[2];
  const am = h < 12;
  h = h % 12 || 12;
  return { main: `${h}:${mm}`, ampm: am ? "A.M." : "P.M." };
}

/** m → "1.8km" / "450m" */
function fmtDist(m: number) {
  if (!Number.isFinite(m)) return "";
  if (m >= 1000) {
    const v = m >= 10000 ? (m / 1000).toFixed(0) : (m / 1000).toFixed(1);
    return `${v}km`;
  }
  return `${Math.round(m)}m`;
}

/** "YYYY/MM/DD (Wed)" */
function fmtYMDWithWeekday(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const wd = d.toLocaleDateString("en-US", { weekday: "short" });
  return `${y}/${m}/${day} (${wd})`;
}
