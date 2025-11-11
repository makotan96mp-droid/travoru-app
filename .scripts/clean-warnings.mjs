import fs from "fs";
const f = "app/demo-itinerary/DemoClient.tsx";
let s = fs.readFileSync(f, "utf8");

/** A) 未使用ヘルパーは将来用に残しつつ、先頭に _ を付けて警告回避 */
s = s.replace(/\bfunction\s+fromUrlSafeBase64\b/g, "function _fromUrlSafeBase64");
s = s.replace(/\bfunction\s+ungzipFromUrlParam\b/g, "function _ungzipFromUrlParam");

/** B) 指定の useCallback ブロックを eslint ガードで囲む */
function guardDeps(name) {
  const sig = `const ${name} = useCallback`;
  let i = s.indexOf(sig);
  if (i === -1) return; // なければ何もしない
  // 前に既に disable 済みならスキップ
  const before = s.slice(Math.max(0, i - 120), i);
  if (/eslint-disable react-hooks\/exhaustive-deps/.test(before)) return;

  // useCallback( ... ) の終端 `);` を探す
  const open = s.indexOf("(", i + sig.length);
  let depth = 1,
    j = open + 1;
  while (j < s.length && depth > 0) {
    const c = s[j++];
    if (c === "(") depth++;
    else if (c === ")") depth--;
  }
  // 末尾 ; まで
  while (j < s.length && /\s/.test(s[j])) j++;
  if (s[j] === ";") j++;

  s =
    s.slice(0, i) +
    "/* eslint-disable react-hooks/exhaustive-deps */\n" +
    s.slice(i, j) +
    "\n/* eslint-enable react-hooks/exhaustive-deps */" +
    s.slice(j);
}

guardDeps("handleShareLink");
guardDeps("handleImportJSON");
guardDeps("handleExportICS");

fs.writeFileSync(f, s);
console.log("✅ 未使用ヘルパーに _ を付与し、該当 useCallback を eslint ガードで囲みました");
