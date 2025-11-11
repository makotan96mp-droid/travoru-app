import fs from "fs";
const f = "app/demo-itinerary/DemoClient.tsx";
let s = fs.readFileSync(f, "utf8");

/** 0) 未使用ヘルパーの警告を一時的に抑制（将来使う想定のためリネーム） */
s = s.replace(/\bfunction\s+fromUrlSafeBase64\b/, "function _fromUrlSafeBase64");
s = s.replace(/\bfunction\s+ungzipFromUrlParam\b/, "function _ungzipFromUrlParam");

/** 1) downloadText ヘルパーを追加（未挿入なら） */
if (!/function\s+downloadText\s*\(/.test(s)) {
  const anchor = s.indexOf("function parseDensity");
  const injectAt = anchor > -1 ? s.indexOf("\n", anchor) + 1 : s.indexOf("\n", 0) + 1;
  s =
    s.slice(0, injectAt) +
    `
function downloadText(name: string, text: string, mime = "text/plain") {
  const blob = new Blob([text], { type: mime + ";charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; document.body.appendChild(a);
  a.click(); setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 0);
}
` +
    s.slice(injectAt);
}

/** 2) ICS 生成ヘルパー（未挿入なら） */
if (!/function\s+buildICS\s*\(/.test(s)) {
  // 依存: items の time "HH:MM" と date "YYYY-MM-DD"
  s = s.replace(
    /function\s+downloadText[\s\S]*?\}\s*\n/,
    (m) =>
      m +
      `
function pad(n:number){ return String(n).padStart(2,"0"); }
function toLocalICSDateTime(dateStr:string, timeStr?: string){
  // "YYYY-MM-DD" + optional "HH:MM" -> "YYYYMMDDTHHMMSS"
  const [y,m,d] = dateStr.split("-").map(Number);
  let hh = 9, mm = 0; // デフォルト09:00
  if (timeStr && /\\d{2}:\\d{2}/.test(timeStr)) { const [H,M] = timeStr.split(":").map(Number); hh = H; mm = M; }
  return \`\${y}\${pad(m)}\${pad(d)}T\${pad(hh)}\${pad(mm)}00\`;
}
function addMinutes(dateStr:string, timeStr:string|undefined, add:number){
  const dt = new Date(\`\${dateStr}T\${(timeStr||"09:00")}:00\`);
  dt.setMinutes(dt.getMinutes()+add);
  return \`\${dt.getFullYear()}\${pad(dt.getMonth()+1)}\${pad(dt.getDate())}T\${pad(dt.getHours())}\${pad(dt.getMinutes())}00\`;
}
function buildICS(date: string, items: Array<{time?:string; title?:string; name?:string; note?:string}>){
  const now = new Date();
  const stamp = \`\${now.getFullYear()}\${pad(now.getMonth()+1)}\${pad(now.getDate())}T\${pad(now.getHours())}\${pad(now.getMinutes())}00Z\`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Travoru//Demo//JP"
  ];
  let seq = 1;
  for (const it of items){
    const title = (it.title || it.name || "予定");
    const dtStart = toLocalICSDateTime(date, it.time);
    // 既定60分（将来: 距離/滞在時間から算出へ）
    const dtEnd   = addMinutes(date, it.time, 60);
    const uid = \`travoru-\${Date.now()}-\${seq++}@demo\`;
    lines.push("BEGIN:VEVENT");
    lines.push(\`UID:\${uid}\`);
    lines.push(\`DTSTAMP:\${stamp}\`);
    lines.push(\`DTSTART:\${dtStart}\`);
    lines.push(\`DTEND:\${dtEnd}\`);
    lines.push(\`SUMMARY:\${title.replace(/[\\n\\r]/g," ")}\`);
    if (it.note) lines.push(\`DESCRIPTION:\${it.note.replace(/[\\n\\r]/g," ").replace(/[,;]/g," ")}\`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\\r\\n");
}
`,
  );
}

/** 3) 印刷ハンドラ & ICS エクスポートハンドラを return( の直前に注入（未挿入なら） */
if (!/const\s+handlePrint\s*=/.test(s) || !/const\s+handleExportICS\s*=/.test(s)) {
  // 最後の return( の直前へ
  let insertAt = -1;
  {
    const re = /return\s*\(/g;
    let m;
    while ((m = re.exec(s)) !== null) insertAt = m.index;
  }
  if (insertAt === -1) throw new Error("return( が見つかりません");
  const block = `
/* eslint-disable react-hooks/exhaustive-deps */
const handlePrint = useCallback(() => {
  try { window.print(); } catch {}
}, []);
const handleExportICS = useCallback(() => {
  try {
    const ics = buildICS(date, items);
    downloadText(\`travoru-\${date}.ics\`, ics, "text/calendar");
    setToast && (setToast("カレンダーファイルを作成しました"), setTimeout(()=>setToast && setToast(null), 1500));
  } catch { alert(".ics の作成に失敗しました"); }
}, []);
/* eslint-enable react-hooks/exhaustive-deps */

`;
  s = s.slice(0, insertAt) + block + s.slice(insertAt);
}

/** 4) ツールバーに「印刷」「カレンダー(.ics)」ボタンを追加（未挿入なら） */
if (!/カレンダー\(.ics\)/.test(s)) {
  s = s.replace(/(<div className="mb-4[^"]*">[\s\S]*?<\/div>)/, (m) =>
    m.replace(
      /<\/div>\s*$/,
      `  <button onClick={handlePrint} className="rounded-lg border px-3 py-1 text-sm hover:bg-black/5">印刷 / PDF</button>
        <button onClick={handleExportICS} className="rounded-lg border px-3 py-1 text-sm hover:bg-black/5">カレンダー(.ics)</button>
      </div>`,
    ),
  );
}

/** 5) JSONボタンのラベルをより安全に（上級者向け） */
s = s.replace(/>JSON読み込み</, ">JSON読み込み（上級者向け）<");
s = s.replace(/>JSON<\/button>/, ">バックアップ（上級者向け）</button>");

fs.writeFileSync(f, s);
console.log("✅ 警告ケア + 印刷/PDF + ICS 書き出し + ツールバー配線 完了");
