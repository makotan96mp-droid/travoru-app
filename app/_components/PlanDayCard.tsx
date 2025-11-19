import type { PlanItem } from "@/lib/plan-types";

type BaseProps = {
  items: PlanItem[];
  date?: string;
  density?: "cozy" | "compact";
  showDistance?: boolean;
};

type Props =
  | (BaseProps & { dayOffset: number; dayKey?: never })
  | (BaseProps & { dayKey: string; dayOffset?: never })
  | (BaseProps & { dayOffset?: undefined; dayKey?: undefined });

function getDayOffsetFromProps(props: Props): number {
  // 1. 明示的に dayOffset があればそれを優先
  if ("dayOffset" in props && typeof props.dayOffset === "number") {
    return props.dayOffset;
  }

  // 2. dayKey: "day1" → 0, "day2" → 1 ...
  if ("dayKey" in props && typeof props.dayKey === "string") {
    const m = props.dayKey.match(/^day(\d+)$/);
    if (m) {
      const n = Number(m[1]);
      if (!Number.isNaN(n)) return Math.max(0, n - 1);
    }
  }

  // 3. items[0].meta.dayOffset があればそれを利用
  const first = props.items?.[0];
  const raw = (first?.meta as any)?.dayOffset;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw;
  }

  // 4. どれもなければ 0（日目）扱い
  return 0;
}

export default function PlanDayCard(props: Props) {
  const { items, density = "cozy", showDistance = true } = props;
  const dayOffset = getDayOffsetFromProps(props);

  const dayLabel = `Day ${dayOffset + 1}`;
  const actualDate = props.date ? addDaysToISO(props.date, dayOffset) : undefined;
  const isCompact = density === "compact";

  return (
    <section className="rounded-2xl border border-white/10 bg-black/30 p-4 shadow-soft">
      <header className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-wide text-white/90">
          {dayLabel}
        </h2>
        {actualDate && (
          <p className="text-[11px] text-white/60">
            {actualDate}
          </p>
        )}
      </header>

      <ol className="space-y-2">
        {items.map((item, idx) => {
          const distanceHint =
            typeof item.meta?.["distanceHint"] === "string"
              ? (item.meta as any).distanceHint
              : typeof (item.meta as any)?.distanceText === "string"
              ? (item.meta as any).distanceText
              : undefined;

          return (
            <li
              key={`${item.time}-${item.title}-${idx}`}
              className={`flex ${isCompact ? "gap-2 py-1" : "gap-3 py-1.5"}`}
            >
              <div className="w-14 shrink-0 text-[11px] tabular-nums text-white/70">
                {item.time}
              </div>
              <div className="flex-1 text-sm text-white/90">
                <div className="font-medium">{item.title}</div>

                {item.note && (
                  <p className="mt-0.5 text-[11px] text-white/70">
                    {item.note}
                  </p>
                )}

                {showDistance && distanceHint && (
                  <p className="mt-0.5 text-[11px] text-emerald-300/80">
                    {distanceHint}
                  </p>
                )}

                {item.tags && item.tags.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/80"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}


/**
 * 基準日の ISO 日付 (YYYY-MM-DD) に dayOffset 日を足した日付を返す。
 * パースできなければ元の文字列をそのまま返す。
 */
function addDaysToISO(baseDate: string | undefined, offset: number): string | undefined {
  if (!baseDate) return baseDate;

  const m = baseDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return baseDate;

  const [_, y, mStr, dStr] = m;
  const dt = new Date(Number(y), Number(mStr) - 1, Number(dStr));
  if (Number.isNaN(dt.getTime())) return baseDate;

  dt.setDate(dt.getDate() + offset);

  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${dt.getFullYear()}-${mm}-${dd}`;
}
