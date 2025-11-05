import { NextRequest, NextResponse } from "next/server";
import { cloneDay1ToOthers, roundRobinDistribute, calcDiffDays } from "@/lib/distribute";
import { readMultiDayMode } from "@/lib/multiday";
import { getDistanceHint } from "@/lib/distanceDict";
import { addArrivalDepartureTransfers } from "@/lib/postprocess";
import { clampMainPerDay } from "@/lib/postprocess";import { balanceByHotelCenter } from "@/lib/distance";


export const runtime = "edge";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as PlanRequest;

  if (!body?.city || !body?.startDate || !body?.endDate) {
    
// === enforceMainCap: 返却直前に各日のメイン件数を cap に揃える（移動は保護） ===
try {
  const days = calcDiffDays((body as any).startDate as any, (body as any).endDate as any);

  // route側の cap 定義（libのcapForと同等に調整）
  const defaultMax = 2;
  const perDayRule: Record<string, number|undefined> = { 1: 2, last: 2 };
  const capFor = (d: number) => (d===days && perDayRule.last!=null) ? perDayRule.last! : (perDayRule[d] ?? defaultMax);

  const isMeal = (t:any)=> /ランチ|夕食/.test(String(t?.title||''));
  const isHotelCheckin = (t:any)=> String(t?.title||'').includes('ホテルチェックイン');
  // ★テスト定義に合わせて「メイン判定」は“食事/ホテルチェックイン以外”を基準にする
  const isMainForView = (t:any)=> !isMeal(t) && !isHotelCheckin(t) && !(t?.type==='移動' || (t?.meta && t.meta.auto===true));
  // 保護対象（削らない）
  const isProtected = (t:any)=> (t?.type==='移動') || (t?.meta && t.meta.auto===true);

  // 削除優先度（低いもの＝先に削る）
  const delPriority = (t:any)=>{
    const title=String(t?.title||'');
    if (/サブスポット（候補）/.test(title)) return 1;
    if (/フリータイム（予備日）/.test(title)) return 2;
    if (/近隣散策（候補）/.test(title)) return 3;
    if (/カフェ休憩（候補）/.test(title)) return 4;
    if (/ショッピング（候補）/.test(title)) return 5;
    // それ以外（mustSee等）は高優先度=削りにくい
    return 999;
  };

  for (let d=1; d<=days; d++){
    const key = `day${d}`;
    const arr = (data as any)[key];
    if (!Array.isArray(arr)) continue;

    const cap = capFor(d);
    // 現在の「表示上のメイン」件数
    let mainIdxs = arr.map((it,idx)=>({it,idx})).filter(x=> isMainForView(x.it)).map(x=>x.idx);

    if (mainIdxs.length > cap){
      // 削除候補（保護対象は除外）
      const candidates = arr.map((it,idx)=>({it,idx}))
        .filter(x=> isMainForView(x.it) && !isProtected(x.it))
        // プレースホルダ優先で削除
        .sort((a,b)=> delPriority(a.it)-delPriority(b.it));

      let needRemove = mainIdxs.length - cap;
      const toRemove = [];
      for (const c of candidates){
        if (needRemove<=0) break;
        toRemove.push(c.idx);
        needRemove--;
      }
      if (toRemove.length>0){
        // index降順で削除（ズレ防止）
        toRemove.sort((a,b)=>b-a).forEach(i=>arr.splice(i,1));
      }
    }

    // 時刻順リソート（削除後も整える）
    (data as any)[key] = arr.slice().sort((a:any,b:any)=> String(a?.time??'').localeCompare(String(b?.time??'')));
  }
} catch {}
// === /enforceMainCap ===
return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
  }

  const wantsFood = Array.isArray(body.purposes) ? body.purposes.includes("グルメ") : false;
  const diffDays = calcDiffDays(body.startDate, body.endDate);
  const MODE = (typeof readMultiDayMode === "function" ? readMultiDayMode() : "roundrobin") || "roundrobin";

  // マルチデイ出力オブジェクト
  const data: Record<string, any> = {};

  try {
    // mustSee 取得
    const ms = Array.isArray((body as any).mustSee) ? ((body as any).mustSee as string[]) : [];

    // ★ B方針: 2枠固定 + seed を上限にカウント
    roundRobinDistribute(
      data as any,
      diffDays,
      ms,
      {
        startOffset: diffDays > 1 ? 1 : 0,
        maxPerDay: 2,
        maxPerDayByDayIndex: { 1: 2, last: 2 },
        addPlaceholders: true,
        wantsFood,
        countMealsAsMain: false,
        includeSeedInCap: true
      }
    );

    // distanceHint を常に数値で注入（未登録は 999）
    for (const k of Object.keys(data)) {
      if (!/^day\d+$/.test(k)) continue;
      const arr = Array.isArray((data as any)[k]) ? (data as any)[k] : [];
      for (const it of arr) {
        if (!it.meta) it.meta = {};
        it.meta.distanceHint = getDistanceHint((body as any)?.city, it.title);
      }
    }

    // 到着/出発 移動行の付与 → 距離簡易バランス → 最終クランプ（B方針: 各日2）
    addArrivalDepartureTransfers(data as any, body.hotelName);
    await balanceByHotelCenter(data as any, { name: body.hotelName });
    clampMainPerDay(data as any);

  } catch (e) {
    console.error("plan route error:", e);
  }

  // 返却
  const res = NextResponse.json(data);
  res.headers.set("x-multiday-mode", String(MODE || ""));
  res.headers.set("x-diffdays", String(diffDays));
  return res;
}
