export type PlanItem = { time: string; title: string; note?: string };
export type PlanData = Record<string, any> & { day1?: PlanItem[] };

const BASE_SLOTS = ['09:30','14:00'];
const LUNCH_SLOT = '12:30';
const DINNER_SLOT = '18:00';

export type DistributeOpts = {
  startOffset?: number;                 // day2 始まりにしたい時は 1（デフォルト: 日数>1なら1）
  maxPerDay?: number;                   // デフォルト上限（メイン件数）
  maxPerDayByDayIndex?: {               // 日別上限（例: {1:3, last:2}）
    [dayIndex: number]: number;
    last?: number;
  };
  addPlaceholders?: boolean;            // プレースホルダ（ランチ/ディナー/フリー日）を埋める
  wantsFood?: boolean;                  // グルメ目的 ON/OFF
  countMealsAsMain?: boolean;           // 食事をメイン件数にカウントするか
};

export function cloneDay1ToOthers(data: PlanData, days: number) {
  if (!Array.isArray(data.day1) || days <= 1) return;
  for (let d = 2; d <= days; d++) data[`day${d}`] = data.day1.map(it => ({ ...it }));
}

export function roundRobinDistribute(
  data: PlanData, days: number, mustSee: string[], opts?: DistributeOpts
) {
  if (days <= 0) return;

  const wantsFood = !!opts?.wantsFood;
  const addPH = !!opts?.addPlaceholders;
  const defaultMax = opts?.maxPerDay ?? 4;
  const perDayRule = opts?.maxPerDayByDayIndex || {};
  const countMealsAsMain = !!opts?.countMealsAsMain;
  const startOffset = opts?.startOffset ?? (days > 1 ? 1 : 0);
  const includeSeedInCap = opts?.includeSeedInCap !== false;  // default: true
  const lastDayIndex = days;

  // day初期化
  if (!Array.isArray(data.day1)) data.day1 = [];
  for (let d = 2; d <= days; d++) data[`day${d}`] = Array.isArray(data[`day${d}`]) ? data[`day${d}`] : [];

  // 既存タイトル（全日）収集 → mustSee 重複排除
  const existing = new Set<string>();
  for (let d = 1; d <= days; d++) {
    const arr = data[`day${d}`];
    if (Array.isArray(arr)) for (const it of arr) if (it?.title) existing.add(String(it.title));
  }
  const queue = Array.from(new Set((mustSee || []).map(String))).filter(t => !existing.has(t));

  // 使用済み時刻 per day
  const used = new Map<number, Set<string>>();
  for (let d = 1; d <= days; d++) {
    const set = new Set<string>();
    const arr = data[`day${d}`];
    if (Array.isArray(arr)) for (const it of arr) if (it?.time) set.add(String(it.time));
    used.set(d, set);
  }

  const pick = (dayIdx:number) => {
    const u = used.get(dayIdx)!;
    // まずは定番枠
    for (const t of BASE_SLOTS) if (!u.has(t)) return t;
    // どうしても埋まっていたら 20:00以降を30分刻みで拡張
    let h = 20, m = 0;
    while (true) {
      const t = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
      if (!u.has(t)) return t;
      m += 30; if (m >= 60) { m = 0; h++; }
    }
  };

  // 食事判定＆メイン判定
  const isMeal = (t: PlanItem) => /ランチ|夕食/.test(t.title);
  const isMain = (t: PlanItem) => countMealsAsMain ? true : !isMeal(t);

  // 日別上限を取得
  const capFor = (d: number) =>
    (d === lastDayIndex && perDayRule.last != null) ? perDayRule.last :
    (perDayRule[d] != null ? perDayRule[d] : defaultMax);

  // ラウンドロビン + 1日上限
  // 各日の「配分開始時点のメイン件数」を記録（seedを把握するため）
  const initialMainCountMap = new Map<number, number>();
  for (let d = 1; d <= days; d++) {
    const arr0 = data[`day${d}`];
    const c0 = Array.isArray(arr0) ? arr0.filter(isMain).length : 0;
    initialMainCountMap.set(d, c0);
  }
  let i = 0;
  for (const spot of queue) {
    const dayIndex = ((i + startOffset) % days) + 1;
    const key = `day${dayIndex}`;
    const arr = data[key] as PlanItem[];

    const totalNow = arr.filter(isMain).length;
    const seedBase = initialMainCountMap.get(dayIndex) || 0;
    const mainCountForCap = includeSeedInCap ? totalNow : Math.max(0, totalNow - seedBase);
    const cap = capFor(dayIndex);
    if (mainCountForCap >= cap) { i++; continue; }
const t = pick(dayIndex);
    arr.push({ time: t, title: spot });
    used.get(dayIndex)!.add(t);
    existing.add(spot);
    i++;
  }

  // プレースホルダ（ユーザー視点の見やすさ）
  if (addPH) {
    for (let d = 1; d <= days; d++) {
      const key = `day${d}`;
      const arr = data[key] as PlanItem[] | undefined;
      if (!Array.isArray(arr)) continue;

      // 完全に空の日 → 自由行動（※ continueしない：不足メイン補完も実行する）
      if (arr.length === 0) {
        arr.push({ time: '10:00', title: 'フリータイム（予備日）', note: '天候や混雑に応じて調整' });
      }

      // ランチ（フード目的ON＆未挿入＆空き時間あり）
      if (wantsFood && !arr.some(x => x.title.includes('ランチ'))) {
        const u = used.get(d)!;
        if (!u.has(LUNCH_SLOT)) {
          arr.push({ time: LUNCH_SLOT, title: 'ランチ（ご当地グルメ）' });
          u.add(LUNCH_SLOT);
        }
      }

      // ディナー（フード目的ON＆未挿入＆空き時間あり）
      if (wantsFood && !arr.some(x => x.title.includes('夕食'))) {
        const u = used.get(d)!;
        if (!u.has(DINNER_SLOT)) {
          arr.push({ time: DINNER_SLOT, title: '夕食（ご当地グルメ）', note: '人気店を優先' });
          u.add(DINNER_SLOT);
        }
      }

      // --- 不足メイン枠をプレースホルダで補完（cap まで）※ wantsFood に依存しない
      const mainNow = arr.filter(isMain).length;
      const cap = capFor(d);
      const need = Math.max(0, cap - mainNow);
      if (need > 0) {
        const candidates = [
          'サブスポット（候補）',
          '近隣散策（候補）',
          'カフェ休憩（候補）',
          'ショッピング（候補）'
        ];
        for (let k = 0; k < need; k++) {
          const t2 = pick(d);
          const title2 = candidates[k % candidates.length];
          arr.push({ time: t2, title: title2 });
          used.get(d)!.add(t2);
        }
      }
    }
  }


  // 時刻順に
  for (let d = 1; d <= days; d++) {
    const key = `day${d}`;
    const arr = data[key];
    if (Array.isArray(arr)) data[key] = arr.slice().sort(
      (a, b) => String(a?.time ?? '').localeCompare(String(b?.time ?? ''))
    );
  }
}

export function calcDiffDays(startISO: string, endISO: string) {
  const sd = new Date(startISO); const ed = new Date(endISO);
  return Math.max(1, Math.floor((ed.getTime() - sd.getTime())/86400000) + 1);
}
