#!/usr/bin/env bash
set -euo pipefail

FILE=app/page.tsx
PATTERN='夜景とカルチャー|歴史と街歩き|グルメとエネルギー'

if rg -n "$PATTERN" "$FILE" >/dev/null; then
  echo "NG: ホームカードの説明文がハードコードされています ($FILE)"
  exit 1
else
  echo "OK: ハードコードなし（CITY_META由来のみ）"
fi
