#!/usr/bin/env bash
set -euo pipefail
SEARCH_DIRS=(app lib)
miss=false

has() { rg -n --no-messages "$1" "${SEARCH_DIRS[@]}" >/dev/null; }
if ! rg -n --no-messages 'type="application/ld\+json"|dangerouslySetInnerHTML' app/i/\[id]/page.tsx >/dev/null; then
  echo "NG: JSON-LD <script> が見つかりません (app/i/[id]/page.tsx)"
  miss=true
fi

has 'alternates:\s*\{[^\}]*canonical' || { echo "NG: canonical の設定が見つかりません (app|lib)"; miss=true; }
has 'openGraph:\s*\{'               || { echo "NG: Open Graph ブロックが見つかりません (app|lib)"; miss=true; }
has 'openGraph:\s*\{[^\}]*title'    || { echo "NG: Open Graph に title が見つかりません (app|lib)"; miss=true; }
has 'openGraph:\s*\{[^\}]*images'   || { echo "NG: Open Graph に images が見つかりません (app|lib)"; miss=true; }
has 'twitter:\s*\{'                 || { echo "NG: Twitter カードのブロックが見つかりません (app|lib)"; miss=true; }
has 'twitter:\s*\{[^\}]*card'       || { echo "NG: Twitter カードに card が見つかりません (app|lib)"; miss=true; }
has 'twitter:\s*\{[^\}]*title'      || { echo "NG: Twitter カードに title が見つかりません (app|lib)"; miss=true; }
if command -v nc >/dev/null 2>&1 && nc -z localhost 3001 2>/dev/null; then
  for c in tokyo kyoto osaka; do
    html="$(curl -s "http://localhost:3001/i/$c")"
    echo "$html" | rg -q '<link rel="canonical" href=' \
      || { echo "NG: runtime: canonical が見つかりません (/i/$c)"; miss=true; }
    echo "$html" | rg -q '(property|name)="og:title"' \
      || { echo "NG: runtime: og:title が見つかりません (/i/$c)"; miss=true; }
    echo "$html" | rg -q 'name="twitter:card"' \
      || { echo "NG: runtime: twitter:card が見つかりません (/i/$c)"; miss=true; }
  done
else
  echo "SKIP: runtime チェック（localhost:3001 が開いていません）"
fi

if [ "$miss" = true ]; then
  exit 1
else
  echo "OK: SEOスニペット（JSON-LD/Canonical/OG/Twitter）がソース/実HTMLで検出されました"
fi
