import fs from "fs";
const f = "app/demo-itinerary/DemoClient.tsx";
let s = fs.readFileSync(f, "utf8");

/** 0) 変なアーティファクト掃除 */
s = s.replace(/\+\+0==1\?/g, "");
s = s.replace(/\/\*\s*@@moved_fns_top:end\s*@@\s*\*\/\s*:""\s*/g, "/* @@moved_fns_top:end @@ */\n");
s = s.replace(/^\s*>,\s*$\n?/gm, "");
s = s.replace(/^\s*>\s*$\n?/gm, "");

/** 1) 既存の downloadText/buildICS を宣言/実体ごと全削除（位置に関わらず） */
const rmFunc = (name) => {
  // 実体
  s = s.replace(new RegExp(`\\bfunction\\s+${name}\\s*\\([^)]*\\)\\s*\\{[\\s\\S]*?\\}`, "g"), "");
  // 宣言だけ
  s = s.replace(new RegExp(`^\\s*(?:declare\\s+)?function\\s+${name}[^;{]+;\\s*$`, "gm"), "");
};
rmFunc("downloadText");
rmFunc("buildICS");

/** 2) 全ての moved_fns_top ブロックを除去（あとで綺麗な1個を入れる） */
s = s.replace(
  /\/\*\s*@@moved_fns_top:start\s*@@\s*\*\/[\s\S]*?\/\*\s*@@moved_fns_top:end\s*@@\s*\*\//g,
  "",
);

/** 3) ESLint no-unused-vars ラッパの残骸 "( ... )" を除去 */
s = s.replace(
  /\s*\/\*\s*eslint-disable\s+@typescript-eslint\/no-unused-vars\s*\*\/\s*\(\s*/g,
  "\n",
);
s = s.replace(
  /\s*\/\*\s*eslint-enable\s+@typescript-eslint\/no-unused-vars\s*\*\/\s*\)\s*\{\s*/g,
  "\n",
);

/** 4) type Item の直後の位置を取得し、未閉なら閉じてから綺麗な実体を挿入 */
const itemIdx = s.indexOf("type Item");
if (itemIdx === -1) {
  throw new Error("type Item が見つかりません。想定外のレイアウトです。");
}
let insertAt = s.indexOf("};", itemIdx);
if (insertAt === -1) {
  // 未閉だったら閉じる
  const afterItemHeader = s.indexOf("{", itemIdx);
  if (afterItemHeader === -1) throw new Error("type Item ブロックの { が見つかりません。");
  // 安全に "};" を type Item ブロックの終端に補う（簡易）
  // 次の import/関数/型宣言の直前を探すより、マーカーを入れて挿入
  insertAt = afterItemHeader + 1;
  s = s.slice(0, itemIdx) + s.slice(itemIdx).replace(/\btype\s+Item\s*=\s*\{/, (match) => match);
  // 挿入点を "};" の前に合わせる
  const before = s.slice(0, itemIdx);
  const rest = s.slice(itemIdx);
  const braceClose = rest.indexOf("\n\n"); // 適当な区切り
  const pos = braceClose === -1 ? rest.length : braceClose;
  s = before + rest.slice(0, pos) + "\n};\n" + rest.slice(pos);
  insertAt = (before + rest.slice(0, pos) + "\n};\n").length;
} else {
  insertAt += 2; // "};" の直後
}

/** 5) 正しいヘルパーの実体を1回だけ挿入 */
const block = `
/* @@moved_fns_top:start @@ */
function downloadText(name: string, text: string, mime = "text/plain") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 0);
}

function buildICS(date: string, items: Item[]) {
  const pad = (n: number) => String(n).padStart(2, "0");
  function toLocalICSDateTime(dateStr: string, timeStr?: string) {
    const dt = new Date(\`\${dateStr}T\${timeStr || "09:00"}:00\`);
    return \`\${dt.getFullYear()}\${pad(dt.getMonth() + 1)}\${pad(dt.getDate())}T\${pad(dt.getHours())}\${pad(dt.getMinutes())}00\`;
  }
  function addMinutes(dateStr: string, timeStr: string | undefined, add: number) {
    const dt = new Date(\`\${dateStr}T\${timeStr || "09:00"}:00\`);
    dt.setMinutes(dt.getMinutes() + add);
    return \`\${dt.getFullYear()}\${pad(dt.getMonth() + 1)}\${pad(dt.getDate())}T\${pad(dt.getHours())}\${pad(dt.getMinutes())}00\`;
  }
  const now = new Date();
  const stamp = \`\${now.getFullYear()}\${pad(now.getMonth() + 1)}\${pad(now.getDate())}T\${pad(now.getHours())}\${pad(now.getMinutes())}00Z\`;
  const esc = (v: string) => v.replace(/[\\n\\r]/g, " ").replace(/[,;]/g, " ");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Travoru//Demo//JP"];
  let seq = 1;
  for (const it of items) {
    const title = it.title || it.name || "予定";
    const dtStart = toLocalICSDateTime(date, it.time);
    const dtEnd   = addMinutes(date, it.time, 60); // 既定60分
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
/* @@moved_fns_top:end @@ */
`.replace(/\r?\n/g, "\n");

s = s.slice(0, insertAt) + "\n" + block + "\n" + s.slice(insertAt);

/** 6) 連続空行の整理 */
s = s.replace(/\n{3,}/g, "\n\n");

fs.writeFileSync(f, s);
console.log(
  "✅ Repaired: removed broken duplicates & artifacts, injected clean helpers once after type Item",
);
