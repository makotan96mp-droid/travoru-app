set -euo pipefail

REPO="makotan96mp-droid/travoru-app"
BRANCH="main"
WF="seo-health-check.yml"
CHECK_NAME="${1:-seo}" # 引数がなければ seo

SHA="$(gh run list --workflow "$WF" --branch "$BRANCH" -L 1 --json headSha -q '.[0].headSha')"

echo "HEAD SHA: $SHA"
echo "=== Available check runs (id / name / status / conclusion) ==="
gh api "repos/$REPO/commits/$SHA/check-runs" \
  --jq '.check_runs[] | {id, name, status, conclusion}'

CHECK_ID="$(
  gh api "repos/$REPO/commits/$SHA/check-runs" \
    --jq ".check_runs[] | select(.name==\"$CHECK_NAME\") | .id" \
  | head -n 1
)"

echo
echo "Picked check: $CHECK_NAME (id=$CHECK_ID)"

echo "=== Check details ==="
gh api "repos/$REPO/check-runs/$CHECK_ID" \
  --jq '{id, name, status, conclusion, started_at, completed_at, html_url}'

echo
echo "=== Annotations (first 20) ==="
gh api "repos/$REPO/check-runs/$CHECK_ID/annotations" \
  --paginate \
  --jq '.[] | {path, start_line, end_line, annotation_level, message}' \
  | head -n 20
