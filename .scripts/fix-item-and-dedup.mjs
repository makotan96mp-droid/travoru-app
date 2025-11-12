import fs from "fs";
const f = "app/demo-itinerary/DemoClient.tsx";
let s = fs.readFileSync(f, "utf8");

// 1) /* @@moved_fns_top:start @@ */ の直前で type Item を閉じる（}; が無ければ挿入）
const mark = "/* @@moved_fns_top:start @@ */";
const markIdx = s.indexOf(mark);
if (markIdx !== -1) {
  const before = s.slice(0, markIdx);
  const itemIdx = before.lastIndexOf("type Item");
  if (itemIdx !== -1) {
    const hasClose = before.slice(itemIdx).includes("};");
    if (!hasClose) {
      s = s.slice(0, markIdx) + "};\n\n" + s.slice(markIdx);
    }
  }
}

// 2) React import の重複を除去（; の有無どちらでも）
let seenReact = false;
s = s
  .split("\n")
  .filter((line) => {
    const isReact = /^\s*import\s+\{[^}]*\}\s+from\s+["']react["']\s*;?\s*$/.test(line);
    if (isReact) {
      if (seenReact) return false;
      seenReact = true;
    }
    return true;
  })
  .join("\n");

// 3) downloadText / buildICS の重複定義を1つに統一（最後から削る）
function removeDup(funcName) {
  const re = new RegExp(`\\bfunction\\s+${funcName}\\s*\\(`, "g");
  const idxs = [];
  let m;
  while ((m = re.exec(s))) idxs.push(m.index);
  if (idxs.length <= 1) return; // 重複なし
  for (let k = idxs.length - 1; k >= 1; k--) {
    const i = idxs[k];
    let j = s.indexOf("{", i);
    if (j < 0) continue;
    let depth = 1,
      p = j + 1;
    while (p < s.length && depth > 0) {
      const ch = s[p++];
      if (ch === "{") depth++;
      else if (ch === "}") depth--;
    }
    s = s.slice(0, i) + s.slice(p);
  }
}
removeDup("downloadText");
removeDup("buildICS");

// 4) 余計な空行の整理
s = s.replace(/\n{3,}/g, "\n\n");

fs.writeFileSync(f, s);
console.log("✅ Closed type Item before moved block, deduped react import & functions");
