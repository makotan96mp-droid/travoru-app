import fs from "fs";

const f = "app/demo-itinerary/DemoClient.tsx";
let s = fs.readFileSync(f, "utf8");

// 0) react import に useCallback/useState を必ず含める
s = s.replace(/import\s+\{\s*([^}]+)\}\s+from\s+['"]react['"];?/, (m, inner) => {
  const set = new Set(
    inner
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean)
      .filter(Boolean),
  );
  ["useCallback", "useState"].forEach((x) => set.add(x));
  return `import { ${Array.from(set).join(", ")} } from "react";`;
});

// 1) コンポーネント関数の開始・終了を特定（export default function ... の波括弧マッチ）
function findFuncBody(str) {
  let m = str.match(/export\s+default\s+function\s+[A-Za-z0-9_]*\s*\([^)]*\)\s*\{/);
  if (!m) m = str.match(/function\s+[A-Za-z0-9_]+\s*\([^)]*\)\s*\{/); // 念のため
  if (!m) throw new Error("コンポーネント関数の開始が見つかりません");
  const start = m.index + m[0].length - 1; // '{' の位置
  let i = start,
    d = 0;
  while (i < str.length) {
    const ch = str[i++];
    if (ch === "{") d++;
    else if (ch === "}") {
      d--;
      if (d === 0) return { open: start, close: i };
    }
  }
  throw new Error("コンポーネント関数の終端が見つかりません");
}

const body = findFuncBody(s);
const head = s.slice(0, body.open + 1);
let mid = s.slice(body.open + 1, body.close - 1);
const tail = s.slice(body.close - 1);

// 2) mid 内の handleShareLink = useCallback(...) を厳密削除
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
  // セミコロンまで吸収
  while (i < src.length && /\s/.test(src[i])) i++;
  if (src[i] === ";") i++;
  return src.slice(0, idx) + src.slice(i);
}
mid = removeUseCallbackBlock(mid, "handleShareLink");

// 3) toast ステートが無ければ items state の直後に追加
if (!/\[\s*toast\s*,\s*setToast\s*\]/.test(mid)) {
  mid = mid.replace(
    /const\s*\[\s*items\s*,\s*setItems\s*\][\s\S]*?\n/,
    (m) => m + `  const [toast, setToast] = useState<string | null>(null);\n`,
  );
}

// 4) 最後の "return (" の直前に新しい handleShareLink を挿入
const insertAt = mid.lastIndexOf("return (");
if (insertAt < 0) throw new Error("関数内の return( が見つかりません");
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

// 5) 再結合
s = head + mid + tail;

fs.writeFileSync(f, s);
console.log("✅ handleShareLink を関数本体に再生成／余計な断片を除去しました");
