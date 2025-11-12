import fs from "fs";
const f = "app/demo-itinerary/DemoClient.tsx";
let s = fs.readFileSync(f, "utf8");

/** A) handleAdd をテンプレ項目付きで統一（再実行OK） */
{
  const re = /const\s+handleAdd\s*=\s*useCallback\([\s\S]*?\);\s*/m;
  const repl = `const handleAdd = useCallback(() => {
  const newItem: Item = {
    time: roundToNextSlot(new Date()),
    title: "新規スポット",
    note: "メモ（例：入場料・予約URL・滞在目安）",
    tags: ["todo","new"],
    isMain: false,
    meta: { distanceHint: 0 }
  };
  setItems(prev => {
    const next = [...prev, newItem];
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
    return next;
  });
}, []);
`;
  s = re.test(s) ? s.replace(re, repl) : s.replace(/return\s*\(/, repl + "\nreturn (");
}

/** B) ツールバー（表示サイズ/距離表示）が無ければ追加 */
if (!/name="density-select"/.test(s)) {
  s = s.replace(
    /<main([^>]*)>\s*\n/,
    `<main$1>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button onClick={handleReset} className="rounded-lg border px-3 py-1 text-sm hover:bg-black/5">Reset</button>
        <label className="text-sm flex items-center gap-2">
          表示サイズ:
          <select
            name="density-select"
            className="rounded border px-2 py-1 text-sm"
            value={density}
            onChange={(e)=>setDensity(e.target.value as "compact"|"cozy"|"comfortable")}
          >
            <option value="compact" title="一覧性重視（情報多め・余白少なめ）">コンパクト</option>
            <option value="cozy" title="標準（バランス）">標準</option>
            <option value="comfortable" title="見やすさ重視（文字大・余白ひろめ）">ゆったり</option>
          </select>
        </label>
        <label className="text-sm flex items-center gap-2">
          <input
            type="checkbox"
            checked={showDistance}
            onChange={(e)=>setShowDistance(e.target.checked)}
          />
          距離表示
        </label>
      </div>
`,
  );
}

fs.writeFileSync(f, s);
console.log("✅ DemoClient: handleAdd（テンプレ）＆ツールバーUIを反映");
