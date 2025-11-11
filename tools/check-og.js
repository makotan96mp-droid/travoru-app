// tools/check-og.js
const fs = require('fs');
const path = require('path');

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';
const ROOT = process.cwd();

// lib/seo.ts の場所を探す
const candidates = ['lib/seo.ts', 'src/lib/seo.ts', 'app/lib/seo.ts', 'lib/seo/index.ts'];
const seoPath = candidates.map(r => path.join(ROOT, r)).find(p => fs.existsSync(p));
if (!seoPath) { console.error('❌ lib/seo.ts not found'); process.exit(1); }

const code = fs.readFileSync(seoPath, 'utf8');

// `export const CITY_META ... = {` の “{” 位置
function startOfCityMetaObject(src){
  const m = /\bCITY_META\b[\s\S]*?=\s*\{/.exec(src);
  return m ? m.index + m[0].length - 1 : -1;
}

// start から対応する “}” まで（バランス取り）
function grabBalanced(src, start){
  let i = start, d = 0;
  function str(q){ i++; for(; i<src.length; i++){ const c=src[i]; if(c==='\\'){ i++; continue; } if(c===q){ i++; break; } } }
  function tpl(){
    i++;
    while(i<src.length){
      const c=src[i];
      if(c==='\\'){ i+=2; continue; }
      if(c==='`'){ i++; break; }
      if(c==='$'&&src[i+1]==='{'){
        i+=2; let k=1;
        while(i<src.length && k>0){ const cc=src[i];
          if(cc==="'") str("'"); else if(cc==='"') str('"'); else if(cc==='`') tpl();
          else if(cc==='{') k++; else if(cc==='}') k--; i++;
        }
      } else i++;
    }
  }
  function line(){ while(i<src.length && src[i++]!=='\n'){} }
  function block(){ i+=2; while(i<src.length && !(src[i-1]==='*'&&src[i]==='/')) i++; i++; }

  for(; i<src.length; i++){
    const ch=src[i];
    if(ch==="'") { str("'"); continue; }
    if(ch==='"') { str('"'); continue; }
    if(ch==='`') { tpl(); continue; }
    if(ch==='/'&&src[i+1]==='/'){ line(); continue; }
    if(ch==='/'&&src[i+1]=='*'){ block(); continue; }
    if(ch==='{'){ d++; }
    else if(ch==='}'){ d--; if(d===0){ i++; break; } }
  }
  return d===0 ? src.slice(start+1, i-1) : null;
}

// CITY_META のトップレベル key を抽出
function topLevelKeys(body){
  const ids=new Set(); let i=0, depth=0;
  function ws(){ while(i<body.length && /\s/.test(body[i])) i++; }
  function str(q){ i++; for(; i<body.length; i++){ const c=body[i]; if(c==='\\'){ i++; continue; } if(c===q){ i++; break; } } }
  function tpl(){
    i++; while(i<body.length){
      const c=body[i];
      if(c==='\\'){ i+=2; continue; }
      if(c==='`'){ i++; break; }
      if(c==='$'&&body[i+1]==='{'){
        i+=2; let k=1; while(i<body.length&&k>0){ const cc=body[i];
          if(cc==="'") str("'"); else if(cc==='"') str('"'); else if(cc==='`') tpl();
          else if(cc==='{') k++; else if(cc==='}') k--; i++;
        }
      } else i++;
    }
  }
  while(i<body.length){
    ws(); if(i>=body.length) break;
    const ch = body[i];
    if(ch==='{'){ depth++; i++; continue; }
    if(ch==='}'){ depth=Math.max(0, depth-1); i++; continue; }
    if(ch==='/' && body[i+1]==='/'){ while(i<body.length && body[i++]!=='\n'){} continue; }
    if(ch==='/' && body[i+1]=='*'){ i+=2; while(i<body.length && !(body[i-1]==='*'&&body[i]==='/')) i++; i++; continue; }
    if((ch==='"'||ch==="'")){
      if(depth===0){ const s=i; str(ch); const key=body.slice(s+1, i-1); ws(); if(body[i]===':') ids.add(key); }
      else str(ch);
      continue;
    }
    if(ch==='`'){ tpl(); continue; }
    if(depth===0 && /[A-Za-z_\$]/.test(ch)){
      const s=i; i++; while(i<body.length && /[A-Za-z0-9_\-$]/.test(body[i])) i++; const key=body.slice(s,i);
      const save=i; ws(); if(body[i]===':') ids.add(key); else i=save; continue;
    }
    i++;
  }
  return [...ids].sort();
}

const start = startOfCityMetaObject(code);
if(start<0){ console.error('⚠️ CITY_META "= {" not found'); process.exit(1); }
const body = grabBalanced(code, start);
if(!body){ console.error('⚠️ CITY_META closing brace not found'); process.exit(1); }
const ids = topLevelKeys(body);
if(!ids.length){ console.error('⚠️ CITY_META keys empty'); process.exit(1); }

(async ()=>{
  for(const id of ids){
    const page = `${SITE}/i/${id}`;
    const og = `${SITE}/og/${id}.jpg`;
    process.stdout.write(`\n== ${id} ==\n`);
    const html = await fetch(page).then(r=>r.text()).catch(()=> '');
    console.log(/<link rel="canonical" href="([^"]+)"/.exec(html)?.[1] || 'canonical: (missing)');
    console.log(/property="og:image" content="([^"]+)"/.exec(html)?.[1] || 'og:image: (missing)');
    const resp = await fetch(og, { method: 'HEAD' }).catch(()=>null);
    console.log(resp ? `OG ${resp.status} ${og}` : `OG ERR  ${og}`);
    if(!resp || resp.status!==200) process.exitCode = 2; // CI で落とす
  }

  // 実ファイル存在チェック
  const ogDir = path.join(ROOT,'public','og');
  const ogIds = fs.existsSync(ogDir)
    ? fs.readdirSync(ogDir).filter(f=>f.endsWith('.jpg')).map(f=>f.replace(/\.jpg$/,'')).sort()
    : [];
  const missing = ids.filter(id => !ogIds.includes(id));
  if(missing.length){
    console.log('\nMissing OG files:');
    for(const id of missing) console.log(`⚠️ ${id} -> public/og/${id}.jpg`);
    process.exitCode = 3;
  } else {
    console.log('\n✅ All city ids have matching public/og/<id>.jpg files.');
  }
})();
