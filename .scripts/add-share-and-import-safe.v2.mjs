import fs from "fs";
const f = "app/demo-itinerary/DemoClient.tsx";
let s = fs.readFileSync(f, "utf8");

/* A) react import に必要フックを揃える */
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

/* B) ヘルパー（未定義なら追加） */
function ensureFn(name, code) {
  if (
    !new RegExp(`\\bfunction\\s+${name}\\s*\\(`).test(s) &&
    !new RegExp(`\\bconst\\s+${name}\\s*=`).test(s)
  ) {
    s = s.replace(/(\nexport\s+default\s+function\s+[A-Za-z0-9_]+\s*\()/, `${code}\n$1`);
  }
}
ensureFn(
  "toUrlSafeBase64",
  `function toUrlSafeBase64(str){ const b64=btoa(unescape(encodeURIComponent(str))); return b64.replace(/\\+/g,"-").replace(/\\//g,"_").replace(/=+$/,""); }`,
);
ensureFn(
  "fromUrlSafeBase64",
  `function fromUrlSafeBase64(param){ const pad = param.length % 4 ? "=".repeat(4-(param.length%4)) : ""; const b64 = param.replace(/-/g,"+").replace(/_/g,"/")+pad; return decodeURIComponent(escape(atob(b64))); }`,
);
ensureFn(
  "gzipToUrlParam",
  `async function gzipToUrlParam(str){ try{ const CS = globalThis?.CompressionStream; if(!CS) return null; const cs=new CS("gzip"); const blob=await new Response(new Blob([str]).stream().pipeThrough(cs)).blob(); const buf=new Uint8Array(await blob.arrayBuffer()); let b64=btoa(String.fromCharCode(...buf)); return b64.replace(/\\+/g,"-").replace(/\\//g,"_").replace(/=+$/,""); }catch{ return null; } }`,
);
ensureFn(
  "ungzipFromUrlParam",
  `async function ungzipFromUrlParam(param){ try{ const pad=param.length%4?"=".repeat(4-(param.length%4)):""; const b64=param.replace(/-/g,"+").replace(/_/g,"/")+pad; const arr=Uint8Array.from(atob(b64),c=>c.charCodeAt(0)); const DS=globalThis?.DecompressionStream; if(!DS) return null; const ds=new DS("gzip"); return await new Response(new Blob([arr]).stream().pipeThrough(ds)).text(); }catch{ return null; } }`,
);
ensureFn(
  "parseDensity",
  `function parseDensity(v){ const t=String(v||"").toLowerCase(); if(["compact","コンパクト","small","s"].includes(t)) return "compact"; if(["cozy","標準","standard","medium","m"].includes(t)) return "cozy"; if(["comfortable","ゆったり","large","l"].includes(t)) return "comfortable"; return null; }`,
);

/* C) toast state を items の直後に（未定義なら） */
if (!/\[\s*toast\s*,\s*setToast\s*\]/.test(s)) {
  s = s.replace(
    /const\s*\[\s*items\s*,\s*setItems\s*\][\s\S]*?\n/,
    (m) => m + `  const [toast, setToast] = useState<string|null>(null);\n`,
  );
}

/* D) 旧 handleShareLink を消去（あれば） */
const sig = "const handleShareLink = useCallback";
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
  while (j < s.length && /\s/.test(s[j])) j++;
  if (s[j] === ";") j++;
  s = s.slice(0, i) + s.slice(j);
}

/* E) 最後の return( 直前に新しい handleShareLink を注入（文字列/RegExpハイブリッドで頑健化） */
function findLastReturnIndex(txt) {
  let idx = -1;
  for (const pat of ["return (", "return(", "return  (", "return\t("]) {
    const i = txt.lastIndexOf(pat);
    if (i > idx) idx = i;
  }
  if (idx >= 0) return idx;
  const re = new RegExp("return\\s*\\(", "g"); // ← 文字列で new RegExp にして安全化
  let m;
  while ((m = re.exec(txt)) !== null) idx = m.index;
  return idx;
}
const insertAt = findLastReturnIndex(s);
if (insertAt < 0) throw new Error("return( が見つかりません");

const shareBlock = `
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
s = s.slice(0, insertAt) + shareBlock + s.slice(insertAt);

/* F) JSON 読み込み（hidden input + trigger + handler） */
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
  reader.onload = () => {
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

/* G) ツールバーにボタン追加（Resetの後） */
if (!/共有リンク<\/button>/.test(s)) {
  s = s.replace(
    /(<button[^>]*onClick=\{handleReset\}[^>]*>[\s\S]*?<\/button>)/,
    `$1
        <button onClick={handleShareLink} className="rounded-lg border px-3 py-1 text-sm hover:bg-black/5">共有リンク</button>
        <button onClick={triggerImport} className="rounded-lg border px-3 py-1 text-sm hover:bg-black/5">JSON読み込み</button>
        <input ref={fileInputRef} type="file" accept=".json,.travoru.json,application/json" hidden onChange={handleImportJSON} />`,
  );
}

/* H) トーストを <main> 内に（未挿入なら） */
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
console.log("✅ v2: share(圧縮+トースト) と JSON読み込み を安全に注入しました");
