import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
const files=[];
(function walk(d){ for(const f of readdirSync(d,{withFileTypes:true})){
  if(f.name==='node_modules'||f.name.startsWith('.')) continue;
  const p=join(d,f.name);
  if(f.isDirectory()) walk(p);
  else if(/\.(tsx|jsx)$/.test(f.name)) files.push(p);
}})('app');

let bad=[];
for(const f of files){
  const s=readFileSync(f,'utf8');
  const isClient=/^\s*['"]use client['"]/.test(s);
  const hasMeta=/export\s+const\s+metadata\s*[:=]/.test(s);
  if(isClient && hasMeta) bad.push(f);
}
if(bad.length){
  console.error('❌ Client Component に metadata export が含まれています:\n' + bad.map(x=>' - '+x).join('\n'));
  process.exit(1);
} else {
  console.log('✅ OK: no client+metadata mix');
}
