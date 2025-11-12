// Simple OG/Twitter/JSON-LD/Canonical checker
// Usage: NEXT_PUBLIC_SITE_URL=http://localhost:3001 node tools/check-og.mjs
const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';
const routes = (process.env.SEO_ROUTES || '/,/new,/i/tokyo,/i/osaka,/i/kyoto')
  .split(',').map(s => s.trim()).filter(Boolean);

const rules = [
  { name: 'og:title', re: /<meta\s+(?:property|name)=["']og:title["']\s+content=["'][^"']+["'][^>]*>/i },
  { name: 'og:description', re: /<meta\s+(?:property|name)=["']og:description["']\s+content=["'][^"']+["'][^>]*>/i },
  { name: 'og:image', re: /<meta\s+(?:property|name)=["']og:image["']\s+content=["'][^"']+["'][^>]*>/i },
  { name: 'twitter:card', re: /<meta\s+name=["']twitter:card["']\s+content=["'][^"']+["'][^>]*>/i },
  { name: 'canonical', re: /<link\s+rel=["']canonical["']\s+href=["'][^"']+["'][^>]*>/i },
  { name: 'json-ld', re: /<script[^>]+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/i },
];

let failed = false;

async function check(url) {
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`✗ ${url} → HTTP ${res.status}`);
    failed = true;
    return;
  }
  const html = await res.text();
  const missing = rules.filter(r => !r.re.test(html)).map(r => r.name);

  if (missing.length) {
    console.error(`✗ ${url} missing: ${missing.join(', ')}`);
    failed = true;
  } else {
    console.log(`✓ ${url} all tags present`);
  }
}

(async () => {
  console.log(`Base: ${base}`);
  for (const r of routes) {
    const url = new URL(r, base).toString();
    await check(url);
  }
  if (failed) {
    console.error('SEO checks failed');
    process.exit(1);
  } else {
    console.log('All SEO checks passed');
  }
})();
