#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3001}"

red() { printf "\033[31m%s\033[0m\n" "$*"; }
green() { printf "\033[32m%s\033[0m\n" "$*"; }

# 共有JQ: メイン項目 = (食事/ホテルCI/移動を除外)
JQ_MAIN_DEF='
def main_items:
  map(
    select(.title|test("ランチ|夕食|ホテルチェックイン")|not)
    | select((.type//"")!="移動")
    | select((.meta.auto//false)==false)
  );
'

# ========== 1) 各日メイン件数が常に2か ==========
resp_main="$(curl -s "$BASE_URL/api/plan" \
  -H 'content-type: application/json' \
  -d '{"city":"大阪","startDate":"2025-11-06","endDate":"2025-11-10","purposes":["観光"],"mustSee":["USJ"]}')"

ok_main="$(
  printf '%s' "$resp_main" | jq "
$JQ_MAIN_DEF
[
  .day1,.day2,.day3,.day4,.day5
]
| map( ( . // [] ) | main_items | length )
| all(. == 2)
"
)"

if [ "$ok_main" != "true" ]; then
  red "❌ main=2 固定テスト失敗"
  printf '%s\n' "$resp_main" | jq "
$JQ_MAIN_DEF
def labels: [\"day1\",\"day2\",\"day3\",\"day4\",\"day5\"];
[
  .day1,.day2,.day3,.day4,.day5
]
| to_entries
| map({
    day: (labels[.key]),
    main: ((.value // []) | main_items | length),
    items: (.value // [])
  })
"
  exit 1
fi

# ========== 2) ランチ/夕食の時刻重複が無いか ==========
resp_meals="$(curl -s "$BASE_URL/api/plan" \
  -H 'content-type: application/json' \
  -d '{"city":"大阪","startDate":"2025-11-06","endDate":"2025-11-10","purposes":["観光","グルメ"],"mustSee":[]}' )"

ok_meals="$(printf '%s' "$resp_meals" | jq -f scripts/jq/check-meals.jq)"

if [ "$ok_meals" != "true" ]; then
  red "❌ ランチ/夕食の時刻重複あり"
  printf '%s\n' "$resp_meals" | jq '
def meals: map(select(.title|test("ランチ|夕食")));
def labels: ["day1","day2","day3","day4","day5"];
[
  .day1,.day2,.day3,.day4,.day5
]
| to_entries
| map({
    day: (labels[.key]),
    meal_times: ((.value // []) | meals | map(.time))
  })'
  exit 1
fi

green "✅ E2E checks passed (main=2, meal slots OK)"
