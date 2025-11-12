import fs from "fs";
const f = "app/demo-itinerary/DemoClient.tsx";
const s = fs.readFileSync(f, "utf8");
const moved = [...s.matchAll(/\/\*\s*@@moved_fns_top:(?:start|end)\s*@@\s*\*\//g)].length;
const buildCount = (s.match(/function\s+buildICS\s*\(/g) || []).length;
if (moved !== 2) {
  console.error("✖ moved_fns_top マーカー数が不正:", moved);
  process.exit(1);
}
if (buildCount !== 1) {
  console.error("✖ buildICS 定義が重複/欠落:", buildCount);
  process.exit(1);
}
if (!/BEGIN:VEVENT/.test(s)) {
  console.error("✖ VEVENT 生成が見当たりません");
  process.exit(1);
}
console.log("✓ ICS integrity OK");
