import fs from "fs";
const f = "app/demo-itinerary/DemoClient.tsx";
let s = fs.readFileSync(f, "utf8");

// 1) "use client" を先頭に保証
if (!s.startsWith('"use client";')) s = '"use client";\n' + s;

// 2) 壊れた先頭行 `declare  from "react";` を修復
s = s.replace(
  /^\s*declare\s+from\s+["']react["'];\s*$/m,
  'import { useState, useEffect, useCallback, useRef } from "react";',
);

// 3) React import が無ければ追加、あれば必要フックを補完
if (!/import\s+\{\s*[^}]*\}\s+from\s+["']react["'];/.test(s)) {
  s = s.replace(
    /^"use client";\s*\n/,
    (m) => m + 'import { useState, useEffect, useCallback, useRef } from "react";\n',
  );
} else {
  s = s.replace(/import\s+\{\s*([^}]+)\}\s+from\s+["']react["'];/, (m, inner) => {
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

// 4) Density 型が無ければ import 群の直後に追加
if (
  !/\btype\s+Density\s*=\s*["']compact["']\s*\|\s*["']cozy["']\s*\|\s*["']comfortable["']\s*;/.test(
    s,
  )
) {
  // 最初の import ブロックの直後
  const p = s.indexOf("\nimport ");
  let q = p;
  while (q !== -1) {
    const n = s.indexOf("\nimport ", q + 1);
    if (n === -1) break;
    q = n;
  }
  const insertAt = q === -1 ? s.indexOf("\n") + 1 : q + 1;
  s =
    s.slice(0, insertAt) +
    'type Density = "compact" | "cozy" | "comfortable";\n' +
    s.slice(insertAt);
}

// 5) 余計な空行を整理
s = s.replace(/\n{3,}/g, "\n\n");

fs.writeFileSync(f, s);
console.log("✅ Fixed top imports and ensured Density type");
