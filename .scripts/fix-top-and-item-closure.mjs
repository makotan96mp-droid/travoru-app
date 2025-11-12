import fs from "fs";
const f = "app/demo-itinerary/DemoClient.tsx";
let s = fs.readFileSync(f, "utf8");

/* 0) "use client" を先頭に1回だけ保証 */
s = s.replace(/^\s*"use client";\s*/m, ""); // どこかにあるものをいったん除去
s = `"use client";\n` + s; // 先頭に付け直す

/* 1) 変な import 行（from 無し）を除去、react import を1本に正規化 */
s = s
  .split("\n")
  .filter((l) => !/^import\s+\{[^}]+\}\s*$/.test(l))
  .join("\n");
const reactImport = /import\s+\{([^}]*)\}\s+from\s+["']react["'];?/;
if (!reactImport.test(s)) {
  s = s.replace(
    /^"use client";\s*\n/,
    (m) => m + 'import { useState, useEffect, useCallback, useRef } from "react";\n',
  );
} else {
  s = s.replace(reactImport, (m, inner) => {
    const set = new Set(
      inner
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
    );
    ["useState", "useEffect", "useCallback", "useRef"].forEach((x) => set.add(x));
    return `import { ${Array.from(set).join(", ")} } from "react";`;
  });
}
/* react import 複数行があれば先頭だけ残す */
let seenReact = false;
s = s
  .split("\n")
  .filter((line) => {
    const isReact = /^import\s+\{[^}]+\}\s+from\s+["']react["'];?/.test(line);
    if (isReact) {
      if (seenReact) return false;
      seenReact = true;
    }
    return true;
  })
  .join("\n");

/* 2) type Item を moved_fns_top の start 直前で確実に閉じる */
const startMark = "/* @@moved_fns_top:start @@ */";
const endMark = "/* @@moved_fns_top:end @@ */";
const ms = s.indexOf(startMark);
if (ms !== -1) {
  const ti = s.lastIndexOf("type Item", ms);
  if (ti !== -1) {
    const between = s.slice(ti, ms);
    if (!/};\s*$/.test(between.trim())) {
      s = s.slice(0, ms) + "};\n\n" + s.slice(ms);
    }
  }
  /* 3) end マーカー直後 2 行以内に迷子の `};` があれば除去 */
  const me = s.indexOf(endMark, ms);
  if (me !== -1) {
    s = s.replace(/(\/\*\s*@@moved_fns_top:end\s*@@\s*\*\/)\s*\n\s*};\s*\n/, "$1\n");
  }
}

/* 4) 余計な ("use client"); を中腹から除去（先頭には既に置いたのでOK） */
s = s.replace(/\n\("use client"\);\n/g, "\n");

/* 5) 連続空行を整理 */
s = s.replace(/\n{3,}/g, "\n\n");

fs.writeFileSync(f, s);
console.log("✅ Fixed: type Item 閉じ位置 / stray `};` / React import 正規化 / use client 整理");
