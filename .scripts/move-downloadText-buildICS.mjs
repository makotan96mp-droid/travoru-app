import fs from "fs";

const f = "app/demo-itinerary/DemoClient.tsx";
let s = fs.readFileSync(f, "utf8");

// 既に移設済みならスキップ
if (s.includes("/* @@moved_fns_top:start @@ */")) {
  console.log("ℹ️ already moved — nothing to do");
  process.exit(0);
}

// A) Item 型の直後の挿入位置を探す（imports の後だと Item が未定義になる可能性があるため）
const mItem = s.match(/type\s+Item\s*=\s*\{[\s\S]*?\};\s*/);
if (!mItem) {
  throw new Error("type Item が見つかりません（挿入位置が特定できない）");
}
const insertAt = mItem.index + mItem[0].length;

// B) 任意位置にある function downloadText / buildICS を抽出して削除
function extractAndRemove(fnName) {
  const re = new RegExp("\\bfunction\\s+" + fnName + "\\s*\\(", "g");
  const hit = [...s.matchAll(re)].map((m) => m.index);
  if (hit.length === 0) return null;

  // 最初の定義だけ採用
  const start = hit[0];
  const open = s.indexOf("{", start);
  if (open < 0) return null;
  let d = 1,
    i = open + 1;
  while (i < s.length && d > 0) {
    const c = s[i++];
    if (c === "{") d++;
    else if (c === "}") d--;
  }
  const end = i; // '}'の次

  const code = s.slice(start, end);
  // 直前直後に eslint の disable/enable があれば一緒に掃除
  let from = start,
    to = end;
  // 前に disable コメントが密接している場合取り込む
  const before = s.slice(Math.max(0, start - 200), start);
  const mDis = before.match(/\/\*\s*eslint-disable[^\*]*\*\/\s*$/);
  if (mDis) from = start - mDis[0].length;
  // 後ろの enable も取り込む
  const after = s.slice(end, Math.min(s.length, end + 200));
  const mEn = after.match(/^\s*\/\*\s*eslint-enable[^\*]*\*\//);
  if (mEn) to = end + mEn[0].length;

  s = s.slice(0, from) + s.slice(to);
  return code;
}

let dl = extractAndRemove("downloadText");
let bi = extractAndRemove("buildICS");

// C) 見つからなかった場合は安全な標準実装を合成
if (!dl) {
  dl = `
function downloadText(name: string, text: string, mime = "text/plain") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 0);
}
`.trim();
}
if (!bi) {
  bi = `
function buildICS(date: string, items: Item[]) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const toLocalICS = (d: string, t?: string) => {
    const base = new Date(d + "T" + (t || "09:00") + ":00");
    const y = base.getFullYear(), m = pad(base.getMonth()+1), dd = pad(base.getDate());
    const hh = pad(base.getHours()), mm = pad(base.getMinutes());
    return \`\${y}\${m}\${dd}T\${hh}\${mm}00\`;
  };
  const addMinutes = (d: string, t: string|undefined, add: number) => {
    const base = new Date(d + "T" + (t || "09:00") + ":00");
    base.setMinutes(base.getMinutes() + add);
    const y = base.getFullYear(), m = pad(base.getMonth()+1), dd = pad(base.getDate());
    const hh = pad(base.getHours()), mm = pad(base.getMinutes());
    return \`\${y}\${m}\${dd}T\${hh}\${mm}00\`;
  };
  const now = new Date();
  const z = (n:number)=>String(n).padStart(2,"0");
  const stamp = \`\${now.getFullYear()}\${z(now.getMonth()+1)}\${z(now.getDate())}T\${z(now.getHours())}\${z(now.getMinutes())}00Z\`;
  const esc = (v: string) => v.replace(/[\\n\\r]/g, " ").replace(/[,;]/g, " ");
  const lines = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Travoru//Demo//JP"];
  let seq = 1;
  for (const it of items) {
    const title = (it.title || it.name || "予定")!;
    const dtStart = toLocalICS(date, it.time);
    const dtEnd   = addMinutes(date, it.time, 60);
    const uid = \`travoru-\${Date.now()}-\${seq++}@demo\`;
    lines.push("BEGIN:VEVENT");
    lines.push(\`UID:\${uid}\`);
    lines.push(\`DTSTAMP:\${stamp}\`);
    lines.push(\`DTSTART:\${dtStart}\`);
    lines.push(\`DTEND:\${dtEnd}\`);
    lines.push(\`SUMMARY:\${esc(title)}\`);
    if (it.note) lines.push(\`DESCRIPTION:\${esc(it.note)}\`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\\r\\n");
}
`.trim();
}

// D) 先頭の declare function を削除（存在時）
s = s.replace(/^declare\s+function\s+downloadText[^\n]*\n/gm, "");
s = s.replace(/^declare\s+function\s+buildICS[^\n]*\n/gm, "");

// E) Item の直後に移設（マーカー付き・再実行で重複しない）
const insertCode = `
/* @@moved_fns_top:start @@ */
${dl}

${bi}
/* @@moved_fns_top:end @@ */
`;
s = s.slice(0, insertAt) + insertCode + s.slice(insertAt);

// F) 余計な空行を軽く整える
s = s.replace(/\n{3,}/g, "\n\n");

fs.writeFileSync(f, s);
console.log("✅ moved downloadText/buildICS to module top (after Item), and removed old copies");
