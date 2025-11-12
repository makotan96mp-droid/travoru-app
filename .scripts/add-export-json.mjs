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

/* B) handleExport を return( の直前に定義（重複防止） */
if (!/const\s+handleExport\s*=/.test(s)) {
  const fn = `
  const handleExport = useCallback(() => {
    const payload = {
      date,
      items,
      settings: { density, showDistance }
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const d = (date || new Date().toISOString().slice(0,10)).replaceAll("-","");
    a.download = \`itinerary-\${d}.json\`;
    a.click();
    URL.revokeObjectURL(url);
  }, [date, items, density, showDistance]);
`;
  s = s.replace(/return\s*\(/, fn + "\n  return (");
}

/* C) ツールバーの「今日」ボタンの右に「JSON書き出し」ボタンを追加（重複防止） */
if (!/JSON書き出し/.test(s)) {
  s = s.replace(
    /(<button[^>]*onClick=\{handleToday\}[^>]*>[\s\S]*?<\/button>)/,
    `$1
        <button onClick={handleExport} className="rounded-lg border px-3 py-1 text-sm hover:bg-black/5">JSON書き出し</button>`,
  );
}

fs.writeFileSync(f, s);
console.log("✅ DemoClient: 「JSON書き出し」ボタンを追加しました");
