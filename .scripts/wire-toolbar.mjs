import fs from "fs";
const f = "app/demo-itinerary/DemoClient.tsx";
let s = fs.readFileSync(f, "utf8");

// 共有リンクボタンが未配線なら、<main ...> の直後に挿入
if (!/共有リンク<\/button>/.test(s)) {
  s = s.replace(
    /<main([^>]*)>\s*\n/,
    `<main$1>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button onClick={handleReset} className="rounded-lg border px-3 py-1 text-sm hover:bg-black/5">Reset</button>
        <button onClick={handleShareLink} className="rounded-lg border px-3 py-1 text-sm hover:bg-black/5">共有リンク</button>
        <button onClick={triggerImport} className="rounded-lg border px-3 py-1 text-sm hover:bg-black/5">JSON読み込み</button>
        <input ref={fileInputRef} type="file" accept=".json,.travoru.json,application/json" hidden onChange={handleImportJSON} />
      </div>
`,
  );
}

fs.writeFileSync(f, s);
console.log("✅ ツールバー（共有リンク/JSON読み込み）を <main> 直下に配線しました");
