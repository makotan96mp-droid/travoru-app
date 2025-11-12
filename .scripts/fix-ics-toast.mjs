import fs from "fs";
const f = "app/demo-itinerary/DemoClient.tsx";
let s = fs.readFileSync(f, "utf8");

// A) 既存の handleExportICS をまるごと消してから、きれいな定義を差し込む
function removeUseCallback(name) {
  const sig = new RegExp(`const\\s+${name}\\s*=\\s*useCallback\\(`);
  const m = s.match(sig);
  if (!m) return;
  let i = m.index;
  let p = s.indexOf("(", i); // useCallback(
  let depth = 1,
    j = p + 1;
  while (j < s.length && depth > 0) {
    // 対応 ) を探す
    const c = s[j++];
    if (c === "(") depth++;
    else if (c === ")") depth--;
  }
  while (j < s.length && /\s/.test(s[j])) j++;
  if (s[j] === ";") j++;
  s = s.slice(0, i) + s.slice(j);
}
removeUseCallback("handleExportICS");

// B) 最後の return( の直前にクリーンな定義を挿入
let insertAt = -1;
{
  const re = /return\s*\(/g;
  let m;
  while ((m = re.exec(s)) !== null) insertAt = m.index;
}
if (insertAt === -1) throw new Error("return( が見つかりません");

const block = `
const handleExportICS = useCallback(() => {
  try {
    const ics = buildICS(date, items);
    downloadText(\`travoru-\${date}.ics\`, ics, "text/calendar");
    // トーストを素直に2行で（ESLint no-unused-expressions 回避）
    setToast("カレンダーファイルを作成しました");
    setTimeout(() => setToast(null), 1500);
  } catch {
    alert(".ics の作成に失敗しました");
  }
}, [date, items]);
`;

s = s.slice(0, insertAt) + block + s.slice(insertAt);

// C) 万一残っている "setToast && (...)" を安全に通常コードへ置換（保険）
s = s.replace(
  /\s*setToast\s*&&\s*\(\s*setToast\(([^)]*)\)\s*,\s*setTimeout\(\s*=>\s*setToast\s*&&\s*setToast\(null\)\s*,\s*1500\)\s*\)\s*;?/g,
  `\n  setToast($1);\n  setTimeout(() => setToast(null), 1500);\n`,
);

// D) downloadText / buildICS 未使用警告は、このハンドラで呼ぶので自然に解消

fs.writeFileSync(f, s);
console.log("✅ handleExportICS を再生成し、トースト表記をESLint準拠に修正しました");
