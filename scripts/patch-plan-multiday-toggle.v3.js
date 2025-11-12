const fs = require("fs");
const path = "app/api/plan/route.ts";
let src = fs.readFileSync(path, "utf8");

// 1) 旧ブロックを全削除（scaffold / real / auto-injected / distribute）
src = src
  .replace(/\/\/\s*====\s*multi-day scaffold[\s\S]*?catch\s*\{\}\s*/m, "")
  .replace(/\/\/\s*====\s*multi-day real logic[\s\S]*?catch\s*\(.*?\)\s*\{[\s\S]*?\}\s*/m, "")
  .replace(/\/\/\s*====\s*multi-day real logic\s*\(auto-injected[\s\S]*?catch\s*\{\s*\}\s*/m, "")
  .replace(/\/\/\s*mustSee\s*を\s*day1[\s\S]*?\/\/\s*各日の並びを時刻順に/m, "");

// 2) 返却アンカーをゆるく検索（NextResponse or Response）
const anchorRe =
  /^[ \t]*(?:return|const\s+\w+\s*=|let\s+\w+\s*=)?[ \t]*(?:NextResponse|Response)\.json\s*\(.*$/m;
const m = src.match(anchorRe);
if (!m) {
  console.error(
    "❌ 返却のアンカー行（NextResponse.json/Response.json）が見つかりません。周辺のコードを確認してください。",
  );
  process.exit(1);
}

// アンカー行の先頭位置
const idx = src.indexOf(m[0]);
const lineStart = src.lastIndexOf("\n", idx) + 1;

// 3) 切替ブロック本体（前回ご案内の MODE: off/scaffold/roundrobin）
const block = `
// ==== multi-day mode switch (off | scaffold | roundrobin) ====
// 環境変数 MULTIDAY_MODE で切替（未設定は "off"）
try {
  const MODE = (process.env.MULTIDAY_MODE || 'off').toLowerCase();
  const sd = new Date(String((body as any).startDate || ''));
  const ed = new Date(String((body as any).endDate || ''));
  const diffDays = Math.max(1, Math.floor((ed.getTime() - sd.getTime()) / 86400000) + 1);

  // day1 は既存を尊重
  (data as any).day1 = Array.isArray((data as any).day1) ? (data as any).day1 : [];

  if (MODE === 'scaffold') {
    // day1 を day2..N に複製（UI確認用）
    if (Array.isArray((data as any).day1) && diffDays > 1) {
      for (let d = 2; d <= diffDays; d++) {
        (data as any)[\`day\${d}\`] = ((data as any).day1 as any[]).map(it => ({ ...it }));
      }
    }
  } else if (MODE === 'roundrobin') {
    const wantsStay = Array.isArray((body as any).purposes) && (body as any).purposes.includes('宿泊');
    const hotel = String((body as any).hotelName || '').trim();
    const mustSee = Array.isArray((body as any).mustSee) ? (body as any).mustSee as string[] : [];

    // 宿泊ON+ホテル名 → day1 にチェックイン（重複防止）
    if (wantsStay && hotel && !((data as any).day1 as any[]).some(i => String(i?.title||'').includes('ホテルチェックイン'))) {
      (data as any).day1.push({ time: '15:00', title: \`ホテルチェックイン（\${hotel}）\` });
    }

    // day2..N を初期化
    for (let d = 2; d <= diffDays; d++) (data as any)[\`day\${d}\`] = Array.isArray((data as any)[\`day\${d}\`]) ? (data as any)[\`day\${d}\`] : [];

    // 既存タイトルを収集（重複登録を避ける）
    const existing = new Set<string>();
    for (let d = 1; d <= diffDays; d++) {
      const arr = (data as any)[\`day\${d}\`];
      if (Array.isArray(arr)) for (const it of arr) if (it?.title) existing.add(String(it.title));
    }
    const queue = mustSee.filter(t => !existing.has(String(t)));

    // 各日の使用済み時刻
    const base = ['09:30','11:00','14:00','16:00','18:00','20:00'];
    const used = new Map<number, Set<string>>();
    for (let d = 1; d <= diffDays; d++) {
      const set = new Set<string>();
      const arr = (data as any)[\`day\${d}\`];
      if (Array.isArray(arr)) for (const it of arr) if (it?.time) set.add(String(it.time));
      used.set(d, set);
    }
    const pick = (dayIdx:number) => {
      const u = used.get(dayIdx)!;
      for (const t of base) if (!u.has(t)) return t;
      let h=20,m=0; for(;;){ const t=\`\${String(h).padStart(2,'0')}:\${String(m).padStart(2,'0')}\`; if(!u.has(t)) return t; m+=30; if(m>=60){m=0;h++;} }
    };

    // ※ 当面は day2 起点で配分（初日を増やし過ぎない）
    const startOffset = (diffDays > 1 ? 1 : 0);
    let i = 0;
    for (const spot of queue) {
      const dayIndex = ((i + startOffset) % diffDays) + 1;
      const key = \`day\${dayIndex}\`;
      const arr = (data as any)[key] as any[];
      const t = pick(dayIndex);
      arr.push({ time: t, title: spot });
      used.get(dayIndex)!.add(t);
      existing.add(String(spot));
      i++;
    }

    // HH:MM 文字列としてソート
    for (let d = 1; d <= diffDays; d++) {
      const key = \`day\${d}\`;
      const arr = (data as any)[key];
      if (Array.isArray(arr)) (data as any)[key] = arr.slice().sort((a:any,b:any)=> String(a?.time ?? '').localeCompare(String(b?.time ?? '')));
    }
  }
} catch {}
// ==== /multi-day switch ====
`;

// 4) 注入
src = src.slice(0, lineStart) + block + src.slice(lineStart);
fs.writeFileSync(path, src);
console.log("✅ route.ts に MULTIDAY_MODE 切替ブロックを注入しました（汎用アンカー対応）。");
