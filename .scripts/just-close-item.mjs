import fs from "fs";
const f = "app/demo-itinerary/DemoClient.tsx";
let s = fs.readFileSync(f, "utf8");

// 1) 先頭の moved ブロック開始マーカー位置
const MARK = "/* @@moved_fns_top:start @@ */";
const ms = s.indexOf(MARK);
if (ms < 0) {
  console.error("マーカーが見つかりませんでした:", MARK);
  process.exit(1);
}

// 2) その直前にある type Item ブロックが閉じているか確認
const before = s.slice(0, ms);
const ti = before.lastIndexOf("type Item");
if (ti < 0) {
  console.error("type Item が見つかりませんでした");
  process.exit(1);
}
const seg = before.slice(ti);
if (!/};\s*$/.test(seg.trim())) {
  // 3) 未閉なら、開始マーカー直前に `};` を挿入
  s = before + "};\n\n" + s.slice(ms);
  fs.writeFileSync(f, s, "utf8");
  console.log("✅ Inserted `};` right before moved_fns_top:start");
} else {
  console.log("ℹ️ type Item は既に閉じています（変更なし）");
}
