const fs = require("fs");
const path = "app/api/plan/route.ts";
let src = fs.readFileSync(path, "utf8");

/**
 * 既存の「暫定: day1を複製」ブロックを検出して、実ロジックに置換します。
 * （見つからない場合は、NextResponse.json(data)直前に挿入）
 */
const markerStart =
  /\/\/ ==== multi-day scaffold \(temporary\): clone day1 into day2\+ for preview ====/;
const resLine = /const\s+res\s*=\s*NextResponse\.json\(data\);/;

const realLogic = `
// ==== multi-day real logic: distribute mustSee across days ====
try {
  const sd = new Date(body.startDate);
  const ed = new Date(body.endDate);
  const diffDays = Math.max(1, Math.floor((ed.getTime() - sd.getTime()) / 86400000) + 1);

  const times = ["09:30", "11:00", "14:00", "18:00"];
  const wantsStay = Array.isArray(body.purposes) && body.purposes.includes("宿泊");
  const hotel = (body.hotelName || "").trim();
  const mustSee = Array.isArray(body.mustSee) ? body.mustSee : [];

  // day1 は既存 data.day1 を尊重（存在しなければ初期化）
  (data as any).day1 = Array.isArray((data as any).day1) ? (data as any).day1 : [];

  // 宿泊ONかつホテル名ありなら day1 にチェックイン（重複防止）
  if (wantsStay && hotel && !(data as any).day1.some((i:any)=> i?.title?.includes("ホテルチェックイン"))) {
    (data as any).day1.push({ time: "15:00", title: \`ホテルチェックイン（\${hotel}\` + "）" });
  }

  // day2+ を初期化
  for (let d = 2; d <= diffDays; d++) {
    (data as any)[\`day\${d}\`] = [];
  }

  // mustSee を day1..dayN にラウンドロビンで配分
  let idx = 0;
  for (const spot of mustSee) {
    const dayIndex = (idx % diffDays) + 1; // 1..diffDays
    const dayKey = \`day\${dayIndex}\`;
    const dayArr = (data as any)[dayKey] as any[];
    const t = times[Math.min(dayArr.length, times.length - 1)];
    dayArr.push({ time: t, title: spot });
    idx++;
  }

  // 各日の並びを時刻順に（文字列比較でも00:00形式ならOK）
  for (let d = 1; d <= diffDays; d++) {
    const key = \`day\${d}\`;
    const arr = (data as any)[key];
    if (Array.isArray(arr)) {
      (data as any)[key] = arr.sort((a:any,b:any)=> String(a.time).localeCompare(String(b.time)));
    }
  }
} catch (e) { /* noop */ }`;

if (markerStart.test(src)) {
  // 暫定ブロックごと置換（開始行〜catch {} まで）
  src = src.replace(/\/\/ ==== multi-day scaffold[\s\S]*?catch \{\}\s*/m, realLogic + "\n");
} else if (resLine.test(src)) {
  // 暫定ブロックが見つからない場合：res直前に挿入
  src = src.replace(resLine, realLogic + "\n$&");
} else {
  console.error(
    "挿入位置が見つかりませんでした。NextResponse.json(data) の位置を確認してください。",
  );
  process.exit(1);
}

fs.writeFileSync(path, src);
console.log("✅ /api/plan に実ロジックを適用しました:", path);
