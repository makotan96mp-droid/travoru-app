const fs = require("fs");
const path = "app/_components/ItineraryForm.tsx";
let src = fs.readFileSync(path, "utf8");

const replacement = `
{Object.entries(preview)
  .filter(([k,v]) => /^day\\d+$/.test(k) && Array.isArray(v) && v.length > 0)
  .sort(([a],[b]) => a.localeCompare(b, undefined, { numeric: true }))
  .map(([dayKey, items]) => (
    <div key={dayKey} className="rounded-md border border-[color:var(--border-subtle)] p-3">
      <div className="text-sm font-medium mb-1">{dayKey.replace("day","Day ")}</div>
      <ul className="list-disc pl-5 text-sm">
        {items.map((s:any,i:number)=>(
          <li key={i}>
            <span className="tabular-nums">{s.time}</span> — {s.title}
            {s.note ? <span className="text-[color:var(--fg-muted)]">（{s.note}）</span> : null}
          </li>
        ))}
      </ul>
    </div>
  ))
}
`.trim();

// パターンA: Array.isArray(preview.day1) .. ブロックを丸ごと置換
const reA = /\{Array\.isArray\(preview\.day1\)[\s\S]*?\n\s*\}\)\n\s*\}/m;

// パターンB: "Day 1" の見出しを含むコンテナを置換
const reB =
  /\{Array\.isArray\(preview\.day1\)[\s\S]*?<div[^>]*>\s*Day\s*1\s*<\/div>[\s\S]*?<\/div>\s*\)\s*\)/m;

let changed = false;
if (reA.test(src)) {
  src = src.replace(reA, replacement + "\n");
  changed = true;
} else if (reB.test(src)) {
  src = src.replace(reB, replacement);
  changed = true;
}

if (!changed) {
  console.error("❌ day1 固定ブロックを見つけられませんでした。周辺テキストの例：");
  const head = src.indexOf("preview.day1");
  if (head >= 0) console.error(src.slice(Math.max(0, head - 200), head + 400));
  process.exit(1);
}

fs.writeFileSync(path, src);
console.log("✅ multiday パッチを適用しました:", path);
