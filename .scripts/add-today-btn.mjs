import fs from "fs";
const f = "app/demo-itinerary/DemoClient.tsx";
let s = fs.readFileSync(f, "utf8");

/* A) react import に useCallback を同居 */
s = s.replace(/import\s+\{\s*([^}]+)\}\s+from\s+["']react["'];/, (m, inner) => {
  const set = new Set(
    inner
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean),
  );
  set.add("useCallback");
  return `import { ${Array.from(set).join(", ")} } from "react";`;
});

/* B) STORAGE_KEY_DATE を定義（無ければ STORAGE_KEY の直後に） */
if (!/STORAGE_KEY_DATE/.test(s)) {
  s = s.replace(
    /const\s+STORAGE_KEY\s*=\s*["'][^"']+["'];/,
    '$&\n  const STORAGE_KEY_DATE = "travoru.demo.itinerary.date.v1";',
  );
}

/* C) handleToday を定義（無ければ return( の直前に） */
if (!/const\s+handleToday\s*=/.test(s)) {
  const todayFn = `
  const handleToday = useCallback(() => {
    const t = new Date().toISOString().slice(0,10);
    setDate(t);
    try { localStorage.setItem(STORAGE_KEY_DATE, t); } catch {}
  }, []);
`;
  s = s.replace(/return\s*\(/, todayFn + "\n  return (");
}

/* D) ツールバーの Reset ボタン直後に「今日」ボタンを挿入（重複防止） */
if (!/>\s*今日\s*<\/button>/.test(s)) {
  s = s.replace(
    /(<button[^>]*onClick=\{handleReset\}[^>]*>[\s\S]*?<\/button>)/,
    `$1
        <button onClick={handleToday} className="rounded-lg border px-3 py-1 text-sm hover:bg-black/5">今日</button>`,
  );
}

fs.writeFileSync(f, s);
console.log("✅ DemoClient: ツールバーに『今日』ボタンを追加しました");
