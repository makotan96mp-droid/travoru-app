import fs from "fs";

const f = "app/demo-itinerary/DemoClient.tsx";
let s = fs.readFileSync(f, "utf8");

/* 1) 重複関数 toUrlSafeBase64 / fromUrlSafeBase64 を後ろ側だけ削除 */
function cutBlockAt(fnName) {
  const occ = [...s.matchAll(new RegExp(`function\\s+${fnName}\\s*\\(`, "g"))].map((m) => m.index);
  if (occ.length <= 1) return;
  function rangeFrom(start) {
    const open = s.indexOf("{", start);
    if (open < 0) return null;
    let d = 1,
      i = open + 1;
    while (i < s.length && d > 0) {
      const c = s[i++];
      if (c == "{") d++;
      else if (c == "}") d--;
    }
    return [start, i];
  }
  for (let k = occ.length - 1; k >= 1; k--) {
    const r = rangeFrom(occ[k]);
    if (!r) continue;
    s = s.slice(0, r[0]) + s.slice(r[1]);
  }
}
cutBlockAt("toUrlSafeBase64");
cutBlockAt("fromUrlSafeBase64");

/* 2) 使われていないハンドラ（handleToday / handleExport）を、参照が無ければ削除 */
function removeCallbackIfUnused(varName) {
  const decl = new RegExp(`const\\s+${varName}\\s*=\\s*useCallback\\(`);
  const used = new RegExp(`\\b${varName}\\b(?!\\s*=\\s*useCallback)`).test(s);
  if (!decl.test(s) || used) return;
  // ブロック終端まで削除
  const start = s.search(decl);
  let i = s.indexOf("(", start); // useCallback(
  let depth = 1,
    j = i + 1,
    end = -1;
  while (j < s.length && depth > 0) {
    const ch = s[j++];
    if (ch === "(") depth++;
    else if (ch === ")") {
      depth--;
      if (depth === 0) end = j;
    }
  }
  // 末尾の ; を吸収
  while (end < s.length && /\s/.test(s[end])) end++;
  if (s[end] === ";") end++;
  s = s.slice(0, start) + s.slice(end);
}
removeCallbackIfUnused("handleToday");
removeCallbackIfUnused("handleExport");

/* 3) yyyymmdd が呼ばれていなければ削除（ICS 実装前の警告回避） */
if (!/\byyyymmdd\(/.test(s)) {
  const m = s.match(/function\s+yyyymmdd\s*\([^)]*\)\s*\{/);
  if (m) {
    let i = m.index + m[0].length,
      d = 1;
    while (i < s.length && d > 0) {
      const c = s[i++];
      if (c == "{") d++;
      else if (c == "}") d--;
    }
    s = s.slice(0, m.index) + s.slice(i);
  }
}

/* 4) 共有リンクが gzip を使うように配線（gzipToUrlParam の未使用を解消）
      - レガシー互換で plan（非圧縮）も併記
      - トースト 2秒表示（setToastがある場合だけ） */
s = s.replace(/const\s+handleShareLink\s*=\s*useCallback\([\s\S]*?\)\s*;\s*/m, (old) => {
  // 既に gzip を使っていればそのまま
  if (/gzipToUrlParam\(/.test(old)) return old;
  return `const handleShareLink = useCallback(async () => {
  const payload = { date, items, ui: { density, showDistance } };
  const json = JSON.stringify(payload);
  let gzipParam = null;
  try { gzipParam = await gzipToUrlParam(json); } catch {}
  const u = new URL(location.href);
  if (gzipParam) u.searchParams.set('plan_gz', gzipParam);
  u.searchParams.set('plan', toUrlSafeBase64(json)); // 互換用
  const url = u.toString();
  try {
    await navigator.clipboard?.writeText(url);
    try { setToast && setToast("共有リンクをコピーしました"); setTimeout(()=>setToast && setToast(null), 2000); } catch {}
  } catch {
    prompt("共有リンクです。コピーしてください:", url);
  }
}, [date, items, density, showDistance]);\n`;
});

/* 5) 余計な未使用 import（useRef など）は別で直したのでそのまま。 */

fs.writeFileSync(f, s);
console.log("✅ 重複ヘルパー削除・gzip配線・未使用ハンドラ除去を適用しました");
