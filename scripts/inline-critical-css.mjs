import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'glob';
import Critters from 'critters';

const outDir = '.next/server/app';

// .next/server/app 以下の全HTMLを探す
const htmlFiles = await glob('**/*.html', {
  cwd: outDir,
  nodir: true,
});

if (htmlFiles.length === 0) {
  console.log('No static HTML files to process (SSR routes are skipped).');
  process.exit(0);
}

// ★ ここを修正
const critters = new Critters({
  path: '.next',            // CSSやフォントなどの実ファイルがあるルート
  publicPath: '/_next/',    // HTML内で参照されてるURLのprefix

  preload: 'swap',
  compress: true,
  pruneSource: true,
  reduceInlineStyles: true,
  mergeStylesheets: true,
  inlineFonts: true,
  logLevel: 'info',
});

for (const rel of htmlFiles) {
  const file = path.join(outDir, rel);
  let html = await fs.readFile(file, 'utf8');
  try {
    const start = performance.now();
    const inlined = await critters.process(html);
    const end = performance.now();

    await fs.writeFile(file, inlined, 'utf8');
    console.log(
      `Inlined CSS OK -> ${rel} (${((end - start) / 1000).toFixed(2)}s)`
    );
  } catch (e) {
    console.warn(
      `Skip (critters error): ${rel} :: ${e?.message || e}`
    );
  }
}
