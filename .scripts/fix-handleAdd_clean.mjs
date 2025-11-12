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
  ["useState", "useEffect", "useCallback"].forEach((x) => set.add(x));
  return `import { ${Array.from(set).join(", ")} } from "react";`;
});

/* B) handleAdd を useCallback 丸ごと安全置換（外側の括弧を深さ追跡で特定） */
const sig = "const handleAdd = useCallback";
function findEndOfUseCallback(str, startIdx) {
  const open = str.indexOf("(", startIdx + sig.length);
  if (open === -1) return null;
  let depth = 1,
    i = open + 1,
    endParen = -1;
  while (i < str.length && depth > 0) {
    const ch = str[i++];
    if (ch === "(") depth++;
    else if (ch === ")") {
      depth--;
      if (depth === 0) endParen = i - 1;
    }
  }
  if (endParen === -1) return null;
  let k = endParen + 1;
  while (k < str.length && /\s/.test(str[k])) k++;
  if (str[k] === ";") k++;
  return { open, end: k };
}

let pos = s.indexOf(sig);
const repl = `const handleAdd = useCallback(() => {
  const newItem: Item = {
    time: roundToNextSlot(new Date()),
    title: "新規スポット",
    note: "メモ（例：入場料・予約URL・滞在目安）",
    tags: ["todo","new"],
    isMain: false,
    meta: { distanceHint: 0 }
  };
  setItems(prev => {
    const next = [...prev, newItem];
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
    return next;
  });
}, []);`;

if (pos !== -1) {
  const rng = findEndOfUseCallback(s, pos);
  if (!rng) throw new Error("useCallback の終端が見つかりません");
  s = s.slice(0, pos) + repl + s.slice(rng.end);
} else {
  s = s.replace(/return\s*\(/, repl + "\n\nreturn (");
}

/* C) 迷子の `} catch {}` を handleAdd ブロック“の後だけ”掃除 */
pos = s.indexOf(sig);
const rng2 = pos !== -1 ? findEndOfUseCallback(s, pos) : null;
if (rng2) {
  const after = s.slice(rng2.end);
  const cleaned = after.replace(/^\s*\}\s*catch\s*\{\s*\}\s*/, ""); // 直後にいる迷子を除去
  s = s.slice(0, rng2.end) + cleaned;
}

/* D) 念のため：handleAdd ブロック“以外”にある孤立 `} catch {}` を軽くケア
   - 先頭〜handleAdd前 と handleAdd後〜末尾 からは孤立catchを除去 */
if (rng2) {
  const before = s.slice(0, pos).replace(/\}\s*catch\s*\{\s*\}\s*/g, "");
  const inside = s.slice(pos, rng2.end); // 正しい try/catch を含むので触らない
  const after2 = s.slice(rng2.end).replace(/\}\s*catch\s*\{\s*\}\s*/g, "");
  s = before + inside + after2;
}

fs.writeFileSync(f, s);
console.log("✅ handleAdd 置換＋迷子 catch をクリーンしました");
