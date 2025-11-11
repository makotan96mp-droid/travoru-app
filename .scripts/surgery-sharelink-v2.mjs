import fs from "fs";

const f = "app/demo-itinerary/DemoClient.tsx";
let s = fs.readFileSync(f, "utf8");

// 0) react importに useCallback/useState を必ず含める
s = s.replace(/import\s+\{\s*([^}]+)\}\s+from\s+['"]react['"];?/, (m, inner) => {
  const set = new Set(
    inner
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean),
  );
  ["useCallback", "useState"].forEach((x) => set.add(x));
  return `import { ${Array.from(set).join(", ")} } from "react";`;
});

// 1) コンポーネント関数 本体の波括弧範囲を特定
function findFuncBody(str) {
  let m = str.match(/export\s+default\s+function\s+[A-Za-z0-9_]*\s*\([^)]*\)\s*\{/);
  if (!m) m = str.match(/function\s+[A-Za-z0-9_]+\s*\([^)]*\)\s*\{/);
  if (!m) throw new Error("コンポーネント関数開始が見つかりません");
  const open = m.index + m[0].length - 1;
  let i = open,
    d = 0;
  while (i < str.length) {
    const ch = str[i++];
    if (ch === "{") d++;
    else if (ch === "}") {
      d--;
      if (d === 0) return { open, close: i };
    }
  }
  throw new Error("関数終端が見つかりません");
}
const body = findFuncBody(s);
const head = s.slice(0, body.open + 1);
let mid = s.slice(body.open + 1, body.close - 1);
const tail = s.slice(body.close - 1);

// 2) mid内の handleShareLink = useCallback(...) を厳密削除（;まで）
function removeUseCallbackBlock(src, name) {
  const sig = `const ${name} = useCallback`;
  let idx = src.indexOf(sig);
  if (idx < 0) return src;
  const open = src.indexOf("(", idx + sig.length);
  if (open < 0) return src;
  let d = 1,
    i = open + 1;
  while (i < src.length && d > 0) {
    const ch = src[i++];
    if (ch === "(") d++;
    else if (ch === ")") d--;
  }
  while (i < src.length && /\s/.test(src[i])) i++;
  if (src[i] === ";") i++;
  return src.slice(0, idx) + src.slice(i);
}
mid = removeUseCallbackBlock(mid, "handleShareLink");

// 3) 迷子の「}, [date, items, density, showDistance]);」行を掃除
mid = mid.replace(
  /\n\s*\},\s*\[\s*date\s*,\s*items\s*,\s*density\s*,\s*showDistance\s*\]\s*\);\s*\n/g,
  "\n",
);

// 4) toast state が無ければ items の直後に追加
if (!/\[\s*toast\s*,\s*setToast\s*\]/.test(mid)) {
  mid = mid.replace(
    /const\s*\[\s*items\s*,\s*setItems\s*\][\s\S]*?\n/,
    (m) => m + `  const [toast, setToast] = useState<string | null>(null);\n`,
  );
}

// 5) 最後の「return (」直前に新しい handleShareLink を挿入（改行やスペースに強い）
let insertAt = -1;
{
  const re = /return\s*\(/g;
  let m;
  while ((m = re.exec(mid)) !== null) insertAt = m.index;
}
if (insertAt < 0)
  throw new Error("関数内の return( が見つかりません（改行含む表記にも対応済みのはず）");

const shareBlock = `
const handleShareLink = useCallback(async () => {
  const payload = { date, items, ui: { density, showDistance } };
  const json = JSON.stringify(payload);
  let gzipParam = null;
  try { gzipParam = await (typeof gzipToUrlParam!=="undefined" ? gzipToUrlParam(json) : null); } catch {}
  const u = new URL(location.href);
  if (gzipParam) u.searchParams.set("plan_gz", gzipParam); // 圧縮版
  u.searchParams.set("plan", toUrlSafeBase64(json));       // 非圧縮（互換）
  const url = u.toString();
  try {
    await navigator.clipboard?.writeText(url);
    try { setToast("共有リンクをコピーしました"); setTimeout(()=>setToast(null), 2000); } catch {}
  } catch {
    prompt("共有リンクです。コピーしてください:", url);
  }
}, [date, items, density, showDistance]);

`;

mid = mid.slice(0, insertAt) + shareBlock + mid.slice(insertAt);

// 6) 再結合して保存
s = head + mid + tail;
fs.writeFileSync(f, s);
console.log("✅ sharelinkを再生成し、迷子の閉じカッコを除去しました");
