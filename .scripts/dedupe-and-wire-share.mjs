import fs from "fs";

const f = "app/demo-itinerary/DemoClient.tsx";
let s = fs.readFileSync(f, "utf8");

/* 1) parseDensity の重複定義を2個目以降カット */
function cutBlock(str, startIdx) {
  const open = str.indexOf("{", startIdx);
  if (open < 0) return null;
  let d = 1,
    i = open + 1;
  while (i < str.length && d > 0) {
    const ch = str[i++];
    if (ch === "{") d++;
    else if (ch === "}") d--;
  }
  return [startIdx, i];
}
const occ = [...s.matchAll(/function\s+parseDensity\s*\(/g)].map((m) => m.index);
if (occ.length > 1) {
  // 後ろから削る
  for (let k = occ.length - 1; k >= 1; k--) {
    const [from, to] = cutBlock(s, occ[k]);
    s = s.slice(0, from) + s.slice(to);
  }
}

/* 2) 未使用 fileRef を削除（あれば） */
s = s.replace(/\s*const\s+fileRef\s*=\s*useRef<[^>]*>\([^)]*\);\s*\n/, "\n");

/* 3) 「共有リンク」ボタンを Reset の直後に必ず差し込む（未挿入時のみ） */
if (!/共有リンク<\/button>/.test(s)) {
  s = s.replace(
    /(<button[^>]*onClick=\{handleReset\}[^>]*>[\s\S]*?<\/button>)/,
    `$1
        <button onClick={handleShareLink} className="rounded-lg border px-3 py-1 text-sm hover:bg-black/5">共有リンク</button>`,
  );
}

fs.writeFileSync(f, s);
console.log("✅ parseDensity重複の解消・fileRef削除・共有リンクボタン配線 完了");
