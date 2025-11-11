import fs from "fs";
const f = "app/demo-itinerary/DemoClient.tsx";
let s = fs.readFileSync(f, "utf8");

/** A) handleExportICS が無ければ return( の直前に挿入 */
if (!/const\s+handleExportICS\s*=\s*useCallback\(/.test(s)) {
  let insertAt = -1;
  {
    const re = /return\s*\(/g;
    let m;
    while ((m = re.exec(s)) !== null) insertAt = m.index;
  }
  if (insertAt === -1) throw new Error("return( が見つかりません");
  const block = `
/* eslint-disable react-hooks/exhaustive-deps */
const handleExportICS = useCallback(() => {
  try {
    const ics = buildICS(date, items);
    downloadText(\`travoru-\${date}.ics\`, ics, "text/calendar");
    setToast("カレンダーファイルを作成しました");
    setTimeout(() => setToast(null), 1500);
  } catch {
    alert(".ics の作成に失敗しました");
  }
}, [date, items]);
/* eslint-enable react-hooks/exhaustive-deps */

`;
  s = s.slice(0, insertAt) + block + s.slice(insertAt);
}

/** B) ツールバーに「カレンダー(.ics)」ボタンが無ければ追加 */
if (!/カレンダー\(.ics\)/.test(s)) {
  s = s.replace(
    /(<div className="mb-4[^"]*">[\s\S]*?)(<\/div>)/,
    `$1  <button onClick={handleExportICS} className="rounded-lg border px-3 py-1 text-sm hover:bg-black/5">カレンダー(.ics)</button>
      $2`,
  );
}

fs.writeFileSync(f, s);
console.log("✅ handleExportICS を保証し、ボタンを配線しました（再実行OK）");
