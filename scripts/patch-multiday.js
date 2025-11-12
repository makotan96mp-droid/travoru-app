const fs = require("fs");
const path = "app/_components/ItineraryForm.tsx";
let src = fs.readFileSync(path, "utf8");

// day1固定ブロックを汎用レンダリングへ置換
const re = /\{Array\.isArray\(preview\.day1\)[\s\S]*?\n\s*\}\)\n\s*\}/m;

const replacement = `
{Object.entries(preview)
  .filter(([k,v]) => /^day\\d+$/.test(k) && Array.isArray(v) && v.length > 0)
  .sort(([a],[b]) => a.localeCompare(b, undefined, { numeric: true }))
  .map(([dayKey, items]) => (
    <div key={dayKey} className="rounded-md border border-[color:var(--border-subtle)] p-3">
      <div className="text-sm font-medium mb-1">{dayKey.replace("day","Day ")}</div>
      <ul className="list-disc pl-5 text-sm">
        {(items).map((s:any,i:number)=>(
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

if (!re.test(src)) {
  console.error(
    "置換対象の day1 ブロックが見つかりませんでした。ファイルの該当部分が変わっていないか確認してください。",
  );
  process.exit(1);
}

src = src.replace(re, replacement + "\n");
fs.writeFileSync(path, src);
console.log("✅ multiday パッチを適用しました:", path);
