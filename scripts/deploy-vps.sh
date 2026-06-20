#!/usr/bin/env bash
# Clean redeploy on VPS — run from project root as the app user
set -euo pipefail

APP_NAME="${PM2_APP_NAME:-neoncode-app}"
APP_DIR="${APP_DIR:-$(pwd)}"

cd "$APP_DIR"

echo "==> Stopping PM2 app: $APP_NAME"
pm2 stop "$APP_NAME" 2>/dev/null || true

echo "==> Cleaning old build"
rm -rf .next

echo "==> Installing dependencies"
npm ci

echo "==> Building"
npm run build

echo "==> Preparing standalone bundle"
npm run prepare:standalone

echo "==> Verifying public assets"
test -f public/Neon-Studio-icon.png || { echo "ERROR: public/Neon-Studio-icon.png missing"; exit 1; }
test -f .next/standalone/public/Neon-Studio-icon.png || { echo "ERROR: logo not copied to standalone"; exit 1; }

echo "==> Starting PM2"
pm2 start "$APP_NAME" 2>/dev/null || pm2 start ecosystem.config.cjs --name "$APP_NAME"
pm2 save

echo "==> Done. Check logs: pm2 logs $APP_NAME --lines 30"
