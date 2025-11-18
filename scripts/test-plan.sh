#!/usr/bin/env bash

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3001}"

red()   { printf "\033[31m%s\033[0m\n" "$*"; }
green() { printf "\033[32m%s\033[0m\n" "$*"; }

resp_main="$(
  curl -s "$BASE_URL/api/plan" \
    -H 'content-type: application/json' \
    -d '{"city":"大阪","startDate":"2025-11-06","endDate":"2025-11-10","purposes":["観光"],"mustSee":["USJ"]}'
)"

arrival_ok="$(
  printf '%s' "$resp_main" | jq '
    .items as $items
    | [ $items[] | select(.title == "到着 / トランスファ") | .meta.dayOffset // 0 ] as $arr
    | ($arr | length > 0) and (($arr | min) == 0)
  '
)"

departure_ok="$(
  printf '%s' "$resp_main" | jq '
    .items as $items
    | [ $items[].meta.dayOffset // 0 ] as $all
    | (if ($all | length) > 0 then ($all | max) else 0 end) as $last
    | [ $items[] | select(.title == "出発 / トランスファ") | .meta.dayOffset // 0 ] as $dep
    | ($dep | length > 0) and (($dep | max) == $last)
  '
)"

if [ "$arrival_ok" != "true" ] || [ "$departure_ok" != "true" ]; then
  red "❌ 到着 / 出発トランスファの配置が期待通りではありません"
  printf '%s\n' "$resp_main" | jq '{
    city,
    startDate,
    endDate,
    items
  }'
  exit 1
fi

resp_meals="$(
  curl -s "$BASE_URL/api/plan" \
    -H 'content-type: application/json' \
    -d '{"city":"大阪","startDate":"2025-11-06","endDate":"2025-11-10","purposes":["観光","グルメ"],"mustSee":[]}'
)"

ok_meals="$(
  printf '%s' "$resp_meals" | jq '
    .items as $items
    | [ $items[]
        | select(.title | test("ランチ|夕食"))
        | "\(.meta.dayOffset // 0)-\(.time)"
      ] as $slots
    | ($slots | length) == ($slots | unique | length)
  '
)"

if [ "$ok_meals" != "true" ]; then
  red "❌ ランチ / 夕食の時刻重複あり"
  printf '%s\n' "$resp_meals" | jq '
    .items as $items
    | [ $items[]
        | select(.title | test("ランチ|夕食"))
        | { dayOffset: (.meta.dayOffset // 0), time, title }
      ]
  '
  exit 1
fi

green "✅ E2E checks passed (transfers & meal slots OK)"
