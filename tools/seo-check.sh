#!/usr/bin/env bash
set -euo pipefail
PORT="${PORT:-3001}"
SITE="http://localhost:${PORT}"
MODE="${MODE:-dev}"   # dev か prod
START_CMD=""
if [[ "$MODE" == "prod" ]]; then
  pnpm exec next build
  START_CMD="pnpm exec next start -p ${PORT}"
else
  START_CMD="pnpm exec next dev -p ${PORT}"
fi

# 起動 → 待機
NEXT_PUBLIC_SITE_URL="$SITE" bash -lc "$START_CMD & echo \$! > .next-run.pid"
trap 'kill $(cat .next-run.pid) 2>/dev/null || true; rm -f .next-run.pid' EXIT
pnpm exec wait-on "$SITE" --timeout 60000

# 重要ページの疎通確認
curl -fsSL "$SITE/"    >/dev/null || { echo "NG: ルートページ到達に失敗しました"; exit 1; }
curl -fsSL "$SITE/new" >/dev/null || { echo "NG: /new 到達に失敗";           exit 1; }

# OG 一貫性チェック（tools/check-og.js）
NEXT_PUBLIC_SITE_URL="$SITE" pnpm run check:og
