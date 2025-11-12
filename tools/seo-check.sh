#!/usr/bin/env bash
set -euxo pipefail

PORT="${PORT:-3001}"
SITE="http://localhost:${PORT}"
MODE="${MODE:-prod}" # dev or prod
mkdir -p .next

if [[ "$MODE" == "prod" ]]; then
  # ビルドログを保存
  NEXT_PUBLIC_SITE_URL="$SITE" pnpm exec next build 2>&1 | tee .next/next-build.log
  START_CMD="NEXT_PUBLIC_SITE_URL=$SITE pnpm exec next start -p ${PORT}"
else
  START_CMD="NEXT_PUBLIC_SITE_URL=$SITE pnpm exec next dev -p ${PORT}"
fi

# サーバ起動（起動ログを保存）
bash -lc "$START_CMD > .next/next-start.log 2>&1 & echo \$! > .next-run.pid"
sleep 1
trap 'kill $(cat .next-run.pid) 2>/dev/null || true' EXIT

# / と /new の両方を待機（最大90秒）
pnpm exec wait-on -t 90000 "$SITE" "$SITE/new"

# curl リトライ関数
retry() { url="$1"; for i in {1..10}; do curl -fsSL "$url" >/dev/null && return 0; sleep 1; done; return 1; }

retry "$SITE/"    || { echo "NG: ルートページ到達に失敗しました";   tail -n +1 .next/*.log || true; exit 1; }
retry "$SITE/new" || { echo "NG: /new 到達に失敗";                 tail -n +1 .next/*.log || true; exit 1; }

# OG 一貫性チェック
NEXT_PUBLIC_SITE_URL="$SITE" pnpm run check:og
