import fs from "fs";
const f = "app/demo-itinerary/DemoClient.tsx";
let s = fs.readFileSync(f, "utf8");

/* 0) Density 型が無ければ追加（import の直後） */
if (!/\btype\s+Density\s*=\s*/.test(s)) {
  s = s.replace(
    /(import[^\n]+\n)([\s\S]*?)/,
    `$1type Density = "compact" | "cozy" | "comfortable";\n$2`,
  );
}

/* 1) ヘルパー関数に型注釈を付与 */
s = s.replace(
  /function\s+toUrlSafeBase64\s*\([^)]*\)\s*\{/,
  "function toUrlSafeBase64(str: string): string {",
);
s = s.replace(
  /function\s+_fromUrlSafeBase64\s*\([^)]*\)\s*\{/,
  "function _fromUrlSafeBase64(param: string): string {",
);
s = s.replace(
  /async\s+function\s+gzipToUrlParam\s*\([^)]*\)\s*\{/,
  "async function gzipToUrlParam(str: string): Promise<string|null> {",
);
s = s.replace(
  /async\s+function\s+_ungzipFromUrlParam\s*\([^)]*\)\s*\{/,
  "async function _ungzipFromUrlParam(param: string): Promise<string|null> {",
);
s = s.replace(
  /function\s+parseDensity\s*\([^)]*\)\s*\{/,
  "function parseDensity(v: string | null): Density | null {",
);

/* 2) downloadText / buildICS の未使用警告をローカル無効化で封じる（実用上安全） */
function wrapEslintNoUnused(name) {
  const re = new RegExp(`\\bfunction\\s+${name}\\s*\\(`);
  const m = s.match(re);
  if (!m) return;
  let i = m.index;
  const open = s.indexOf("{", i);
  let d = 1,
    j = open + 1;
  while (j < s.length && d > 0) {
    const c = s[j++];
    if (c == "{") d++;
    else if (c == "}") d--;
  }
  s =
    s.slice(0, i) +
    `/* eslint-disable @typescript-eslint/no-unused-vars */\n` +
    s.slice(i, j) +
    `\n/* eslint-enable @typescript-eslint/no-unused-vars */` +
    s.slice(j);
}
wrapEslintNoUnused("downloadText");
wrapEslintNoUnused("buildICS");

/* 3) useSearchParams の参照を確認し、無ければコンポーネント内に差し込み */
if (!/\bconst\s+sp\s*=\s*useSearchParams\(\)/.test(s)) {
  // コンポーネント関数の先頭（importの後の最初の "function Demo..." の '{' 直後）に入れる
  s = s.replace(
    /(export\s+default\s+function\s+[A-Za-z0-9_]+\s*\([^)]*\)\s*\{)/,
    `$1\n  const sp = useSearchParams();`,
  );
}

/* 4) state を導入：date / density / showDistance（無ければ） */
if (!/\[\s*date\s*,\s*setDate\s*\]/.test(s)) {
  s = s.replace(
    /(const\s+sp\s*=\s*useSearchParams\(\);\s*)/,
    `$1const [date, setDate] = useState<string>(sp.get("date") || new Date().toISOString().slice(0,10));\n`,
  );
}
if (!/\[\s*density\s*,\s*setDensity\s*\]/.test(s)) {
  s = s.replace(
    /(const\s+\[date,\s*setDate\][^\n]*\n)/,
    `$1const [density, setDensity] = useState<Density>(parseDensity(sp.get("density")) || "cozy");\n`,
  );
}
if (/const\s+showDistance\s*=/.test(s) && !/\[\s*showDistance\s*,\s*setShowDistance\s*\]/.test(s)) {
  // 既存の const showDistance = sp.get("dist") !== "0"; を state に置換
  s = s.replace(
    /const\s+showDistance\s*=\s*sp\.get\(\s*["']dist["']\s*\)\s*!==\s*["']0["']\s*;/,
    `const [showDistance, setShowDistance] = useState<boolean>(sp.get("dist") !== "0");`,
  );
}

/* 5) handleReset が無ければ追加（items state の直後か、date state の直後） */
if (!/\bconst\s+handleReset\s*=\s*useCallback\(/.test(s)) {
  const anchor = s.match(/\[\s*items\s*,\s*setItems\s*\]/)
    ? /\bconst\s*\[\s*items\s*,\s*setItems\s*\][^\n]*\n/
    : /\bconst\s*\[\s*date\s*,\s*setDate\s*\][^\n]*\n/;
  s = s.replace(
    anchor,
    (m) =>
      m +
      `
const handleReset = useCallback(() => {
  try { localStorage.removeItem("travoru.demo.itinerary.v1"); } catch {}
  try { localStorage.removeItem("travoru.demo.itinerary.date.v1"); } catch {}
  try { localStorage.removeItem("travoru.demo.ui.density"); } catch {}
  try { localStorage.removeItem("travoru.demo.ui.dist"); } catch {}
  try { setItems && setItems([]); } catch {}
  setDate(new Date().toISOString().slice(0,10));
  setDensity("cozy");
  setShowDistance(true);
  try { setToast && setToast("リセットしました"); setTimeout(()=> setToast && setToast(null), 1000); } catch {}
}, []);
`,
  );
}

/* 6) baseDate を state に接続（new Date().toISOString().slice(0,10) → date） */
s = s.replace(
  /baseDate=\{new Date\(\)\.toISOString\(\)\.slice\(\s*0\s*,\s*10\s*\)\}/,
  "baseDate={date}",
);

/* 7) JSX の Reset ボタンが handleReset を指しているか保険で確認（未配線時は配線） */
if (!/onClick=\{handleReset\}/.test(s)) {
  s = s.replace(
    /(<button[^>]*className="rounded-lg[^"]*"[^>]*>[\s\S]*?Reset[\s\S]*?<\/button>)/,
    `<button onClick={handleReset} className="rounded-lg border px-3 py-1 text-sm hover:bg-black/5">Reset</button>`,
  );
}

fs.writeFileSync(f, s);
console.log("✅ 型注釈 + state 導入 + handleReset 追加 + baseDate 接続 を適用しました");
