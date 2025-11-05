const fs = require('fs');
const path = 'app/api/plan/route.ts';
let s = fs.readFileSync(path, 'utf8');

// 1) 「mustSee を day1..dayN に配分」部分を、for (const spot of mustSee) 起点で見つける
const start = s.search(/for\s*\(\s*const\s+spot\s+of\s+mustSee\s*\)/);
if (start === -1) {
  console.error('❌ 配分ループ（for (const spot of mustSee)）が見つかりません。ファイル構造が変わっていないか確認してください。');
  process.exit(1);
}

// 2) 終点は「各日の並びを時刻順に」を示す for (let d=1; …) の直前に設定
const end = s.slice(start).search(/for\s*\(\s*let\s+d\s*=\s*1\s*;\s*d\s*<=\s*diffDays\s*;\s*d\+\+\s*\)\s*\{/);
if (end === -1) {
  console.error('❌ 終点（for (let d = 1; d <= diffDays; d++)）が見つかりません。コメント位置がズレている可能性があります。');
  process.exit(1);
}
const endAbs = start + end;

// 3) 置換する本文（重複タイトル除外＋時刻被りなし＋Set 管理）
const replacement = `
{
  // 既存タイトルを全日から収集（重複挿入防止）
  const existingTitles = new Set<string>();
  for (let d = 1; d <= diffDays; d++) {
    const arr = (data as any)[\`day\${d}\`];
    if (Array.isArray(arr)) {
      for (const it of arr) {
        if (it?.title) existingTitles.add(String(it.title));
      }
    }
  }

  // mustSee をユニーク化→既存除外
  const queue = Array.from(new Set((mustSee as string[]).map(String)))
    .filter(t => !existingTitles.has(t));

  // 各日の使用済み時刻を保持
  const base = ["09:30","11:00","14:00","16:00","18:00","20:00"];
  const usedByDay = new Map<number, Set<string>>();
  for (let d = 1; d <= diffDays; d++) {
    const used = new Set<string>();
    const arr = (data as any)[\`day\${d}\`];
    if (Array.isArray(arr)) {
      for (const it of arr) if (it?.time) used.add(String(it.time));
    }
    usedByDay.set(d, used);
  }

  // 空き時刻を取得
  const pickTime = (dayIdx:number) => {
    const used = usedByDay.get(dayIdx)!;
    for (const t of base) if (!used.has(t)) return t;
    // 全て埋まっていたら 20:00 以降 30 分刻みを生成
    let h = 20, m = 0;
    while (true) {
      const t = \`\${String(h).padStart(2,'0')}:\${String(m).padStart(2,'0')}\`;
      if (!used.has(t)) return t;
      m += 30; if (m >= 60) { m = 0; h++; }
    }
  };

  // ラウンドロビンで day1..dayN に配分
  let i = 0;
  for (const spot of queue) {
    const dayIndex = (i % diffDays) + 1;
    const key = \`day\${dayIndex}\`;
    const dayArr = (data as any)[key] as any[];
    const t = pickTime(dayIndex);
    dayArr.push({ time: t, title: spot });
    usedByDay.get(dayIndex)!.add(t);
    existingTitles.add(spot);
    i++;
  }
}
`.trim() + '\n';

// 4) 置換して保存
const out = s.slice(0, start) + replacement + s.slice(endAbs);
fs.writeFileSync(path, out);
console.log('✅ 配分ロジックを重複なし・時刻被りなし版に置換しました:', path);
