import fs from "fs";

const f = "app/demo-itinerary/DemoClient.tsx";
let s = fs.readFileSync(f, "utf8");

// 0) react import: 必要フックを揃える
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

// 1) トースト state + ヘルパー（未定義なら）
if (!/const\s*\[\s*toast\s*,\s*setToast\s*\]/.test(s)) {
  s = s.replace(
    /const\s*\[\s*items\s*,\s*setItems\s*\][\s\S]*?\n/,
    (m) =>
      m +
      `  const [toast, setToast] = useState<string|null>(null);
  const showToast = useCallback((msg: string, ms=2000) => {
    setToast(msg);
    try{ clearTimeout((showToast as any)._t); }catch{}
    ;(showToast as any)._t = setTimeout(()=>setToast(null), ms);
  }, []);
`,
  );
}

// 2) URL圧縮/復元ヘルパー（重複防止）
if (!/function\s+gzipToUrlParam/.test(s)) {
  s = s.replace(
    /function\s+roundToNextSlot[\s\S]*?\}\n/,
    (m) =>
      m +
      `
function toUrlSafeBase64(b64){ return b64.replace(/\\+/g,'-').replace(/\\//g,'_').replace(/=+$/,''); }
function fromUrlSafeBase64(u){ const pad=u.length%4?'='.repeat(4-(u.length%4)):""; return u.replace(/-/g,'+').replace(/_/g,'/')+pad; }
async function gzipToUrlParam(str){
  try{
    const stream = new Blob([str]).stream().pipeThrough(new CompressionStream('gzip'));
    const ab = await new Response(stream).arrayBuffer();
    const b64 = btoa(String.fromCharCode(...new Uint8Array(ab)));
    return toUrlSafeBase64(b64);
  }catch{
    const b64 = btoa(unescape(encodeURIComponent(str)));
    return toUrlSafeBase64(b64);
  }
}
async function ungzipFromUrlParam(u){
  const b64 = fromUrlSafeBase64(u);
  try{
    const bin = atob(b64);
    const ab = Uint8Array.from(bin, c=>c.charCodeAt(0));
    const stream = new Blob([ab]).stream().pipeThrough(new DecompressionStream('gzip'));
    return await new Response(stream).text();
  }catch{
    try{ return decodeURIComponent(escape(atob(b64))); }catch{ return null; }
  }
}
function yyyymmdd(d){ return (d||"").replaceAll("-","").slice(0,8); }
`,
  );
}

// 3) 追加時の開始時間“賢い提案”（未定義なら）
if (!/function\s+estimateNextStartTime/.test(s)) {
  s = s.replace(
    /function\s+roundToNextSlot[\s\S]*?\}\n/,
    (m) =>
      m +
      `
function minutesFromDistance(m=0){ return Math.max(5, Math.min(60, Math.ceil((m||0)/80))); }
function addMinutes(hhmm, add){ const [h,m]=hhmm.split(":").map(n=>parseInt(n||"0",10)); const t=h*60+m+add; const hh=String(Math.floor((t%1440)/60)).padStart(2,"0"); const mm=String(t%60).padStart(2,"0"); return \`\${hh}:\${mm}\`; }
function estimateDwellMin(tags){ const set=new Set((tags||[]).map(x=>String(x).toLowerCase())); if(set.has("food")||set.has("shopping")) return 60; if(set.has("show")) return 90; return 45; }
function estimateNextStartTime(list){ if(!list?.length) return roundToNextSlot(new Date()); const prev=list[list.length-1]; const travel=minutesFromDistance(prev?.meta?.distanceHint||500); const dwell=estimateDwellMin(prev?.tags); const base=prev?.time||roundToNextSlot(new Date()); return addMinutes(base, travel+dwell); }
`,
  );
}

// 4) handleAdd を賢い開始時刻に（存在すれば置換/なければ追加）
s = s.replace(
  /const\s+handleAdd\s*=\s*useCallback\([\s\S]*?\]\);\s*/m,
  `const handleAdd = useCallback(() => {
  const newItem: Item = { time: estimateNextStartTime(items), title: "新規スポット", note: "メモ（例：入場料・予約URL・滞在目安）", tags: ["todo","new"], isMain: false, meta: { distanceHint: 0 } };
  setItems(prev => { const next=[...prev, newItem]; try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }catch{} return next; });
}, [items]);
`,
);

// 5) 並べ替え後のトースト（保存しました 1秒）
s = s.replace(/const\s+handleReorder\s*=\s*useCallback\(([\s\S]*?)\)\s*;\s*\n/, (m, body) =>
  m.includes("showToast(")
    ? m
    : m.replace(
        /\}\);\s*$/,
        `  showToast("保存しました", 1000);
});
`,
      ),
);

// 6) 共有リンク（圧縮+レガシー）＋トースト（存在しなければ追加）
if (!/const\s+handleShareLink/.test(s)) {
  s = s.replace(
    /return\s*\(/,
    `
const handleShareLink = useCallback(async () => {
  const payload = { date, items, ui: { density, showDistance } };
  const u = new URL(location.href);
  const json = JSON.stringify(payload);
  try { u.searchParams.set('plan_gz', await gzipToUrlParam(json)); } catch {}
  try { const b64 = btoa(unescape(encodeURIComponent(json))); u.searchParams.set('plan', toUrlSafeBase64(b64)); } catch {}
  const url = u.toString();
  try { await navigator.clipboard?.writeText(url); showToast("共有リンクをコピーしました"); }
  catch { prompt("共有リンクです。コピーしてください:", url); }
}, [date, items, density, showDistance]);

function downloadFile(name, text, mime="application/octet-stream"){
  const blob = new Blob([text], {type:mime}); const a=document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href), 1000);
}

const handleExportJSON = useCallback(() => {
  const obj = { date, items, ui: { density, showDistance } };
  const name = \`itinerary-\${yyyymmdd(date)}.travoru.json\`;
  downloadFile(name, JSON.stringify(obj, null, 2), "application/json");
  showToast("バックアップを保存しました");
}, [date, items, density, showDistance]);

const handleExportICS = useCallback(() => {
  const lines = []; lines.push("BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Travoru//Itinerary//JP");
  const d = (date||"").replaceAll("-","");
  (items||[]).forEach((it, idx) => {
    const t = String(it?.time||"00:00").replace(":","");
    const start = \`\${d}T\${t}00\`;
    const [hh,mm] = String(it?.time||"00:00").split(":").map(x=>parseInt(x,10));
    const endMin = (hh*60+mm)+60; const eh=String(Math.floor((endMin%1440)/60)).padStart(2,"0"); const em=String(endMin%60).padStart(2,"0");
    const end = \`\${d}T\${eh}\${em}00\`;
    lines.push("BEGIN:VEVENT", \`UID:\${d}-\${idx}@travoru\`, \`DTSTAMP:\${d}T000000\`, \`DTSTART:\${start}\`, \`DTEND:\${end}\`, \`SUMMARY:\${it?.title||"スポット"}\`, \`DESCRIPTION:\${it?.note||""}\`, "END:VEVENT");
  });
  lines.push("END:VCALENDAR");
  downloadFile(\`itinerary-\${yyyymmdd(date)}.ics\`, lines.join("\\r\\n"), "text/calendar");
  showToast("カレンダーを書き出しました");
}, [items, date]);

const handlePrint = useCallback(() => { window.print(); }, []);

return (
`,
  );
}

// 7) JSON読み込み：既存（fileInputRef/triggerImport/handleImportJSON）があれば**強化**、無ければ追加
if (/fileInputRef/.test(s)) {
  // 既存 handleImportJSON に確認ダイアログ＆トーストを注入（粗め置換）
  s = s.replace(
    /const\s+handleImportJSON[\s\S]*?=>\s*\(\s*e:[\s\S]*?\)\s*=>\s*\{([\s\S]*?)\}\s*,\s*\[[^\]]*\]\);\s*/,
    (m, body) => {
      let b = body;
      if (!/confirm\(/.test(b)) {
        b =
          `  if (!confirm("現在の行程を置き換えます。よろしいですか？")) { try{ e.target.value=""; }catch{}; return; }\n` +
          b;
      }
      if (!/showToast\(/.test(b)) {
        b = b.replace(
          /try\s*\{\s*e\.target\.value\s*=\s*"";\s*\}\s*\{\}\s*$/,
          `try { e.target.value = ""; } catch {}\n  showToast("読み込み完了");`,
        );
      }
      return `const handleImportJSON = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {\n${b}\n}, [setItems, setDate, setDensity, setShowDistance]);\n`;
    },
  );
} else {
  s = s.replace(
    /return\s*\(/,
    `
const fileInputRef = useRef<HTMLInputElement|null>(null);
const triggerImport = () => fileInputRef.current?.click();
const handleImportJSON = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]; if (!file) return;
  if (!confirm("現在の行程を置き換えます。よろしいですか？")) { try{ e.target.value=""; }catch{}; return; }
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result));
      if (Array.isArray(data?.items)) { setItems(data.items as Item[]); try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(data.items)); }catch{} }
      if (typeof data?.date === "string") { setDate(data.date); try{ localStorage.setItem(STORAGE_KEY_DATE, data.date); }catch{} }
      if (data?.ui) {
        const pd = parseDensity(data.ui.density ?? null); if (pd) { setDensity(pd); try{ localStorage.setItem(STORAGE_KEY_UI_DENSITY, pd); }catch{} }
        if (typeof data.ui.showDistance === "boolean") { setShowDistance(!!data.ui.showDistance); try{ localStorage.setItem(STORAGE_KEY_UI_DIST, data.ui.showDistance?"1":"0"); }catch{} }
      }
      showToast("読み込み完了");
    } catch { alert("JSONの読み込みに失敗しました。ファイルを確認してください。"); }
    try { e.target.value = ""; } catch {}
  };
  reader.readAsText(file);
}, [setItems, setDate, setDensity, setShowDistance]);

return (
`,
  );
}

// 8) ツールバーに … メニュー（なければ）を追加＆既存ボタンを整理
if (!/name="more-menu"/.test(s)) {
  s = s.replace(/<div className="mb-4[^"]*">([\s\S]*?)<\/div>/, (m, inner) =>
    m.replace(
      inner,
      `        <button onClick={handleReset} className="rounded-lg border px-3 py-1 text-sm hover:bg-black/5">Reset</button>
        <button onClick={handleShareLink} className="rounded-lg border px-3 py-1 text-sm hover:bg-black/5">共有リンク</button>
        <details className="relative" name="more-menu">
          <summary className="select-none rounded-lg border px-3 py-1 text-sm hover:bg-black/5 cursor-pointer">⋯</summary>
          <div className="absolute z-20 mt-2 w-64 rounded-xl border border-white/15 bg-white/90 dark:bg-black/85 backdrop-blur p-2 text-sm shadow-xl">
            <button onClick={handleExportJSON} className="w-full text-left rounded px-3 py-2 hover:bg-black/5">バックアップ（上級者向け／JSON）</button>
            <button onClick={typeof triggerImport!=="undefined" ? triggerImport : (()=>document.getElementById('json-import-file')?.click())} className="w-full text-left rounded px-3 py-2 hover:bg-black/5">JSON読み込み（上級者向け）</button>
            <div className="my-1 h-px bg-black/10 dark:bg-white/10" />
            <button onClick={handleExportICS} className="w-full text-left rounded px-3 py-2 hover:bg-black/5">カレンダーに追加（.ics書き出し）</button>
            <button onClick={handlePrint} className="w-full text-left rounded px-3 py-2 hover:bg-black/5">PDF / 印刷</button>
            <button disabled title="次のステップで実装します" className="w-full text-left rounded px-3 py-2 opacity-50 cursor-not-allowed">画像として書き出し（準備中）</button>
          </div>
        </details>
        `,
    ),
  );
}

// 9) 隠しinput（無ければ）＋トースト描画（末尾）
if (!/id="json-import-file"/.test(s)) {
  s = s.replace(
    /<\/main>\s*\)\s*;\s*}\s*$/m,
    `
        <input id="json-import-file" ref={typeof fileInputRef!=="undefined"?fileInputRef:undefined} type="file" accept=".json,.travoru.json,application/json" className="hidden" onChange={typeof handleImportJSON!=="undefined"?handleImportJSON:undefined} />
      </main>
      {toast ? (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 rounded-xl bg-black/80 text-white text-sm px-4 py-2 shadow-lg z-50">{toast}</div>
      ) : null}
    );
}
`,
  );
}

// 10) 起動時：?plan_gz / ?plan を自動復元（未設定なら）
if (!/sp\.get\("plan_gz"\)/.test(s)) {
  s = s.replace(
    /useEffect\([\s\S]*?\[\]\);\s*\n/,
    (m) =>
      m +
      `
useEffect(() => {
  (async () => {
    try{
      const gz = sp.get("plan_gz");
      if (gz) {
        const text = await ungzipFromUrlParam(gz);
        if (text) {
          const data = JSON.parse(text);
          if (Array.isArray(data?.items)) setItems(data.items as Item[]);
          if (typeof data?.date === "string") setDate(data.date);
          const pd = parseDensity(data?.ui?.density ?? null); if (pd) setDensity(pd);
          if (typeof data?.ui?.showDistance === "boolean") setShowDistance(!!data.ui.showDistance);
          return;
        }
      }
      const plan = sp.get("plan");
      if (plan) {
        const json = decodeURIComponent(escape(atob(fromUrlSafeBase64(plan))));
        const data = JSON.parse(json);
        if (Array.isArray(data?.items)) setItems(data.items as Item[]);
        if (typeof data?.date === "string") setDate(data.date);
        const pd = parseDensity(data?.ui?.density ?? null); if (pd) setDensity(pd);
        if (typeof data?.ui?.showDistance === "boolean") setShowDistance(!!data.ui.showDistance);
      }
    }catch{}
  })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
`,
  );
}

fs.writeFileSync(f, s);
console.log(
  "✅ DemoClient: 共有リンク(圧縮+トースト)/JSON入出力(.travoru.json)/ICS/印刷/トースト/賢い開始時刻/並べ替えトースト/…メニュー を適用",
);

// 11) 印刷CSS（globals.css に一度だけ）
const css = "app/globals.css";
let g = fs.readFileSync(css, "utf8");
if (!/@@print_patch@@/.test(g)) {
  g += `

/* @@print_patch@@ */
@media print {
  body { background: #fff !important; -webkit-print-color-adjust: exact; }
  .no-print { display: none !important; }
  .shadow-soft, .shadow-xl { box-shadow: none !important; }
  .border-white\\/20, .border-white\\/15 { border-color: #ddd !important; }
}
`;
  fs.writeFileSync(css, g);
  console.log("✅ globals.css: 印刷スタイルを追加しました");
}
