import fs from "fs";

const f = "app/demo-itinerary/DemoClient.tsx";
let s = fs.readFileSync(f, "utf8");

/* A) react import に必要フックを揃える（不足時のみ追加） */
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

/* B) const handleAdd = useCallback(...) ブロックを外側の ) まで丸ごと置換 */
const sig = "const handleAdd = useCallback";
let i = s.indexOf(sig);
if (i !== -1) {
  const open = s.indexOf("(", i + sig.length);
  if (open === -1) throw new Error("useCallback の '(' が見つかりません");
  let depth = 1,
    j = open + 1,
    endParen = -1;
  while (j < s.length && depth > 0) {
    const ch = s[j++];
    if (ch === "(") depth++;
    else if (ch === ")") {
      depth--;
      if (depth === 0) endParen = j - 1;
    }
  }
  if (endParen === -1) throw new Error("useCallback の対応 ')' が見つかりません");
  let k = endParen + 1; // セミコロンを含めて進める
  while (k < s.length && /\s/.test(s[k])) k++;
  if (s[k] === ";") k++;

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

  s = s.slice(0, i) + repl + s.slice(k);
} else {
  // 無い場合は return( の直前に追加
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
}, []);\n\n`;
  s = s.replace(/return\s*\(/, repl + "return (");
}

fs.writeFileSync(f, s);
console.log("✅ handleAdd: useCallback ブロックを安全に再生成しました");
