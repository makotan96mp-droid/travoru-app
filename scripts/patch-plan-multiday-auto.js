const fs = require("fs");
const path = "app/api/plan/route.ts";
let src = fs.readFileSync(path, "utf8");

// 既存の暫定ブロックがあれば除去
src = src.replace(/\/\/ ==== multi-day scaffold[\s\S]*?catch \{\}\s*/m, "");

// NextResponse.json(IDENT) の IDENT を特定
const m = src.match(/NextResponse\.json\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*\)/);
if (!m) {
  console.error("❌ NextResponse.json(…) の第1引数が単純な変数ではありません。");
  process.exit(1);
}
const varName = m[1];

// 挿入位置（NextResponse.json の行頭直前）
const idx = src.indexOf(m[0]);
const lineStart = src.lastIndexOf("\n", idx) + 1;

// 実ロジック：mustSee を day1..dayN に配分、宿泊ONなら day1へチェックイン
const realLogic = `
// ==== multi-day real logic (auto-injected for \`${varName}\`) ====
try {
  const sd = new Date(body.startDate as any);
  const ed = new Date(body.endDate as any);
  const diffDays = Math.max(1, Math.floor((ed.getTime() - sd.getTime()) / 86400000) + 1);

  const times = ["09:30", "11:00", "14:00", "18:00"];
  const wantsStay = Array.isArray(body.purposes) && body.purposes.includes("宿泊");
  const hotel = (body.hotelName || "").trim();
  const mustSee = Array.isArray((body as any).mustSee) ? (body as any).mustSee : [];

  // day1 初期化（既存を尊重）
  if (!Array.isArray((${varName} as any).day1)) {
    ((${varName} as any).day1 = []);
  }

  // 宿泊ON+ホテル名あり → day1にチェックイン（重複防止）
  if (wantsStay && hotel && !(((${varName} as any).day1 as any[]).some(i => String(i?.title||"").includes("ホテルチェックイン")))) {
    (((${varName} as any).day1) as any[]).push({ time: "15:00", title: \`ホテルチェックイン（\${hotel}\` + "）" });
  }

  // day2+ 初期化
  for (let d = 2; d <= diffDays; d++) {
    ((${varName} as any)[\`day\${d}\`] = ((${varName} as any)[\`day\${d}\`] ?? []));
  }

  // mustSee を day1..dayN にラウンドロビン配分
  let i = 0;
  for (const spot of mustSee) {
    const dayIndex = (i % diffDays) + 1;  // 1..diffDays
    const key = \`day\${dayIndex}\`;
    const arr = (((${varName} as any)[key]) as any[]);
    const t = times[Math.min(arr.length, times.length - 1)];
    arr.push({ time: t, title: spot });
    i++;
  }

  // 各日を時刻順に
  for (let d = 1; d <= diffDays; d++) {
    const key = \`day\${d}\`;
    const arr = (((${varName} as any)[key]) as any[]);
    if (Array.isArray(arr)) {
      ((${varName} as any)[key] = arr.sort((a:any,b:any)=> String(a?.time||"").localeCompare(String(b?.time||"")));
    }
  }
} catch { /* noop */ }
`;

const out = src.slice(0, lineStart) + realLogic + src.slice(lineStart);
fs.writeFileSync(path, out);
console.log("✅ Injected multi-day logic targeting variable:", varName);
