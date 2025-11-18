"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import PlanDayCard from "../_components/PlanDayCard";
import type { PlanItem } from "@/lib/plan-types";
import { groupItemsByDay } from "@/lib/group-by-day";

type EncodedPlan = {
  date?: string;
  items?: PlanItem[];
  ui?: {
    density?: "cozy" | "compact";
    showDistance?: boolean;
  };
};

// 互換用: もし page.tsx から props で渡していても動くようにしておく
type DemoClientProps = {
  plan?: string;
  encodedPlan?: string;
  searchParams?: { plan?: string };
};


function toStandardBase64(input: string): string {
  let s = input.trim();

  try {
    s = decodeURIComponent(s);
  } catch {
    // URLエンコードされていない場合などは無視
  }

  // base64url (-, _) → base64 (+, /)
  s = s.replace(/-/g, "+").replace(/_/g, "/");

  // 長さを 4 の倍数になるように padding
  const pad = s.length % 4;
  if (pad > 0) {
    s += "=".repeat(4 - pad);
  }

  return s;
}

function decodePlan(encoded: string | null | undefined): EncodedPlan | null {
  if (!encoded) return null;

  // 明らかに base64 ではなさそうな場合は早期リターン
  if (!/^[0-9A-Za-z+_/%=-]+$/.test(encoded)) {
    return null;
  }

  try {
    const b64 = toStandardBase64(encoded);
    let jsonStr: string;

    if (typeof window !== "undefined" && typeof window.atob === "function") {
      jsonStr = window.atob(b64);
    } else if (typeof atob === "function") {
      jsonStr = atob(b64);
    } else if (typeof Buffer !== "undefined") {
      // Node / Edge 環境用
      jsonStr = Buffer.from(b64, "base64").toString("utf8");
    } else {
      return null;
    }

    const data = JSON.parse(jsonStr);
    if (!data || !Array.isArray((data as any).items)) return null;
    return data as EncodedPlan;
  } catch (e) {
    console.error("Failed to decode demo plan:", e);
    return null;
  }
}

export default function DemoClient(props: DemoClientProps) {
  const searchParams = useSearchParams();

  // どこから渡されても拾えるように優先順で決定
  const encoded =
    searchParams.get("plan") ??
    props.plan ??
    props.encodedPlan ??
    props.searchParams?.plan ??
    null;

  const decoded = useMemo(() => decodePlan(encoded), [encoded]);

  if (!decoded) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/80">
        <p>プレビュー用の行程データが見つかりませんでした。</p>
        <p className="text-white/60">
          /new 画面から「プレビュー」ボタンを押すと、自動でここにサンプル行程が表示されます。
        </p>
      </div>
    );
  }

  const { date, items = [], ui } = decoded;
  const days = groupItemsByDay(items);
  const density = ui?.density ?? "cozy";
  const showDistance = ui?.showDistance ?? true;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      {date && (
        <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-white/70">
          <div>基準日: {date}</div>
          {days.length > 1 && (
            <div className="mt-1">
              全 {days.length} 日分のサンプル行程を表示しています。
            </div>
          )}
        </div>
      )}

      {days.map((day) => (
        <PlanDayCard
          key={day.dayOffset}
          dayOffset={day.dayOffset}
          items={day.items}
          density={density}
          showDistance={showDistance}
          date={date}
        />
      ))}
    </div>
  );
}
