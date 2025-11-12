import fs from "fs";
const f = "app/demo-itinerary/DemoClient.tsx";
let s = fs.readFileSync(f, "utf8");

// A) react import に useRef / useCallback を揃える
s = s.replace(/import\s+\{\s*([^}]+)\}\s+from\s+["']react["'];/, (m, inner) => {
  const set = new Set(
    inner
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean),
  );
  ["useRef", "useCallback"].forEach((x) => set.add(x));
  return `import { ${Array.from(set).join(", ")} } from "react";`;
});

// B) file input とハンドラを return( の前に挿入（再実行OK）
if (!/fileInputRef/.test(s)) {
  s = s.replace(
    /return\s*\(/,
    `
const fileInputRef = useRef<HTMLInputElement|null>(null);
const triggerImport = () => fileInputRef.current?.click();

const handleImportJSON = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result));
      if (Array.isArray(data?.items)) {
        setItems(data.items as Item[]);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data.items)); } catch {}
      }
      if (typeof data?.date === "string") {
        setDate(data.date);
        try { localStorage.setItem(STORAGE_KEY_DATE, data.date); } catch {}
      }
      if (data?.ui) {
        const pd = parseDensity(data.ui.density ?? null); 
        if (pd) { setDensity(pd); try { localStorage.setItem(STORAGE_KEY_UI_DENSITY, pd); } catch {} }
        if (typeof data.ui.showDistance === "boolean") {
          setShowDistance(!!data.ui.showDistance);
          try { localStorage.setItem(STORAGE_KEY_UI_DIST, data.ui.showDistance ? "1":"0"); } catch {}
        }
      }
    } catch {
      alert("JSONの読み込みに失敗しました。ファイルを確認してください。");
    }
    try { e.target.value = ""; } catch {}
  };
  reader.readAsText(file);
}, [setItems, setDate, setDensity, setShowDistance]);

return (
`,
  );
}

// C) ツールバーに「JSON読み込み」を追加（書き出しボタンの近く）
if (!/JSON読み込み/.test(s)) {
  s = s.replace(
    /(<button[^>]*onClick=\{handleExportJSON\}[^>]*>[^<]*<\/button>)/,
    `$1
        <button onClick={triggerImport} className="rounded-lg border px-3 py-1 text-sm hover:bg-black/5">JSON読み込み</button>
        <input ref={fileInputRef} type="file" accept="application/json" hidden onChange={handleImportJSON} />`,
  );
}

fs.writeFileSync(f, s);
console.log("✅ DemoClient: JSON読み込み（インポート）を追加しました");
