import fs from "fs";
const f = "app/demo-itinerary/DemoClient.tsx";
let s = fs.readFileSync(f, "utf8");

// 既に宣言があれば何もしない
if (!/declare\s+function\s+downloadText\b/.test(s) || !/declare\s+function\s+buildICS\b/.test(s)) {
  // 最初の2本の import 群の直後あたりに挿入（import ブロックの末尾を探す）
  const m = s.match(/^(?:import[^\n]*\n)+/);
  const headEnd = m ? m[0].length : 0;
  const decl = `declare function downloadText(name: string, text: string, mime?: string): void;
declare function buildICS(date: string, items: Item[]): string;

`;
  s = s.slice(0, headEnd) + decl + s.slice(headEnd);
  fs.writeFileSync(f, s);
  console.log("✅ Added ambient declarations for downloadText/buildICS");
} else {
  console.log("ℹ️ Ambient declarations already present — no change");
}
