# Itinerary Policy (B)

- BASE_SLOTS = 09:30, 14:00 → 日中メインは常に2枠
- maxPerDay=2, includeSeedInCap=true
- addPlaceholders=true (不足分は候補で補完／空日はフリータイム10:00)
- wantsFood=true のときは 12:30 ランチ／18:00 夕食を自動挿入（重複防止）
- E2E: `pnpm run test:api`
