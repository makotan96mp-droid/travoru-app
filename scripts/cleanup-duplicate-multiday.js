const fs = require("fs");
const path = "app/api/plan/route.ts";
let src = fs.readFileSync(path, "utf8");

// 1) すべての multi-day switch ブロック（開始～終了）を検出
const startRE = /\/\/ ==== multi-day switch ====/g;
const endRE = /\/\/ ==== \/multi-day switch ====/g;

let starts = [],
  ends = [];
for (let m; (m = startRE.exec(src)); ) starts.push(m.index);
for (let m; (m = endRE.exec(src)); ) ends.push(m.index);

if (starts.length === 0 || ends.length === 0) {
  console.log("⚠️ multi-day switch ブロックが見つかりません。スキップします。");
  process.exit(0);
}

// ブロックのペアを作る（開始の直後に来る終了と対応付け）
const pairs = [];
let eIdx = 0;
for (const s of starts) {
  while (eIdx < ends.length && ends[eIdx] < s) eIdx++;
  if (eIdx < ends.length) {
    pairs.push([s, ends[eIdx] + "// ==== /multi-day switch ====//".length]); // ざっくり終端
    eIdx++;
  }
}

// 2) 最後のブロック（return直前にある想定）だけ残して、それ以前のブロックを削除
if (pairs.length > 1) {
  const keep = pairs[pairs.length - 1];
  let out = "";
  let cursor = 0;
  for (let i = 0; i < pairs.length - 1; i++) {
    const [s, e] = pairs[i];
    out += src.slice(cursor, s); // 開始までを残す
    cursor = e; // ブロック本文は落とす
  }
  out += src.slice(cursor); // 最後のブロック以降はそのまま
  src = out;
}

// 3) 先頭側に残った配分ロジックの残骸（times/base/pick/旧mustSee配分）を念のため除去
//   - これは「最後の multi-day ブロックより前の領域」だけに限定して削除
const lastStart = src.lastIndexOf("// ==== multi-day switch ====");
if (lastStart > 0) {
  let head = src.slice(0, lastStart);
  const tail = src.slice(lastStart);

  // 代表的な残骸パターン
  head = head
    // 古い times 配列から catch{} までの塊
    .replace(/const\s+times\s*=\s*\[[^\]]*\][\s\S]*?catch\s*\{\}\s*;?\s*/g, "")
    // BASE_SLOTS / base / pick 関連の塊
    .replace(/const\s+BASE_SLOTS[\s\S]*?;?\s*for\s*\(let\s+d\s*=\s*1;[\s\S]*?\}\s*\}\s*/g, "")
    .replace(/const\s+base\s*=\s*\[[^\]]*\][\s\S]*?used\.get\(dayIdx\)\!\.add\(t\);\s*\}\s*/g, "")
    // mustSee を直接 push している古い配分ループ
    .replace(/for\s*\(const\s+spot\s+of\s+mustSee\)[\s\S]*?\}\s*/g, "");

  src = head + tail;
}

fs.writeFileSync(path, src);
console.log("✅ 先頭側の重複 multi-day ブロックと残骸を削除しました（最後のブロックのみ保持）。");
