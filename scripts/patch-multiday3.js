const fs = require('fs');
const path = 'app/_components/ItineraryForm.tsx';
let src = fs.readFileSync(path, 'utf8');

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

// パターンC: 実コード断片に合わせて、条件開始〜閉じ括弧までをゆるくキャプチャ
// {Array.isArray(preview.day1) ... ( <div> <div>Day 1</div> ... </div> ) }
const reC = /\{Array\.isArray\(preview\.day1\)[\s\S]*?\(\s*<div[^>]*>\s*<div[^>]*>Day\s*1<\/div>[\s\S]*?<\/div>\s*\)\s*\}/m;

if (!reC.test(src)) {
  console.error('❌ day1 固定ブロックを見つけられませんでした。周辺を表示します:');
  const head = src.indexOf('Array.isArray(preview.day1)');
  if (head >= 0) console.error(src.slice(Math.max(0, head-200), head+600));
  process.exit(1);
}

src = src.replace(reC, replacement + '\n');
fs.writeFileSync(path, src);
console.log('✅ multiday パッチを適用しました:', path);
