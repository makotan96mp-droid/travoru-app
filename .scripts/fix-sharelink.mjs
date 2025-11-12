import fs from "fs";

const f = "app/demo-itinerary/DemoClient.tsx";
let s = fs.readFileSync(f, "utf8");

/* A) react import に useCallback/useState を確実に含める */
s = s.replace(/import\s+\{\s*([^}]+)\}\s+from\s+["']react["'];/, (m, inner) => {
  const set = new Set(
    inner
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean),
  );
  ["useCallback", "useState"].forEach((x) => set.add(x));
  return `import { ${Array.from(set).join(", ")} } from "react";`;
});

/* B) toast ステートが無ければ追加（items の useState 直後を目安） */
if (!/\[\s*toast\s*,\s*setToast\s*\]/.test(s)) {
  s = s.replace(
    /const\s*\[\s*items\s*,\s*setItems\s*\][\s\S]*?\n/,
    (m) => m + `  const [toast, setToast] = useState<string | null>(null);\n`,
  );
}

/* C) 既存の handleShareLink = useCallback(...) を丸ごと削除（; まで） */
function removeUseCallback(name) {
  const sig = `const ${name} = useCallback`;
  let i = s.indexOf(sig);
  if (i === -1) return;
  let open = s.indexOf("(", i + sig.length);
  if (open === -1) return;
  let depth = 1,
    j = open + 1;
  while (j < s.length && depth > 0) {
    const ch = s[j++];
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
  }
  // j は ')' の次の位置。末尾の空白＋セミコロンを吸収
  while (j < s.length && /\s/.test(s[j])) j++;
  if (s[j] === ";") j++;
  s = s.slice(0, i) + s.slice(j);
}
removeUseCallback("handleShareLink");

/* D) 新しい handleShareLink を return( の直前に挿入（gzip + 非圧縮 併記・2秒トースト） */
const block = `
const handleShareLink = useCallback(async () => {
  const payload = { date, items, ui: { density, showDistance } };
  const json = JSON.stringify(payload);
  let gzipParam = null;
  try { gzipParam = await (typeof gzipToUrlParam!=="undefined" ? gzipToUrlParam(json) : null); } catch {}
  const u = new URL(location.href);
  if (gzipParam) u.searchParams.set("plan_gz", gzipParam); // 圧縮版
  u.searchParams.set("plan", toUrlSafeBase64(json));       // 互換用（非圧縮）
  const url = u.toString();
  try {
    await navigator.clipboard?.writeText(url);
    try { setToast("共有リンクをコピーしました"); setTimeout(()=>setToast(null), 2000); } catch {}
  } catch {
    prompt("共有リンクです。コピーしてください:", url);
  }
}, [date, items, density, showDistance]);
`;

s = s.replace(/return\s*\(/, `${block}\nreturn (`);

fs.writeFileSync(f, s);
console.log("✅ handleShareLink を安全に再生成・配線しました");
