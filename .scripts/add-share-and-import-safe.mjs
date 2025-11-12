import fs from "fs";
const f = "app/demo-itinerary/DemoClient.tsx";
let s = fs.readFileSync(f, "utf8");

/* --- A) react import に必要フックを揃える --- */
s = s.replace(/import\s+\{\s*([^}]+)\}\s+from\s+["']react["'];/, (m, inner) => {
  const set = new Set(
    inner
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean),
  );
  ["useState", "useEffect", "useCallback", "useRef"].forEach((x) => set.add(x));
  return `import { ${Array.from(set).join(", ")} } from "react";`;
});

/* --- B) ヘルパー群：存在しなければ追加（重複は追加しない） --- */
function addHelperOnce(name, code) {
  if (
    !new RegExp(`function\\s+${name}\\s*\\(`).test(s) &&
    !new RegExp(`const\\s+${name}\\s*=`).test(s)
  ) {
    s = s.replace(/(\nexport\s+default\s+function\s+[A-Za-z0-9_]+\s*\()/, `${code}\n$1`);
  }
}

// URL-safe Base64
addHelperOnce(
  "toUrlSafeBase64",
  `
function toUrlSafeBase64(str) {
  const b64 = btoa(unescape(encodeURIComponent(str)));
  return b64.replace(/\\+/g,"-").replace(/\\//g,"_").replace(/=+$/,"");
}
`,
);
addHelperOnce(
  "fromUrlSafeBase64",
  `
function fromUrlSafeBase64(param) {
  const pad = param.length % 4 ? "=".repeat(4-(param.length%4)) : "";
  const b64 = param.replace(/-/g,"+").replace(/_/g,"/") + pad;
  return decodeURIComponent(escape(atob(b64)));
}
`,
);
// gzip 圧縮/解凍（CompressionStream が無い環境は自動フォールバック）
addHelperOnce(
  "gzipToUrlParam",
  `
async function gzipToUrlParam(str){
  try{
    const CS = (globalThis && (globalThis).CompressionStream) || null;
    if(!CS) return null;
    const cs = new CS("gzip");
    const blob = await new Response(new Blob([str]).stream().pipeThrough(cs)).blob();
    const buf = new Uint8Array(await blob.arrayBuffer());
    let b64 = btoa(String.fromCharCode(...buf));
    return b64.replace(/\\+/g,"-").replace(/\\//g,"_").replace(/=+$/,"");
  }catch{ return null; }
}
`,
);
addHelperOnce(
  "ungzipFromUrlParam",
  `
async function ungzipFromUrlParam(param){
  try{
    const pad = param.length % 4 ? "=".repeat(4-(param.length%4)) : "";
    const b64 = param.replace(/-/g,"+").replace(/_/g,"/")+pad;
    const bin = atob(b64); const arr = Uint8Array.from(bin, c=>c.charCodeAt(0));
    const DS = (globalThis && (globalThis).DecompressionStream) || null;
    if(!DS) return null;
    const ds = new DS("gzip");
    const blob = new Blob([arr]);
    const text = await new Response(blob.stream().pipeThrough(ds)).text();
    return text;
  }catch{ return null; }
}
`,
);
// parseDensity（無ければ）
addHelperOnce(
  "parseDensity",
  `
function parseDensity(v){
  const t = String(v||"").toLowerCase();
  if (["compact","コンパクト","small","s"].includes(t)) return "compact";
  if (["cozy","標準","standard","medium","m"].includes(t)) return "cozy";
  if (["comfortable","ゆったり","large","l"].includes(t)) return "comfortable";
  return null;
}
`,
);

/* --- C) toast state を items state の直後に（未定義なら） --- */
if (!/\[\s*toast\s*,\s*setToast\s*\]/.test(s)) {
  s = s.replace(
    /const\s*\[\s*items\s*,\s*setItems\s*\][\s\S]*?\n/,
    (m) => m + `  const [toast, setToast] = useState<string|null>(null);\n`,
  );
}

/* --- D) handleShareLink を最後の return( の直前に追加/置換 --- */
(function injectShare() {
  const sig = "const handleShareLink = useCallback";
  // 既存ブロックを削除
  if (s.includes(sig)) {
    let i = s.indexOf(sig);
    let open = s.indexOf("(", i + sig.length);
    let d = 1,
      j = open + 1;
    while (j < s.length && d > 0) {
      const ch = s[j++];
      if (ch === "(") d++;
      else if (ch === ")") d--;
    }
    while (j < s.length && /\\s/.test(s[j])) j++;
    if (s[j] === ";") j++;
    s = s.slice(0, i) + s.slice(j);
  }
  // 直前に挿入
  let insertAt = -1;
  {
    const re = /return\\s*\\(/g;
    let m;
    while ((m = re.exec(s)) !== null) insertAt = m.index;
  }
  if (insertAt < 0) throw new Error("return( が見つかりません");
  const block = `
const handleShareLink = useCallback(async () => {
  const payload = { date, items, ui: { density, showDistance } };
  const json = JSON.stringify(payload);
  let gzipParam = null;
  try { gzipParam = await gzipToUrlParam(json); } catch {}
  const u = new URL(location.href);
  if (gzipParam) u.searchParams.set("plan_gz", gzipParam); // 圧縮
  u.searchParams.set("plan", toUrlSafeBase64(json));       // 互換
  const url = u.toString();
  try {
    await navigator.clipboard?.writeText(url);
    try { setToast("共有リンクをコピーしました"); setTimeout(()=>setToast(null), 2000); } catch {}
  } catch {
    prompt("共有リンクです。コピーしてください:", url);
  }
}, [date, items, density, showDistance]);

`;
  s = s.slice(0, insertAt) + block + s.slice(insertAt);
})();

/* --- E) JSON読み込み（hidden input + ハンドラ）を return( の直前に注入 --- */
if (!/const\s+fileInputRef\s*=/.test(s)) {
  s = s.replace(
    /return\s*\(/,
    `
const fileInputRef = useRef<HTMLInputElement|null>(null);
const triggerImport = () => fileInputRef.current?.click();

const handleImportJSON = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]; if (!file) return;
  if (!confirm("現在のプランを置き換えます。よろしいですか？")) { e.target.value=""; return; }
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const data = JSON.parse(String(reader.result||"{}"));
      if (Array.isArray(data?.items)) setItems(data.items as Item[]);
      if (typeof data?.date === "string") setDate(data.date);
      const pd = parseDensity(data?.ui?.density ?? null); if (pd) setDensity(pd);
      if (typeof data?.ui?.showDistance === "boolean") setShowDistance(!!data.ui.showDistance);
      try { localStorage.setItem("travoru.demo.itinerary.v1", JSON.stringify(data.items||[])); } catch {}
      try { localStorage.setItem("travoru.demo.itinerary.date.v1", data.date||""); } catch {}
      try { localStorage.setItem("travoru.demo.ui.density", pd||""); } catch {}
      try { localStorage.setItem("travoru.demo.ui.dist", data?.ui?.showDistance ? "1":"0"); } catch {}
      setToast("JSONを読み込みました"); setTimeout(()=>setToast(null), 1500);
    } catch { alert("JSONの読み込みに失敗しました"); }
    try { e.target.value = ""; } catch {}
  };
  reader.readAsText(file);
}, [setItems, setDate, setDensity, setShowDistance, setToast]);

return (`,
  );
}

/* --- F) ツールバーにボタン（共有リンク / JSON読み込み）を差し込む --- */
if (!/共有リンク<\/button>/.test(s)) {
  s = s.replace(
    /(<button[^>]*onClick=\{handleReset\}[^>]*>[\s\S]*?<\/button>)/,
    `$1
        <button onClick={handleShareLink} className="rounded-lg border px-3 py-1 text-sm hover:bg-black/5">共有リンク</button>
        <button onClick={triggerImport} className="rounded-lg border px-3 py-1 text-sm hover:bg-black/5">JSON読み込み</button>
        <input ref={fileInputRef} type="file" accept=".json,.travoru.json,application/json" hidden onChange={handleImportJSON} />`,
  );
}

/* --- G) トーストを <main> 内に表示（未挿入なら） --- */
if (!/\{toast\s*\?\s*\(/.test(s)) {
  s = s.replace(
    /<\/main>\s*\)\s*;\s*}\s*$/m,
    `      {toast ? (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 rounded-xl bg-black/80 text-white text-sm px-4 py-2 shadow-lg z-50">{toast}</div>
      ) : null}
      </main>
    );
}
`,
  );
}

fs.writeFileSync(f, s);
console.log("✅ share(圧縮+トースト) と JSON読み込み を安全に注入しました");
