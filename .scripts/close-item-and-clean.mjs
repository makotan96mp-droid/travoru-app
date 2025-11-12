import fs from "fs";
const f = "app/demo-itinerary/DemoClient.tsx";
let s = fs.readFileSync(f, "utf8");

// 1) /* @@moved_fns_top:start @@ */ の直前で type Item を閉じる（未閉ならだけ）
const MARK = "/* @@moved_fns_top:start @@ */";
const mi = s.indexOf(MARK);
if (mi !== -1) {
  const before = s.slice(0, mi);
  const tIdx = before.lastIndexOf("type Item");
  if (tIdx !== -1) {
    const seg = before.slice(tIdx, before.length);
    if (!/};\s*$/.test(seg.trim())) {
      s = s.slice(0, mi) + "};\n\n" + s.slice(mi);
      console.log("✅ inserted '};' to close type Item");
    } else {
      console.log("ℹ️ type Item already closed");
    }
  }
}

// 2) React import を先頭の1本だけに正規化
let seenReact = false;
s = s
  .split("\n")
  .filter((ln, i) => {
    const isReact = /^\s*import\s+\{[^}]*\}\s+from\s+["']react["']\s*;?\s*$/.test(ln);
    if (isReact) {
      if (seenReact) return false;
      seenReact = true;
    }
    return true;
  })
  .join("\n");

// 3) 余計な ("use client"); が中腹に混ざっていたら除去（先頭は保持）
s = s.replace(/\n\("use client"\);\n/g, "\n");

// 4) downloadText/buildICS の重複があれば後方を削除
function dedup(func) {
  const re = new RegExp(`\\bfunction\\s+${func}\\s*\\(`, "g");
  const idxs = [];
  let m;
  while ((m = re.exec(s))) idxs.push(m.index);
  for (let k = idxs.length - 1; k >= 1; k--) {
    const i = idxs[k];
    let j = s.indexOf("{", i);
    if (j < 0) continue;
    let d = 1,
      p = j + 1;
    while (p < s.length && d > 0) {
      const ch = s[p++];
      if (ch === "{") d++;
      else if (ch === "}") d--;
    }
    s = s.slice(0, i) + s.slice(p);
  }
}
dedup("downloadText");
dedup("buildICS");

// 5) 余計な空行の整理
s = s.replace(/\n{3,}/g, "\n\n");

fs.writeFileSync(f, s);
console.log("✅ item close + import dedup + helpers dedup 完了");
