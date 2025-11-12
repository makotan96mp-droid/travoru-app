: "${PORT:=3001}"
: "${LOG:=/tmp/travoru-start.log}"
HOST="http://localhost:${PORT}"

#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-3001}"
HOST="http://localhost:${PORT}"
LOG="/tmp/travoru-start.log"
if PIDS="$(lsof -ti :${PORT} || true)"; then
  if [ -n "${PIDS}" ]; then
    kill ${PIDS} || true
    # プロセス終了待ち（最大3秒）
    for _ in {1..6}; do
      lsof -ti :${PORT} >/dev/null 2>&1 || break
      sleep 0.5
    done
  fi
fi

[ -d ".next" ] || pnpm build >/dev/null
pnpm start -p "${PORT}" >"${LOG}" 2>&1 &
SRV_PID=$!

cleanup() { kill "${SRV_PID}" 2>/dev/null || true; }
trap cleanup EXIT INT TERM
ready=false
for _ in {1..30}; do
  if command -v nc >/dev/null 2>&1; then
    if nc -z localhost "${PORT}" 2>/dev/null; then ready=true; break; fi
  else
    if curl -sf "${HOST}/" >/dev/null 2>&1; then ready=true; break; fi
  fi
  sleep 0.5
done

if [ "${ready}" != true ]; then
  echo "NG: サーバ起動を確認できませんでした (port ${PORT})"
  echo "----- server log tail -----"
  tail -n 80 "${LOG}" || true
  exit 1
fi
if ! curl -sf "${HOST}/" >/dev/null; then
  echo "NG: ルートページ到達に失敗しました"
curl -sf "${HOST}/new" >/dev/null || { echo "NG: /new 到達に失敗"; tail -n 80 "${LOG}" || true; exit 1; }
  echo "----- server log tail -----"
  tail -n 80 "${LOG}" || true
  exit 1
fi
bash scripts/check-seo-snippets.sh
