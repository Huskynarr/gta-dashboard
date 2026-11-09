#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

LOG="/tmp/gta-dashboard-cron.log"
LOCK="/tmp/gta-dashboard-cron.lock"

exec 9>"$LOCK"
if ! flock -n 9; then
  echo "[$(date -Is)] another collector is already running" >> "$LOG"
  exit 0
fi

{
  echo "[$(date -Is)] collect start"
  git pull --rebase --autostash origin main || true
  node scripts/collect.mjs
  if ! git diff --quiet -- data sitemap.xml; then
    git add data/*.json sitemap.xml
    git commit -m "chore(data): refresh GTA VI signals"
    git push origin main
    echo "[$(date -Is)] data pushed"
  else
    echo "[$(date -Is)] no data changes"
  fi
} >> "$LOG" 2>&1
