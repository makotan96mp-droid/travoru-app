"use client";
import PurposeSummary from "@/_components/PurposeSummary";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type PlanPreview = { notes?: string; day1?: { time: string; title: string; note?: string }[] };

const SUGGESTS_BY_CITY: Record<string, string[]> = {
  大阪: [
    "ユニバーサル・スタジオ・ジャパン（USJ）",
    "カニ道楽 本店",
    "アメリカ村（アメ村）",
    "道頓堀",
    "大阪城",
    "梅田スカイビル 空中庭園",
  ],
  東京: [
    "浅草・浅草寺",
    "東京スカイツリー",
    "渋谷スクランブル交差点",
    "明治神宮",
    "チームラボボーダレス",
    "築地・豊洲",
  ],
  京都: ["清水寺", "伏見稲荷大社", "金閣寺", "祇園", "嵐山 竹林", "錦市場"],
};

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

/* ====== 共通UI ====== */
function CalendarIcon(props: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className ?? "h-5 w-5"}
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

/* Date input with explicit calendar button */
function DateInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const openPicker = () => {
    if (!ref.current) return;
    ref.current.showPicker?.();
    if (!("showPicker" in HTMLInputElement.prototype)) ref.current.focus();
  };
  return (
    <div className="relative">
      <input
        ref={ref}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="ui-field pr-12 ui-date-noicon"
      />
      <button
        type="button"
        aria-label="日付を選択"
        onClick={openPicker}
        data-date-button
        className="icon-trailing"
      >
        <CalendarIcon />
      </button>
    </div>
  );
}

/* ====== dnd-kit: ソート可能行 ====== */
function SortableRow({
  id,
  index,
  title,
  onUp,
  onDown,
  onRemove,
}: {
  id: string;
  index: number;
  title: string;
  onUp: () => void;
  onDown: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  } as React.CSSProperties;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between px-3 py-2 text-sm text-[color:var(--fg)]
                  ${isDragging ? "is-dragging bg-[color:var(--surface)]" : ""}`}
    >
      <div className="flex items-center gap-2 flex-1 pr-3">
        {/* ドラッグハンドル */}
        <button
          type="button"
          aria-label="ドラッグして並び替え"
          {...attributes}
          {...listeners}
          className="btn-ghost !px-2 !py-1 cursor-grab active:cursor-grabbing"
          title="ドラッグして並び替え（Enter/Spaceで掴む→矢印キー）"
        >
          ≡
        </button>
        <div>
          {index + 1}. {title}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" className="btn-ghost" onClick={onUp} aria-label="上へ">
          ↑
        </button>
        <button type="button" className="btn-ghost" onClick={onDown} aria-label="下へ">
          ↓
        </button>
        <button type="button" className="btn-ghost" onClick={onRemove} aria-label="削除">
          ×
        </button>
      </div>
    </div>
  );
}

export default function ItineraryForm() {
  const [city, setCity] = useState<string>(() =>
    typeof window !== "undefined" ? localStorage.getItem("city") || "" : "",
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [purposes, setPurposes] = useState<string[]>([]);
  const wantsStay = purposes.includes("宿泊");
  const [hotelName, setHotelName] = useState("");
  const [preview, setPreview] = useState<PlanPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mustSee, setMustSee] = useState<string[]>([]);
  const [customSpot, setCustomSpot] = useState("");

  useEffect(() => {
    if (!wantsStay) setHotelName("");
  }, [wantsStay]);

  const citySuggests = useMemo(() => {
    const key = Object.keys(SUGGESTS_BY_CITY).find((k) => city.includes(k));
    return key ? SUGGESTS_BY_CITY[key] : [];
  }, [city]);

  const togglePurpose = (p: string) =>
    setPurposes((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));
  const toggleMustSee = (s: string) =>
    setMustSee((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));
  const addCustomSpot = () => {
    const s = customSpot.trim();
    if (!s) return;
    setMustSee((cur) => uniq([...cur, s]));
    setCustomSpot("");
  };
  const moveUp = (i: number) => {
    if (i <= 0) return;
    setMustSee((cur) => {
      const c = [...cur];
      [c[i - 1], c[i]] = [c[i], c[i - 1]];
      return c;
    });
  };
  const moveDown = (i: number) => {
    setMustSee((cur) => {
      if (i >= cur.length - 1) return cur;
      const c = [...cur];
      [c[i + 1], c[i]] = [c[i], c[i + 1]];
      return c;
    });
  };
  const removeAt = (i: number) => setMustSee((cur) => cur.filter((_, idx) => idx !== i));

  const canSubmit = !!(city && startDate && endDate && (!wantsStay || hotelName.trim().length > 0));

  async function handlePreview() {
    setErrorMsg(null);
    setLoading(true);
    try {
      const payload: any = { city, startDate, endDate, purposes };
      if (wantsStay && hotelName.trim()) payload.hotelName = hotelName.trim();
      if (mustSee.length) payload.mustSee = mustSee;
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setPreview(data);
    } catch (e: any) {
      setErrorMsg(e.message || "プレビューに失敗しました");
      setPreview(null);
    } finally {
      setLoading(false);
    }
  }

  /* dnd-kit センサー（マウス/タッチ + キーボード） */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = mustSee.findIndex((s) => s === active.id);
    const newIndex = mustSee.findIndex((s) => s === over.id);
    setMustSee((items) => arrayMove(items, oldIndex, newIndex));
  };

  return (
    <div className="space-y-6 text-[15px]">
      {/* 基本項目 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-[color:var(--fg)]">都市</label>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="例：大阪 / 東京 / 京都"
            className="ui-field focus-visible:ui-focus"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[color:var(--fg)]">開始日</label>
          <DateInput value={startDate} onChange={setStartDate} placeholder="年/月/日" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[color:var(--fg)]">終了日</label>
          <DateInput value={endDate} onChange={setEndDate} placeholder="年/月/日" />
        </div>
      </div>

      {/* 目的 */}
      <div>
        <label className="block text-sm font-medium text-[color:var(--fg)] mb-1">目的</label>
        <div className="flex flex-wrap gap-2">
          {["観光", "ショッピング", "グルメ", "宿泊"].map((p) => {
            const active = purposes.includes(p);
            return (
              <button
                key={p}
                type="button"
                aria-pressed={active}
                onClick={() => togglePurpose(p)}
                className={`chip ${active ? "chip--active" : ""}`}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>
      {/* ホテル名 */}
      {wantsStay && (
        <div>
          <PurposeSummary
            purposes={purposes}
            onRemove={(p) => setPurposes((prev) => prev.filter((x) => x !== p))}
          />
          <label className="block text-sm font-medium text-[color:var(--fg)]">ホテル名</label>
          <input
            value={hotelName}
            onChange={(e) => setHotelName(e.target.value)}
            placeholder="例：ホテルモントレ大阪"
            className="ui-field focus-visible:ui-focus"
          />
          <p className="mt-1 text-xs text-[color:var(--fg-muted)]">
            ※「宿泊」をOFFにすると自動的にクリアされます
          </p>
        </div>
      )}

      {/* mustSee */}
      <div>
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-[color:var(--fg)]">
            行きたい場所（mustSee）
          </label>
          <span className="text-xs text-[color:var(--fg)]/50">
            順番＝優先順／巡る順（ドラッグ＆ドロップ対応）
          </span>
        </div>

        {citySuggests.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {citySuggests.map((s) => {
              const active = mustSee.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleMustSee(s)}
                  className={`chip text-xs ${active ? "chip--active" : ""}`}
                  title={active ? "リストから除外" : "リストに追加"}
                >
                  {s}
                </button>
              );
            })}
          </div>
        )}

        {/* 追加行 */}
        <div className="mt-3 flex gap-2">
          <input
            value={customSpot}
            onChange={(e) => setCustomSpot(e.target.value)}
            placeholder="スポット名を追加（例：通天閣）"
            className="ui-field focus-visible:ui-focus flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomSpot();
              }
            }}
          />
          <button
            type="button"
            onClick={addCustomSpot}
            className="px-3 rounded-md border border-[color:var(--border-subtle)] bg-[color:var(--surface)] text-[color:var(--fg)] hover:bg-[color:color-mix(in oklab, var(--surface) 85%, #fff 15%)] h-12"
          >
            追加
          </button>
        </div>

        {/* 並び替えリスト（dnd-kit） */}
        {mustSee.length > 0 && (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={mustSee} strategy={verticalListSortingStrategy}>
              <div className="mt-3 rounded-md border border-[color:var(--border-subtle)] divide-y divide-white/10">
                {mustSee.map((s, i) => (
                  <SortableRow
                    key={s}
                    id={s}
                    index={i}
                    title={s}
                    onUp={() => moveUp(i)}
                    onDown={() => moveDown(i)}
                    onRemove={() => removeAt(i)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* アクション */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="btn-ghost"
          onClick={() => {
            setCity("");
            setStartDate("");
            setEndDate("");
            setPurposes([]);
            setHotelName("");
            setMustSee([]);
            setPreview(null);
          }}
        >
          クリア
        </button>
        <button
          type="button"
          disabled={!canSubmit || loading}
          onClick={handlePreview}
          className="btn-primary"
        >
          {loading ? "生成中..." : "プレビュー生成"}
        </button>
        {!canSubmit && (
          <span className="text-sm text-[color:var(--fg-muted)]">
            都市・日付（＋宿泊ON時はホテル名）を入力してください
          </span>
        )}
      </div>

      {/* エラー */}
      {errorMsg && <div className="text-sm text-red-400">エラー：{errorMsg}</div>}

      {/* プレビュー */}
      {preview && (
        <div className="mt-4 space-y-3 text-[color:var(--fg)]">
          {preview.notes && (
            <div className="rounded-md border border-[color:var(--border-subtle)] p-3">
              <div className="text-sm font-medium mb-1">Notes</div>
              <div className="text-xs text-[color:var(--fg-muted)] mb-1">
                期間：{startDate} – {endDate}
              </div>
              <div className="whitespace-pre-wrap text-sm">{preview.notes}</div>
            </div>
          )}
          {Object.entries(preview)
            .filter(([k, v]) => /^day\d+$/.test(k) && Array.isArray(v) && v.length > 0)
            .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
            .map(([dayKey, items]) => (
              <div
                key={dayKey}
                className="rounded-md border border-[color:var(--border-subtle)] p-3"
              >
                <div className="text-sm font-medium mb-1">{dayKey.replace("day", "Day ")}</div>
                <ul className="list-disc pl-5 text-sm">
                  {(Array.isArray(items) ? items : []).map((s: any, i: number) => (
                    <li key={i}>
                      <span className="tabular-nums">{s.time}</span> — {s.title}
                      {s.note ? (
                        <span className="text-[color:var(--fg-muted)]">（{s.note}）</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
