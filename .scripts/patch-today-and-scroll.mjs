import fs from "fs";
const f = "app/_components/ItineraryDayCard.tsx";
let s = fs.readFileSync(f, "utf8");

/* A) react import に useRef/useEffect を同居 */
s = s.replace(/import\s+\{\s*([^}]+)\}\s+from\s+["']react["'];/, (m, inner) => {
  const set = new Set(
    inner
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean),
  );
  ["useRef", "useEffect"].forEach((x) => set.add(x));
  return `import { ${Array.from(set).join(", ")} } from "react";`;
});

/* B) 内部フックの追加（list/state の直後辺り） */
if (!/bottomRef\s*=\s*useRef/.test(s)) {
  s = s.replace(
    /const\s*\[\s*list\s*,\s*setList\s*\]\s*=\s*useState<[^\)]*\)\s*;/,
    (m) =>
      `${m}\n  const bottomRef = useRef<HTMLDivElement | null>(null);\n  const justAddedRef = useRef(false);\n`,
  );
}

/* C) +追加ボタンの onClick を justAddedRef セット→onAdd 実行に */
s = s.replace(
  /onClick=\{onAdd\}/,
  `onClick={() => { try { justAddedRef.current = true; } catch {} ; onAdd?.(); }}`,
);

/* D) ドロッパブルの末尾にスクロール用の番兵を設置 */
if (!/ref=\{bottomRef\}/.test(s)) {
  s = s.replace(/<\/Droppable>/, `  <div ref={bottomRef} />\n          </Droppable>`);
}

/* E) 追加直後に末尾へスムーススクロール */
if (!/scrollIntoView\(\{behavior:\s*['"]smooth['"]/.test(s)) {
  s = s.replace(
    /(\n\s*)return\s*\(/,
    `$1useEffect(() => {
    if (justAddedRef.current) {
      justAddedRef.current = false;
      try { bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); } catch {}
    }
  }, [list.length]);
$1return (`,
  );
}

/* F) 日付 input の直後に「今日」ボタンを付ける */
s = s.replace(
  /(<input[^>]*type="date"[^>]*\/>)/,
  `$1
            <button
              type="button"
              onClick={() => onDateChange?.(new Date().toISOString().slice(0,10))}
              className="ml-2 rounded border px-2 py-1 text-xs hover:bg-black/5"
            >今日</button>`,
);

fs.writeFileSync(f, s);
console.log("✅ ItineraryDayCard: 今日ボタン＋追加直後の末尾スクロールを実装しました");
