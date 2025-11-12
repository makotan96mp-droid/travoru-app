import fs from "fs";
const f = "app/demo-itinerary/DemoClient.tsx";
let s = fs.readFileSync(f, "utf8");

// 1) 余計な「宣言だけ」の行を削除
s = s.replace(/^\s*(?:declare\s+)?function\s+downloadText\s*\([^)]*\)\s*:[^;{]+;\s*$/gm, "");
s = s.replace(/^\s*declare\s+function\s+buildICS\s*\([^)]*\)\s*:[^;{]+;\s*$/gm, "");

// 2) 途中に紛れた ("use client"); を削除（先頭の "use client"; は残す）
s = s.replace(/^\s*\("use client"\);\s*$/gm, "");

// 3) React import の重複があれば2個目以降を削除
let seenReact = false;
s = s
  .split("\n")
  .filter((line) => {
    const isReact = /^\s*import\s+\{[^}]*\}\s+from\s+["']react["'];\s*$/.test(line);
    if (isReact) {
      if (seenReact) return false;
      seenReact = true;
    }
    return true;
  })
  .join("\n");

// 4) downloadText / buildICS の実体があるか最低限チェック（なければ先頭の型群の後に挿入）
const hasDL = /\nfunction\s+downloadText\s*\([^)]*\)\s*\{/.test(s);
const hasBI = /\nfunction\s+buildICS\s*\([^)]*\)\s*\{/.test(s);

if (!hasDL || !hasBI) {
  const insertAfter =
    s.indexOf("type Item") >= 0
      ? s.indexOf("};", s.indexOf("type Item")) + 2
      : s.indexOf("type Density") >= 0
        ? s.indexOf(";", s.indexOf("type Density")) + 1
        : s.indexOf("\n"); // 保険

  const dl = `
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

function buildICS(date: string, items: Array<{time?:string; title?:string; name?:string; note?:string}>) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const toLocal = (d: string, t?: string) => {
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
    const dtStart = toLocal(date, it.time);
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
/* @@moved_fns_top:end @@ */
`;

  s = s.slice(0, insertAfter) + "\n" + dl + "\n" + s.slice(insertAfter);
}

// 5) 余計な空行を整形
s = s.replace(/\n{3,}/g, "\n\n");

fs.writeFileSync(f, s);
console.log(
  "✅ Removed bad declarations / stray ('use client'); and ensured function bodies exist",
);
